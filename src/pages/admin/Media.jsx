import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAdmin } from "../../context/AdminContext";
import { optimizeImage } from "../../utils/imageOptimizer";
import { Upload, Trash2, Search, FolderOpen, Loader2, Image as ImageIcon, Film, Edit3, Check, X } from "lucide-react";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const FOLDERS = ["Products", "Collections", "Logos", "Hero", "Other"];

export default function AdminMedia() {
    const { adminToken } = useAdmin();
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [search, setSearch] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadFolder, setUploadFolder] = useState("Products");
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const fileInputRef = useRef(null);

    const media = useQuery(api.media.list, selectedFolder ? { folder: selectedFolder } : {});
    const generateUploadUrl = useMutation(api.media.generateUploadUrl);
    const uploadMedia = useMutation(api.media.upload);
    const removeMedia = useMutation(api.media.remove);
    const renameMedia = useMutation(api.media.rename);

    const filtered = (media || []).filter((item) => {
        if (!search) return true;
        return item.name.toLowerCase().includes(search.toLowerCase());
    });

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setUploading(true);
        try {
            for (const file of files) {
                const isVideo = file.type.startsWith("video/");
                const optimized = isVideo ? file : await optimizeImage(file);
                const postUrl = await generateUploadUrl({ adminToken });
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": optimized.type },
                    body: optimized,
                });
                const { storageId } = await result.json();
                await uploadMedia({
                    storageId,
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    type: isVideo ? "video" : "image",
                    folder: uploadFolder,
                    size: file.size,
                    adminToken,
                });
            }
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async (item) => {
        if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
        await removeMedia({ id: item._id, adminToken });
    };

    const handleRename = async (item) => {
        if (!renameValue.trim()) return;
        await renameMedia({ id: item._id, name: renameValue.trim(), adminToken });
        setRenamingId(null);
        setRenameValue("");
    };

    if (!media) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-brand-navy">Media Library</h1>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{media.length} files</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={uploadFolder}
                        onChange={(e) => setUploadFolder(e.target.value)}
                        className="text-xs font-bold bg-gray-50 rounded-lg px-3 py-2 border border-gray-200"
                    >
                        {FOLDERS.map((f) => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white rounded-xl text-sm font-bold hover:bg-brand-orange/90 transition-colors disabled:opacity-50"
                    >
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        Upload Files
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleUpload}
                        className="hidden"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search media..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl text-sm font-medium border border-gray-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
                    />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    <button
                        onClick={() => setSelectedFolder(null)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${!selectedFolder ? "bg-brand-navy text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
                    >
                        All
                    </button>
                    {FOLDERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setSelectedFolder(f)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${selectedFolder === f ? "bg-brand-navy text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
                    <FolderOpen size={48} className="mb-4" />
                    <p className="font-bold text-sm">No media found</p>
                    <p className="text-xs mt-1">Upload files to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filtered.map((item) => (
                        <div key={item._id} className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
                            <div className="relative aspect-square bg-gray-50">
                                {item.type === "video" ? (
                                    <video src={item.url} className="w-full h-full object-cover" muted />
                                ) : (
                                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute top-2 left-2">
                                    {item.type === "video" ? (
                                        <span className="bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1"><Film size={10} /> Video</span>
                                    ) : (
                                        <span className="bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1"><ImageIcon size={10} /> Image</span>
                                    )}
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setRenamingId(item._id); setRenameValue(item.name); }}
                                        className="w-7 h-7 bg-white text-gray-600 rounded-lg flex items-center justify-center shadow-md hover:text-brand-orange transition-colors"
                                    >
                                        <Edit3 size={12} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item)}
                                        className="w-7 h-7 bg-white text-gray-600 rounded-lg flex items-center justify-center shadow-md hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-2.5">
                                {renamingId === item._id ? (
                                    <div className="flex gap-1">
                                        <input
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleRename(item)}
                                            className="flex-1 text-xs font-bold px-2 py-1 rounded-lg border border-gray-200 focus:ring-1 focus:ring-brand-orange/30"
                                            autoFocus
                                        />
                                        <button onClick={() => handleRename(item)} className="text-green-500 hover:text-green-600"><Check size={14} /></button>
                                        <button onClick={() => setRenamingId(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs font-bold text-brand-navy truncate">{item.name}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{item.folder || "Uncategorized"}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
