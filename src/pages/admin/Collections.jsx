import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Package,
} from "lucide-react";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import CollectionForm from "./CollectionForm";
import { useAdmin } from "../../context/AdminContext";

export default function AdminCollections() {
    const { adminToken } = useAdmin();
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingCollection, setEditingCollection] = useState(null);

    const collections = useQuery(api.collections.list);
    const removeCollection = useMutation(api.collections.removeCollection);

    const handleEdit = (collection) => {
        setEditingCollection(collection);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this collection? Products will be unassigned from this collection.")) {
            try {
                await removeCollection({ id, adminToken });
            } catch (error) {
                alert("Failed to delete collection. Please try again.");
            }
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingCollection(null);
    };

    const filteredCollections = collections?.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (collections === undefined) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    if (showForm) {
        return (
            <CollectionForm
                collection={editingCollection}
                onClose={handleFormClose}
                onSave={handleFormClose}
            />
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-brand-navy mb-2">Collections</h1>
                        <p className="text-gray-600">Manage product collections and groupings</p>
                    </div>
                    <Button onClick={() => setShowForm(true)} className="gap-2">
                        <Plus size={20} />
                        Add Collection
                    </Button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search collections..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                        />
                    </div>
                </div>

                {/* Collections Grid */}
                {filteredCollections && filteredCollections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCollections.map((collection) => (
                            <div
                                key={collection._id}
                                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                                        {collection.image ? (
                                            <img
                                                src={collection.image}
                                                alt={collection.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <Package className="text-brand-orange" size={28} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-brand-navy text-xl leading-tight">
                                            {collection.name}
                                        </h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">/{collection.slug}</p>
                                    </div>
                                </div>

                                {collection.description && (
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {collection.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleEdit(collection)}
                                        className="p-2 text-gray-400 hover:text-brand-navy hover:bg-gray-100 rounded-lg transition-all"
                                        title="Edit Collection"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(collection._id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Delete Collection"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchQuery ? "No collections found" : "No collections yet"}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery
                                ? "Try adjusting your search query"
                                : "Get started by creating your first collection"}
                        </p>
                        {!searchQuery && (
                            <Button onClick={() => setShowForm(true)} className="gap-2">
                                <Plus size={20} />
                                Add Collection
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
