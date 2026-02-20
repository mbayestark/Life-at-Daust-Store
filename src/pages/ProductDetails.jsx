import React, { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, ShoppingCart, Star, Info, Shield, Truck } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PRODUCTS } from "../data/products";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/format.js";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function ProductDetails() {
    const { id } = useParams();
    const { addItem } = useCart();

    // Determine if this looks like a Convex ID (longer strings or specific format)
    const isConvexId = typeof id === "string" && (id.length > 20 || id.includes(":"));

    // Only query Convex if ID looks like a Convex ID
    const convexProduct = useQuery(
        api.products.getById,
        isConvexId ? { id: id } : "skip"
    );

    // Try to find the product in either Convex or Static DATA
    const product = useMemo(() => {
        if (convexProduct) return convexProduct;

        // Don't fall back to static data if we are still waiting for a valid Convex query
        if (isConvexId && convexProduct === undefined) return null;

        // Handle numeric IDs for static products
        const numericId = parseInt(id);
        if (!isNaN(numericId)) {
            return PRODUCTS.find(p => p.id === numericId);
        }

        // Also check if id is a string matching static product (if any)
        return PRODUCTS.find(p => p.id === id) || null;
    }, [id, convexProduct, isConvexId]);

    const [mainImage, setMainImage] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);

    // Scroll to top when navigating to product details
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    // Initialize state when product is loaded
    useEffect(() => {
        if (product) {
            setMainImage(product.image);
            setSelectedColor(product.colors?.[0] || null);
            setSelectedSize(product.sizes?.[0] || null);
        }
    }, [product]);

    // Show loading spinner while Convex query is loading
    if (isConvexId && convexProduct === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-32 text-center animate-in fade-in duration-700">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 mb-8">
                    <Info size={40} className="text-gray-300" />
                </div>
                <h2 className="text-[var(--text-3xl)] font-black text-brand-navy tracking-tight mb-4">Product not found</h2>
                <p className="text-gray-500 mb-10 max-w-md mx-auto">This item may have been moved or is currently unavailable in your region.</p>
                <Link to="/shop">
                    <Button variant="secondary" size="md">Return to Shop</Button>
                </Link>
            </div>
        );
    }

    // Better gallery handling
    const gallery = (product.images && product.images.length > 0)
        ? product.images
        : [product.image];

    return (
        <div className="bg-white min-h-screen overflow-x-hidden">
            {/* Breadcrumbs */}
            <div className="bg-gray-50/50 border-b border-gray-100">
                <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <Link to="/" className="hover:text-brand-orange transition-colors">Home</Link>
                    <ChevronRight size={10} className="mx-3 text-gray-300" />
                    <Link to="/shop" className="hover:text-brand-orange transition-colors">Shop</Link>
                    <ChevronRight size={10} className="mx-3 text-gray-300" />
                    <span className="text-gray-900 truncate">{product.name}</span>
                </nav>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-12 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                {/* Left: Image Gallery (Span 7) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-gray-50/50 premium-shadow border border-gray-100 animate-in fade-in zoom-in-95 duration-700">
                        <img
                            src={mainImage || product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-all duration-700 ease-in-out hover:scale-110"
                        />
                    </div>
                    <div className="flex gap-4 overflow-x-auto py-4 scrollbar-hide px-2">
                        {gallery.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setMainImage(img)}
                                className={`flex-shrink-0 w-24 h-28 rounded-2xl overflow-hidden border-2 transition-all duration-300 interactive-scale ${mainImage === img
                                    ? "border-brand-orange shadow-lg scale-105"
                                    : "border-transparent opacity-60 grayscale-[50%]"
                                    }`}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Info & Actions (Span 5) */}
                <div className="lg:col-span-7 flex flex-col pt-4">
                    <div className="mb-10 animate-in slide-in-from-right-10 duration-700 delay-100">
                        {product.badge && (
                            <span className="inline-block px-4 py-1.5 rounded-full bg-orange-100 text-brand-orange text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm">
                                {product.badge}
                            </span>
                        )}
                        <h1 className="text-[var(--text-4xl)] font-black text-brand-navy leading-tight tracking-tighter mb-6">
                            {product.name}
                        </h1>
                        <div className="flex items-center gap-6">
                            <span className="text-3xl font-black text-brand-orange tracking-tight">
                                {formatPrice(product.price)}
                            </span>
                            <div className="h-6 w-[1px] bg-gray-200" />
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg">
                                <Star size={16} fill="#fbbf24" className="text-yellow-400" />
                                <span className="text-sm font-black text-gray-800">{product.rating}</span>
                                <span className="text-gray-400 text-xs font-bold pl-1 border-l border-yellow-200 ml-1">124 Reviews</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-500 text-lg leading-relaxed mb-10 font-medium">
                        {product.description || "Inspired by campus life, this DAUST essential combines comfort with university spirit. Perfect for everyday wear or as a special gift."}
                    </p>

                    {/* Variants Section */}
                    <div className="space-y-10 mb-12 animate-in slide-in-from-right-10 duration-700 delay-200">
                        {/* Colors */}
                        {product.colors && product.colors.length > 0 && (
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-5">
                                    Select Color · <span className="text-brand-navy">{selectedColor?.name}</span>
                                </h3>
                                <div className="flex gap-4">
                                    {product.colors.map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() => setSelectedColor(color)}
                                            className={`relative w-12 h-12 rounded-full ring-2 ring-offset-4 transition-all duration-300 interactive-scale ${selectedColor?.name === color.name
                                                ? "ring-brand-orange"
                                                : "ring-transparent"
                                                }`}
                                        >
                                            <span
                                                className="block w-full h-full rounded-full shadow-inner border border-black/5"
                                                style={{ backgroundColor: color.hex }}
                                            />
                                            {selectedColor?.name === color.name && (
                                                <span className="absolute inset-0 flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sizes */}
                        {product.sizes && product.sizes.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Select Your Size</h3>
                                    <button className="text-[10px] text-brand-orange font-black uppercase tracking-widest hover:underline">Size Guide</button>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {product.sizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`min-w-[70px] h-14 rounded-xl font-black text-sm transition-all duration-300 border-2 interactive-scale ${selectedSize === size
                                                ? "border-brand-navy bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
                                                : "border-gray-100 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Add to Cart Actions */}
                    <div className="mt-auto pt-10 border-t border-gray-100 animate-in slide-in-from-bottom-5 duration-700 delay-300">
                        <div className="flex flex-wrap gap-4 items-center">
                            {/* Quantity Selector */}
                            <div className="flex items-center bg-gray-50 rounded-2xl p-1 h-16 w-full sm:w-auto">
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="w-12 h-full rounded-xl hover:bg-white hover:shadow-sm text-xl font-bold transition-all"
                                >
                                    −
                                </button>
                                <span className="w-14 text-center font-black text-brand-navy">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(q => Math.min(99, q + 1))}
                                    className="w-12 h-full rounded-xl hover:bg-white hover:shadow-sm text-xl font-bold transition-all"
                                >
                                    +
                                </button>
                            </div>

                            {/* Add to Cart Button - Now using Tailwind classes */}
                            <Button
                                variant="primary"
                                size="lg"
                                uppercase={false}
                                className="flex-1 h-16 rounded-2xl gap-4 shadow-xl shadow-brand-navy/10 group normal-case min-w-[200px] hover:-translate-y-0.5 hover:shadow-brand-orange/20"
                                onClick={() => {
                                    // Validate selections
                                    if (product.colors?.length > 0 && !selectedColor) {
                                        alert('Please select a color');
                                        return;
                                    }
                                    if (product.sizes?.length > 0 && !selectedSize) {
                                        alert('Please select a size');
                                        return;
                                    }

                                    addItem({
                                        ...product,
                                        selectedColor: selectedColor?.name,
                                        selectedSize: selectedSize
                                    }, quantity);
                                }}
                            >
                                <ShoppingCart size={22} className="group-hover:rotate-12 transition-transform" />
                                <span className="text-base">Add to Shopping Bag</span>
                            </Button>

                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 mt-12 bg-gray-50/50 p-6 rounded-3xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                    <Truck size={20} className="text-brand-orange" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-900 leading-none">Fast Delivery</p>
                                    <p className="text-[10px] text-gray-500 mt-1">2-4 days campus ship</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                    <Shield size={20} className="text-green-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-900 leading-none">Secure Payment</p>
                                    <p className="text-[10px] text-gray-500 mt-1">100% encrypted</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Product Details Tabs */}
            <section className="max-w-7xl mx-auto px-4 py-24 sm:py-32 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                    <div>
                        <h4 className="font-black text-brand-navy mb-5 uppercase tracking-[0.2em] text-[10px]">Premium Materials</h4>
                        <p className="text-gray-500 text-sm italic leading-relaxed">"Every fiber is selected to endure the rigorous yet rewarding lifestyle of the DAUST student. We prioritize organic cotton and high-density blends for maximum longevity."</p>
                    </div>
                    <div>
                        <h4 className="font-black text-brand-navy mb-5 uppercase tracking-[0.2em] text-[10px]">Our Promise</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">Part of our "Excellence in Gear" initiative—responsibly manufactured to ensure that your university pride never comes at a cost to the community or planet.</p>
                    </div>
                    <div>
                        <h4 className="font-black text-brand-navy mb-5 uppercase tracking-[0.2em] text-[10px]">Exchanges</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">Not the perfect fit? Campus exchanges are always free. External returns accepted within 14 days of receipt in original condition.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}