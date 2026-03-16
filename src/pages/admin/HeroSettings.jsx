import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Upload, Trash2, ChevronUp, ChevronDown, Image as ImageIcon, Save, Loader2 } from "lucide-react";
import Button from "../../components/ui/Button";
import { optimizeImage } from "../../utils/imageOptimizer";
import { useAdmin } from "../../context/AdminContext";

export default function HeroSettings() {
    const { adminToken } = useAdmin();
    const images = useQuery(api.settings.getHeroImagesAdmin, adminToken ? { adminToken } : "skip") || [];
    const updateHeroImages = useMutation(api.settings.updateHeroImages);
    const generateUploadUrl = useMutation(api.products.generateUploadUrl);

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setUploading(true);
        setError("");
        try {
            const newIds = [];
            for (const file of files) {
                const optimized = await optimizeImage(file);
                const postUrl = await generateUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": optimized.type },
                    body: optimized,
                });
                const { storageId } = await result.json();
                newIds.push(storageId);
            }
            const currentIds = images.map(i => i.storageId);
            await updateHeroImages({ heroImages: [...currentIds, ...newIds], adminToken });
            setSuccess(`${newIds.length} image${newIds.length > 1 ? "s" : ""} uploaded.`);
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err?.message || "Upload failed.");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleDelete = async (storageId) => {
        const updated = images.map(i => i.storageId).filter(id => id !== storageId);
        setSaving(true);
        try {
            await updateHeroImages({ heroImages: updated, adminToken });
        } catch (err) {
            setError(err?.message || "Delete failed.");
        } finally {
            setSaving(false);
        }
    };

    const handleMove = async (index, dir) => {
        const ids = images.map(i => i.storageId);
        const newIndex = index + dir;
        if (newIndex < 0 || newIndex >= ids.length) return;
        const reordered = [...ids];
        [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
        setSaving(true);
        try {
            await updateHeroImages({ heroImages: reordered, adminToken });
        } catch (err) {
            setError(err?.message || "Reorder failed.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-[900] text-brand-navy tracking-tight">Hero Wallpapers</h1>
                    <p className="text-gray-400 font-medium mt-1">Manage the images displayed on the homepage hero section.</p>
                </div>
                <label className={`cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm hover:bg-brand-orange transition-all duration-300 shadow-lg ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    {uploading ? "Uploading…" : "Upload Images"}
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </label>
            </div>

            {/* Feedback */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-bold text-sm">{error}</div>
            )}
            {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 font-bold text-sm">{success}</div>
            )}

            {/* Images grid */}
            {images.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <div className="inline-flex p-6 bg-gray-50 rounded-2xl mb-4">
                        <ImageIcon size={36} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs mb-2">No hero images yet</p>
                    <p className="text-gray-300 text-sm">Upload images to display on the homepage hero section.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((img, index) => (
                        <div key={img.storageId} className="bg-white rounded-[2rem] border border-gray-100 shadow-lg overflow-hidden group">
                            {/* Preview */}
                            <div className="relative aspect-video overflow-hidden bg-gray-100">
                                <img
                                    src={img.url}
                                    alt={`Hero wallpaper ${index + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                {/* Order badge */}
                                <div className="absolute top-3 left-3 bg-brand-navy/80 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                                    {index === 0 ? "Active" : `#${index + 1}`}
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="p-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleMove(index, -1)}
                                        disabled={index === 0 || saving}
                                        className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-30 transition-colors"
                                        title="Move up"
                                    >
                                        <ChevronUp size={16} className="text-brand-navy" />
                                    </button>
                                    <button
                                        onClick={() => handleMove(index, 1)}
                                        disabled={index === images.length - 1 || saving}
                                        className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-30 transition-colors"
                                        title="Move down"
                                    >
                                        <ChevronDown size={16} className="text-brand-navy" />
                                    </button>
                                    <span className="text-xs text-gray-400 font-bold ml-1">
                                        Slide {index + 1} of {images.length}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(img.storageId)}
                                    disabled={saving}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-30"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info */}
            <div className="bg-brand-navy/5 rounded-2xl p-6 text-sm text-brand-navy/60 font-medium">
                <p className="font-bold text-brand-navy mb-1">How it works</p>
                <ul className="space-y-1 list-disc list-inside">
                    <li>The first image is the active hero wallpaper shown on the homepage.</li>
                    <li>If multiple images are uploaded, they auto-cycle every 5 seconds.</li>
                    <li>Use the arrows to reorder images. Recommended size: 1920×1080px or wider.</li>
                </ul>
            </div>
        </div>
    );
}
