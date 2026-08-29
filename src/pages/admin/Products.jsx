import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    Edit2,
    Trash2,
    Plus,
    Search,
    ExternalLink,
    Copy,
    Filter,
    Package,
    AlertCircle,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { formatPrice } from "../../utils/format.js";
import { useAdmin } from "../../context/AdminContext";

import AdminProductForm from "./ProductForm";

export default function AdminProducts() {
    const { adminToken, adminRole } = useAdmin();
    const products = useQuery(api.products.list);
    const removeProduct = useMutation(api.products.removeProduct);
    const toggleActive = useMutation(api.products.toggleActive);
    const bulkToggleActive = useMutation(api.products.bulkToggleActive);
    const bulkDeleteProducts = useMutation(api.products.bulkDeleteProducts);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    const isLoading = products === undefined;

    const filteredProducts = products?.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "All" || p.category === filterCategory;
        return matchesSearch && matchesCategory;
    }) || [];

    const categories = ["All", ...new Set(products?.map(p => p.category) || [])];

    const handleToggleActive = async (id, currentActive) => {
        try {
            await toggleActive({ id, isActive: !currentActive, adminToken });
        } catch {
            alert("Failed to toggle product status.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
            try {
                await removeProduct({ id, adminToken });
            } catch {
                alert("Failed to delete product. Please try again.");
            }
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setIsFormOpen(true);
    };

    const handleFormSave = () => {
        setIsFormOpen(false);
        setEditingProduct(null);
    };

    const handleDuplicate = (product) => {
        const { _id, _creationTime, ...rest } = product;
        setEditingProduct({ ...rest, name: `${product.name} (Copy)` });
        setIsFormOpen(true);
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Catalog...</p>
            </div>
        );
    }

    if (isFormOpen) {
        return (
            <AdminProductForm
                product={editingProduct}
                onSave={handleFormSave}
                onCancel={() => setIsFormOpen(false)}
            />
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1 w-full md:max-w-md relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative inline-block">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="appearance-none bg-white border border-gray-100 rounded-2xl px-5 py-3 pr-10 text-xs font-bold font-black uppercase tracking-widest text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-orange/20 shadow-sm cursor-pointer"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                    </div>

                    <Button variant="primary" onClick={handleAdd} className="rounded-2xl h-12 px-6 flex-shrink-0">
                        <Plus size={18} className="mr-2" />
                        Add Product
                    </Button>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 p-4 bg-brand-navy/5 rounded-2xl border border-brand-navy/10 animate-in fade-in duration-200">
                    <span className="text-xs font-black text-brand-navy">{selectedIds.size} selected</span>
                    <button
                        onClick={async () => {
                            setIsBulkUpdating(true);
                            try { await bulkToggleActive({ ids: [...selectedIds], isActive: true, adminToken }); setSelectedIds(new Set()); } catch { alert("Failed"); }
                            finally { setIsBulkUpdating(false); }
                        }}
                        disabled={isBulkUpdating}
                        className="px-3 py-1.5 bg-green-50 text-green-600 text-xs font-black rounded-xl hover:bg-green-600 hover:text-white transition-all disabled:opacity-40"
                    >
                        Activate All
                    </button>
                    <button
                        onClick={async () => {
                            setIsBulkUpdating(true);
                            try { await bulkToggleActive({ ids: [...selectedIds], isActive: false, adminToken }); setSelectedIds(new Set()); } catch { alert("Failed"); }
                            finally { setIsBulkUpdating(false); }
                        }}
                        disabled={isBulkUpdating}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-black rounded-xl hover:bg-gray-600 hover:text-white transition-all disabled:opacity-40"
                    >
                        Deactivate All
                    </button>
                    {adminRole !== "partner" && (
                        <button
                            onClick={async () => {
                                if (!window.confirm(`Delete ${selectedIds.size} products? This cannot be undone.`)) return;
                                setIsBulkUpdating(true);
                                try { await bulkDeleteProducts({ ids: [...selectedIds], adminToken }); setSelectedIds(new Set()); } catch { alert("Failed"); }
                                finally { setIsBulkUpdating(false); }
                            }}
                            disabled={isBulkUpdating}
                            className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-black rounded-xl hover:bg-red-600 hover:text-white transition-all disabled:opacity-40"
                        >
                            Delete All
                        </button>
                    )}
                    <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-400 hover:text-red-500 font-bold transition-colors ml-auto">
                        Clear
                    </button>
                </div>
            )}

            {/* Product List */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50/50">
                                <th className="pl-6 py-5 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                                        onChange={() => {
                                            if (selectedIds.size === filteredProducts.length) setSelectedIds(new Set());
                                            else setSelectedIds(new Set(filteredProducts.map(p => p._id)));
                                        }}
                                        className="w-3.5 h-3.5 rounded accent-brand-orange cursor-pointer"
                                    />
                                </th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Product</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 md:table-cell hidden">Category</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Price</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Stock</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Active</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 lg:table-cell hidden">Rating</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts.map((p) => {
                                const isActive = p.isActive !== false;
                                const isOnSale = p.salePrice != null && p.salePrice < p.price;
                                return (
                                <tr key={p._id} className={`hover:bg-gray-50/30 transition-colors group ${!isActive ? 'opacity-50' : ''}`}>
                                    <td className="pl-6 py-6 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(p._id)}
                                            onChange={() => {
                                                setSelectedIds(prev => {
                                                    const next = new Set(prev);
                                                    next.has(p._id) ? next.delete(p._id) : next.add(p._id);
                                                    return next;
                                                });
                                            }}
                                            className="w-3.5 h-3.5 rounded accent-brand-orange cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-black text-brand-navy text-sm group-hover:text-brand-orange transition-colors">{p.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {p._id.substring(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 md:table-cell hidden">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                            {p.category}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-0.5">
                                            <p className={`font-black text-sm ${isOnSale ? 'text-red-500' : 'text-brand-navy'}`}>
                                                {formatPrice(isOnSale ? p.salePrice : p.price)}
                                            </p>
                                            {isOnSale && (
                                                <p className="text-[10px] text-gray-400 line-through">{formatPrice(p.price)}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-xs font-bold ${p.stock === 0 ? "text-red-500" : p.stock <= 5 ? "text-orange-500" : "text-green-500"}`}>
                                                {p.stock === 0 ? "Sold Out" : `${p.stock} units`}
                                            </span>
                                            {p.stock <= 5 && p.stock > 0 && (
                                                <span className="text-[8px] font-black uppercase tracking-widest text-orange-400">Low Stock</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <button
                                            onClick={() => handleToggleActive(p._id, isActive)}
                                            className="transition-colors"
                                            title={isActive ? "Click to deactivate" : "Click to activate"}
                                        >
                                            {isActive ? (
                                                <ToggleRight size={28} className="text-green-500" />
                                            ) : (
                                                <ToggleLeft size={28} className="text-gray-300" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-8 py-6 lg:table-cell hidden">
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-bold text-gray-700">{p.rating}</span>
                                            <span className="text-yellow-400 text-xs">★</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(p)}
                                                className="p-2 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-all"
                                                title="Edit Product"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDuplicate(p)}
                                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Duplicate Product"
                                            >
                                                <Copy size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p._id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Product"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <Link to={`/product/${p._id}`} target="_blank" className="p-2 text-gray-400 hover:text-brand-navy hover:bg-gray-100 rounded-lg transition-all" title="View in Store">
                                                <ExternalLink size={18} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}


                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                                                <Package className="h-8 w-8 text-gray-200" />
                                            </div>
                                            <h3 className="font-black text-brand-navy text-lg mb-2">No Products Found</h3>
                                            <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8 font-medium">Try adjusting your search criteria or add a new product to the catalog.</p>
                                            <Button variant="secondary" onClick={() => { setSearchTerm(""); setFilterCategory("All"); }}>
                                                Clear Filters
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
