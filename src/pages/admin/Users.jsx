import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAdmin } from "../../context/AdminContext";
import { Users as UsersIcon, Plus, Edit2, Trash2, Shield, ShieldOff, X, Eye, EyeOff } from "lucide-react";
import Button from "../../components/ui/Button";

const ALL_PERMISSIONS = [
    { key: "dashboard", label: "Dashboard" },
    { key: "products", label: "Products" },
    { key: "product_sets", label: "Product Sets" },
    { key: "collections", label: "Collections" },
    { key: "orders", label: "Orders" },
    { key: "media", label: "Media" },
    { key: "hero", label: "Hero Settings" },
    { key: "delete", label: "Delete / Destructive" },
    { key: "users", label: "User Management" },
];

function PermissionBadge({ perm }) {
    const info = ALL_PERMISSIONS.find((p) => p.key === perm);
    return (
        <span className="inline-block bg-brand-orange/10 text-brand-orange text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
            {info?.label || perm}
        </span>
    );
}

function UserFormModal({ user, onClose, adminToken }) {
    const createUser = useMutation(api.auth.createAdminUser);
    const updateUser = useMutation(api.auth.updateAdminUser);
    const isEdit = !!user;

    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [selectedPerms, setSelectedPerms] = useState(user?.permissions || []);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const togglePerm = (key) => {
        setSelectedPerms((prev) =>
            prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
        );
    };

    const selectAll = () => setSelectedPerms(ALL_PERMISSIONS.map((p) => p.key));
    const selectNone = () => setSelectedPerms([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isEdit) {
                const args = { id: user._id, adminToken, permissions: selectedPerms };
                if (name !== user.name) args.name = name;
                if (password) args.newPassword = password;
                await updateUser(args);
            } else {
                if (!password) { setError("Password is required."); setLoading(false); return; }
                await createUser({ email: email.trim().toLowerCase(), name: name.trim(), password, permissions: selectedPerms, adminToken });
            }
            onClose(true);
        } catch (err) {
            setError(err.message || "Operation failed");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#0F1B2E] border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <h2 className="text-lg font-bold text-white">{isEdit ? "Edit User" : "Create User"}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} required
                            className="w-full bg-brand-navy border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-brand-orange/50 outline-none"
                            placeholder="Full name" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isEdit}
                            type="email" placeholder="user@mydaust.org"
                            className="w-full bg-brand-navy border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-brand-orange/50 outline-none disabled:opacity-50" />
                        {!isEdit && <p className="text-[10px] text-gray-600 mt-1">Only @mydaust.org emails allowed</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                            {isEdit ? "New Password (leave blank to keep)" : "Password"}
                        </label>
                        <div className="relative">
                            <input value={password} onChange={(e) => setPassword(e.target.value)}
                                type={showPassword ? "text" : "password"} placeholder="Min 8 characters"
                                required={!isEdit} minLength={isEdit && !password ? undefined : 8}
                                className="w-full bg-brand-navy border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-brand-orange/50 outline-none pr-12" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Permissions</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={selectAll} className="text-[10px] text-brand-orange hover:underline">All</button>
                                <button type="button" onClick={selectNone} className="text-[10px] text-gray-500 hover:underline">None</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {ALL_PERMISSIONS.map(({ key, label }) => (
                                <label key={key} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                                    selectedPerms.includes(key)
                                        ? "border-brand-orange/40 bg-brand-orange/5"
                                        : "border-gray-800 hover:border-gray-700"
                                }`}>
                                    <input type="checkbox" checked={selectedPerms.includes(key)} onChange={() => togglePerm(key)}
                                        className="accent-brand-orange" />
                                    <span className="text-xs text-gray-300">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                            <p className="text-red-400 text-xs font-bold text-center">{error}</p>
                        </div>
                    )}

                    <Button type="submit" variant="primary" className="w-full rounded-xl" loading={loading}>
                        {isEdit ? "Update User" : "Create User"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function AdminUsers() {
    const { adminToken } = useAdmin();
    const users = useQuery(api.auth.listAdminUsers, adminToken ? { adminToken } : "skip");
    const updateUser = useMutation(api.auth.updateAdminUser);
    const deleteUser = useMutation(api.auth.deleteAdminUser);

    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const handleToggleActive = async (user) => {
        await updateUser({ id: user._id, isActive: !user.isActive, adminToken });
    };

    const handleDelete = async (user) => {
        if (!confirm(`Delete ${user.name} (${user.email})? This cannot be undone.`)) return;
        await deleteUser({ id: user._id, adminToken });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <UsersIcon className="text-brand-orange" size={24} />
                    <h1 className="text-2xl font-bold text-white">Admin Users</h1>
                </div>
                <Button variant="primary" className="rounded-xl" onClick={() => { setEditingUser(null); setShowForm(true); }}>
                    <Plus size={16} className="mr-2" /> New User
                </Button>
            </div>

            {!users ? (
                <div className="text-gray-500 text-center py-12">Loading users...</div>
            ) : users.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <UsersIcon size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">No admin users yet</p>
                    <p className="text-sm mt-1">Create the first user to get started</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {users.map((user) => (
                        <div key={user._id} className={`bg-[#0F1B2E] border border-gray-800 rounded-xl p-5 transition-all ${!user.isActive ? "opacity-50" : ""}`}>
                            <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-white font-bold truncate">{user.name}</h3>
                                        {!user.isActive && (
                                            <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase">Inactive</span>
                                        )}
                                    </div>
                                    <p className="text-gray-500 text-sm">{user.email}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {user.permissions.map((p) => <PermissionBadge key={p} perm={p} />)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 ml-4 shrink-0">
                                    <button onClick={() => { setEditingUser(user); setShowForm(true); }}
                                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleToggleActive(user)}
                                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                        title={user.isActive ? "Deactivate" : "Activate"}>
                                        {user.isActive ? <ShieldOff size={16} /> : <Shield size={16} />}
                                    </button>
                                    <button onClick={() => handleDelete(user)}
                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <UserFormModal
                    user={editingUser}
                    adminToken={adminToken}
                    onClose={() => { setShowForm(false); setEditingUser(null); }}
                />
            )}
        </div>
    );
}
