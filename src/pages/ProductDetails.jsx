import React, { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, ShoppingCart, Star, Info, Shield, Truck } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/format.js";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function ProductDetails() {
    const { id } = useParams();
    const { addItem } = useCart();

    const product = useQuery(api.products.getById, id ? { id } : "skip");

    const [mainImage, setMainImage] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedLogo, setSelectedLogo] = useState(null);
    const [selectedLogoPosition, setSelectedLogoPosition] = useState(null);
    const [selectedHoodieType, setSelectedHoodieType] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [logoPreview, setLogoPreview] = useState(null);

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
            const firstLogo = product.logos?.[0] || null;
            setSelectedLogo(firstLogo);
            setSelectedLogoPosition(firstLogo?.positions?.[0] || null);
            setSelectedHoodieType(null);
        }
    }, [product]);

    // Update main image when color selection changes (color-only variant images)
    useEffect(() => {
        if (product?.logoImages && selectedColor?.name) {
            // Look under _default key first, then fall back to any key that has this color
            const colorImages = product.logoImages["_default"]?.[selectedColor.name]
                || Object.values(product.logoImages).find(
                    colorMap => colorMap?.[selectedColor.name]?.length > 0
                )?.[selectedColor.name];
            if (colorImages && colorImages.length > 0) {
                setMainImage(colorImages[0]);
                return;
            }
        }
        if (product) {
            setMainImage(product.image);
        }
    }, [selectedColor, product]);

    // Get variant-specific images based on selected color only
    const getVariantImages = () => {
        if (product?.logoImages && selectedColor?.name) {
            const colorImages = product.logoImages["_default"]?.[selectedColor.name]
                || Object.values(product.logoImages).find(
                    colorMap => colorMap?.[selectedColor.name]?.length > 0
                )?.[selectedColor.name];
            if (colorImages && colorImages.length > 0) {
                return colorImages;
            }
        }
        return product.images || [product.image];
    };

    // Show loading spinner while Convex query is loading
    if (product === undefined) {
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

    // Better gallery handling - now includes logo variant images
    const gallery = getVariantImages();

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
                <div id="product-image" className="lg:col-span-5 space-y-4 sm:space-y-6">
                    <div className="relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl sm:rounded-[2rem] overflow-hidden bg-gray-50/50 premium-shadow border border-gray-100 animate-in fade-in zoom-in-95 duration-700">
                        <img
                            src={mainImage || product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-all duration-700 ease-in-out hover:scale-110"
                        />
                        {/* Temporary logo preview overlay */}
                        {logoPreview && (
                            <div
                                className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 animate-in fade-in duration-300 cursor-pointer"
                                onClick={() => setLogoPreview(null)}
                            >
                                <div className="bg-white rounded-2xl p-4 shadow-2xl animate-in zoom-in-95 duration-300 max-w-[70%]">
                                    <img src={logoPreview} alt="Logo preview" className="w-full object-contain rounded-xl" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mt-3">Logo Preview</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 sm:gap-4 overflow-x-auto py-2 sm:py-4 scrollbar-hide px-1 sm:px-2">
                        {gallery.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setMainImage(img)}
                                className={`flex-shrink-0 w-16 h-20 sm:w-24 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all duration-300 interactive-scale ${mainImage === img
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
                        <h1 className="text-[var(--text-4xl)] font-black text-brand-navy leading-tight tracking-tighter mb-2">
                            {product.name}
                        </h1>
                        {product.type && (
                            <p className="text-sm font-bold text-brand-orange uppercase tracking-widest mb-6">
                                {product.type} Edition
                            </p>
                        )}
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
                        {/* Hoodie Type */}
                        {product.category === "Hoodies" && (
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-5">
                                        Hoodie Type · <span className="text-brand-navy">{selectedHoodieType || "Select"}</span>
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {["Zipped", "No zip"].map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setSelectedHoodieType(t)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm transition-all duration-300 border-2 interactive-scale ${selectedHoodieType === t
                                                    ? "border-brand-navy bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
                                                    : "border-gray-100 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Logo Variants - click to preview */}
                        {product.logos && product.logos.length > 0 && (
                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-5">
                                        Logo Style · <span className="text-brand-navy">{selectedLogo?.name || "Select"}</span>
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {product.logos.map((logo) => (
                                            <button
                                                key={logo.id || logo.name}
onClick={() => {
                                                    setSelectedLogo(logo);
                                                    setSelectedLogoPosition(logo.positions?.[0] || null);
                                                    // Scroll to product image on mobile when selecting a logo
                                                    if (window.innerWidth < 1024) {
                                                        const imageSection = document.getElementById('product-image');
                                                        if (imageSection) {
                                                            imageSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }
                                                    }
                                                    if (logo.image) {
                                                        setLogoPreview(logo.image);
                                                        setTimeout(() => setLogoPreview(null), 2500);
                                                    }
                                                }}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm transition-all duration-300 border-2 interactive-scale ${selectedLogo?.id === logo.id || selectedLogo?.name === logo.name
                                                        ? "border-brand-navy bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
                                                        : "border-gray-100 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                                                    }`}
                                            >
                                                {logo.image && (
                                                    <img src={logo.image} alt={logo.name} className="w-7 h-7 rounded-lg object-cover" />
                                                )}
                                                {logo.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Logo Position selector - only when a logo with positions is selected */}
                                {selectedLogo?.positions && selectedLogo.positions.length > 1 && (
                                    <div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                                            Logo Position · <span className="text-brand-navy capitalize">{selectedLogoPosition || "Select"}</span>
                                        </h3>
                                        <div className="flex gap-3">
                                            {selectedLogo.positions.map((pos) => (
                                                <button
                                                    key={pos}
                                                    onClick={() => setSelectedLogoPosition(pos)}
                                                    className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-300 border-2 interactive-scale capitalize ${selectedLogoPosition === pos
                                                        ? "border-brand-navy bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
                                                        : "border-gray-100 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                                                    }`}
                                                >
                                                    {pos}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

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
                            {/* Stock Status */}
                            <div className="w-full mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${product.stock === 0 ? "bg-red-500" : product.stock <= 5 ? "bg-orange-500" : "bg-green-500"}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${product.stock === 0 ? "text-red-500" : product.stock <= 5 ? "text-orange-500" : "text-green-500"}`}>
                                        {product.stock === 0 ? "Currently Out of Stock" : product.stock <= 5 ? `Low Stock: Only ${product.stock} Left` : "In Stock & Ready to Ship"}
                                    </span>
                                </div>
                            </div>

                            {/* Quantity Selector */}
                            <div className={`flex items-center bg-gray-50 rounded-2xl p-1 h-16 w-full sm:w-auto ${product.stock === 0 ? "opacity-50 pointer-events-none" : ""}`}>
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="w-12 h-full rounded-xl hover:bg-white hover:shadow-sm text-xl font-bold transition-all"
                                    disabled={product.stock === 0}
                                >
                                    −
                                </button>
                                <span className="w-14 text-center font-black text-brand-navy">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))}
                                    className="w-12 h-full rounded-xl hover:bg-white hover:shadow-sm text-xl font-bold transition-all"
                                    disabled={product.stock === 0}
                                >
                                    +
                                </button>
                            </div>

                            {/* Add to Cart Button */}
                            <Button
                                variant={product.stock === 0 ? "secondary" : "primary"}
                                size="lg"
                                uppercase={false}
                                className={`flex-1 h-16 rounded-2xl gap-4 shadow-xl shadow-brand-navy/10 group normal-case min-w-[200px] transition-all ${product.stock === 0 ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5 hover:shadow-brand-orange/20"}`}
                                disabled={product.stock === 0}
                                onClick={() => {
                                    if (product.stock === 0) return;

                                    // Validate selections
                                    if (product.category === "Hoodies" && !selectedHoodieType) {
                                        alert('Please select a hoodie type (Zipped or No zip)');
                                        return;
                                    }
                                    if (product.colors?.length > 0 && !selectedColor) {
                                        alert('Please select a color');
                                        return;
                                    }
                                    if (product.sizes?.length > 0 && !selectedSize) {
                                        alert('Please select a size');
                                        return;
                                    }
                                    if (product.logos?.length > 0 && !selectedLogo) {
                                        alert('Please select a logo style');
                                        return;
                                    }
                                    if (selectedLogo?.positions?.length > 1 && !selectedLogoPosition) {
                                        alert('Please select a logo position (Front or Back)');
                                        return;
                                    }

                                    addItem({
                                        ...product,
                                        image: mainImage || product.image,
                                        selectedHoodieType,
                                        selectedColor: selectedColor?.name,
                                        selectedSize: selectedSize,
                                        selectedLogo: selectedLogo?.name,
                                        selectedLogoPosition: selectedLogoPosition,
                                    }, quantity);
                                }}
                            >
                                {product.stock === 0 ? (
                                    <span className="text-base">Sold Out</span>
                                ) : (
                                    <>
                                        <ShoppingCart size={22} className="group-hover:rotate-12 transition-transform" />
                                        <span className="text-base">Add to Shopping Bag</span>
                                    </>
                                )}
                            </Button>

                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 sm:mt-12 bg-gray-50/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                    <Truck size={20} className="text-brand-orange" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-900 leading-none">Fast Delivery</p>
                                    <p className="text-[10px] text-gray-500 mt-1">{product.shippingTimeline || "2-4 days campus ship"}</p>
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
