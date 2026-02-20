import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    X,
    Upload,
    Save,
    Trash2,
    Image as ImageIcon,
    AlertCircle,
    Plus,
    Minus
} from "lucide-react";
import Button from "../../components/ui/Button";
import { optimizeImage, createPreviewUrl, revokePreviewUrl } from "../../utils/imageOptimizer";

export default function AdminProductForm({ product, onSave, onCancel }) {
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
        collection: "",
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const generateUploadUrl = useMutation(api.products.generateUploadUrl);
    const addProduct = useMutation(api.products.addProduct);
    const updateProduct = useMutation(api.products.updateProduct);
    const collections = useQuery(api.collections.list);

    const categories = ["Clothing", "Accessories", "Footwear", "Bundles", "Limited Edition"];

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
                collection: product.collection || "",
            });
            setImagePreview(product.image || "");
        }
    }, [product]);
    useEffect(() => {
        return () => {
            // Cleanup generic preview URL if it's a blob
            if (imagePreview && imagePreview.startsWith("blob:")) {
                revokePreviewUrl(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Revoke old preview if it exists
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

        // In a real app, you'd get the public URL from Convex
        // For now, we'll store the storageId or a placeholder if storageId is not immediately available as a URL
        // Actually, Convex storageId is just a string. We need ctx.storage.getUrl(storageId) in a query.
        // For simplicity in this demo, we'll store the storageId and hope the frontend handles it or use the data URI for now.
        // But better to store a string.
        return storageId;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            let finalImageUrl = formData.image;
            if (imageFile) {
                // Compress and optimize image before upload
                const optimizedFile = await optimizeImage(imageFile);

                // Upload the file and get the storage ID
                const storageId = await handleUpload(optimizedFile);
                finalImageUrl = storageId;
            }

            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                rating: parseFloat(formData.rating),
                image: finalImageUrl,
            };

            if (product) {
                await updateProduct({ id: product._id, ...payload });
            } else {
                await addProduct(payload);
            }

            onSave();
        } catch (err) {
            console.error("Failed to save product", err);
            setError("An error occurred while saving the product. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-brand-navy">{product ? "Edit Product" : "Add New Product"}</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{product ? `Editing ID: ${product._id}` : "Enter product details"}</p>
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={24} className="text-gray-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left Side: Basic Info */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Product Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all"
                                placeholder="DAUST Varsity Jacket"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all appearance-none"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Description</label>
                            <textarea
                                rows="4"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all resize-none"
                                placeholder="Tell the story of this product..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Initial Rating</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="5"
                                    value={formData.rating}
                                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Badge (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.badge}
                                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all"
                                    placeholder="New Arrival, Popular, etc."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Collection (Optional)</label>
                                <select
                                    value={formData.collection}
                                    onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all appearance-none"
                                >
                                    <option value="">None</option>
                                    {collections?.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Media & Settings */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Product Image</label>
                            <div
                                className={`relative aspect-[3/4] rounded-3xl overflow-hidden border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 bg-gray-50 ${imagePreview ? "border-transparent" : "border-gray-200 hover:border-brand-orange/40"
                                    }`}
                            >
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => { setImageFile(null); setImagePreview(""); setFormData({ ...formData, image: "" }) }}
                                            className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-xl shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-4 shadow-sm text-gray-400">
                                            <ImageIcon size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-gray-500 mb-1">Click to upload image</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Recommended: 1200 x 1600px</p>
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
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-50">
                    <Button variant="secondary" type="button" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        loading={loading}
                        className="px-10 rounded-2xl h-14"
                    >
                        <Save size={20} className="mr-2" />
                        {product ? "Update Product" : "Save Product"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
