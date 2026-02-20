import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    TrendingUp,
    ShoppingBag,
    Package,
    Clock,
    CheckCircle2,
    DollarSign,
    Users,
    Layers
} from "lucide-react";
import { formatPrice } from "../../utils/format.js";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

export default function AdminDashboard() {
    const products = useQuery(api.products.list);
    const orders = useQuery(api.orders.list);

    const isLoading = products === undefined || orders === undefined;

    const stats = useMemo(() => {
        if (!products || !orders) return [];

        const totalRevenue = orders.reduce((sum, order) => sum + (order?.total || 0), 0);
        const activeOrders = orders.filter(o => o.status === "Processing" || o.status === "Shipped").length;
        const totalProducts = products.length;
        const completedOrders = orders.filter(o => o.status === "Delivered").length;

        return [
            { label: "Total Revenue", value: formatPrice(totalRevenue), icon: DollarSign, color: "bg-green-50 text-green-600" },
            { label: "Active Orders", value: activeOrders.toString(), icon: ShoppingBag, color: "bg-brand-orange/10 text-brand-orange" },
            { label: "Catalog Size", value: totalProducts.toString(), icon: Package, color: "bg-blue-50 text-blue-600" },
            { label: "Fulfillment Rate", value: orders.length > 0 ? `${Math.round((completedOrders / orders.length) * 100)}%` : "0%", icon: CheckCircle2, color: "bg-purple-50 text-purple-600" },
        ];
    }, [products, orders]);

    const recentOrders = useMemo(() => {
        return orders?.slice(0, 5) || [];
    }, [orders]);

    const topCategories = useMemo(() => {
        if (!products) return [];
        const counts = {};
        products.forEach(p => {
            const cat = p.category || "Uncategorized";
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
    }, [products]);

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Analytics Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-[900] text-brand-navy tracking-tight mb-2">Workspace Overview</h1>
                    <p className="text-gray-400 font-medium italic text-lg">&ldquo;Excellence is not an act, but a habit.&rdquo;</p>
                </div>
                <div className="flex items-center gap-3 bg-brand-navy/5 px-6 py-4 rounded-2xl border border-brand-navy/5">
                    <Clock size={18} className="text-brand-navy/30" />
                    <span className="text-sm font-bold text-brand-navy/60 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-black/[0.02] hover:shadow-black/[0.05] hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-brand-orange/10 transition-colors" />
                        <div className="flex items-center justify-between mb-8">
                            <div className={`p-4 rounded-2xl ${stat.color} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                                <stat.icon size={26} />
                            </div>
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{stat.label}</p>
                        <p className="text-3xl font-[900] text-brand-navy tracking-tighter">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Recent Activity */}
                <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-black/[0.02] relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-8 bg-brand-orange rounded-full" />
                            <h2 className="text-2xl font-[900] text-brand-navy tracking-tight">Recent Activity</h2>
                        </div>
                        <button className="px-6 py-2.5 bg-gray-50 hover:bg-brand-orange hover:text-white text-brand-navy text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300">View Analytics</button>
                    </div>

                    <div className="space-y-6">
                        {recentOrders.map((order) => (
                            <div key={order._id} className="flex items-center justify-between p-7 bg-gray-50/50 rounded-[2rem] border border-transparent hover:border-brand-orange/10 hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all duration-500 group">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 group-hover:bg-brand-navy group-hover:text-white transition-all duration-500">
                                        <ShoppingBag size={24} className="group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div>
                                        <p className="font-[900] text-brand-navy text-lg tracking-tight mb-1">Order {order.orderId}</p>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                            {order.customer.name}
                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                            {order.items.length} items
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-10">
                                    <div className="hidden sm:block">
                                        <p className="font-[900] text-brand-navy text-lg tracking-tighter mb-1">{formatPrice(order.total)}</p>
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-5 py-2 rounded-full border ${order.status === "Processing" ? "bg-brand-orange/5 text-brand-orange border-brand-orange/10" :
                                        order.status === "Shipped" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                            "bg-green-50 text-green-600 border-green-100"
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {recentOrders.length === 0 && (
                            <div className="text-center py-32 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                                <div className="inline-flex p-6 bg-white rounded-2xl shadow-sm mb-4">
                                    <Package size={32} className="text-gray-300" />
                                </div>
                                <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">No recent orders identified</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-10">
                    {/* Inventory Share Card */}
                    <div className="bg-brand-navy p-10 rounded-[3rem] text-white shadow-2xl shadow-brand-navy/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:bg-brand-orange/10 transition-all duration-700" />
                        <h2 className="text-xl font-[900] tracking-tight mb-10 relative z-10 flex items-center gap-3">
                            <Layers size={20} className="text-brand-orange" />
                            Inventory Share
                        </h2>
                        <div className="space-y-8 relative z-10">
                            {topCategories.map(([cat, count], i) => (
                                <div key={i} className="space-y-3 group/item">
                                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                                        <span className="text-brand-cream/40 group-hover/item:text-white transition-colors">{cat}</span>
                                        <span className="text-brand-orange">{count} items</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-brand-orange to-orange-400 rounded-full transition-all duration-[1.5s] ease-out shadow-[0_0_12px_rgba(255,107,0,0.3)]"
                                            style={{ width: `${(count / products.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}

                            {topCategories.length === 0 && (
                                <p className="text-brand-cream/20 text-xs italic text-center py-14">Awaiting catalog data...</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Access Card */}
                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-black/[0.02]">
                        <h2 className="text-xl font-[900] text-brand-navy tracking-tight mb-8">Quick Access</h2>
                        <div className="grid grid-cols-2 gap-5">
                            <Link to="/admin/products" className="flex flex-col items-center justify-center p-6 bg-gray-50/50 rounded-[2rem] hover:bg-brand-navy hover:text-white transition-all duration-500 gap-3 group">
                                <Package size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Inventory</span>
                            </Link>
                            <Link to="/admin/orders" className="flex flex-col items-center justify-center p-6 bg-gray-50/50 rounded-[2rem] hover:bg-brand-orange hover:text-white transition-all duration-500 gap-3 group shadow-orange-500/10">
                                <Clock size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
