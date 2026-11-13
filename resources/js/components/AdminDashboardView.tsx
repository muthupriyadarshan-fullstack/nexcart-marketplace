import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Shield, Users, Store, IndianRupee, ShoppingBag, CheckCircle, XCircle, RotateCcw, Tag, FileText, Check, AlertCircle } from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'metrics' | 'vendors' | 'products' | 'refunds' | 'coupons' | 'audit'>('metrics');
    const [vendorsList, setVendorsList] = useState<any[]>([]);
    const [productsList, setProductsList] = useState<any[]>([]);
    const [refundsList, setRefundsList] = useState<any[]>([]);
    const [couponsList, setCouponsList] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [actionMsg, setActionMsg] = useState<string>('');

    const formatINR = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const fetchAdminData = () => {
        setIsLoading(true);
        Promise.all([
            apiClient.get('/admin/dashboard'),
            apiClient.get('/admin/vendors'),
            apiClient.get('/admin/products'),
            apiClient.get('/admin/refunds'),
            apiClient.get('/admin/coupons'),
            apiClient.get('/admin/audit-logs'),
        ]).then(([dashRes, venRes, prodRes, refRes, coupRes, audRes]) => {
            setAnalytics(dashRes.data.data);
            setVendorsList(venRes.data.data.data || venRes.data.data);
            setProductsList(prodRes.data.data.data || prodRes.data.data);
            setRefundsList(refRes.data.data.data || refRes.data.data);
            setCouponsList(coupRes.data.data);
            setAuditLogs(audRes.data.data.data || audRes.data.data);
        }).catch((err) => console.error(err))
          .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const handleApproveVendor = async (id: number) => {
        try {
            await apiClient.put(`/admin/vendors/${id}/approve`);
            setActionMsg('Vendor application approved and store activated.');
            setTimeout(() => setActionMsg(''), 3000);
            fetchAdminData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error approving vendor');
        }
    };

    const handleModerateProduct = async (id: number, status: 'approved' | 'rejected') => {
        try {
            await apiClient.put(`/admin/products/${id}/moderate`, { status });
            setActionMsg(`Product marked as ${status}.`);
            setTimeout(() => setActionMsg(''), 3000);
            fetchAdminData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error moderating product');
        }
    };

    const handleProcessRefund = async (returnId: number) => {
        try {
            await apiClient.post(`/admin/refunds/${returnId}/process`, { notes: 'Approved and issued by Super Admin' });
            setActionMsg('Refund processed successfully via Razorpay Payment Gateway.');
            setTimeout(() => setActionMsg(''), 3000);
            fetchAdminData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error processing refund');
        }
    };

    if (isLoading) {
        return <div className="p-12 text-center text-slate-400">Loading Governance Hub...</div>;
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-16">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center space-x-1.5 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur">
                        <Shield className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Platform Super Admin Hub</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold">Marketplace Governance & Revenue</h1>
                    <p className="text-xs sm:text-sm text-slate-300">
                        Oversee vendor approvals, commission splits, catalog moderation, Razorpay refunds, and audit trail.
                    </p>
                </div>
                {actionMsg && (
                    <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-semibold">
                        {actionMsg}
                    </div>
                )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <div className="text-xs text-slate-500 font-medium">Platform Gross GMV</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                        {formatINR(analytics?.metrics?.total_gmv || 0)}
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <div className="text-xs text-slate-500 font-medium">Platform Fee Revenue</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-indigo-600">
                        {formatINR(analytics?.metrics?.platform_revenue || 0)}
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <div className="text-xs text-slate-500 font-medium">Active Vendors</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                        {analytics?.metrics?.vendors_count || 0}
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <div className="text-xs text-slate-500 font-medium">Total Orders Placed</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                        {analytics?.metrics?.orders_count || 0}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
                <button
                    onClick={() => setActiveTab('metrics')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${activeTab === 'metrics' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Platform Metrics
                </button>
                <button
                    onClick={() => setActiveTab('vendors')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${activeTab === 'vendors' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Vendors & Stores ({vendorsList.length})
                </button>
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Product Moderation ({productsList.length})
                </button>
                <button
                    onClick={() => setActiveTab('refunds')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${activeTab === 'refunds' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Returns & Refunds ({refundsList.length})
                </button>
                <button
                    onClick={() => setActiveTab('coupons')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${activeTab === 'coupons' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Coupons ({couponsList.length})
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Audit Trail ({auditLogs.length})
                </button>
            </div>

            {/* Tab: Overview Metrics */}
            {activeTab === 'metrics' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Recent Platform Orders</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Order Number</th>
                                    <th className="p-3">Customer</th>
                                    <th className="p-3">Total Amount</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {analytics?.recent_orders?.map((ord: any) => (
                                    <tr key={ord.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-mono font-bold text-indigo-600">{ord.order_number}</td>
                                        <td className="p-3 font-semibold text-slate-800">{ord.customer_name}</td>
                                        <td className="p-3 font-extrabold text-slate-900">{formatINR(ord.grand_total)}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                                                {ord.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-400">{ord.placed_at}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab: Vendors */}
            {activeTab === 'vendors' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Registered Vendor Stores</h3>
                    <div className="space-y-3">
                        {vendorsList.map((v) => {
                            const store = v.stores?.[0];
                            return (
                                <div key={v.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-slate-900 text-sm">{store?.name || 'Store'}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${v.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {v.status}
                                            </span>
                                        </div>
                                        <div className="text-slate-500">
                                            Owner: <span className="font-semibold text-slate-700">{v.user?.name}</span> ({v.user?.email})
                                        </div>
                                        <div className="text-slate-500">
                                            Company: {v.profile?.company_name} • GST: <span className="font-mono">{v.profile?.tax_id_gst}</span>
                                        </div>
                                        <div className="text-slate-500">
                                            Bank: {v.profile?.bank_name} • IFSC: <span className="font-mono">{v.profile?.bank_ifsc_code}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {v.status === 'pending' && (
                                            <button
                                                onClick={() => handleApproveVendor(v.id)}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                                            >
                                                Approve Vendor
                                            </button>
                                        )}
                                        <div className="text-right">
                                            <div className="text-[11px] text-slate-400">Commission Rate</div>
                                            <div className="text-sm font-bold text-slate-800">{store?.commission_rate}%</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tab: Products Moderation */}
            {activeTab === 'products' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Catalog Moderation & Verification</h3>
                    <div className="space-y-3">
                        {productsList.map((p) => (
                            <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-slate-900">{p.name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {p.status}
                                        </span>
                                    </div>
                                    <div className="text-slate-500">
                                        Vendor: <span className="font-semibold">{p.store?.name}</span> • Category: {p.category?.name}
                                    </div>
                                    <div className="text-slate-900 font-extrabold">{formatINR(p.base_price)}</div>
                                </div>
                                <div className="flex space-x-2">
                                    {p.status !== 'approved' && (
                                        <button
                                            onClick={() => handleModerateProduct(p.id, 'approved')}
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center space-x-1"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Approve</span>
                                        </button>
                                    )}
                                    {p.status !== 'rejected' && (
                                        <button
                                            onClick={() => handleModerateProduct(p.id, 'rejected')}
                                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs"
                                        >
                                            Reject
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab: Refunds */}
            {activeTab === 'refunds' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Return & Refund Requests</h3>
                    <div className="space-y-3">
                        {refundsList.length === 0 ? (
                            <p className="text-xs text-slate-400">No return requests submitted.</p>
                        ) : (
                            refundsList.map((r) => (
                                <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-slate-900">Order: {r.order_item?.order?.order_number}</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                                                {r.status}
                                            </span>
                                        </div>
                                        <div className="text-slate-600">Item: {r.order_item?.product_name}</div>
                                        <div className="text-slate-500">Reason: {r.reason}</div>
                                        <div className="text-slate-900 font-extrabold">{formatINR(r.order_item?.total_price || 0)}</div>
                                    </div>
                                    {r.status === 'requested' && (
                                        <button
                                            onClick={() => handleProcessRefund(r.id)}
                                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-200 flex items-center space-x-1"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span>Process Gateway Refund</span>
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Tab: Coupons */}
            {activeTab === 'coupons' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Active Platform Coupons</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {couponsList.map((c) => (
                            <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                        {c.code}
                                    </span>
                                    <span className="text-emerald-600 font-bold">Active</span>
                                </div>
                                <div className="text-slate-700 font-medium">
                                    {c.discount_type === 'percentage' ? `${c.discount_value}% Discount` : `Flat ₹${c.discount_value} Discount`}
                                </div>
                                <div className="text-slate-500">
                                    Min Order: ₹{c.min_order_amount} • Used: {c.used_count || 0} times
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab: Audit Logs */}
            {activeTab === 'audit' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Immutable Audit Logs Trail</h3>
                    <div className="space-y-2">
                        {auditLogs.map((log) => (
                            <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                                <div>
                                    <span className="font-mono font-bold text-indigo-600">{log.event}</span>
                                    <span className="text-slate-600 ml-2">by User #{log.user_id || 'System'}</span>
                                    <span className="text-slate-400 ml-2">({log.auditable_type})</span>
                                </div>
                                <span className="text-slate-400 text-[11px]">{new Date(log.created_at).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

