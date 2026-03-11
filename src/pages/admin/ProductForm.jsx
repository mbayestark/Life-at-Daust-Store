import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Save, Trash2, Image as ImageIcon, AlertCircle, Plus } from "lucide-react";
import Button from "../../components/ui/Button";
import { optimizeImage, createPreviewUrl, revokePreviewUrl } from "../../utils/imageOptimizer";
import { useAdmin } from "../../context/AdminContext";

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
        logoImages: null,
        collection: "",
        stock: "",
        shippingTimeline: "",
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [newColorName, setNewColorName] = useState("");
    const [newColorHex, setNewColorHex] = useState("#000000");
    const [newLogoName, setNewLogoName] = useState("");
    const [newLogoFile, setNewLogoFile] = useState(null);
    const [newLogoPreview, setNewLogoPreview] = useState("");
    const [newLogoPositions, setNewLogoPositions] = useState(["front", "back"]);
    const [logoUploading, setLogoUploading] = useState(false);

    const generateUploadUrl = useMutation(api.products.generateUploadUrl);
    const addProduct = useMutation(api.products.addProduct);
    const updateProduct = useMutation(api.products.updateProduct);
    const collections = useQuery(api.collections.list);

    const categories = ["T-Shirts", "Hoodies", "Quarter Zip", "Caps", "Shorts", "Joggers", "Drinkware", "Accessories"];

    useEffect(() => {
        if (product) {
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
                logoImages: product.logoImages || null,
                collection: product.collection || "",
                stock: product.stock?.toString() || "",
                shippingTimeline: product.shippingTimeline || "",
            });
            setImagePreview(product.image || "");
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
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": fileToUpload.type },
            body: fileToUpload,
        });
        const { storageId } = await result.json();
        return storageId;
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
                const postUrl = await generateUploadUrl();
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
                    ...(imageStorageId ? { image: imageStorageId } : {}),
                    ...(newLogoPositions.length > 0 ? { positions: newLogoPositions } : {}),
                }]
            });
            setNewLogoName("");
            setNewLogoFile(null);
            setNewLogoPositions(["front", "back"]);
            if (newLogoPreview) {
                revokePreviewUrl(newLogoPreview);
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

            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                rating: parseFloat(formData.rating),
                stock: formData.stock !== "" ? parseInt(formData.stock) : undefined,
                image: finalImageUrl,
                shippingTimeline: formData.shippingTimeline || undefined,
            };

            if (product) {
                await updateProduct({ id: product._id, ...payload, adminToken });
            } else {
                await addProduct({ ...payload, adminToken });
            }

            onSave();
        } catch (err) {
            setError("An error occurred while saving the product. Please try again.");
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
                                <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Price (XOF)</label>
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
                                            {logo.image ? (
                                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                                                    <img 
                                                        src={logo.image.startsWith("kg") ? "" : logo.image} 
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
                                {logo.image && (
                                    <img src={logo.image.startsWith("kg") ? "" : logo.image} alt={logo.name} className="w-8 h-8 rounded-lg object-cover bg-gray-100" />
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
                        {["front", "back"].map(pos => (
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

                {/* Variant Images Section - per color only */}
                {formData.colors.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-8">
                        <h3 className="font-black text-brand-navy mb-1 text-sm md:text-base">Color Images</h3>
                        <p className="text-[10px] text-gray-400 font-bold mb-4">Upload images for each color. These show when a customer selects that color.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {formData.colors.map((color) => {
                                const images = formData.logoImages?.["_default"]?.[color.name] || [];
                                return (
                                    <div key={color.name} className="bg-white rounded-xl p-3 border border-gray-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: color.hex }} />
                                            <span className="text-xs font-bold text-brand-navy">{color.name}</span>
                                            <span className="text-[10px] text-gray-400 ml-auto">{images.length} image{images.length !== 1 ? "s" : ""}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {images.map((img, idx) => (
                                                <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 group">
                                                    <img src={typeof img === "string" && !img.startsWith("kg") ? img : ""} alt="" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = { ...formData.logoImages };
                                                            updated["_default"][color.name] = updated["_default"][color.name].filter((_, i) => i !== idx);
                                                            setFormData({ ...formData, logoImages: updated });
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
                                                        const updated = { ...(formData.logoImages || {}) };
                                                        if (!updated["_default"]) updated["_default"] = {};
                                                        if (!updated["_default"][color.name]) updated["_default"][color.name] = [];
                                                        for (const file of files) {
                                                            const optimized = await optimizeImage(file);
                                                            const postUrl = await generateUploadUrl();
                                                            const result = await fetch(postUrl, {
                                                                method: "POST",
                                                                headers: { "Content-Type": optimized.type },
                                                                body: optimized,
                                                            });
                                                            const { storageId } = await result.json();
                                                            updated["_default"][color.name] = [...updated["_default"][color.name], storageId];
                                                        }
                                                        setFormData(prev => ({ ...prev, logoImages: { ...updated } }));
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
                        placeholder="e.g. 2-4 days campus ship"
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
        </div>
    );
}
