import React, { useState } from 'react';
import { Cart } from '../types';
import { X, Trash2, Tag, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cart: Cart | null;
    onUpdateQuantity: (itemId: number, qty: number) => void;
    onRemoveItem: (itemId: number) => void;
    onApplyCoupon: (code: string) => Promise<void>;
    onRemoveCoupon: () => Promise<void>;
    onProceedCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
    isOpen,
    onClose,
    cart,
    onUpdateQuantity,
    onRemoveItem,
    onApplyCoupon,
    onRemoveCoupon,
    onProceedCheckout,
}) => {
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');

    if (!isOpen) return null;

    const formatINR = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const handleApplyCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        setCouponError('');
        try {
            await onApplyCoupon(couponCode);
            setCouponCode('');
        } catch (err: any) {
            setCouponError(err.response?.data?.message || 'Invalid coupon code');
        } finally {
            setCouponLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm">
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <ShoppingBag className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-lg font-extrabold text-slate-900">Your Shopping Cart</h2>
                            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                                {cart?.items_count || 0}
                            </span>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {!cart || cart.items.length === 0 ? (
                            <div className="py-16 text-center space-y-3">
                                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                                <div className="text-sm font-bold text-slate-900">Your cart is empty</div>
                                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                    Explore authentic tech and handloom fashion from verified multi-vendor storefronts.
                                </p>
                            </div>
                        ) : (
                            cart.items.map((item) => (
                                <div key={item.id} className="flex space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                                    <img
                                        src={item.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300'}
                                        alt={item.product_name}
                                        className="w-16 h-16 rounded-xl object-cover bg-white flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                                                {item.store.name}
                                            </div>
                                            <h4 className="text-xs font-bold text-slate-900 truncate">{item.product_name}</h4>
                                            <div className="text-[11px] text-slate-500">{item.variant_title}</div>
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <div className="text-xs font-extrabold text-slate-900">
                                                {formatINR(item.subtotal)}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="flex items-center border border-slate-200 bg-white rounded-lg">
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                        className="px-2 py-0.5 text-xs text-slate-600 hover:text-slate-900 font-bold"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="px-2 py-0.5 text-xs font-bold text-slate-900">{item.quantity}</span>
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                                        className="px-2 py-0.5 text-xs text-slate-600 hover:text-slate-900 font-bold"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => onRemoveItem(item.id)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer / Summary */}
                    {cart && cart.items.length > 0 && (
                        <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
                            {/* Coupon Section */}
                            {cart.coupon ? (
                                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs">
                                    <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                                        <Tag className="w-3.5 h-3.5" />
                                        <span>Coupon {cart.coupon.code} Applied</span>
                                        <span className="text-emerald-600 font-normal">(-{formatINR(cart.discount_amount)})</span>
                                    </div>
                                    <button
                                        onClick={onRemoveCoupon}
                                        className="text-xs text-rose-600 font-bold hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Try WELCOME10 or FESTIVE500"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs uppercase font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={couponLoading}
                                        className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold transition disabled:bg-slate-400"
                                    >
                                        Apply
                                    </button>
                                </form>
                            )}
                            {couponError && <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>}

                            {/* Price Breakdown */}
                            <div className="space-y-1.5 text-xs text-slate-600">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-semibold text-slate-900">{formatINR(cart.subtotal)}</span>
                                </div>
                                {cart.discount_amount > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-semibold">
                                        <span>Coupon Discount</span>
                                        <span>-{formatINR(cart.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>GST (18% Estimated)</span>
                                    <span className="font-semibold text-slate-900">{formatINR(cart.estimated_tax)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping Fee</span>
                                    <span className="font-semibold text-slate-900">
                                        {cart.shipping_fee === 0 ? <span className="text-emerald-600">FREE</span> : formatINR(cart.shipping_fee)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                                    <span>Grand Total</span>
                                    <span className="text-indigo-600">{formatINR(cart.grand_total + cart.estimated_tax)}</span>
                                </div>
                            </div>

                            {/* Checkout Button */}
                            <button
                                onClick={() => {
                                    onClose();
                                    onProceedCheckout();
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2 transition"
                            >
                                <span>Proceed to Checkout</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>

                            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Guaranteed Stock Reservation on Checkout</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

