import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAdmin } from "../../context/AdminContext";
import { optimizeImage } from "../../utils/imageOptimizer";
import { X, Upload, Search, Image as ImageIcon, Check, Trash2, FolderOpen, Loader2 } from "lucide-react";

const FOLDERS = ["Products", "Collections", "Logos", "Hero", "Other"];

export default function MediaLibrary({ open, onClose, onSelect, multiple = false }) {
    const { adminToken } = useAdmin();
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadFolder, setUploadFolder] = useState("Products");
    const fileInputRef = useRef(null);

    const media = useQuery(api.media.list, selectedFolder ? { folder: selectedFolder } : {}) || [];
    const generateUploadUrl = useMutation(api.media.generateUploadUrl);
    const uploadMedia = useMutation(api.media.upload);
    const removeMedia = useMutation(api.media.remove);

    if (!open) return null;

    const filtered = media.filter((item) => {
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

    const handleDelete = async (e, item) => {
        e.stopPropagation();
        if (!confirm(`Delete "${item.name}"?`)) return;
        await removeMedia({ id: item._id, adminToken });
        setSelected((prev) => prev.filter((s) => s.storageId !== item.storageId));
    };

    const toggleSelect = (item) => {
        if (multiple) {
            setSelected((prev) =>
                prev.some((s) => s.storageId === item.storageId)
                    ? prev.filter((s) => s.storageId !== item.storageId)
                    : [...prev, item]
            );
        } else {
            setSelected([item]);
        }
    };

    const handleConfirm = () => {
        if (selected.length === 0) return;
        onSelect(multiple ? selected : selected[0]);
        setSelected([]);
        onClose();
    };

    const isSelected = (item) => selected.some((s) => s.storageId === item.storageId);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-black text-brand-navy">Media Library</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-gray-50 flex flex-wrap gap-3 items-center shrink-0">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search media..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-brand-orange/20"
                        />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                        <button
                            onClick={() => setSelectedFolder(null)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${!selectedFolder ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        >
                            All
                        </button>
                        {FOLDERS.map((f) => (
                            <button
                                key={f}
                                onClick={() => setSelectedFolder(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedFolder === f ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={uploadFolder}
                            onChange={(e) => setUploadFolder(e.target.value)}
                            className="text-xs font-bold bg-gray-50 rounded-lg px-2 py-1.5 border-none"
                        >
                            {FOLDERS.map((f) => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-orange text-white rounded-lg text-xs font-bold hover:bg-brand-orange/90 transition-colors disabled:opacity-50"
                        >
                            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            Upload
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

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <FolderOpen size={48} className="mb-4" />
                            <p className="font-bold text-sm">No media found</p>
                            <p className="text-xs mt-1">Upload files to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                            {filtered.map((item) => (
                                <div
                                    key={item._id}
                                    onClick={() => toggleSelect(item)}
                                    className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                                        isSelected(item)
                                            ? "border-brand-orange ring-2 ring-brand-orange/30"
                                            : "border-transparent hover:border-gray-200"
                                    }`}
                                >
                                    {item.type === "video" ? (
                                        <video src={item.url} className="w-full h-full object-cover" muted />
                                    ) : (
                                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                                    )}
                                    {/* Selection check */}
                                    {isSelected(item) && (
                                        <div className="absolute top-2 left-2 w-6 h-6 bg-brand-orange rounded-full flex items-center justify-center">
                                            <Check size={14} className="text-white" />
                                        </div>
                                    )}
                                    {/* Delete button */}
                                    <button
                                        onClick={(e) => handleDelete(e, item)}
                                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    {/* Name overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                                        <p className="text-white text-[10px] font-bold truncate">{item.name}</p>
                                        {item.folder && (
                                            <p className="text-white/60 text-[8px] font-bold uppercase">{item.folder}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between shrink-0">
                    <p className="text-xs text-gray-400 font-medium">
                        {selected.length > 0 ? `${selected.length} selected` : `${filtered.length} items`}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selected.length === 0}
                            className="px-4 py-2 text-sm font-bold text-white bg-brand-orange rounded-xl hover:bg-brand-orange/90 transition-colors disabled:opacity-40"
                        >
                            Select {selected.length > 0 && `(${selected.length})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
