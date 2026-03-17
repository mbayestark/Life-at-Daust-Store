import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, ShoppingCart, Star, Info, Shield, Truck, CheckCircle } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/format.js";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function ProductDetails() {
    const { id } = useParams();
    const { addItem, showToast } = useCart();

    const product = useQuery(api.products.getById, id ? { id } : "skip");

    const [mainImage, setMainImage] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedFrontLogos, setSelectedFrontLogos] = useState([]);
    const [selectedBackLogos, setSelectedBackLogos] = useState([]);
    const [selectedSideLogos, setSelectedSideLogos] = useState([]);
    const [selectedHoodieType, setSelectedHoodieType] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [logoPreview, setLogoPreview] = useState(null);
    const [showAddedAnimation, setShowAddedAnimation] = useState(false);

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
            setSelectedFrontLogos([]);
            setSelectedBackLogos([]);
            setSelectedSideLogos([]);
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

            <main className="max-w-7xl mx-auto px-4 py-6 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-20">
{/* Left: Image Gallery (Span 7) */}
                <div id="product-image" className="lg:col-span-5 space-y-2 sm:space-y-6">
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
                                <div className="bg-white rounded-2xl p-2 sm:p-4 shadow-2xl animate-in zoom-in-95 duration-300 max-w-[70%]">
                                    <img src={logoPreview} alt="Logo preview" className="w-full object-contain rounded-xl" />
                                    <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mt-1 sm:mt-3">Logo Preview</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 sm:gap-4 overflow-x-auto py-2 sm:py-4 scrollbar-hide px-1 sm:px-2 snap-x snap-mandatory">
                        {gallery.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setMainImage(img)}
                                className={`flex-shrink-0 w-20 h-24 sm:w-24 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all duration-300 active:scale-95 snap-center ${mainImage === img
                                    ? "border-brand-orange shadow-lg scale-105"
                                    : "border-transparent opacity-60 grayscale-[50%]"
                                    }`}
                                aria-label={`View image ${idx + 1}`}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Info & Actions (Span 5) */}
                <div className="lg:col-span-7 flex flex-col pt-0 sm:pt-4">
                    <div className="mb-3 sm:mb-10 animate-in slide-in-from-right-10 duration-700 delay-100">
                        {product.badge && (
                            <span className="inline-block px-2 py-1 sm:px-4 sm:py-1.5 rounded-full bg-orange-100 text-brand-orange text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-6 shadow-sm">
                                {product.badge}
                            </span>
                        )}
                        <h1 className="text-base sm:text-[var(--text-4xl)] font-black text-brand-navy leading-tight tracking-tighter mb-1 sm:mb-2">
                            {product.name}
                        </h1>
                        <div className="flex items-center gap-2 sm:gap-6 flex-wrap">
                            <span className="text-lg sm:text-3xl font-black text-brand-orange tracking-tight">
                                {formatPrice(product.price)}
                            </span>
                            <div className="hidden sm:block h-6 w-[1px] bg-gray-200" />
                            <div className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-yellow-50 rounded-lg">
                                <Star size={12} fill="#fbbf24" className="text-yellow-400 sm:w-4 sm:h-4" />
                                <span className="text-xs sm:text-sm font-black text-gray-800">{product.rating}</span>
                            </div>
                        </div>
                    </div>

                    {product.description && (
                        <p className="hidden sm:block text-gray-500 text-lg leading-relaxed mb-10 font-medium">
                            {product.description}
                        </p>
                    )}

                    {/* Variants Section */}
                    <div className="space-y-4 sm:space-y-10 mb-4 sm:mb-12 animate-in slide-in-from-right-10 duration-700 delay-200">
                        {/* Hoodie Type */}
                        {product.hoodieTypes && product.hoodieTypes.length > 0 && (
                            <div className="space-y-2 sm:space-y-5">
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 sm:mb-5">
                                        Hoodie Type · <span className="text-brand-navy">{selectedHoodieType || "Select"}</span>
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {product.hoodieTypes.map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setSelectedHoodieType(t)}
                                                className={`flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 border-2 active:scale-95 ${selectedHoodieType === t
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

                        {/* Front Logo Selection */}
                        {product.logos && product.logos.filter(l => !l.positions || l.positions.includes("front")).length > 0 && (
                            <div className="space-y-2 sm:space-y-5">
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 sm:mb-5">
                                        Front Logo <span className="normal-case font-medium">(choose one)</span> · <span className="text-brand-navy">{selectedFrontLogos.length > 0 ? selectedFrontLogos[0].name : "None"}</span>
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFrontLogos([])}
                                            className={`px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 border-2 active:scale-95 ${
                                                selectedFrontLogos.length === 0
                                                    ? "border-brand-navy bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
                                                    : "border-gray-100 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                                            }`}
                                        >
                                            None
                                        </button>
                                        {product.logos.filter(l => !l.positions || l.positions.includes("front")).map((logo) => {
                                            const isSelected = selectedFrontLogos.some(l => (l.id && l.id === logo.id) || l.name === logo.name);
                                            return (
                                                <button
                                                    key={logo.id || logo.name}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedFrontLogos(isSelected ? [] : [logo]);
                                                        if (!isSelected && window.innerWidth < 1024) {
                                                            document.getElementById('product-image')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }
                                                        if (!isSelected && logo.image) {
                                                            setLogoPreview(logo.image);
                                                            setTimeout(() => setLogoPreview(null), 2500);
                                                        }
                                                    }}
                                                    className={`flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 border-2 active:scale-95 ${
                                                        isSelected
                                                            ? "border-brand-navy bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
                                                            : "border-gray-100 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                                                    }`}
                                                >
                                                    {logo.image && <img src={logo.image} alt={logo.name} className="w-5 h-5 sm:w-7 sm:h-7 rounded-md object-cover" />}
                                                    {logo.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Back Logo Selection */}
                        {product.logos && product.logos.filter(l => !l.positions || l.positions.includes("back")).length > 0 && (
                            <div className="space-y-2 sm:space-y-5">
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 sm:mb-5">
                                        Back Logo · <span className="text-brand-navy">{selectedBackLogos.length > 0 ? selectedBackLogos.map(l => l.name).join(", ") : "None"}</span>
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedBackLogos([])}
                                            className={`px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 border-2 active:scale-95 ${
                                                selectedBackLogos.length === 0
                                                    ? "border-brand-navy bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
                                                    : "border-gray-100 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                                            }`}
                                        >
                                            None
                                        </button>
                                        {product.logos.filter(l => !l.positions || l.positions.includes("back")).map((logo) => {
                                            const isSelected = selectedBackLogos.some(l => (l.id && l.id === logo.id) || l.name === logo.name);
                                            return (
                                                <button
                                                    key={logo.id || logo.name}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedBackLogos(prev =>
                                                            isSelected ? prev.filter(l => !((l.id && l.id === logo.id) || l.name === logo.name)) : [...prev, logo]
                                                        );
                                                        if (!isSelected && window.innerWidth < 1024) {
                                                            document.getElementById('product-image')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }
                                                        if (!isSelected && logo.image) {
                                                            setLogoPreview(logo.image);
                                                            setTimeout(() => setLogoPreview(null), 2500);
                                                        }
                                                    }}
                                                    className={`flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 border-2 active:scale-95 ${
                                                        isSelected
                                                            ? "border-brand-navy bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
                                                            : "border-gray-100 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                                                    }`}
                                                >
                                                    {logo.image && <img src={logo.image} alt={logo.name} className="w-5 h-5 sm:w-7 sm:h-7 rounded-md object-cover" />}
                                                    {logo.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Side Logo Selection */}
                        {product.logos && product.logos.filter(l => !l.positions || l.positions.includes("side")).length > 0 && (
                            <div className="space-y-2 sm:space-y-5">
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 sm:mb-5">
                                        Side Logo · <span className="text-brand-navy">{selectedSideLogos.length > 0 ? selectedSideLogos.map(l => l.name).join(", ") : "None"}</span>
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSideLogos([])}
                                            className={`px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 border-2 active:scale-95 ${
                                                selectedSideLogos.length === 0
                                                    ? "border-brand-navy bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
                                                    : "border-gray-100 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                                            }`}
                                        >
                                            None
                                        </button>
                                        {product.logos.filter(l => !l.positions || l.positions.includes("side")).map((logo) => {
                                            const isSelected = selectedSideLogos.some(l => (l.id && l.id === logo.id) || l.name === logo.name);
                                            return (
                                                <button
                                                    key={logo.id || logo.name}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSideLogos(prev =>
                                                            isSelected ? prev.filter(l => !((l.id && l.id === logo.id) || l.name === logo.name)) : [...prev, logo]
                                                        );
                                                        if (!isSelected && window.innerWidth < 1024) {
                                                            document.getElementById('product-image')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }
                                                        if (!isSelected && logo.image) {
                                                            setLogoPreview(logo.image);
                                                            setTimeout(() => setLogoPreview(null), 2500);
                                                        }
                                                    }}
                                                    className={`flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 border-2 active:scale-95 ${
                                                        isSelected
                                                            ? "border-brand-navy bg-brand-navy text-white shadow-xl shadow-brand-navy/20"
                                                            : "border-gray-100 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                                                    }`}
                                                >
                                                    {logo.image && <img src={logo.image} alt={logo.name} className="w-5 h-5 sm:w-7 sm:h-7 rounded-md object-cover" />}
                                                    {logo.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Additional Logo Fee Notice */}
                        {(() => {
                            const freeLogos = ["DAUSTIAN+ENGINEERS"];
                            const billable = (arr) => arr.filter(l => !freeLogos.includes(l.name)).length;
                            const totalLogoCount = billable(selectedFrontLogos) + billable(selectedBackLogos) + billable(selectedSideLogos);
                            const extraLogos = Math.max(0, totalLogoCount - 2);
                            if (extraLogos === 0) return null;
                            return (
                                <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                                    <Info size={18} className="text-brand-orange flex-shrink-0" />
                                    <p className="text-sm font-bold text-brand-orange">
                                        +{formatPrice(extraLogos * 500)} logo fee ({extraLogos} extra logo{extraLogos > 1 ? "s" : ""} × {formatPrice(500)})
                                    </p>
                                </div>
                            );
                        })()}

                        {/* Colors */}
                        {product.colors && product.colors.length > 0 && (
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 sm:mb-5">
                                    Select Color · <span className="text-brand-navy">{selectedColor?.name}</span>
                                </h3>
                                <div className="flex items-center gap-5 flex-wrap">
                                    {/* Color swatches */}
                                    <div className="flex gap-3">
                                        {product.colors.map((color) => (
                                            <button
                                                key={color.name}
                                                onClick={() => {
                                                    setSelectedColor(color);
                                                    document.getElementById('product-image')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }}
                                                className={`relative w-8 h-8 rounded-full ring-2 ring-offset-2 transition-all duration-300 active:scale-95 ${selectedColor?.name === color.name
                                                    ? "ring-brand-orange"
                                                    : "ring-transparent"
                                                    }`}
                                                aria-label={`Select ${color.name} color`}
                                            >
                                                <span
                                                    className="block w-full h-full rounded-full shadow-inner border border-black/5"
                                                    style={{ backgroundColor: color.hex }}
                                                />
                                                {selectedColor?.name === color.name && (
                                                    <span className="absolute inset-0 flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* Sizes */}
                        {product.sizes && product.sizes.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-2 sm:mb-5">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Select Your Size</h3>
                                    <button className="text-[10px] text-brand-orange font-black uppercase tracking-widest hover:underline">Size Guide</button>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {product.sizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`min-w-[52px] sm:min-w-[70px] h-9 sm:h-14 rounded-xl font-black text-sm transition-all duration-300 border-2 active:scale-95 ${selectedSize === size
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
                    <div className="mt-auto pt-3 sm:pt-10 border-t border-gray-100 animate-in slide-in-from-bottom-5 duration-700 delay-300">
                        <div className="flex flex-wrap gap-4 items-center">
                            {/* Stock Status */}
                            <div className="w-full mb-1 sm:mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${product.stock === 0 ? "bg-red-500" : product.stock <= 5 ? "bg-orange-500" : "bg-green-500"}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${product.stock === 0 ? "text-red-500" : product.stock <= 5 ? "text-orange-500" : "text-green-500"}`}>
                                        {product.stock === 0 ? "Currently Out of Stock" : product.stock <= 5 ? `Low Stock: Only ${product.stock} Left` : "Available on pre-order · Ships in 10–15 days"}
                                    </span>
                                </div>
                            </div>

                            {/* Quantity Selector */}
                            <div className={`flex items-center bg-gray-50 rounded-2xl p-1 h-11 sm:h-16 w-full sm:w-auto ${product.stock === 0 ? "opacity-50 pointer-events-none" : ""}`}>
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="w-10 sm:w-12 h-full rounded-xl hover:bg-white hover:shadow-sm active:scale-95 active:bg-brand-navy active:text-white text-xl font-bold transition-all"
                                    disabled={product.stock === 0 || quantity <= 1}
                                    aria-label="Decrease quantity"
                                >
                                    −
                                </button>
                                <span className="w-16 sm:w-14 text-center font-black text-brand-navy text-base sm:text-base">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(q => {
                                        const maxQty = product.stock > 0 ? product.stock : 99;
                                        return Math.min(maxQty, q + 1);
                                    })}
                                    className="w-10 sm:w-12 h-full rounded-xl hover:bg-white hover:shadow-sm active:scale-95 active:bg-brand-navy active:text-white text-xl font-bold transition-all"
                                    disabled={product.stock === 0 || (product.stock > 0 && quantity >= product.stock)}
                                    aria-label="Increase quantity"
                                >
                                    +
                                </button>
                            </div>

                            {/* Add to Cart Button */}
                            <Button
                                variant={product.stock === 0 ? "secondary" : "primary"}
                                size="lg"
                                uppercase={false}
                                className={`flex-1 h-11 sm:h-16 rounded-2xl gap-2 sm:gap-4 shadow-xl shadow-brand-navy/10 group normal-case min-w-0 transition-all active:scale-[0.98] ${product.stock === 0 ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5 hover:shadow-brand-orange/20"}`}
                                disabled={product.stock === 0}
                                onClick={() => {
                                    if (product.stock === 0) return;

                                    // Validate required selections
                                    if (product.hoodieTypes?.length > 0 && !selectedHoodieType) {
                                        alert('Please select a hoodie type');
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
                                    // Logo selection is optional - removed strict validation

                                    addItem({
                                        ...product,
                                        image: mainImage || product.image,
                                        selectedHoodieType,
                                        selectedColor: selectedColor?.name,
                                        selectedSize: selectedSize,
                                        selectedFrontLogo: selectedFrontLogos.length > 0 ? selectedFrontLogos.map(l => l.name).join(", ") : null,
                                        selectedBackLogo: selectedBackLogos.length > 0 ? selectedBackLogos.map(l => l.name).join(", ") : null,
                                        selectedSideLogo: selectedSideLogos.length > 0 ? selectedSideLogos.map(l => l.name).join(", ") : null,
                                    }, quantity);
                                    showToast(`${quantity}x ${product.name} added to bag!`);
                                }}
                            >
                                {product.stock === 0 ? (
                                    <span className="text-sm sm:text-base font-bold">Sold Out</span>
                                ) : (
                                    <>
                                        <ShoppingCart size={20} className="sm:w-[22px] sm:h-[22px] group-hover:rotate-12 transition-transform" />
                                        <span className="text-sm sm:text-base font-bold">Add to Shopping Bag</span>
                                    </>
                                )}
                            </Button>

                            {/* Added to bag toast */}
                            {showAddedAnimation && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl animate-in fade-in zoom-in-95 duration-300 w-full sm:w-auto">
                                    <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                                    <span className="text-sm font-black text-green-700">Added to bag!</span>
                                </div>
                            )}

                        </div>

                    </div>
                </div>
            </main>

            {/* Trust Badges */}
            <div className="max-w-7xl mx-auto px-4 pb-8 sm:pb-16">
                <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                            <Truck size={20} className="text-brand-orange" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-900 leading-none">Fast Delivery</p>
                            <p className="text-[10px] text-gray-500 mt-1">{product.shippingTimeline || "10-15 days campus ship"}</p>
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
    );
}
