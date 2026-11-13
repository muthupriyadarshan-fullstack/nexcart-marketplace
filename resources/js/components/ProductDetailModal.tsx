import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Product, ProductVariant } from '../types';
import { X, Star, ShoppingBag, ShieldCheck, Truck, RefreshCw, Store, Check, AlertCircle } from 'lucide-react';

interface ProductDetailModalProps {
    slug: string | null;
    onClose: () => void;
    onAddToCart: (variantId: number, qty: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ slug, onClose, onAddToCart }) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!slug) return;
        setIsLoading(true);
        apiClient.get(`/products/${slug}`)
            .then((res) => {
                const p = res.data.data;
                setProduct(p);
                if (p.images && p.images.length > 0) {
                    setSelectedImage(p.images[0].url);
                }
                if (p.variants && p.variants.length > 0) {
                    setSelectedVariant(p.variants[0]);
                }
            })
            .catch((err) => console.error(err))
            .finally(() => setIsLoading(false));
    }, [slug]);

    if (!slug) return null;

    const formatINR = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition"
                >
                    <X className="w-5 h-5" />
                </button>

                {isLoading || !product ? (
                    <div className="p-12 text-center text-slate-400 animate-pulse">
                        Loading product details...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
                        {/* Left: Images */}
                        <div className="space-y-4">
                            <div className="aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                                <img
                                    src={selectedImage || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800'}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {product.images && product.images.length > 1 && (
                                <div className="flex space-x-2 overflow-x-auto pb-2">
                                    {product.images.map((img) => (
                                        <button
                                            key={img.id}
                                            onClick={() => setSelectedImage(img.url)}
                                            className={`w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition ${selectedImage === img.url ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Trust badges */}
                            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] text-slate-600">
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                                    <span className="font-semibold block">100% Genuine</span>
                                    <span>Verified Seller</span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <Truck className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                                    <span className="font-semibold block">Fast Express</span>
                                    <span>Blue Dart / Delhivery</span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <RefreshCw className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                                    <span className="font-semibold block">Easy Returns</span>
                                    <span>7 Days Window</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Product Info & Actions */}
                        <div className="space-y-6 flex flex-col justify-between">
                            <div className="space-y-4">
                                {/* Vendor tag */}
                                <div className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold">
                                    <Store className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Fulfilled by {product.store.name}</span>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
                                        {product.brand || product.category.name}
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                                        {product.name}
                                    </h2>
                                </div>

                                {/* Rating */}
                                <div className="flex items-center space-x-2 text-xs">
                                    <div className="flex items-center text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                                        <span>{product.rating_avg}</span>
                                    </div>
                                    <span className="text-slate-500">({product.rating_count} verified reviews)</span>
                                </div>

                                {/* Price */}
                                <div className="flex items-baseline space-x-3 pt-2">
                                    <span className="text-3xl font-extrabold text-slate-900">
                                        {formatINR(selectedVariant?.price ?? product.sale_price ?? product.base_price)}
                                    </span>
                                    {selectedVariant?.compare_at_price && (
                                        <span className="text-sm text-slate-400 line-through">
                                            {formatINR(selectedVariant.compare_at_price)}
                                        </span>
                                    )}
                                </div>

                                {/* Variants Selector */}
                                {product.variants && product.variants.length > 0 && (
                                    <div className="space-y-2 pt-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                            Select Variant / Configuration:
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {product.variants.map((v) => {
                                                const isSelected = selectedVariant?.id === v.id;
                                                return (
                                                    <button
                                                        key={v.id}
                                                        onClick={() => setSelectedVariant(v)}
                                                        className={`p-3 rounded-xl border text-left transition ${isSelected ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'}`}
                                                    >
                                                        <div className="text-xs font-bold text-slate-900">{v.title}</div>
                                                        <div className="text-xs text-slate-500">{formatINR(v.price)}</div>
                                                        <div className="text-[10px] mt-1">
                                                            {v.available_quantity > 0 ? (
                                                                <span className="text-emerald-600 font-semibold flex items-center">
                                                                    <Check className="w-3 h-3 mr-0.5" /> In Stock ({v.available_quantity})
                                                                </span>
                                                            ) : (
                                                                <span className="text-rose-600 font-semibold">Out of Stock</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Short Description */}
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
                                    {product.short_description || product.description}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 border-t border-slate-200 space-y-3">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="px-3 py-2 text-slate-600 hover:text-slate-900 font-bold"
                                        >
                                            -
                                        </button>
                                        <span className="px-3 py-2 text-sm font-bold text-slate-900">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="px-3 py-2 text-slate-600 hover:text-slate-900 font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        disabled={!selectedVariant || selectedVariant.available_quantity <= 0}
                                        onClick={() => {
                                            if (selectedVariant) {
                                                onAddToCart(selectedVariant.id, quantity);
                                                onClose();
                                            }
                                        }}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-3 px-6 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2 transition"
                                    >
                                        <ShoppingBag className="w-4 h-4" />
                                        <span>
                                            {selectedVariant && selectedVariant.available_quantity > 0
                                                ? `Add to Cart • ${formatINR((selectedVariant.price || product.base_price) * quantity)}`
                                                : 'Out of Stock'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

