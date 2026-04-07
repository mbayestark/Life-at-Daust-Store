import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Upload, Trash2, ChevronUp, ChevronDown, Image as ImageIcon, Film, Loader2, Play } from "lucide-react";
import { optimizeImage } from "../../utils/imageOptimizer";
import { useAdmin } from "../../context/AdminContext";

export default function HeroSettings() {
    const { adminToken } = useAdmin();
    const media = useQuery(api.settings.getHeroMediaAdmin, adminToken ? { adminToken } : "skip") || [];
    const reels = useQuery(api.settings.getReelVideosAdmin, adminToken ? { adminToken } : "skip") || [];
    const updateHeroMedia = useMutation(api.settings.updateHeroMedia);
    const updateReelVideos = useMutation(api.settings.updateReelVideos);
    const generateUploadUrl = useMutation(api.products.generateUploadUrl);

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [reelUploading, setReelUploading] = useState(false);
    const [reelSaving, setReelSaving] = useState(false);

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setUploading(true);
        setError("");
        try {
            const newItems = [];
            for (const file of files) {
                const isVideo = file.type.startsWith("video/");
                const postUrl = await generateUploadUrl({ adminToken });
                let body = file;
                let contentType = file.type;
                if (!isVideo) {
                    const optimized = await optimizeImage(file);
                    body = optimized;
                    contentType = optimized.type;
                }
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": contentType },
                    body,
                });
                const { storageId } = await result.json();
                newItems.push({ storageId, type: isVideo ? "video" : "image" });
            }
            const current = media.map(i => ({ storageId: i.storageId, type: i.type }));
            await updateHeroMedia({ heroMedia: [...current, ...newItems], adminToken });
            setSuccess(`${newItems.length} file${newItems.length > 1 ? "s" : ""} uploaded.`);
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err?.message || "Upload failed.");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleDelete = async (storageId) => {
        const updated = media.filter(i => i.storageId !== storageId).map(i => ({ storageId: i.storageId, type: i.type }));
        setSaving(true);
        try {
            await updateHeroMedia({ heroMedia: updated, adminToken });
        } catch (err) {
            setError(err?.message || "Delete failed.");
        } finally {
            setSaving(false);
        }
    };

    const handleReelUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setReelUploading(true);
        setError("");
        try {
            const newIds = [];
            for (const file of files) {
                const postUrl = await generateUploadUrl({ adminToken });
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                });
                const { storageId } = await result.json();
                newIds.push(storageId);
            }
            const current = reels.map(r => r.storageId);
            await updateReelVideos({ reelVideos: [...current, ...newIds], adminToken });
            setSuccess(`${newIds.length} reel${newIds.length > 1 ? "s" : ""} uploaded.`);
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err?.message || "Reel upload failed.");
        } finally {
            setReelUploading(false);
            e.target.value = "";
        }
    };

    const handleReelDelete = async (storageId) => {
        const updated = reels.filter(r => r.storageId !== storageId).map(r => r.storageId);
        setReelSaving(true);
        try {
            await updateReelVideos({ reelVideos: updated, adminToken });
        } catch (err) {
            setError(err?.message || "Delete failed.");
        } finally {
            setReelSaving(false);
        }
    };

    const handleReelMove = async (index, dir) => {
        const ids = reels.map(r => r.storageId);
        const newIndex = index + dir;
        if (newIndex < 0 || newIndex >= ids.length) return;
        [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
        setReelSaving(true);
        try {
            await updateReelVideos({ reelVideos: ids, adminToken });
        } catch (err) {
            setError(err?.message || "Reorder failed.");
        } finally {
            setReelSaving(false);
        }
    };

    const handleMove = async (index, dir) => {
        const items = media.map(i => ({ storageId: i.storageId, type: i.type }));
        const newIndex = index + dir;
        if (newIndex < 0 || newIndex >= items.length) return;
        [items[index], items[newIndex]] = [items[newIndex], items[index]];
        setSaving(true);
        try {
            await updateHeroMedia({ heroMedia: items, adminToken });
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
                    <p className="text-gray-400 font-medium mt-1">Images and videos displayed on the homepage hero section.</p>
                </div>
                <label className={`cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl font-bold text-sm hover:bg-brand-orange transition-all duration-300 shadow-lg ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    {uploading ? "Uploading…" : "Upload Media"}
                    <input
                        type="file"
                        accept="image/*,video/*"
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

            {/* Media grid */}
            {media.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <div className="inline-flex p-6 bg-gray-50 rounded-2xl mb-4">
                        <ImageIcon size={36} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs mb-2">No hero media yet</p>
                    <p className="text-gray-300 text-sm">Upload images or videos to display on the homepage.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {media.map((item, index) => (
                        <div key={item.storageId} className="bg-white rounded-[2rem] border border-gray-100 shadow-lg overflow-hidden group">
                            {/* Preview */}
                            <div className="relative aspect-video overflow-hidden bg-gray-100">
                                {item.type === "video" ? (
                                    <video
                                        src={item.url}
                                        muted
                                        loop
                                        playsInline
                                        className="w-full h-full object-cover"
                                        onMouseEnter={e => e.target.play()}
                                        onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                                    />
                                ) : (
                                    <img
                                        src={item.url}
                                        alt={`Hero slide ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                )}
                                {/* Badges */}
                                <div className="absolute top-3 left-3 flex items-center gap-2">
                                    <div className="bg-brand-navy/80 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                                        {index === 0 ? "Active" : `#${index + 1}`}
                                    </div>
                                    <div className={`backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${item.type === "video" ? "bg-brand-orange/80" : "bg-blue-500/80"}`}>
                                        {item.type === "video" ? <Film size={10} /> : <ImageIcon size={10} />}
                                        {item.type === "video" ? "Video" : "Image"}
                                    </div>
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
                                        disabled={index === media.length - 1 || saving}
                                        className="p-2 rounded-xl hover:bg-gray-100 disabled:opacity-30 transition-colors"
                                        title="Move down"
                                    >
                                        <ChevronDown size={16} className="text-brand-navy" />
                                    </button>
                                    <span className="text-xs text-gray-400 font-bold ml-1">
                                        Slide {index + 1} of {media.length}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(item.storageId)}
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
                    <li>The first slide is shown on the homepage. Use arrows to reorder.</li>
                    <li>Multiple slides auto-cycle every 5 seconds.</li>
                    <li>Videos play automatically, muted, on loop. Hover to preview in admin.</li>
                    <li>Recommended image size: 1920×1080px or wider.</li>
                </ul>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-gray-100 pt-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-[900] text-brand-navy tracking-tight flex items-center gap-3">
                            <Play size={20} className="text-brand-orange" />
                            Campus Reels
                        </h2>
                        <p className="text-gray-400 font-medium mt-1">Portrait (9:16) videos shown in the homepage reel section.</p>
                    </div>
                    <label className={`cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-2xl font-bold text-sm hover:bg-brand-navy transition-all duration-300 shadow-lg ${reelUploading ? "opacity-60 pointer-events-none" : ""}`}>
                        {reelUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                        {reelUploading ? "Uploading…" : "Upload Reels"}
                        <input
                            type="file"
                            accept="video/*"
                            multiple
                            className="hidden"
                            onChange={handleReelUpload}
                            disabled={reelUploading}
                        />
                    </label>
                </div>

                {reels.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                        <div className="inline-flex p-5 bg-gray-50 rounded-2xl mb-3">
                            <Film size={32} className="text-gray-300" />
                        </div>
                        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs mb-1">No reels yet</p>
                        <p className="text-gray-300 text-sm">Upload vertical (9:16) videos to display on the homepage.</p>
                    </div>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {reels.map((reel, index) => (
                            <div key={reel.storageId} className="flex-shrink-0 w-40 bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden group">
                                <div className="relative aspect-[9/16] bg-gray-100 overflow-hidden">
                                    <video
                                        src={reel.url}
                                        muted
                                        loop
                                        playsInline
                                        className="w-full h-full object-cover"
                                        onMouseEnter={e => e.target.play()}
                                        onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                                    />
                                    <div className="absolute top-2 left-2 bg-brand-navy/80 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                                        #{index + 1}
                                    </div>
                                </div>
                                <div className="p-2 flex items-center justify-between">
                                    <div className="flex items-center gap-0.5">
                                        <button onClick={() => handleReelMove(index, -1)} disabled={index === 0 || reelSaving} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                            <ChevronUp size={13} className="text-brand-navy" />
                                        </button>
                                        <button onClick={() => handleReelMove(index, 1)} disabled={index === reels.length - 1 || reelSaving} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                                            <ChevronDown size={13} className="text-brand-navy" />
                                        </button>
                                    </div>
                                    <button onClick={() => handleReelDelete(reel.storageId)} disabled={reelSaving} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
