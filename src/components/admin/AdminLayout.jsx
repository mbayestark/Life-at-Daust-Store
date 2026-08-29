import React, { useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    LogOut,
    Menu,
    ExternalLink,
    Layers,
    Tag,
    Image,
    FolderOpen,
    Users,
    ClipboardList,
    KeyRound,
    X,
    Eye,
    EyeOff
} from "lucide-react";
import logo from "../../assets/logo.png";
import Button from "../ui/Button";

function ChangePasswordModal({ adminToken, onClose }) {
    const changePassword = useMutation(api.auth.changeOwnPassword);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (newPassword !== confirmPassword) { setError("New passwords don't match."); return; }
        setLoading(true);
        try {
            await changePassword({ currentPassword, newPassword, adminToken });
            setSuccess(true);
            setTimeout(onClose, 1500);
        } catch (err) {
            setError(err.message || "Failed to change password");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-base font-bold text-brand-navy">Change Password</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>

                {success ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <KeyRound size={20} className="text-green-600" />
                        </div>
                        <p className="font-bold text-green-700">Password updated!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Current Password</label>
                            <div className="relative">
                                <input type={showCurrent ? "text" : "password"} value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)} required
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/30 outline-none pr-10" />
                                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">New Password</label>
                            <div className="relative">
                                <input type={showNew ? "text" : "password"} value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/30 outline-none pr-10" />
                                <button type="button" onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Confirm New Password</label>
                            <input type="password" value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/30 outline-none" />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                <p className="text-red-600 text-xs font-bold text-center">{error}</p>
                            </div>
                        )}

                        <Button type="submit" variant="primary" className="w-full rounded-xl" loading={loading}>
                            Update Password
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function AdminLayout() {
    const { isAdmin, logout, adminToken, adminRole, userName } = useAdmin();
    const isPartner = adminRole === "partner";
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const location = useLocation();
    const orders = useQuery(api.orders.list, adminToken ? { adminToken } : "skip");
    const pendingCount = orders?.filter(o => o.status === "Pending Verification" || o.status === "Pending Payment").length ?? 0;

    if (!isAdmin) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    const allMenuItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin", managerOnly: true },
        { icon: Package, label: "Products", path: "/admin/products", managerOnly: true },
        { icon: Tag, label: "Bundles", path: "/admin/product-sets", managerOnly: true },
        { icon: Layers, label: "Collections", path: "/admin/collections", managerOnly: true },
        { icon: ShoppingBag, label: "Orders", path: "/admin/orders", managerOnly: false },
        { icon: Image, label: "Hero", path: "/admin/hero", managerOnly: true },
        { icon: FolderOpen, label: "Media", path: "/admin/media", managerOnly: true },
        { icon: Users, label: "Users", path: "/admin/users", managerOnly: true },
        { icon: ClipboardList, label: "Audit Log", path: "/admin/audit", managerOnly: true },
    ];
    const menuItems = isPartner ? allMenuItems.filter(i => !i.managerOnly) : allMenuItems;

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside
                className={`
                    fixed lg:relative z-50 h-full
                    ${isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0 w-20"}
                    bg-brand-navy text-white transition-all duration-300 ease-in-out flex flex-col
                    shadow-xl lg:shadow-none
                `}
            >
                <div className={`h-16 lg:h-20 border-b border-white/5 flex items-center ${isSidebarOpen ? "px-6 justify-between" : "justify-center px-0"}`}>
                    <Link to="/" className="flex items-center gap-3 overflow-hidden group">
                        <img
                            src={logo}
                            alt="DAUST"
                            className={`w-auto brightness-0 invert transition-all duration-300 group-hover:scale-110 ${isSidebarOpen ? "h-8 lg:h-10" : "h-6 lg:h-7"}`}
                        />
                        {isSidebarOpen && (
                            <div className="flex flex-col whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="font-[900] text-[11px] tracking-[0.2em] uppercase leading-none mb-1">{isPartner ? "Partner Portal" : "Store Admin"}</span>
                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Life at DAUST</span>
                            </div>
                        )}
                    </Link>
                </div>

                <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    {isSidebarOpen && (
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 ml-4 animate-in fade-in duration-500">
                            Management
                        </p>
                    )}
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                                title={!isSidebarOpen ? item.label : ""}
                                className={`flex items-center rounded-2xl transition-all duration-300 group relative ${isSidebarOpen ? "px-4 py-4 gap-4" : "px-0 py-4 justify-center"
                                    } ${isActive
                                        ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/20"
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <Icon
                                        size={20}
                                        className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                                    />
                                    {item.path === "/admin/orders" && pendingCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                                            {pendingCount > 9 ? "9+" : pendingCount}
                                        </span>
                                    )}
                                </div>
                                {isSidebarOpen && (
                                    <span className="text-xs font-[800] uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300 flex-1">
                                        {item.label}
                                    </span>
                                )}
                                {isSidebarOpen && item.path === "/admin/orders" && pendingCount > 0 && (
                                    <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">
                                        {pendingCount}
                                    </span>
                                )}
                                {!isSidebarOpen && isActive && (
                                    <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-white/5 space-y-2">
                    <Link
                        to="/shop"
                        title={!isSidebarOpen ? "Public Store" : ""}
                        className={`flex items-center rounded-2xl text-white/30 hover:text-white hover:bg-white/5 transition-all group ${isSidebarOpen ? "px-4 py-4 gap-4" : "px-0 py-4 justify-center"
                            }`}
                    >
                        <ExternalLink size={18} />
                        {isSidebarOpen && (
                            <span className="text-xs font-[800] uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                                Public Store
                            </span>
                        )}
                    </Link>
                    <button
                        onClick={logout}
                        title={!isSidebarOpen ? "Exit Portal" : ""}
                        className={`w-full flex items-center rounded-2xl text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all group ${isSidebarOpen ? "px-4 py-4 gap-4" : "px-0 py-4 justify-center"
                            }`}
                    >
                        <LogOut size={18} />
                        {isSidebarOpen && (
                            <span className="text-xs font-[800] uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                                Exit Portal
                            </span>
                        )}
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden relative w-full">
                <div className="absolute inset-0 bg-brand-cream/20 pointer-events-none" />

                <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 lg:px-10 z-50">
                    <div className="flex items-center gap-3 lg:gap-6">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 lg:p-3 bg-gray-50 hover:bg-brand-navy hover:text-white text-brand-navy rounded-xl transition-all duration-300 shadow-sm"
                        >
                            <Menu size={20} />
                        </button>
                        <h1 className="text-base lg:text-xl font-[900] text-brand-navy tracking-tight">
                            {menuItems.find(item => location.pathname.startsWith(item.path) && (item.path !== "/admin" || location.pathname === "/admin"))?.label || "Admin Panel"}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-6">
                        <div className="flex flex-col items-end mr-1 lg:mr-2 hidden sm:flex">
                            <span className="text-xs font-black text-brand-navy uppercase tracking-widest leading-none mb-1">{userName || (isPartner ? "Uniwear Partner" : "System Admin")}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{isPartner ? "Partner Access" : "Manager"}</span>
                        </div>
                        {isPartner && (
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 border border-red-200 font-bold text-xs uppercase tracking-widest transition-all"
                            >
                                <LogOut size={14} />
                                <span className="hidden sm:inline">Sign Out</span>
                            </button>
                        )}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="w-10 lg:w-12 h-10 lg:h-12 rounded-xl lg:rounded-2xl bg-brand-navy shadow-lg shadow-brand-navy/20 flex items-center justify-center group cursor-pointer hover:bg-brand-orange transition-all duration-500 overflow-hidden relative"
                            >
                                <span className="text-white font-[900] text-base lg:text-lg relative z-10 transition-transform group-hover:scale-110">{(userName || "A")[0].toUpperCase()}</span>
                                <div className="absolute inset-0 bg-brand-orange translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            </button>
                            {showUserMenu && (
                                <>
                                    <div className="fixed inset-0 z-[60]" onClick={() => setShowUserMenu(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[70]">
                                        <button
                                            onClick={() => { setShowUserMenu(false); setShowPasswordModal(true); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <KeyRound size={14} />
                                            Change Password
                                        </button>
                                        <button
                                            onClick={() => { setShowUserMenu(false); logout(); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut size={14} />
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-10 relative">
                    <Outlet />
                </div>
            </main>

            {showPasswordModal && (
                <ChangePasswordModal adminToken={adminToken} onClose={() => setShowPasswordModal(false)} />
            )}
        </div>
    );
}
