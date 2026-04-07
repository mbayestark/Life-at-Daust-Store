import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Save, Trash2, Image as ImageIcon, AlertCircle, Plus, FolderOpen } from "lucide-react";
import Button from "../../components/ui/Button";
import { optimizeImage, createPreviewUrl, revokePreviewUrl } from "../../utils/imageOptimizer";
import { useAdmin } from "../../context/AdminContext";
import MediaLibrary from "../../components/admin/MediaLibrary";

export default function AdminProductForm({ product, onSave, onCancel }) {
    const { adminToken } = useAdmin();
    const [formData, setFormData] = useState({
        name: "",
        category: "Accessories",
        price: "",
        rating: 4.5,
        description: "",
        badge: "",
        image: "",
        colors: [],
        sizes: [],
        logos: [],
        collection: "",
        stock: "",
        shippingTimeline: "",
        hoodieTypes: [],
        hasCropTopOption: false,
        buyingPrice: "",
    });
    const [colorImages, setColorImages] = useState(null); // raw storage IDs — used for saving
    const [colorImagesDisplay, setColorImagesDisplay] = useState(null); // resolved URLs — used for thumbnails

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
    const initializedForId = useRef(null);

    const [newColorName, setNewColorName] = useState("");
    const [newColorHex, setNewColorHex] = useState("#000000");
    const [newLogoName, setNewLogoName] = useState("");
    const [newLogoFile, setNewLogoFile] = useState(null);
    const [newLogoPreview, setNewLogoPreview] = useState("");
    const [newLogoPositions, setNewLogoPositions] = useState(["front", "back"]);
    const [logoUploading, setLogoUploading] = useState(false);

    const [logoCombinations, setLogoCombinations] = useState([]); // raw storage IDs for saving
    const [logoCombinationsDisplay, setLogoCombinationsDisplay] = useState([]); // URLs for preview
    const [newComboLogoIds, setNewComboLogoIds] = useState(["", ""]);
    const [newComboFile, setNewComboFile] = useState(null);
    const [newComboPreview, setNewComboPreview] = useState("");
    const [comboUploading, setComboUploading] = useState(false);

    const generateUploadUrl = useMutation(api.products.generateUploadUrl);
    const addProduct = useMutation(api.products.addProduct);
    const updateProduct = useMutation(api.products.updateProduct);
    const collections = useQuery(api.collections.list);
    const allProducts = useQuery(api.products.list);

    const [importSourceId, setImportSourceId] = useState("");
    const [importOpen, setImportOpen] = useState(false);

    const categories = ["T-Shirts", "Hoodies", "Quarter Zip", "Caps", "Shorts", "Joggers", "Drinkware", "Accessories"];

    useEffect(() => {
        if (product && product._id !== initializedForId.current) {
            initializedForId.current = product._id;
            setFormData({
                name: product.name || "",
                category: product.category || "Accessories",
                price: product.price?.toString() || "",
                rating: product.rating || 4.5,
                description: product.description || "",
                badge: product.badge || "",
                image: product.image || "",
                colors: product.colors || [],
                sizes: product.sizes || [],
                logos: product.logos || [],
                collection: product.collection || "",
                stock: product.stock?.toString() || "",
                shippingTimeline: product.shippingTimeline || "",
                hoodieTypes: product.hoodieTypes || [],
                hasCropTopOption: product.hasCropTopOption || false,
                buyingPrice: product.buyingPrice?.toString() || "",
            });
            setColorImages(product.logoImagesRaw || null);
            setColorImagesDisplay(product.logoImages || null);
            setImagePreview(product.image || "");
            setLogoCombinations(product.logoCombinationsRaw || []);
            setLogoCombinationsDisplay(product.logoCombinations || []);
        }
    }, [product]);

    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith("blob:")) {
                revokePreviewUrl(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (imagePreview && imagePreview.startsWith("blob:")) {
                revokePreviewUrl(imagePreview);
            }
            setImageFile(file);
            setImagePreview(createPreviewUrl(file));
        }
    };

    const handleUpload = async (fileToUpload) => {
        if (!fileToUpload) return formData.image;
        const postUrl = await generateUploadUrl({ adminToken });
        const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": fileToUpload.type },
            body: fileToUpload,
        });
        const { storageId } = await result.json();
        return storageId;
    };

    const handleMediaSelect = (media) => {
        setImageFile(null);
        setImagePreview(media.url);
        setFormData({ ...formData, image: media.storageId });
    };

    const addColor = () => {
        if (newColorName.trim()) {
            setFormData({
                ...formData,
                colors: [...formData.colors, { name: newColorName.trim(), hex: newColorHex }]
            });
            setNewColorName("");
            setNewColorHex("#000000");
        }
    };

    const removeColor = (index) => {
        setFormData({
            ...formData,
            colors: formData.colors.filter((_, i) => i !== index)
        });
    };

    const addLogo = async () => {
        if (!newLogoName.trim()) return;
        setLogoUploading(true);
        try {
            let imageStorageId = undefined;
            if (newLogoFile) {
                const optimizedFile = await optimizeImage(newLogoFile);
                const postUrl = await generateUploadUrl({ adminToken });
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": optimizedFile.type },
                    body: optimizedFile,
                });
                const { storageId } = await result.json();
                imageStorageId = storageId;
            }
            const logoId = `logo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            setFormData({
                ...formData,
                logos: [...formData.logos, {
                    id: logoId,
                    name: newLogoName.trim(),
                    ...(imageStorageId ? { image: imageStorageId, displayImage: newLogoPreview } : {}),
                    ...(newLogoPositions.length > 0 ? { positions: newLogoPositions } : {}),
                }]
            });
            setNewLogoName("");
            setNewLogoFile(null);
            setNewLogoPositions(["front", "back"]);
            if (newLogoPreview) {
                // Do not revoke just yet, as we need it for immediate display
                setNewLogoPreview("");
            }
        } catch {
            setError("Failed to upload logo image. Please try again.");
        } finally {
            setLogoUploading(false);
        }
    };

    const removeLogo = (index) => {
        setFormData({
            ...formData,
            logos: formData.logos.filter((_, i) => i !== index)
        });
    };

    const addSize = (size) => {
        if (size.trim() && !formData.sizes.includes(size.trim())) {
            setFormData({
                ...formData,
                sizes: [...formData.sizes, size.trim()]
            });
        }
    };

    const removeSize = (index) => {
        setFormData({
            ...formData,
            sizes: formData.sizes.filter((_, i) => i !== index)
        });
    };

    const defaultSizes = ["XS", "S", "M", "L", "XL", "XXL"];

    // Keep storage IDs ("kg...") and Convex storage URLs ("https://")
    const sanitizeLogoImages = (logoImages) => {
        if (!logoImages || typeof logoImages !== "object") return logoImages;
        const out = {};
        for (const [logoKey, colorMap] of Object.entries(logoImages)) {
            out[logoKey] = {};
            if (colorMap && typeof colorMap === "object") {
                for (const [colorName, images] of Object.entries(colorMap)) {
                    if (Array.isArray(images)) {
                        out[logoKey][colorName] = images.filter(img => typeof img === "string" && img.length > 0);
                    }
                }
            }
        }
        return out;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            let finalImageUrl = formData.image;
            if (imageFile) {
                const optimizedFile = await optimizeImage(imageFile);
                const storageId = await handleUpload(optimizedFile);
                finalImageUrl = storageId;
            }

            // If the image is a resolved https:// URL (not a new upload), keep the original storage ID
            const imageToSave = imageFile ? finalImageUrl : (product?.image?.startsWith("kg") ? product.image : finalImageUrl);

            const payload = {
                name: formData.name,
                category: formData.category,
                price: parseFloat(formData.price),
                rating: parseFloat(formData.rating),
                description: formData.description || undefined,
                badge: formData.badge || undefined,
                image: imageToSave,
                colors: formData.colors,
                sizes: formData.sizes,
                logos: formData.logos.map(({ displayImage, ...logo }) => logo),
                logoImages: sanitizeLogoImages(colorImages),
                collection: formData.collection || undefined,
                stock: formData.stock !== "" ? parseInt(formData.stock) : undefined,
                shippingTimeline: formData.shippingTimeline || undefined,
                hoodieTypes: formData.hoodieTypes,
                hasCropTopOption: formData.hasCropTopOption || undefined,
                buyingPrice: formData.buyingPrice !== "" ? parseFloat(formData.buyingPrice) : undefined,
                logoCombinations: logoCombinations.length > 0 ? logoCombinations : undefined,
            };

            if (product) {
                await updateProduct({ id: product._id, ...payload, adminToken });
            } else {
                await addProduct({ ...payload, adminToken });
            }

            onSave();
        } catch (err) {
            console.error("Product save error:", err);
            setError(err?.message || "An error occurred while saving the product. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-8 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                    <h2 className="text-lg md:text-xl font-black text-brand-navy">{product ? "Edit Product" : "Add New Product"}</h2>
                    <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">{product ? `Editing ID: ${product._id}` : "Enter product details"}</p>
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={20} className="text-gray-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
                    <div className="space-y-4 md:space-y-6">
                        <div>
                            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Product Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all"
                                placeholder="DAUST Varsity Jacket"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div>
                                <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all appearance-none"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Selling Price (XOF)</label>
                                <input
                                    type="number"
                                    step="100"
                                    required
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all"
                                    placeholder="7500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Buying Price / Cost (XOF) <span className="normal-case font-medium text-gray-300">— admin only, used for profit tracking</span></label>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                value={formData.buyingPrice}
                                onChange={(e) => setFormData({ ...formData, buyingPrice: e.target.value })}
                                className="w-full bg-orange-50 border border-orange-100 rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all"
                                placeholder="e.g. 4000"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Description</label>
                            <textarea
                                rows="3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all resize-none"
                                placeholder="Tell the story of this product..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div>
                                <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Rating</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="5"
                                    value={formData.rating}
                                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Badge</label>
                                <input
                                    type="text"
                                    value={formData.badge}
                                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all"
                                    placeholder="New, Popular, etc."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                        <div>
                            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Product Image</label>
                            <div
                                className={`relative aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden border-2 border-dashed transition-all flex flex-col items-center justify-center p-3 md:p-4 bg-gray-50 ${imagePreview ? "border-transparent" : "border-gray-200 hover:border-brand-orange/40"}`}
                            >
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => { setImageFile(null); setImagePreview(""); setFormData({ ...formData, image: "" }) }}
                                            className="absolute top-2 md:top-4 right-2 md:right-4 bg-red-500 text-white p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 size={16} md:size={20} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-white mb-3 md:mb-4 shadow-sm text-gray-400">
                                            <ImageIcon size={24} md:size={32} />
                                        </div>
                                        <p className="text-xs md:text-sm font-bold text-gray-500 mb-1">Click to upload image</p>
                                        <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">Recommended: 1200 x 1600px</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setMediaLibraryOpen(true)}
                                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-brand-navy font-bold text-xs rounded-xl transition-colors border border-gray-200"
                            >
                                <FolderOpen size={14} /> Choose from Media Library
                            </button>
                        </div>

                        {/* Logo Preview Section - Show near top for visibility */}
                        {formData.logos.length > 0 && (
                            <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-gray-100">
                                <h4 className="font-black text-brand-navy mb-3 text-xs md:text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Logo Preview
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {formData.logos.map((logo, index) => (
                                        <div key={index} className="relative bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                                            {logo.displayImage || (logo.image && !logo.image.startsWith("kg")) ? (
                                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                                                    <img
                                                        src={logo.displayImage || logo.image}
                                                        alt={logo.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center mb-2">
                                                    <ImageIcon size={24} className="text-gray-300" />
                                                </div>
                                            )}
                                            <p className="text-xs font-bold text-brand-navy truncate">{logo.name}</p>
                                            {logo.positions && logo.positions.length > 0 && (
                                                <p className="text-[9px] text-gray-400 font-bold capitalize">{logo.positions.join(" & ")}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-3 font-medium">
                                    {formData.logos.length} logo{formData.logos.length !== 1 ? 's' : ''} added. These will be applied to your products.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-8">
                    <h3 className="font-black text-brand-navy mb-3 md:mb-4 text-sm md:text-base">Colors</h3>
                    <div className="flex flex-wrap gap-2 md:gap-3 mb-3 md:mb-4">
                        {formData.colors.map((color, index) => (
                            <div key={index} className="flex items-center gap-2 bg-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl shadow-sm">
                                <span className="w-4 h-4 md:w-5 md:h-5 rounded-full border border-gray-200" style={{ backgroundColor: color.hex }} />
                                <span className="text-xs md:text-sm font-bold text-brand-navy">{color.name}</span>
                                <button type="button" onClick={() => removeColor(index)} className="text-gray-400 hover:text-red-500">
                                    <X size={12} md:size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 md:gap-3 items-end">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={newColorName}
                                onChange={(e) => setNewColorName(e.target.value)}
                                placeholder="Color name"
                                className="w-full bg-white border-none rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-bold"
                            />
                        </div>
                        <div>
                            <input
                                type="color"
                                value={newColorHex}
                                onChange={(e) => setNewColorHex(e.target.value)}
                                className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl cursor-pointer border-none"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={addColor}
                            className="bg-brand-navy text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-sm hover:bg-brand-navy/90"
                        >
                            <Plus size={18} md:size={20} />
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-8">
                    <h3 className="font-black text-brand-navy mb-3 md:mb-4 text-sm md:text-base">Logo Types</h3>
                    <div className="flex flex-wrap gap-2 md:gap-3 mb-3 md:mb-4">
                        {formData.logos.map((logo, index) => (
                            <div key={index} className="flex items-center gap-2 bg-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl shadow-sm">
                                {(logo.displayImage || (logo.image && !logo.image.startsWith("kg"))) && (
                                    <img src={logo.displayImage || logo.image} alt={logo.name} className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
                                )}
                                <span className="text-xs md:text-sm font-bold text-brand-navy">{logo.name}</span>
                                {logo.positions && logo.positions.length > 0 && (
                                    <span className="text-[10px] text-gray-400 font-bold capitalize">{logo.positions.join(" & ")}</span>
                                )}
                                <button type="button" onClick={() => removeLogo(index)} className="text-gray-400 hover:text-red-500">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {["front", "back", "side"].map(pos => (
                            <label key={pos} className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={newLogoPositions.includes(pos)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setNewLogoPositions(prev => [...prev, pos]);
                                        } else {
                                            setNewLogoPositions(prev => prev.filter(p => p !== pos));
                                        }
                                    }}
                                    className="w-4 h-4 accent-brand-navy rounded"
                                />
                                <span className="text-xs font-bold text-brand-navy capitalize">{pos}</span>
                            </label>
                        ))}
                    </div>
                    <div className="flex gap-2 md:gap-3 items-end">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={newLogoName}
                                onChange={(e) => setNewLogoName(e.target.value)}
                                placeholder="Logo display name"
                                className="w-full bg-white border-none rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-bold"
                            />
                        </div>
                        <div className="relative flex-shrink-0">
                            {newLogoPreview ? (
                                <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-xl overflow-hidden border border-gray-200">
                                    <img src={newLogoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => { setNewLogoFile(null); revokePreviewUrl(newLogoPreview); setNewLogoPreview(""); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                                        <X size={10} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 bg-white rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-dashed border-gray-300">
                                    <ImageIcon size={18} className="text-gray-400" />
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                        const f = e.target.files[0];
                                        if (f) { setNewLogoFile(f); setNewLogoPreview(createPreviewUrl(f)); }
                                    }} />
                                </label>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={addLogo}
                            disabled={logoUploading || !newLogoName.trim()}
                            className="bg-brand-navy text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-sm hover:bg-brand-navy/90 disabled:opacity-50"
                        >
                            {logoUploading ? "..." : <Plus size={18} />}
                        </button>
                    </div>
                </div>

                {/* Import Logos & Combinations from another product */}
                <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-8">
                    <button type="button" onClick={() => setImportOpen(v => !v)} className="w-full flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-brand-navy text-sm md:text-base text-left">Import from Another Product</h3>
                            <p className="text-[10px] text-gray-400 font-bold text-left">Reuse logos and combinations already set up on other products.</p>
                        </div>
                        <span className="text-gray-400 font-black text-lg">{importOpen ? "−" : "+"}</span>
                    </button>

                    {importOpen && (
                        <div className="mt-4 space-y-4">
                            <select
                                value={importSourceId}
                                onChange={e => setImportSourceId(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-navy"
                            >
                                <option value="">Select a product…</option>
                                {allProducts?.filter(p => p._id !== product?._id && p.logos?.length > 0).map(p => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>

                            {(() => {
                                const src = allProducts?.find(p => p._id === importSourceId);
                                if (!src) return null;
                                const currentLogoIds = new Set(formData.logos.map(l => l.id));
                                const currentComboKeys = new Set(logoCombinations.map(c => [...c.logoIds].sort().join("|")));

                                return (
                                    <div className="space-y-4">
                                        {/* Logos */}
                                        {src.logos?.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Logos</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {src.logos.map(logo => {
                                                        const already = currentLogoIds.has(logo.id);
                                                        return (
                                                            <button
                                                                key={logo.id}
                                                                type="button"
                                                                disabled={already}
                                                                onClick={() => {
                                                                    setFormData(prev => ({ ...prev, logos: [...prev.logos, { ...logo }] }));
                                                                }}
                                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${already ? "bg-green-50 border-green-200 text-green-700 cursor-not-allowed" : "bg-white border-gray-200 text-brand-navy hover:border-brand-navy"}`}
                                                            >
                                                                {logo.image && <img src={logo.image} alt={logo.name} className="w-6 h-6 rounded-md object-cover" />}
                                                                {logo.name}
                                                                {already ? <span className="text-green-500">✓</span> : <Plus size={12} />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Combinations */}
                                        {src.logoCombinations?.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Combinations</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {src.logoCombinations.map((combo, idx) => {
                                                        const key = [...combo.logoIds].sort().join("|");
                                                        const already = currentComboKeys.has(key);
                                                        const logo1 = src.logos?.find(l => l.id === combo.logoIds[0]);
                                                        const logo2 = src.logos?.find(l => l.id === combo.logoIds[1]);
                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                disabled={already}
                                                                onClick={() => {
                                                                    // Also import the two logos if not already present
                                                                    setFormData(prev => {
                                                                        const ids = new Set(prev.logos.map(l => l.id));
                                                                        const toAdd = [logo1, logo2].filter(l => l && !ids.has(l.id));
                                                                        return toAdd.length > 0 ? { ...prev, logos: [...prev.logos, ...toAdd] } : prev;
                                                                    });
                                                                    setLogoCombinations(prev => [...prev, { logoIds: combo.logoIds, image: combo.image }]);
                                                                    setLogoCombinationsDisplay(prev => [...prev, { logoIds: combo.logoIds, image: combo.image }]);
                                                                }}
                                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${already ? "bg-green-50 border-green-200 text-green-700 cursor-not-allowed" : "bg-white border-gray-200 text-brand-navy hover:border-brand-navy"}`}
                                                            >
                                                                {combo.image && <img src={combo.image} alt="combo" className="w-6 h-6 rounded-md object-cover" />}
                                                                {logo1?.name || combo.logoIds[0]} + {logo2?.name || combo.logoIds[1]}
                                                                {already ? <span className="text-green-500">✓</span> : <Plus size={12} />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* Logo Combinations Section */}
                {formData.logos.length >= 2 && (
                    <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-8">
                        <h3 className="font-black text-brand-navy mb-1 text-sm md:text-base">Logo Combinations</h3>
                        <p className="text-[10px] text-gray-400 font-bold mb-4">Upload a combined image shown when two back logos are selected together.</p>

                        {/* Existing combinations */}
                        {logoCombinations.length > 0 && (
                            <div className="space-y-2 mb-4">
                                {logoCombinations.map((combo, idx) => {
                                    const logo1 = formData.logos.find(l => l.id === combo.logoIds[0]);
                                    const logo2 = formData.logos.find(l => l.id === combo.logoIds[1]);
                                    const displayUrl = logoCombinationsDisplay[idx]?.image;
                                    return (
                                        <div key={idx} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                                            {displayUrl && <img src={displayUrl} alt="combo" className="w-12 h-12 rounded-lg object-cover border border-gray-100" />}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-brand-navy truncate">{logo1?.name || combo.logoIds[0]} + {logo2?.name || combo.logoIds[1]}</p>
                                            </div>
                                            <button type="button" onClick={() => {
                                                setLogoCombinations(prev => prev.filter((_, i) => i !== idx));
                                                setLogoCombinationsDisplay(prev => prev.filter((_, i) => i !== idx));
                                            }} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Add new combination */}
                        <div className="flex flex-wrap items-end gap-2">
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Logo 1</label>
                                <select
                                    value={newComboLogoIds[0]}
                                    onChange={e => setNewComboLogoIds([e.target.value, newComboLogoIds[1]])}
                                    className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-brand-navy"
                                >
                                    <option value="">Select</option>
                                    {formData.logos.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Logo 2</label>
                                <select
                                    value={newComboLogoIds[1]}
                                    onChange={e => setNewComboLogoIds([newComboLogoIds[0], e.target.value])}
                                    className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-brand-navy"
                                >
                                    <option value="">Select</option>
                                    {formData.logos.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Combined Image</label>
                                {newComboPreview ? (
                                    <div className="relative w-11 h-11">
                                        <img src={newComboPreview} alt="combo preview" className="w-11 h-11 rounded-xl object-cover border border-gray-200" />
                                        <button type="button" onClick={() => { setNewComboFile(null); setNewComboPreview(""); }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                            <X size={8} className="text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center w-11 h-11 bg-white rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-dashed border-gray-300">
                                        <ImageIcon size={18} className="text-gray-400" />
                                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                                            const f = e.target.files[0];
                                            if (f) { setNewComboFile(f); setNewComboPreview(createPreviewUrl(f)); }
                                        }} />
                                    </label>
                                )}
                            </div>
                            <button
                                type="button"
                                disabled={comboUploading || !newComboLogoIds[0] || !newComboLogoIds[1] || newComboLogoIds[0] === newComboLogoIds[1] || !newComboFile}
                                onClick={async () => {
                                    if (!newComboFile || !newComboLogoIds[0] || !newComboLogoIds[1]) return;
                                    setComboUploading(true);
                                    try {
                                        const optimized = await optimizeImage(newComboFile);
                                        const postUrl = await generateUploadUrl({ adminToken });
                                        const result = await fetch(postUrl, { method: "POST", headers: { "Content-Type": optimized.type }, body: optimized });
                                        const { storageId } = await result.json();
                                        setLogoCombinations(prev => [...prev, { logoIds: [newComboLogoIds[0], newComboLogoIds[1]], image: storageId }]);
                                        setLogoCombinationsDisplay(prev => [...prev, { logoIds: [newComboLogoIds[0], newComboLogoIds[1]], image: newComboPreview }]);
                                        setNewComboLogoIds(["", ""]);
                                        setNewComboFile(null);
                                        setNewComboPreview("");
                                    } catch { setError("Failed to upload combination image."); }
                                    finally { setComboUploading(false); }
                                }}
                                className="bg-brand-navy text-white px-3 py-2.5 rounded-xl font-bold text-xs hover:bg-brand-navy/90 disabled:opacity-50 h-[42px]"
                            >
                                {comboUploading ? "..." : <Plus size={18} />}
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-8">
                    <h3 className="font-black text-brand-navy mb-3 md:mb-4 text-sm md:text-base">Sizes</h3>
                    <div className="flex flex-wrap gap-2 md:gap-3 mb-3 md:mb-4">
                        {formData.sizes.map((size, index) => (
                            <div key={index} className="flex items-center gap-2 bg-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl shadow-sm">
                                <span className="text-xs md:text-sm font-bold text-brand-navy">{size}</span>
                                <button type="button" onClick={() => removeSize(index)} className="text-gray-400 hover:text-red-500">
                                    <X size={12} md:size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {defaultSizes.map(size => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => addSize(size)}
                                disabled={formData.sizes.includes(size)}
                                className={`px-3 md:px-4 py-2 md:py-2 rounded-lg md:rounded-xl font-bold text-xs md:text-sm ${formData.sizes.includes(size)
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-white text-brand-navy hover:bg-brand-navy hover:text-white"
                                    }`}
                            >
                                + {size}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-8">
                    <h3 className="font-black text-brand-navy mb-1 text-sm md:text-base">Hoodie Types</h3>
                    <p className="text-[10px] text-gray-400 font-bold mb-4">Add style variants like Zipped, No Zip, Pullover, etc. Leave empty if not applicable.</p>
                    <div className="flex flex-wrap gap-2 md:gap-3 mb-3 md:mb-4">
                        {formData.hoodieTypes.map((ht, index) => (
                            <div key={index} className="flex items-center gap-2 bg-white px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl shadow-sm">
                                <span className="text-xs md:text-sm font-bold text-brand-navy">{ht}</span>
                                <button type="button" onClick={() => setFormData({ ...formData, hoodieTypes: formData.hoodieTypes.filter((_, i) => i !== index) })} className="text-gray-400 hover:text-red-500">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {["Zipped", "No Zip", "Pullover", "Quarter Zip"].map(ht => (
                            <button
                                key={ht}
                                type="button"
                                onClick={() => {
                                    if (!formData.hoodieTypes.includes(ht)) {
                                        setFormData({ ...formData, hoodieTypes: [...formData.hoodieTypes, ht] });
                                    }
                                }}
                                disabled={formData.hoodieTypes.includes(ht)}
                                className={`px-3 md:px-4 py-2 rounded-lg md:rounded-xl font-bold text-xs md:text-sm ${formData.hoodieTypes.includes(ht)
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-white text-brand-navy hover:bg-brand-navy hover:text-white"
                                    }`}
                            >
                                + {ht}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-brand-navy mb-1 text-sm md:text-base">Crop Top Option</h3>
                            <p className="text-[10px] text-gray-400 font-bold">Allow customers to choose a crop top version of this product.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, hasCropTopOption: !formData.hasCropTopOption })}
                            className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${formData.hasCropTopOption ? "bg-brand-navy" : "bg-gray-300"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ${formData.hasCropTopOption ? "translate-x-5" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* Variant Images Section - per color only */}
                {formData.colors.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-8">
                        <h3 className="font-black text-brand-navy mb-1 text-sm md:text-base">Color Images</h3>
                        <p className="text-[10px] text-gray-400 font-bold mb-4">Upload images for each color. These show when a customer selects that color.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {formData.colors.map((color) => {
                                const rawIds = colorImages?.["_default"]?.[color.name] || [];
                                const displayUrls = colorImagesDisplay?.["_default"]?.[color.name] || [];
                                // Use display URLs for existing images, raw IDs for newly uploaded (shown as count)
                                const count = rawIds.length;
                                return (
                                    <div key={color.name} className="bg-white rounded-xl p-3 border border-gray-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: color.hex }} />
                                            <span className="text-xs font-bold text-brand-navy">{color.name}</span>
                                            <span className="text-[10px] text-gray-400 ml-auto">{count} image{count !== 1 ? "s" : ""}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {rawIds.map((id, idx) => (
                                                <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 group">
                                                    <img src={displayUrls[idx] || ""} alt="" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const colorName = color.name;
                                                            setColorImages(prev => {
                                                                const base = prev || {};
                                                                const dm = { ...(base["_default"] || {}) };
                                                                dm[colorName] = (dm[colorName] || []).filter((_, i) => i !== idx);
                                                                return { ...base, "_default": dm };
                                                            });
                                                            setColorImagesDisplay(prev => {
                                                                const base = prev || {};
                                                                const dm = { ...(base["_default"] || {}) };
                                                                dm[colorName] = (dm[colorName] || []).filter((_, i) => i !== idx);
                                                                return { ...base, "_default": dm };
                                                            });
                                                        }}
                                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                    >
                                                        <X size={14} className="text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                            <label className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-brand-orange/40 transition-colors bg-gray-50">
                                                <Plus size={16} className="text-gray-400" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const files = Array.from(e.target.files || []);
                                                        if (files.length === 0) return;
                                                        const colorName = color.name;
                                                        const newStorageIds = [];
                                                        const newBlobUrls = [];
                                                        for (const file of files) {
                                                            const optimized = await optimizeImage(file);
                                                            const blobUrl = createPreviewUrl(optimized);
                                                            newBlobUrls.push(blobUrl);
                                                            const postUrl = await generateUploadUrl({ adminToken });
                                                            const result = await fetch(postUrl, {
                                                                method: "POST",
                                                                headers: { "Content-Type": optimized.type },
                                                                body: optimized,
                                                            });
                                                            const { storageId } = await result.json();
                                                            newStorageIds.push(storageId);
                                                        }
                                                        setColorImages(prev => {
                                                            const base = prev || {};
                                                            const dm = { ...(base["_default"] || {}) };
                                                            dm[colorName] = [...(dm[colorName] || []), ...newStorageIds];
                                                            return { ...base, "_default": dm };
                                                        });
                                                        setColorImagesDisplay(prev => {
                                                            const base = prev || {};
                                                            const dm = { ...(base["_default"] || {}) };
                                                            dm[colorName] = [...(dm[colorName] || []), ...newBlobUrls];
                                                            return { ...base, "_default": dm };
                                                        });
                                                        e.target.value = "";
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                        <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Collection</label>
                        <select
                            value={formData.collection}
                            onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                            className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all appearance-none"
                        >
                            <option value="">None</option>
                            {collections?.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Stock Quantity</label>
                        <input
                            type="number"
                            min="0"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all"
                            placeholder="0"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Shipping Timeline</label>
                    <input
                        type="text"
                        value={formData.shippingTimeline}
                        onChange={(e) => setFormData({ ...formData, shippingTimeline: e.target.value })}
                        className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all"
                        placeholder="e.g. 10-15 days campus ship"
                    />
                </div>

                {error && (
                    <div className="p-3 md:p-4 bg-red-50 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 text-red-600 font-bold text-xs md:text-sm">
                        <AlertCircle size={18} md:size={20} />
                        {error}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 pt-3 md:pt-4 border-t border-gray-50">
                    <Button variant="secondary" type="button" onClick={onCancel} className="w-full sm:w-auto h-12 md:h-14">
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        loading={loading}
                        className="w-full sm:w-auto px-6 md:px-10 rounded-xl md:rounded-2xl h-12 md:h-14 text-sm md:text-base"
                    >
                        <Save size={18} md:size={20} className="mr-2" />
                        {product ? "Update Product" : "Save Product"}
                    </Button>
                </div>
            </form>
            <MediaLibrary
                open={mediaLibraryOpen}
                onClose={() => setMediaLibraryOpen(false)}
                onSelect={handleMediaSelect}
            />
        </div>
    );
}
