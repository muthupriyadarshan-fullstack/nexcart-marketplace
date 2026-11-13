import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Product, Category } from '../types';
import { Star, ShoppingBag, Eye, Heart, Store, Filter, CheckCircle, Sparkles, ShieldCheck } from 'lucide-react';

interface CustomerStorefrontProps {
    onSelectProduct: (productSlug: string) => void;
    onAddToCart: (variantId: number, qty: number) => void;
    onToggleWishlist: (productId: number) => void;
    wishlistIds: number[];
    searchQuery: string;
}

export const CustomerStorefront: React.FC<CustomerStorefrontProps> = ({
    onSelectProduct,
    onAddToCart,
    onToggleWishlist,
    wishlistIds,
    searchQuery,
}) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<string>('latest');
    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        apiClient.get('/categories')
            .then((res) => setCategories(res.data.data))
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        setIsLoading(true);
        const params: Record<string, any> = { sort_by: sortBy };
        if (selectedCategory) params.category_id = selectedCategory;
        if (searchQuery) params.q = searchQuery;
        if (minPrice) params.min_price = minPrice;
        if (maxPrice) params.max_price = maxPrice;

        apiClient.get('/products', { params })
            .then((res) => setProducts(res.data.data.items))
            .catch((err) => console.error(err))
            .finally(() => setIsLoading(false));
    }, [selectedCategory, sortBy, searchQuery, minPrice, maxPrice]);

    const formatINR = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-8 pb-16">
            {/* Hero Marketplace Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="relative max-w-5xl mx-auto px-6 py-12 sm:py-16 text-center space-y-4">
                    <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>India's Premier Multi-Vendor Marketplace</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-2xl mx-auto leading-tight">
                        Curated Tech, Heritage Textiles & Artisanal Crafts
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
                        One consolidated order across verified regional vendors. Direct dispatch with Blue Dart Express and 100% buyer protection.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-xs text-slate-300">
                        <div className="flex items-center space-x-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Safe Stock Reservation</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <CheckCircle className="w-4 h-4 text-indigo-400" />
                            <span>Multi-Vendor Segregated Fulfillment</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <Store className="w-4 h-4 text-amber-400" />
                            <span>Verified Indian Sellers</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Filter Pills & Sort Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-slate-200">
                {/* Category Pills */}
                <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition whitespace-nowrap ${selectedCategory === null ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    >
                        All Categories
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition whitespace-nowrap ${selectedCategory === cat.id ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                    <span className="text-xs text-slate-500 font-medium hidden sm:inline">Sort by:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg text-xs font-medium px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    >
                        <option value="latest">Latest Arrivals</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="name_asc">Name: A to Z</option>
                    </select>
                </div>
            </div>

            {/* Product Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
                            <div className="w-full h-48 bg-slate-200 rounded-xl"></div>
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                    <Store className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-900">No products found</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        Try clearing your search query or selecting another category.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => {
                        const isWishlisted = wishlistIds.includes(product.id);
                        return (
                            <div
                                key={product.id}
                                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between"
                            >
                                {/* Image Box */}
                                <div className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onSelectProduct(product.slug)}>
                                    <img
                                        src={product.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500'}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                    />
                                    {/* Store Tag */}
                                    <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-800 shadow-sm flex items-center space-x-1">
                                        <Store className="w-3 h-3 text-indigo-600" />
                                        <span>{product.store.name}</span>
                                    </div>
                                    {/* Wishlist Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleWishlist(product.id);
                                        }}
                                        className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition shadow-sm ${isWishlisted ? 'bg-rose-50 text-rose-600' : 'bg-white/80 backdrop-blur text-slate-600 hover:text-rose-600'}`}
                                    >
                                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>{product.category.name}</span>
                                            <div className="flex items-center space-x-1 text-amber-500 font-semibold">
                                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                <span>{product.rating_avg}</span>
                                                <span className="text-slate-400">({product.rating_count})</span>
                                            </div>
                                        </div>
                                        <h3
                                            onClick={() => onSelectProduct(product.slug)}
                                            className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2 cursor-pointer leading-snug"
                                        >
                                            {product.name}
                                        </h3>
                                    </div>

                                    {/* Price and Cart Action */}
                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                        <div>
                                            <div className="text-base font-extrabold text-slate-900">
                                                {formatINR(product.sale_price || product.base_price)}
                                            </div>
                                            {product.sale_price && (
                                                <div className="text-[11px] text-slate-400 line-through">
                                                    {formatINR(product.base_price)}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => onSelectProduct(product.slug)}
                                            className="inline-flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>View</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

