import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Heart, Shield, Store, UserCheck, LogOut, Search, User, Menu, X, HelpCircle } from 'lucide-react';
import { Role } from '../types';

interface NavbarProps {
    currentTab: string;
    setCurrentTab: (tab: string) => void;
    cartCount: number;
    wishlistCount: number;
    setIsCartOpen: (open: boolean) => void;
    setIsAuthOpen: (open: boolean) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
    currentTab,
    setCurrentTab,
    cartCount,
    wishlistCount,
    setIsCartOpen,
    setIsAuthOpen,
    searchQuery,
    setSearchQuery,
}) => {
    const { user, logout, quickSwitchRole } = useAuth();
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const hasRole = (role: Role) => user?.roles?.includes(role) ?? false;

    return (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 transition-all">
            {/* Top Quick Role Switcher Bar */}
            <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-medium text-slate-200">NexCart Multi-Vendor Hub (INR ₹)</span>
                    <span className="hidden sm:inline text-slate-400">|</span>
                    <span className="hidden sm:inline text-slate-400">Razorpay Verified Integration</span>
                </div>
                <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400 mr-1 hidden md:inline">Quick Role Demo:</span>
                    <button
                        onClick={() => quickSwitchRole('Super Admin')}
                        className={`px-2 py-0.5 rounded transition ${hasRole('Super Admin') ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                    >
                        Super Admin
                    </button>
                    <button
                        onClick={() => quickSwitchRole('Vendor')}
                        className={`px-2 py-0.5 rounded transition ${hasRole('Vendor') ? 'bg-amber-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                    >
                        Vendor (Apex)
                    </button>
                    <button
                        onClick={() => quickSwitchRole('Customer')}
                        className={`px-2 py-0.5 rounded transition ${hasRole('Customer') ? 'bg-emerald-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                    >
                        Customer (Rajesh)
                    </button>
                    <button
                        onClick={() => quickSwitchRole('Support Staff')}
                        className={`px-2 py-0.5 rounded transition ${hasRole('Support Staff') ? 'bg-cyan-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                    >
                        Support
                    </button>
                </div>
            </div>

            {/* Main Navigation Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 gap-4">
                    {/* Brand Logo */}
                    <div className="flex items-center cursor-pointer" onClick={() => setCurrentTab('storefront')}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 mr-3">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-xl font-extrabold tracking-tight text-slate-900">
                                Nex<span className="text-indigo-600">Cart</span>
                            </span>
                            <span className="hidden sm:block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                                Enterprise Marketplace
                            </span>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-md relative">
                        <input
                            type="text"
                            placeholder="Search flagship phones, Banarasi silk, headphones..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="hidden lg:flex items-center space-x-1">
                        <button
                            onClick={() => setCurrentTab('storefront')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentTab === 'storefront' ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            Storefront
                        </button>
                        {user && (
                            <button
                                onClick={() => setCurrentTab('orders')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentTab === 'orders' ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                My Orders
                            </button>
                        )}
                        {hasRole('Vendor') && (
                            <button
                                onClick={() => setCurrentTab('vendor')}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentTab === 'vendor' ? 'text-amber-700 bg-amber-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                <Store className="w-4 h-4 text-amber-500" />
                                <span>Vendor Portal</span>
                            </button>
                        )}
                        {hasRole('Super Admin') && (
                            <button
                                onClick={() => setCurrentTab('admin')}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentTab === 'admin' ? 'text-indigo-700 bg-indigo-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                <Shield className="w-4 h-4 text-indigo-600" />
                                <span>Admin Hub</span>
                            </button>
                        )}
                        {(hasRole('Support Staff') || hasRole('Super Admin')) && (
                            <button
                                onClick={() => setCurrentTab('support')}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentTab === 'support' ? 'text-cyan-700 bg-cyan-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                <HelpCircle className="w-4 h-4 text-cyan-600" />
                                <span>Support Desk</span>
                            </button>
                        )}
                    </nav>

                    {/* Right Action Icons & User Profile */}
                    <div className="flex items-center space-x-3">
                        {/* Wishlist Icon */}
                        <button
                            onClick={() => setCurrentTab('wishlist')}
                            className="relative p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-full transition"
                            title="Wishlist"
                        >
                            <Heart className="w-5 h-5" />
                            {wishlistCount > 0 && (
                                <span className="absolute top-0 right-0 w-4 h-4 text-[10px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center">
                                    {wishlistCount}
                                </span>
                            )}
                        </button>

                        {/* Cart Drawer Trigger */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-full shadow-sm shadow-indigo-200 transition"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            <span className="text-xs font-semibold">{cartCount}</span>
                        </button>

                        {/* User Profile / Login */}
                        {user ? (
                            <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
                                <div className="text-right hidden sm:block">
                                    <div className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</div>
                                    <div className="text-[10px] text-slate-500 capitalize">{user.roles?.join(', ')}</div>
                                </div>
                                <button
                                    onClick={logout}
                                    title="Logout"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAuthOpen(true)}
                                className="inline-flex items-center space-x-1.5 text-sm font-medium text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                            >
                                <User className="w-4 h-4" />
                                <span>Sign In</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

