import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Store, Package, AlertTriangle, TrendingUp, IndianRupee, Plus, Truck, Edit3, Trash2, X, CheckCircle, RefreshCw } from 'lucide-react';

export const VendorDashboardView: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'inventory' | 'orders' | 'payouts'>('overview');
    const [products, setProducts] = useState<any[]>([]);
    const [inventoryList, setInventoryList] = useState<any[]>([]);
    const [ordersList, setOrdersList] = useState<any[]>([]);
    const [payoutsData, setPayoutsData] = useState<any>({ available_balance: 0, payouts: [] });
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // New Product Modal State
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [newProductCategory, setNewProductCategory] = useState('1');
    const [newProductBrand, setNewProductBrand] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductDesc, setNewProductDesc] = useState('');
    const [newProductSku, setNewProductSku] = useState('');
    const [newProductQty, setNewProductQty] = useState('15');
    const [newProductImg, setNewProductImg] = useState('https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800');

    // Restock Modal
    const [restockVariantId, setRestockVariantId] = useState<number | null>(null);
    const [restockQty, setRestockQty] = useState<number>(20);

    // Payout Modal
    const [isPayoutOpen, setIsPayoutOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('5000');
    const [payoutMsg, setPayoutMsg] = useState('');

    const formatINR = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    const fetchAllVendorData = () => {
        setIsLoading(true);
        Promise.all([
            apiClient.get('/vendor/dashboard'),
            apiClient.get('/vendor/products'),
            apiClient.get('/vendor/inventory'),
            apiClient.get('/vendor/orders'),
            apiClient.get('/vendor/payouts'),
        ]).then(([dashRes, prodRes, invRes, ordRes, payRes]) => {
            setDashboardData(dashRes.data.data);
            setProducts(prodRes.data.data.items);
            setInventoryList(invRes.data.data.data || invRes.data.data);
            setOrdersList(ordRes.data.data.data || ordRes.data.data);
            setPayoutsData(payRes.data.data);
        }).catch((err) => console.error(err))
          .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchAllVendorData();
    }, []);

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/vendor/products', {
                name: newProductName,
                category_id: parseInt(newProductCategory),
                brand: newProductBrand,
                description: newProductDesc,
                base_price: parseFloat(newProductPrice),
                images: [{ image_url: newProductImg, is_primary: true }],
                variants: [
                    {
                        sku: newProductSku || ('SKU-' + Math.random().toString(36).substring(2, 8).toUpperCase()),
                        title: 'Standard',
                        price: parseFloat(newProductPrice),
                        quantity: parseInt(newProductQty),
                    }
                ]
            });
            setIsAddProductOpen(false);
            fetchAllVendorData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error creating product');
        }
    };

    const handleRestock = async () => {
        if (!restockVariantId) return;
        try {
            await apiClient.put(`/vendor/inventory/${restockVariantId}`, {
                quantity: restockQty,
                notes: 'Vendor dashboard manual replenishment'
            });
            setRestockVariantId(null);
            fetchAllVendorData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error restocking');
        }
    };

    const handleRequestPayout = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/vendor/payouts/request', { amount: parseFloat(payoutAmount) });
            setPayoutMsg('Payout request registered!');
            setTimeout(() => {
                setIsPayoutOpen(false);
                setPayoutMsg('');
                fetchAllVendorData();
            }, 1000);
        } catch (err: any) {
            setPayoutMsg(err.response?.data?.message || 'Payout request failed');
        }
    };

    if (isLoading) {
        return <div className="p-12 text-center text-slate-400">Loading Vendor Portal metrics...</div>;
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-16">
            {/* Store Banner */}
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center space-x-1.5 bg-black/20 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur">
                        <Store className="w-3.5 h-3.5" />
                        <span>Vendor Operations Dashboard</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold">{dashboardData?.store?.name}</h1>
                    <p className="text-xs sm:text-sm text-amber-100">
                        Platform Commission Rate: <span className="font-bold">{dashboardData?.store?.commission_rate}%</span> • Automated Blue Dart Fulfillment
                    </p>
                </div>
                <button
                    onClick={() => setIsAddProductOpen(true)}
                    className="inline-flex items-center space-x-2 bg-white text-amber-900 hover:bg-amber-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product</span>
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <div className="text-xs text-slate-500 font-medium">Gross Store Sales</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                        {formatINR(dashboardData?.metrics?.total_sales || 0)}
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <div className="text-xs text-slate-500 font-medium">Net Vendor Earnings</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">
                        {formatINR(dashboardData?.metrics?.total_earnings || 0)}
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <div className="text-xs text-slate-500 font-medium">Orders Received</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                        {dashboardData?.metrics?.total_orders || 0}
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <div className="text-xs text-slate-500 font-medium">Low Stock Alerts</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-amber-600">
                        {dashboardData?.metrics?.low_stock_count || 0}
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${activeTab === 'overview' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Overview & Alerts
                </button>
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${activeTab === 'products' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Products Catalog ({products.length})
                </button>
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${activeTab === 'inventory' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Inventory & Restock
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${activeTab === 'orders' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Store Orders ({ordersList.length})
                </button>
                <button
                    onClick={() => setActiveTab('payouts')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${activeTab === 'payouts' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                    Earnings & Payouts
                </button>
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Low Stock Warning Box */}
                    {dashboardData?.low_stock_items?.length > 0 && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                            <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <span>Low Inventory Notice – Restock to Prevent Stockouts</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {dashboardData.low_stock_items.map((item: any) => (
                                    <div key={item.variant_id} className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                                        <div className="text-xs">
                                            <div className="font-bold text-slate-900">{item.product_name}</div>
                                            <div className="text-slate-500 font-mono">SKU: {item.sku}</div>
                                            <div className="text-amber-700 font-semibold mt-0.5">
                                                Available: {item.available_quantity} (Threshold: {item.threshold})
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setRestockVariantId(item.variant_id);
                                                setActiveTab('inventory');
                                            }}
                                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition"
                                        >
                                            Restock
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Orders */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                        <h3 className="text-sm font-bold text-slate-900">Recent Customer Purchases for Your Store</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Order Number</th>
                                        <th className="p-3">Customer</th>
                                        <th className="p-3">Item Name</th>
                                        <th className="p-3">Qty</th>
                                        <th className="p-3">Total</th>
                                        <th className="p-3">Your Earnings</th>
                                        <th className="p-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {dashboardData?.recent_orders?.map((ord: any) => (
                                        <tr key={ord.order_item_id} className="hover:bg-slate-50">
                                            <td className="p-3 font-mono font-bold text-indigo-600">{ord.order_number}</td>
                                            <td className="p-3 font-semibold text-slate-800">{ord.customer_name}</td>
                                            <td className="p-3 text-slate-700">{ord.product_name}</td>
                                            <td className="p-3 font-bold">{ord.quantity}</td>
                                            <td className="p-3 font-bold text-slate-900">{formatINR(ord.total_price)}</td>
                                            <td className="p-3 font-bold text-emerald-600">{formatINR(ord.vendor_earnings)}</td>
                                            <td className="p-3">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                                                    {ord.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Products */}
            {activeTab === 'products' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-900">Store Catalog</h3>
                        <button
                            onClick={() => setIsAddProductOpen(true)}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Product</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {products.map((p) => (
                            <div key={p.id} className="p-4 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <img
                                        src={p.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500'}
                                        alt={p.name}
                                        className="w-full h-36 object-cover rounded-lg"
                                    />
                                    <div className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</div>
                                    <div className="text-xs text-slate-500">Category: {p.category?.name}</div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                    <span className="font-extrabold text-slate-900">{formatINR(p.sale_price || p.base_price)}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {p.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab: Inventory */}
            {activeTab === 'inventory' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Inventory Stock Levels & Movement Audit</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Product</th>
                                    <th className="p-3">SKU</th>
                                    <th className="p-3">Physical Qty</th>
                                    <th className="p-3">Reserved (Checkout)</th>
                                    <th className="p-3">Available</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {inventoryList.map((item: any) => {
                                    const inv = item.inventory;
                                    const available = (inv?.quantity || 0) - (inv?.reserved_quantity || 0);
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="p-3 font-semibold text-slate-800">{item.product?.name || item.title}</td>
                                            <td className="p-3 font-mono text-slate-500">{item.sku}</td>
                                            <td className="p-3 font-bold">{inv?.quantity || 0}</td>
                                            <td className="p-3 text-indigo-600 font-semibold">{inv?.reserved_quantity || 0}</td>
                                            <td className="p-3 font-extrabold text-emerald-600">{available}</td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => {
                                                        setRestockVariantId(item.id);
                                                        setRestockQty((inv?.quantity || 0) + 15);
                                                    }}
                                                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px] transition"
                                                >
                                                    Adjust / Restock
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab: Orders */}
            {activeTab === 'orders' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Orders Dispatched by Your Store</h3>
                    <div className="space-y-3">
                        {ordersList.map((ord: any) => (
                            <div key={ord.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                    <div className="font-bold text-slate-900">{ord.product_name}</div>
                                    <div className="text-slate-500">
                                        Order: <span className="font-mono font-bold text-indigo-600">{ord.order?.order_number}</span> • Qty: {ord.quantity}
                                    </div>
                                    <div className="text-slate-500">Customer: {ord.order?.user?.name}</div>
                                </div>
                                <div className="text-right space-y-1">
                                    <div className="font-extrabold text-slate-900">{formatINR(ord.total_price)}</div>
                                    <div className="text-emerald-600 font-semibold">Your Earnings: {formatINR(ord.vendor_earnings)}</div>
                                    <div className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold uppercase text-[10px]">
                                        {ord.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab: Payouts */}
            {activeTab === 'payouts' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs text-slate-500 font-medium">Available for Payout</div>
                            <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                                {formatINR(payoutsData.available_balance || 0)}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                                Direct NEFT/IMPS transfer to verified vendor bank account.
                            </div>
                        </div>
                        <button
                            onClick={() => setIsPayoutOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-200"
                        >
                            Request Bank Payout
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
                        <h4 className="text-sm font-bold text-slate-900">Payout Requests History</h4>
                        {payoutsData.payouts?.length === 0 ? (
                            <p className="text-xs text-slate-400">No payout requests submitted yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {payoutsData.payouts?.map((p: any) => (
                                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                        <div>
                                            <span className="font-bold text-slate-900">{formatINR(p.amount)}</span>
                                            <span className="text-slate-400 ml-2">Requested on {new Date(p.requested_at).toLocaleDateString()}</span>
                                            {p.bank_reference && <div className="text-slate-500 text-[11px]">Bank Ref: {p.bank_reference}</div>}
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {p.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Product Modal */}
            {isAddProductOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <button onClick={() => setIsAddProductOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-slate-900">Add New Marketplace Product</h3>
                        <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                            <div>
                                <label className="font-semibold text-slate-600 block mb-1">Product Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                                    value={newProductName}
                                    onChange={(e) => setNewProductName(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-600 block mb-1">Category</label>
                                    <select
                                        value={newProductCategory}
                                        onChange={(e) => setNewProductCategory(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                    >
                                        <option value="1">Consumer Electronics</option>
                                        <option value="2">Smartphones & Tablets</option>
                                        <option value="3">Audio & Headphones</option>
                                        <option value="4">Fashion & Ethnic Wear</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-600 block mb-1">Brand</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sony"
                                        value={newProductBrand}
                                        onChange={(e) => setNewProductBrand(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-600 block mb-1">Price (₹ INR)</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="29990"
                                        value={newProductPrice}
                                        onChange={(e) => setNewProductPrice(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-600 block mb-1">Initial Stock Units</label>
                                    <input
                                        type="number"
                                        required
                                        value={newProductQty}
                                        onChange={(e) => setNewProductQty(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="font-semibold text-slate-600 block mb-1">Image URL</label>
                                <input
                                    type="url"
                                    value={newProductImg}
                                    onChange={(e) => setNewProductImg(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-slate-600 block mb-1">Description</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={newProductDesc}
                                    onChange={(e) => setNewProductDesc(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                    placeholder="Product description and specifications..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold transition shadow-md"
                            >
                                Submit Product for Moderation
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Restock Modal */}
            {restockVariantId && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                        <button onClick={() => setRestockVariantId(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-base font-bold text-slate-900">Restock Variant</h3>
                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="font-semibold text-slate-600 block mb-1">New Total Physical Quantity</label>
                                <input
                                    type="number"
                                    value={restockQty}
                                    onChange={(e) => setRestockQty(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                                />
                            </div>
                            <button
                                onClick={handleRestock}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-xl font-bold transition shadow-sm"
                            >
                                Update Inventory Level
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payout Modal */}
            {isPayoutOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                        <button onClick={() => setIsPayoutOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-base font-bold text-slate-900">Request Earnings Payout</h3>
                        <form onSubmit={handleRequestPayout} className="space-y-3 text-xs">
                            <div>
                                <label className="font-semibold text-slate-600 block mb-1">Amount to Transfer (₹)</label>
                                <input
                                    type="number"
                                    required
                                    min="500"
                                    max={payoutsData.available_balance}
                                    value={payoutAmount}
                                    onChange={(e) => setPayoutAmount(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                                />
                            </div>
                            {payoutMsg && <p className="text-xs font-semibold text-emerald-600">{payoutMsg}</p>}
                            <button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-bold transition shadow-sm"
                            >
                                Confirm Payout Request
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

