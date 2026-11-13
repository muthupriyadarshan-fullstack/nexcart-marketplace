import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Order, OrderItem } from '../types';
import { Package, Truck, Store, Star, RotateCcw, CheckCircle, Clock, X, AlertCircle } from 'lucide-react';

export const CustomerOrdersView: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Review modal state
    const [reviewItem, setReviewItem] = useState<OrderItem | null>(null);
    const [rating, setRating] = useState<number>(5);
    const [reviewTitle, setReviewTitle] = useState<string>('');
    const [reviewComment, setReviewComment] = useState<string>('');
    const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
    const [reviewMessage, setReviewMessage] = useState<string>('');

    // Return modal state
    const [returnItem, setReturnItem] = useState<OrderItem | null>(null);
    const [returnReason, setReturnReason] = useState<string>('Defective or damaged product');
    const [returnDesc, setReturnDesc] = useState<string>('');
    const [returnSubmitting, setReturnSubmitting] = useState<boolean>(false);
    const [returnMessage, setReturnMessage] = useState<string>('');

    const fetchOrders = () => {
        setIsLoading(true);
        apiClient.get('/orders')
            .then((res) => setOrders(res.data.data.items))
            .catch((err) => console.error(err))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const formatINR = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewItem) return;
        setReviewSubmitting(true);
        setReviewMessage('');

        try {
            await apiClient.post('/reviews', {
                order_item_id: reviewItem.id,
                rating,
                title: reviewTitle,
                comment: reviewComment,
            });
            setReviewMessage('Review published successfully!');
            setTimeout(() => {
                setReviewItem(null);
                setReviewTitle('');
                setReviewComment('');
                setReviewMessage('');
                fetchOrders();
            }, 1000);
        } catch (err: any) {
            setReviewMessage(err.response?.data?.message || 'Failed to submit review.');
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleSubmitReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!returnItem) return;
        setReturnSubmitting(true);
        setReturnMessage('');

        try {
            await apiClient.post('/returns', {
                order_item_id: returnItem.id,
                reason: returnReason,
                description: returnDesc,
            });
            setReturnMessage('Return request submitted! Our team will review shortly.');
            setTimeout(() => {
                setReturnItem(null);
                setReturnDesc('');
                setReturnMessage('');
                fetchOrders();
            }, 1200);
        } catch (err: any) {
            setReturnMessage(err.response?.data?.message || 'Failed to submit return request.');
        } finally {
            setReturnSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-16">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900">Order History & Dispatches</h1>
                <p className="text-xs text-slate-500">
                    Track segregated shipments from different vendors, submit verified product reviews, or dispute items.
                </p>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2].map((n) => (
                        <div key={n} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 animate-pulse">
                            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                            <div className="h-24 bg-slate-100 rounded-2xl"></div>
                        </div>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                    <Package className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-900">No orders placed yet</h3>
                    <p className="text-sm text-slate-500">Items you purchase will appear here with live tracking.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                            {/* Header */}
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="space-y-0.5">
                                    <div className="text-slate-500">Order Placed</div>
                                    <div className="font-bold text-slate-900">
                                        {new Date(order.placed_at || order.created_at).toLocaleDateString('en-IN', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-slate-500">Total Amount</div>
                                    <div className="font-extrabold text-slate-900">{formatINR(order.grand_total)}</div>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-slate-500">Order Number</div>
                                    <div className="font-mono font-bold text-indigo-600">{order.order_number}</div>
                                </div>
                                <div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {order.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-6 space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50/60 rounded-2xl border border-slate-100">
                                        <div className="space-y-1">
                                            <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                                <Store className="w-3 h-3" />
                                                <span>Sold by {item.store_name}</span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900">{item.product_name}</h4>
                                            <div className="text-xs text-slate-500">
                                                SKU: {item.variant_sku} • Qty: {item.quantity} • Unit: {formatINR(item.unit_price)}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                                            <div className="text-sm font-extrabold text-slate-900">
                                                {formatINR(item.total_price)}
                                            </div>

                                            <div className="flex space-x-2">
                                                {!item.is_reviewed ? (
                                                    <button
                                                        onClick={() => setReviewItem(item)}
                                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition flex items-center space-x-1"
                                                    >
                                                        <Star className="w-3.5 h-3.5" />
                                                        <span>Review</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-xs font-medium text-emerald-600 flex items-center">
                                                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Reviewed
                                                    </span>
                                                )}

                                                {!item.has_return_request ? (
                                                    <button
                                                        onClick={() => setReturnItem(item)}
                                                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition flex items-center space-x-1"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                        <span>Return</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-xs font-medium text-amber-600 flex items-center">
                                                        <Clock className="w-3.5 h-3.5 mr-1" /> Return Requested
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Vendor Shipments Breakdown */}
                                {order.shipments && order.shipments.length > 0 && (
                                    <div className="pt-3 border-t border-slate-100">
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                            Shipment Carriers & Tracking
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {order.shipments.map((s) => (
                                                <div key={s.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                                                    <div className="flex justify-between font-bold text-slate-800">
                                                        <span>{s.store_name}</span>
                                                        <span className="capitalize text-emerald-600">{s.status}</span>
                                                    </div>
                                                    <div className="text-slate-500 flex items-center space-x-1">
                                                        <Truck className="w-3.5 h-3.5 text-indigo-500" />
                                                        <span>{s.carrier || 'Blue Dart Express'}</span>
                                                        <span>•</span>
                                                        <span className="font-mono">{s.tracking_number}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            {reviewItem && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <button onClick={() => setReviewItem(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-slate-900">Review {reviewItem.product_name}</h3>
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Rating</label>
                                <div className="flex space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className="p-1 text-amber-400 hover:scale-110 transition"
                                        >
                                            <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400' : 'text-slate-300'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Exceptional sound quality and fast delivery"
                                    value={reviewTitle}
                                    onChange={(e) => setReviewTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Comments</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Describe your authentic experience with this product..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            {reviewMessage && <p className="text-xs font-semibold text-emerald-600">{reviewMessage}</p>}
                            <button
                                type="submit"
                                disabled={reviewSubmitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs transition"
                            >
                                {reviewSubmitting ? 'Submitting...' : 'Post Verified Review'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            {returnItem && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <button onClick={() => setReturnItem(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-slate-900">Request Return / Refund</h3>
                        <p className="text-xs text-slate-500">
                            Returning: <span className="font-semibold text-slate-800">{returnItem.product_name}</span>
                        </p>
                        <form onSubmit={handleSubmitReturn} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Reason for Return</label>
                                <select
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="Defective or damaged product">Defective or damaged product</option>
                                    <option value="Item not as described">Item not as described</option>
                                    <option value="Wrong size or variant received">Wrong size or variant received</option>
                                    <option value="Quality not up to expectations">Quality not up to expectations</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Additional Details</label>
                                <textarea
                                    rows={3}
                                    placeholder="Provide additional details for vendor / support review..."
                                    value={returnDesc}
                                    onChange={(e) => setReturnDesc(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            {returnMessage && <p className="text-xs font-semibold text-emerald-600">{returnMessage}</p>}
                            <button
                                type="submit"
                                disabled={returnSubmitting}
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs transition"
                            >
                                {returnSubmitting ? 'Submitting...' : 'Submit Return Request'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

