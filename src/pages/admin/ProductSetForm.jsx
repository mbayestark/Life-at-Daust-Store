import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Save, Trash2, Image as ImageIcon, AlertCircle, Plus, Package } from "lucide-react";
import Button from "../../components/ui/Button";
import { useAdmin } from "../../context/AdminContext";

export default function ProductSetForm({ productSet, onSave, onCancel }) {
    const { adminToken } = useAdmin();
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        products: [],
        specialPrice: "",
        image: "",
        badge: "",
        isActive: true,
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const generateUploadUrl = useMutation(api.products.generateUploadUrl);
    const addProductSet = useMutation(api.products.addProductSet);
    const updateProductSet = useMutation(api.products.updateProductSet);
    
    // Fetch all products for selection
    const products = useQuery(api.products.list) || [];

    useEffect(() => {
        if (productSet) {
            setFormData({
                name: productSet.name || "",
                description: productSet.description || "",
                products: productSet.products || [],
                specialPrice: productSet.specialPrice?.toString() || "",
                image: productSet.image || "",
                badge: productSet.badge || "",
                isActive: productSet.isActive !== false,
            });
            setImagePreview(productSet.image || "");
        }
    }, [productSet]);

    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (imagePreview && imagePreview.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreview);
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
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

    const addProductToSet = (productId) => {
        if (!productId) return;
        const product = products.find(p => p._id === productId);
        if (!product) return;
        
        // Check if product already exists in set
        const exists = formData.products.find(p => p.productId === productId);
        if (exists) {
            setError("This product is already in the set");
            return;
        }

        setFormData({
            ...formData,
            products: [...formData.products, {
                productId,
                quantity: 1,
                selectedColor: null,
                selectedSize: null,
                selectedLogo: null,
            }]
        });
        setError("");
    };

    const removeProductFromSet = (index) => {
        setFormData({
            ...formData,
            products: formData.products.filter((_, i) => i !== index)
        });
    };

    const updateProductQuantity = (index, quantity) => {
        const updated = [...formData.products];
        updated[index] = { ...updated[index], quantity: Math.max(1, parseInt(quantity) || 1) };
        setFormData({ ...formData, products: updated });
    };

    const calculateOriginalPrice = () => {
        return formData.products.reduce((total, item) => {
            const product = products.find(p => p._id === item.productId);
            return total + (product?.price || 0) * item.quantity;
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!formData.name.trim()) {
            setError("Please enter a name for the product set");
            setLoading(false);
            return;
        }

        if (formData.products.length < 2) {
            setError("Please add at least 2 products to create a bundle");
            setLoading(false);
            return;
        }

        if (!formData.specialPrice || parseFloat(formData.specialPrice) <= 0) {
            setError("Please enter a special price for the bundle");
            setLoading(false);
            return;
        }

        try {
            let finalImageUrl = formData.image;
            if (imageFile) {
                finalImageUrl = await handleUpload(imageFile);
            }

            const payload = {
                ...formData,
                specialPrice: parseFloat(formData.specialPrice),
                image: finalImageUrl,
            };

            if (productSet) {
                await updateProductSet({ id: productSet._id, ...payload, adminToken });
            } else {
                await addProductSet({ ...payload, adminToken });
            }

            onSave();
        } catch (err) {
            setError("An error occurred while saving. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const originalPrice = calculateOriginalPrice();
    const savings = originalPrice - parseFloat(formData.specialPrice || 0);

    return (
        <div className="bg-white rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-8 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                    <h2 className="text-lg md:text-xl font-black text-brand-navy">
                        {productSet ? "Edit Product Bundle" : "Create Product Bundle"}
                    </h2>
                    <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">
                        {productSet ? `Editing: ${productSet.name}` : "Create special bundles with discounted pricing"}
                    </p>
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={20} className="text-gray-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
                    <div className="space-y-4 md:space-y-6">
                        <div>
                            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Bundle Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all"
                                placeholder="e.g., Student Starter Pack"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Description</label>
                            <textarea
                                rows="3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all resize-none"
                                placeholder="Describe what's included in this bundle..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div>
                                <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Special Price (XOF)</label>
                                <input
                                    type="number"
                                    step="100"
                                    required
                                    value={formData.specialPrice}
                                    onChange={(e) => setFormData({ ...formData, specialPrice: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all"
                                    placeholder="8000"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Badge</label>
                                <input
                                    type="text"
                                    value={formData.badge}
                                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 md:px-5 py-3 md:py-4 text-sm md:text-base text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all"
                                    placeholder="Best Value, etc."
                                />
                            </div>
                        </div>

                        {/* Price Preview */}
                        {formData.products.length > 0 && formData.specialPrice && (
                            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-500">Original Price:</span>
                                    <span className="text-sm font-bold text-gray-400 line-through">
                                        {originalPrice.toLocaleString()} XOF
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500">Your Savings:</span>
                                    <span className="text-sm font-bold text-green-600">
                                        {savings > 0 ? `${savings.toLocaleString()} XOF` : "None"}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 md:space-y-6">
                        <div>
                            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Bundle Image</label>
                            <div
                                className={`relative aspect-video rounded-2xl md:rounded-3xl overflow-hidden border-2 border-dashed transition-all flex flex-col items-center justify-center p-3 md:p-4 bg-gray-50 ${imagePreview ? "border-transparent" : "border-gray-200 hover:border-brand-orange/40"}`}
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
                                            <Package size={24} md:size={32} />
                                        </div>
                                        <p className="text-xs md:text-sm font-bold text-gray-500 mb-1">Click to upload bundle image</p>
                                        <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">Optional</p>
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

                        {/* Active Toggle */}
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                            <span className="text-sm font-bold text-brand-navy">Active</span>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                className={`w-12 h-6 rounded-full transition-colors ${formData.isActive ? "bg-brand-orange" : "bg-gray-300"}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.isActive ? "translate-x-6" : "translate-x-0.5"}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Products Selection */}
                <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-8">
                    <h3 className="font-black text-brand-navy mb-3 md:mb-4 text-sm md:text-base">Products in Bundle</h3>
                    
                    {/* Add Product */}
                    <div className="flex gap-2 md:gap-3 mb-4 md:mb-6">
                        <select
                            onChange={(e) => addProductToSet(e.target.value)}
                            className="flex-1 bg-white border-none rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-bold"
                            defaultValue=""
                        >
                            <option value="" disabled>Select a product to add...</option>
                            {products.map(p => (
                                <option key={p._id} value={p._id}>
                                    {p.name} - {p.price?.toLocaleString()} XOF
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Selected Products */}
                    {formData.products.length > 0 ? (
                        <div className="space-y-3">
                            {formData.products.map((item, index) => {
                                const product = products.find(p => p._id === item.productId);
                                return (
                                    <div key={index} className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl shadow-sm">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                            {product?.image && (
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-brand-navy truncate">{product?.name}</p>
                                            <p className="text-xs text-gray-400">{product?.price?.toLocaleString()} XOF each</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-400">Qty:</span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateProductQuantity(index, e.target.value)}
                                                className="w-12 bg-gray-50 rounded-lg px-2 py-1 text-center text-sm font-bold"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeProductFromSet(index)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-4">No products added yet. Add at least 2 products to create a bundle.</p>
                    )}
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
                        {productSet ? "Update Bundle" : "Create Bundle"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
