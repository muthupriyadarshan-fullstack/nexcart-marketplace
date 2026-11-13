import React from 'react';
import { Order } from '../types';
import { CheckCircle2, PackageCheck, Truck, Store, ArrowRight } from 'lucide-react';

interface OrderConfirmationModalProps {
    order: Order | null;
    onClose: () => void;
    onViewOrders: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({ order, onClose, onViewOrders }) => {
    if (!order) return null;

    const formatINR = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                    <h2 className="text-2xl font-extrabold text-slate-900">Payment Confirmed!</h2>
                    <p className="text-sm text-slate-600">
                        Order <span className="font-mono font-bold text-indigo-600">{order.order_number}</span> has been confirmed.
                    </p>
                </div>

                {/* Multi-Vendor Segregated Packages */}
                <div className="text-left space-y-3 pt-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Multi-Vendor Shipment Dispatches ({order.vendor_splits?.length || 1} Vendors):
                    </div>
                    {order.vendor_splits?.map((split) => (
                        <div key={split.store_id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                                <div className="flex items-center space-x-1.5">
                                    <Store className="w-4 h-4 text-indigo-600" />
                                    <span>{split.store_name}</span>
                                </div>
                                <span className="text-slate-600">{formatINR(split.subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                                <div className="flex items-center space-x-1">
                                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Carrier: Blue Dart Express</span>
                                </div>
                                <span className="font-semibold text-emerald-600">Dispatched Independently</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-800">Total Paid (Razorpay)</span>
                    <span className="text-lg font-extrabold text-indigo-700">{formatINR(order.grand_total)}</span>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs transition"
                    >
                        Continue Shopping
                    </button>
                    <button
                        onClick={() => {
                            onClose();
                            onViewOrders();
                        }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-indigo-200 flex items-center justify-center space-x-1.5 transition"
                    >
                        <span>View My Orders</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

