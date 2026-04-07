import React, { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Upload, Image as ImageIcon, FolderOpen } from "lucide-react";
import Button from "../../components/ui/Button";
import { optimizeImage, createPreviewUrl, revokePreviewUrl } from "../../utils/imageOptimizer";
import { useAdmin } from "../../context/AdminContext";
import MediaLibrary from "../../components/admin/MediaLibrary";

export default function CollectionForm({ collection, onClose, onSave }) {
    const { adminToken } = useAdmin();
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        image: "",
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
    const imageInputRef = useRef(null);

    const addCollection = useMutation(api.collections.addCollection);
    const updateCollection = useMutation(api.collections.updateCollection);
    const generateUploadUrl = useMutation(api.collections.generateUploadUrl);

    useEffect(() => {
        if (collection) {
            setFormData({
                name: collection.name || "",
                slug: collection.slug || "",
                description: collection.description || "",
                image: collection.image || "",
            });
            setImagePreview(collection.image || "");
        }
    }, [collection]);

    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith("blob:")) {
                revokePreviewUrl(imagePreview);
            }
        };
    }, [imagePreview]);

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData({
            ...formData,
            name,
            slug: generateSlug(name),
        });
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!formData.name.trim()) {
                setError("Collection name is required");
                setLoading(false);
                return;
            }

            let finalImageUrl = formData.image;
            if (imageFile) {
                const optimizedFile = await optimizeImage(imageFile);
                const storageId = await handleUpload(optimizedFile);
                finalImageUrl = storageId;
            }

            const payload = {
                ...formData,
                image: finalImageUrl,
            };

            if (collection) {
                await updateCollection({
                    id: collection._id,
                    ...payload,
                    adminToken,
                });
            } else {
                await addCollection({ ...payload, adminToken });
            }

            onSave();
        } catch {
            setError("An error occurred while saving the collection. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-brand-navy mb-2">
                            {collection ? "Edit Collection" : "Add Collection"}
                        </h1>
                        <p className="text-gray-600">
                            {collection ? "Update collection details" : "Create a new product collection"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Collection Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={handleNameChange}
                                placeholder="e.g., Life At Daust"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                                required
                            />
                        </div>

                        {/* Slug (auto-generated) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Slug (auto-generated)
                            </label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="life-at-daust"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                URL-friendly identifier for this collection
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of this collection..."
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all resize-none"
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Collection Image
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-100 border-dashed rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <div className="space-y-1 text-center">
                                    {imagePreview ? (
                                        <div className="relative inline-block">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="h-32 w-auto object-cover rounded-xl shadow-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview("");
                                                    setFormData({ ...formData, image: "" });
                                                }}
                                                className="absolute -top-2 -right-2 p-1 bg-white rounded-full border border-gray-200 shadow-sm hover:text-red-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="mx-auto h-12 w-12 text-gray-400 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                <ImageIcon size={24} />
                                            </div>
                                            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                                                PNG, JPG, GIF up to 10MB
                                            </p>
                                            <div className="flex flex-col gap-2 w-full max-w-[240px] mx-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => imageInputRef.current?.click()}
                                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-navy text-white font-bold text-xs rounded-xl hover:bg-brand-navy/90 transition-colors"
                                                >
                                                    <Upload size={14} /> Upload from Computer
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaLibraryOpen(true)}
                                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-brand-navy font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                                                >
                                                    <FolderOpen size={14} /> Choose from Media Library
                                                </button>
                                            </div>
                                            <input
                                                ref={imageInputRef}
                                                type="file"
                                                className="hidden"
                                                onChange={handleImageChange}
                                                accept="image/*"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : collection ? "Update Collection" : "Create Collection"}
                        </Button>
                    </div>
                </form>
                <MediaLibrary
                    open={mediaLibraryOpen}
                    onClose={() => setMediaLibraryOpen(false)}
                    onSelect={handleMediaSelect}
                />
            </div>
        </div>
    );
}
