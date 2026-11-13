import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { CustomerStorefront } from './components/CustomerStorefront';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { CustomerOrdersView } from './components/CustomerOrdersView';
import { VendorDashboardView } from './components/VendorDashboardView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { SupportDashboardView } from './components/SupportDashboardView';
import { AuthModal } from './components/AuthModal';
import { apiClient } from './api/client';
import { Cart, Order } from './types';
import { Heart, ShieldCheck, ShoppingBag } from 'lucide-react';

const AppContent: React.FC = () => {
    const { user } = useAuth();
    const [currentTab, setCurrentTab] = useState<string>('storefront');
    const [cart, setCart] = useState<Cart | null>(null);
    const [wishlistIds, setWishlistIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Modals
    const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
    const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
    const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

    const fetchCart = () => {
        if (!user) {
            setCart(null);
            return;
        }
        apiClient.get('/cart')
            .then((res) => setCart(res.data.data))
            .catch(() => setCart(null));
    };

    const fetchWishlist = () => {
        if (!user) {
            setWishlistIds([]);
            return;
        }
        apiClient.get('/wishlist')
            .then((res) => {
                const items = res.data.data || [];
                setWishlistIds(items.map((i: any) => i.id));
            })
            .catch(() => setWishlistIds([]));
    };

    useEffect(() => {
        fetchCart();
        fetchWishlist();
    }, [user]);

    const handleAddToCart = async (variantId: number, qty: number) => {
        if (!user) {
            setIsAuthOpen(true);
            return;
        }
        try {
            await apiClient.post('/cart/items', { product_variant_id: variantId, quantity: qty });
            fetchCart();
            setIsCartOpen(true);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error adding to cart');
        }
    };

    const handleUpdateQuantity = async (itemId: number, qty: number) => {
        try {
            await apiClient.put(`/cart/items/${itemId}`, { quantity: qty });
            fetchCart();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error updating cart');
        }
    };

    const handleRemoveCartItem = async (itemId: number) => {
        try {
            await apiClient.delete(`/cart/items/${itemId}`);
            fetchCart();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error removing item');
        }
    };

    const handleApplyCoupon = async (code: string) => {
        const res = await apiClient.post('/cart/apply-coupon', { code });
        setCart(res.data.data);
    };

    const handleRemoveCoupon = async () => {
        const res = await apiClient.delete('/cart/remove-coupon');
        setCart(res.data.data);
    };

    const handleToggleWishlist = async (productId: number) => {
        if (!user) {
            setIsAuthOpen(true);
            return;
        }
        try {
            const res = await apiClient.post(`/wishlist/${productId}`);
            if (res.data.data.in_wishlist) {
                setWishlistIds([...wishlistIds, productId]);
            } else {
                setWishlistIds(wishlistIds.filter((id) => id !== productId));
            }
        } catch (err: any) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-between bg-slate-50">
            <div>
                {/* Navbar */}
                <Navbar
                    currentTab={currentTab}
                    setCurrentTab={setCurrentTab}
                    cartCount={cart?.items_count || 0}
                    wishlistCount={wishlistIds.length}
                    setIsCartOpen={setIsCartOpen}
                    setIsAuthOpen={setIsAuthOpen}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

                {/* Main View Area */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                    {currentTab === 'storefront' && (
                        <CustomerStorefront
                            onSelectProduct={(slug) => setSelectedProductSlug(slug)}
                            onAddToCart={handleAddToCart}
                            onToggleWishlist={handleToggleWishlist}
                            wishlistIds={wishlistIds}
                            searchQuery={searchQuery}
                        />
                    )}

                    {currentTab === 'orders' && <CustomerOrdersView />}

                    {currentTab === 'vendor' && <VendorDashboardView />}

                    {currentTab === 'admin' && <AdminDashboardView />}

                    {currentTab === 'support' && <SupportDashboardView />}

                    {currentTab === 'wishlist' && (
                        <div className="space-y-6 max-w-5xl mx-auto pb-16">
                            <div className="flex items-center space-x-2">
                                <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                                <h2 className="text-2xl font-extrabold text-slate-900">Your Saved Wishlist</h2>
                            </div>
                            {wishlistIds.length === 0 ? (
                                <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
                                    <Heart className="w-10 h-10 text-slate-300 mx-auto" />
                                    <div className="text-sm font-bold text-slate-700">Your wishlist is empty</div>
                                    <p className="text-xs text-slate-400">Save items by clicking the heart icon on any product.</p>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500">You have {wishlistIds.length} saved product(s).</p>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Modals & Drawers */}
            <ProductDetailModal
                slug={selectedProductSlug}
                onClose={() => setSelectedProductSlug(null)}
                onAddToCart={handleAddToCart}
            />

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveCartItem}
                onApplyCoupon={handleApplyCoupon}
                onRemoveCoupon={handleRemoveCoupon}
                onProceedCheckout={() => setIsCheckoutOpen(true)}
            />

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                cart={cart}
                onOrderSuccess={(order) => {
                    fetchCart();
                    setConfirmedOrder(order);
                }}
            />

            <OrderConfirmationModal
                order={confirmedOrder}
                onClose={() => setConfirmedOrder(null)}
                onViewOrders={() => {
                    setConfirmedOrder(null);
                    setCurrentTab('orders');
                }}
            />

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
            />

            {/* Footer */}
            <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 py-10 mt-16 text-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                            N
                        </div>
                        <span className="font-extrabold text-white text-sm">NexCart Marketplace</span>
                        <span>•</span>
                        <span>Enterprise Multi-Vendor Platform (Laravel 13 + React + TypeScript + Razorpay)</span>
                    </div>
                    <div className="flex space-x-4">
                        <span className="hover:text-white transition">PSR-12</span>
                        <span>•</span>
                        <span className="hover:text-white transition">Atomic Stock Reservation</span>
                        <span>•</span>
                        <span className="hover:text-white transition">Idempotent Webhooks</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export const App = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

