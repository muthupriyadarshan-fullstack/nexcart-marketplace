import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { HelpCircle, Search, Package, RotateCcw, Check, X, Truck, Store } from 'lucide-react';

export const SupportDashboardView: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [returns, setReturns] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const formatINR = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const fetchSupportData = (q?: string) => {
        setIsLoading(true);
        Promise.all([
            apiClient.get('/support/orders', { params: { q: q || '' } }),
            apiClient.get('/support/returns'),
        ]).then(([ordRes, retRes]) => {
            setOrders(ordRes.data.data.data || ordRes.data.data);
            setReturns(retRes.data.data.data || retRes.data.data);
        }).catch((err) => console.error(err))
          .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchSupportData();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSupportData(searchQuery);
    };

    const handleResolveReturn = async (id: number, status: 'approved' | 'rejected') => {
        try {
            await apiClient.put(`/support/returns/${id}/review`, {
                status,
                notes: `Support desk resolution: ${status}`
            });
            fetchSupportData(searchQuery);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error resolving return');
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-16">
            <div className="bg-gradient-to-r from-cyan-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center space-x-1.5 bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur">
                        <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Support Staff Helpdesk Portal</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold">Customer Assistance & Dispute Resolution</h1>
                    <p className="text-xs sm:text-sm text-cyan-200">
                        Investigate orders across all vendors, verify Blue Dart carrier tracking, and resolve return requests.
                    </p>
                </div>
            </div>

            {/* Search Box */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search by Order Number (NEX-...), Customer Email, or Phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-cyan-500 shadow-sm"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
                <button
                    type="submit"
                    className="bg-cyan-700 hover:bg-cyan-800 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm"
                >
                    Lookup
                </button>
            </form>

            {/* Return Disputes Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Pending Return Disputes</h3>
                <div className="space-y-3">
                    {returns.length === 0 ? (
                        <p className="text-xs text-slate-400">No active return disputes.</p>
                    ) : (
                        returns.map((ret: any) => (
                            <div key={ret.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                    <div className="font-bold text-slate-900">Customer: {ret.user?.name} ({ret.user?.email})</div>
                                    <div className="text-slate-600">Product: {ret.order_item?.product_name}</div>
                                    <div className="text-slate-500">Reason: {ret.reason}</div>
                                    <div className="font-mono text-indigo-600">Order: {ret.order_item?.order?.order_number}</div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleResolveReturn(ret.id, 'approved')}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Approve & Refund</span>
                                    </button>
                                    <button
                                        onClick={() => handleResolveReturn(ret.id, 'rejected')}
                                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Orders Lookup Results */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Platform Orders</h3>
                <div className="space-y-4">
                    {orders.map((ord: any) => (
                        <div key={ord.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                            <div className="flex justify-between items-center font-bold">
                                <span className="font-mono text-indigo-600">{ord.order_number}</span>
                                <span className="text-slate-900">{formatINR(ord.grand_total)}</span>
                            </div>
                            <div className="text-slate-600">Customer: {ord.user?.name} ({ord.user?.email})</div>
                            <div className="space-y-1 pt-1 border-t border-slate-200">
                                {ord.items?.map((it: any) => (
                                    <div key={it.id} className="flex justify-between text-slate-500 text-[11px]">
                                        <span>{it.product_name} (Qty: {it.quantity})</span>
                                        <span className="font-semibold text-slate-700">{formatINR(it.total_price)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

