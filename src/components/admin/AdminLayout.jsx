import React, { useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    LogOut,
    Menu,
    ExternalLink,
    Layers,
    Tag
} from "lucide-react";
import logo from "../../assets/logo.png";

export default function AdminLayout() {
    const { isAdmin, logout } = useAdmin();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    if (!isAdmin) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
        { icon: Package, label: "Products", path: "/admin/products" },
        { icon: Tag, label: "Bundles", path: "/admin/product-sets" },
        { icon: Layers, label: "Collections", path: "/admin/collections" },
        { icon: ShoppingBag, label: "Orders", path: "/admin/orders" },
    ];

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
                                <span className="font-[900] text-[11px] tracking-[0.2em] uppercase leading-none mb-1">Store Admin</span>
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
                                <Icon
                                    size={20}
                                    className={`flex-shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                                />
                                {isSidebarOpen && (
                                    <span className="text-xs font-[800] uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                                        {item.label}
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
                            {menuItems.find(item => item.path === location.pathname)?.label || "Admin Panel"}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-6">
                        <div className="flex flex-col items-end mr-1 lg:mr-2 hidden sm:flex">
                            <span className="text-xs font-black text-brand-navy uppercase tracking-widest leading-none mb-1">System Admin</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Authorized Session</span>
                        </div>
                        <div className="w-10 lg:w-12 h-10 lg:h-12 rounded-xl lg:rounded-2xl bg-brand-navy shadow-lg shadow-brand-navy/20 flex items-center justify-center group cursor-pointer hover:bg-brand-orange transition-all duration-500 overflow-hidden relative">
                            <span className="text-white font-[900] text-base lg:text-lg relative z-10 transition-transform group-hover:scale-110">A</span>
                            <div className="absolute inset-0 bg-brand-orange translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-10 relative">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
