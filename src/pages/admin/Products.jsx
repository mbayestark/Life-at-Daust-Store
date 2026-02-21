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
    MoreVertical,
    Filter,
    Package,
    AlertCircle
} from "lucide-react";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { formatPrice } from "../../utils/format.js";

import AdminProductForm from "./ProductForm";

export default function AdminProducts() {
    const products = useQuery(api.products.list);
    const removeProduct = useMutation(api.products.removeProduct);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const isLoading = products === undefined;

    const filteredProducts = products?.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "All" || p.category === filterCategory;
        return matchesSearch && matchesCategory;
    }) || [];

    const categories = ["All", ...new Set(products?.map(p => p.category) || [])];

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
            try {
                await removeProduct({ id });
            } catch (err) {
                console.error("Failed to delete product", err);
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

            {/* Product List */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-50/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Product</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 md:table-cell hidden">Category</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Price</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Stock</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 lg:table-cell hidden">Rating</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts.map((p) => (
                                <tr key={p._id} className="hover:bg-gray-50/30 transition-colors group">
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
                                        <p className="font-black text-brand-navy text-sm">{formatPrice(p.price)}</p>
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
                            ))}


                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-8 py-32 text-center">
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
