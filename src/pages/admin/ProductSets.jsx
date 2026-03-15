import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Package, Edit2, Trash2, Eye, EyeOff, Tag, TrendingUp } from "lucide-react";
import Button from "../../components/ui/Button";
import { formatPrice } from "../../utils/format";
import ProductSetForm from "./ProductSetForm";
import { useAdmin } from "../../context/AdminContext";

export default function ProductSets() {
    const { adminToken } = useAdmin();
    const [showForm, setShowForm] = useState(false);
    const [editingSet, setEditingSet] = useState(null);

    const productSets = useQuery(api.products.listProductSets) || [];
    const removeProductSet = useMutation(api.products.removeProductSet);
    const toggleProductSet = useMutation(api.products.updateProductSet);

    const handleEdit = (set) => {
        setEditingSet(set);
        setShowForm(true);
    };

    const handleDelete = async (setId) => {
        if (window.confirm("Are you sure you want to delete this product bundle?")) {
            try {
                await removeProductSet({ id: setId, adminToken });
            } catch {
                alert("Failed to delete product bundle");
            }
        }
    };

    const handleToggleActive = async (set) => {
        try {
            await toggleProductSet({
                id: set._id,
                isActive: !set.isActive,
                adminToken
            });
        } catch {
            alert("Failed to update product bundle");
        }
    };

    const handleSave = () => {
        setShowForm(false);
        setEditingSet(null);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingSet(null);
    };

    if (showForm) {
        return (
            <ProductSetForm
                productSet={editingSet}
                onSave={handleSave}
                onCancel={handleCancel}
            />
        );
    }

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-brand-navy">Product Bundles</h1>
                    <p className="text-sm text-gray-500 mt-1">Create special bundles with discounted pricing</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2"
                >
                    <Plus size={18} />
                    Create Bundle
                </Button>
            </div>

            {productSets.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-3xl">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                        <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No product bundles yet</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">Create special bundles to offer discounted pricing on product combinations.</p>
                    <Button variant="primary" onClick={() => setShowForm(true)}>
                        Create Your First Bundle
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {productSets.map((set) => (
                        <div
                            key={set._id}
                            className={`bg-white rounded-2xl p-6 border transition-all ${
                                set.isActive 
                                    ? "border-gray-100 shadow-sm" 
                                    : "border-gray-200 bg-gray-50"
                            }`}
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                {/* Image */}
                                <div className="w-full md:w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                    {set.image ? (
                                        <img src={set.image} alt={set.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full grid grid-cols-2 gap-0.5 p-1">
                                            {set.products?.slice(0, 4).map((p, idx) => (
                                                <div key={idx} className="rounded bg-gray-200">
                                                    {p.productImage && (
                                                        <img src={p.productImage} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-black text-brand-navy">{set.name}</h3>
                                        {set.badge && (
                                            <span className="text-xs font-bold text-white bg-brand-orange px-2 py-0.5 rounded-full">
                                                {set.badge}
                                            </span>
                                        )}
                                        {!set.isActive && (
                                            <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <EyeOff size={10} /> Inactive
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                                        {set.description || "No description"}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3 text-sm">
                                        <span className="font-bold text-gray-400">
                                            {set.products?.length || 0} products
                                        </span>
                                        <span className="text-gray-300">|</span>
                                        <span className="font-bold text-gray-400">
                                            Original: <span className="line-through">{formatPrice(set.originalPrice)}</span>
                                        </span>
                                        <span className="text-gray-300">|</span>
                                        <span className="font-black text-brand-navy">
                                            Bundle: {formatPrice(set.specialPrice)}
                                        </span>
                                        {set.savings > 0 && (
                                            <>
                                                <span className="text-gray-300">|</span>
                                                <span className="font-bold text-green-600 flex items-center gap-1">
                                                    <Tag size={14} />
                                                    Save {formatPrice(set.savings)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-sm mt-2">
                                        <span className="font-bold text-gray-400">
                                            Cost: {formatPrice(set.costOfGoods ?? 0)}
                                        </span>
                                        <span className="text-gray-300">|</span>
                                        <span className={`font-black flex items-center gap-1 ${(set.netProfit ?? set.specialPrice) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                            <TrendingUp size={14} />
                                            Profit: {formatPrice(set.netProfit ?? set.specialPrice)}
                                            <span className="font-bold text-xs opacity-70">
                                                ({set.specialPrice > 0 ? Math.round(((set.netProfit ?? set.specialPrice) / set.specialPrice) * 100) : 0}% margin)
                                            </span>
                                        </span>
                                        {!set.hasBuyingPrices && (
                                            <span className="text-[10px] text-amber-500 font-bold italic">
                                                (buying prices not set)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Products Preview */}
                                <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                                    {set.products?.slice(0, 3).map((p, idx) => (
                                        <div key={idx} className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                                            {p.productImage && (
                                                <img src={p.productImage} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                    ))}
                                    {set.products?.length > 3 && (
                                        <span className="text-xs font-bold text-gray-400">+{set.products.length - 3}</span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleToggleActive(set)}
                                        className={`p-2 rounded-xl transition-colors ${
                                            set.isActive 
                                                ? "text-gray-400 hover:text-brand-orange hover:bg-orange-50" 
                                                : "text-green-600 hover:bg-green-50"
                                        }`}
                                        title={set.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {set.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(set)}
                                        className="p-2 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-xl transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(set._id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
