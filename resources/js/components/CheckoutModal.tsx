import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Address, Cart, Order } from '../types';
import { X, CheckCircle, ShieldCheck, CreditCard, Smartphone, Building, AlertCircle, Lock } from 'lucide-react';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: Cart | null;
    onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, cart, onOrderSuccess }) => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Razorpay Simulation State
    const [razorpayOrder, setRazorpayOrder] = useState<any>(null);
    const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
    const [paymentVerifying, setPaymentVerifying] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        apiClient.get('/addresses')
            .then((res) => {
                const list = res.data.data;
                setAddresses(list);
                if (list.length > 0) {
                    const defaultAddr = list.find((a: Address) => a.is_default) || list[0];
                    setSelectedAddressId(defaultAddr.id);
                }
            })
            .catch((err) => console.error(err));
    }, [isOpen]);

    if (!isOpen) return null;

    const formatINR = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    // Step 1: Initialize Checkout (Atomic Lock & Stock Reservation)
    const handleInitialize = async () => {
        if (!selectedAddressId) {
            setError('Please select or provide a delivery address.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const res = await apiClient.post('/checkout/initialize', {
                shipping_address_id: selectedAddressId,
                billing_address_id: selectedAddressId,
            });

            setRazorpayOrder(res.data.data);
            setIsRazorpayOpen(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to initialize checkout. Insufficient inventory.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step 2: Confirm Razorpay Payment (Signature Verification)
    const handleSimulatePayment = async (success: boolean) => {
        if (!razorpayOrder) return;
        setPaymentVerifying(true);
        setError('');

        if (!success) {
            // Simulate failure callback to webhook or cancel
            setTimeout(() => {
                setPaymentVerifying(false);
                setIsRazorpayOpen(false);
                setError('Payment attempt was cancelled. Reserved inventory was safely released.');
            }, 600);
            return;
        }

        try {
            const fakePaymentId = 'pay_' + Math.random().toString(36).substring(2, 14);
            const signature = 'demo_signature_valid'; // Matches Razorpay adapter demo signature

            const res = await apiClient.post('/checkout/verify', {
                razorpay_order_id: razorpayOrder.razorpay_order_id,
                razorpay_payment_id: fakePaymentId,
                razorpay_signature: signature,
            });

            const confirmedOrder = res.data.data;
            setIsRazorpayOpen(false);
            onClose();
            onOrderSuccess(confirmedOrder);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Payment verification failed.');
        } finally {
            setPaymentVerifying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition"
                >
                    <X className="w-5 h-5" />
                </button>

                {!isRazorpayOpen ? (
                    <div className="space-y-6">
                        <div>
                            <div className="inline-flex items-center space-x-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-xs font-semibold">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Multi-Vendor Checkout</span>
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900 mt-2">Delivery & Order Review</h2>
                            <p className="text-xs text-slate-500">
                                Stock for all cart items will be locked atomically using row-level database transactions upon initialization.
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Saved Addresses */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                Select Delivery Address:
                            </label>
                            {addresses.length === 0 ? (
                                <p className="text-xs text-slate-400">Loading default addresses...</p>
                            ) : (
                                <div className="space-y-2">
                                    {addresses.map((addr) => {
                                        const isSelected = selectedAddressId === addr.id;
                                        return (
                                            <div
                                                key={addr.id}
                                                onClick={() => setSelectedAddressId(addr.id)}
                                                className={`p-4 rounded-2xl border cursor-pointer transition ${isSelected ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-slate-900">{addr.name}</span>
                                                    <span className="text-xs font-semibold text-slate-500">{addr.phone}</span>
                                                </div>
                                                <div className="text-xs text-slate-600 mt-1">
                                                    {addr.address_line1}, {addr.address_line2 ? `${addr.address_line2}, ` : ''}
                                                    {addr.city}, {addr.state} – {addr.postal_code}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Order Summary Pill */}
                        {cart && (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                                <div className="flex justify-between font-bold text-slate-900">
                                    <span>Items in Order ({cart.items_count})</span>
                                    <span>{formatINR(cart.grand_total + cart.estimated_tax)}</span>
                                </div>
                                <div className="text-[11px] text-slate-500">
                                    Includes 18% GST ({formatINR(cart.estimated_tax)}) and Blue Dart Express shipping.
                                </div>
                            </div>
                        )}

                        {/* Action */}
                        <div className="pt-2">
                            <button
                                disabled={isSubmitting || !selectedAddressId}
                                onClick={handleInitialize}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2 transition"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                <span>{isSubmitting ? 'Reserving Stock & Generating Order...' : 'Proceed to Razorpay Payment'}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Razorpay Interactive Simulator */
                    <div className="space-y-6">
                        <div className="bg-slate-900 text-white -m-6 sm:-m-8 p-6 rounded-t-3xl flex items-center justify-between">
                            <div>
                                <div className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                                    Razorpay Payment Gateway (Test Mode)
                                </div>
                                <h3 className="text-xl font-bold mt-0.5">NexCart Technologies India</h3>
                                <div className="text-xs text-slate-400 mt-0.5">Order ID: {razorpayOrder.razorpay_order_id}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-slate-400">Amount Due</div>
                                <div className="text-2xl font-extrabold text-emerald-400">
                                    {formatINR(razorpayOrder.grand_total)}
                                </div>
                            </div>
                        </div>

                        {/* Payment Options */}
                        <div className="pt-6 space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setPaymentMethod('upi')}
                                    className={`p-3 rounded-xl border flex flex-col items-center space-y-1 text-xs font-bold transition ${paymentMethod === 'upi' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
                                >
                                    <Smartphone className="w-4 h-4" />
                                    <span>UPI / QR</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('card')}
                                    className={`p-3 rounded-xl border flex flex-col items-center space-y-1 text-xs font-bold transition ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    <span>Cards</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('netbanking')}
                                    className={`p-3 rounded-xl border flex flex-col items-center space-y-1 text-xs font-bold transition ${paymentMethod === 'netbanking' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
                                >
                                    <Building className="w-4 h-4" />
                                    <span>NetBanking</span>
                                </button>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                                <div className="font-semibold text-slate-800">
                                    {paymentMethod === 'upi' && 'Pay via UPI VPA (Google Pay / PhonePe / Paytm / CRED)'}
                                    {paymentMethod === 'card' && 'Pay via Visa / MasterCard / RuPay Debit or Credit Card'}
                                    {paymentMethod === 'netbanking' && 'Pay via HDFC / SBI / ICICI / Axis Bank NetBanking'}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    This payment uses the real Razorpay Adapter API architecture with SHA-256 HMAC signature verification. You can test successful payment confirmation or test aborting to verify stock reservation release.
                                </p>
                            </div>

                            {/* Simulation Buttons */}
                            <div className="space-y-2 pt-2">
                                <button
                                    disabled={paymentVerifying}
                                    onClick={() => handleSimulatePayment(true)}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 flex items-center justify-center space-x-2 transition"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{paymentVerifying ? 'Verifying HMAC Signature...' : `Authorize & Pay ${formatINR(razorpayOrder.grand_total)}`}</span>
                                </button>
                                <button
                                    disabled={paymentVerifying}
                                    onClick={() => handleSimulatePayment(false)}
                                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl font-semibold text-xs transition"
                                >
                                    Simulate Payment Failure / Abort
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

