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
    Layers,
    AlertTriangle,
    ArrowUpRight,
    Download
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatPrice } from "../../utils/format.js";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { useAdmin } from "../../context/AdminContext";

export default function AdminDashboard() {
    const { adminToken } = useAdmin();
    const products = useQuery(api.products.list);
    const orders = useQuery(api.orders.list, adminToken ? { adminToken } : "skip");

    const isLoading = products === undefined || (adminToken ? orders === undefined : false);
    // If no admin token (or orders query was skipped), treat as empty 
    const ordersData = orders ?? [];

    const profitData = useMemo(() => {
        if (!products) return { totalProfit: 0, totalCost: 0, margin: 0 };

        // Build a lookup: productName -> buyingPrice
        const buyingByName = {};
        for (const p of products) {
            if (p.buyingPrice != null) {
                buyingByName[p.name.toLowerCase()] = p.buyingPrice;
            }
        }

        const CONFIRMED_STATUSES = ["Paid", "Processing", "Shipped", "Delivered"];
        let totalRevenue = 0;
        let totalCost = 0;

        for (const order of ordersData) {
            if (!CONFIRMED_STATUSES.includes(order.status) || order.isGift) continue;
            totalRevenue += order.total || 0;
            for (const item of order.items || []) {
                if (item.isProductSet && item.setProducts) {
                    for (const sp of item.setProducts) {
                        const spCost = buyingByName[sp.productName?.toLowerCase()] ?? 0;
                        totalCost += spCost * (sp.quantity || 1) * (item.qty || 1);
                    }
                } else {
                    const cost = buyingByName[item.name?.toLowerCase()] ?? 0;
                    totalCost += cost * (item.qty || 1);
                }
            }
        }

        const totalProfit = totalRevenue - totalCost;
        const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
        return { totalProfit, totalCost, margin };
    }, [products, ordersData]);

    const stats = useMemo(() => {
        if (!products) return [];

        const CONFIRMED_STATUSES = ["Paid", "Processing", "Shipped", "Delivered"];
        const totalRevenue = ordersData.filter(o => CONFIRMED_STATUSES.includes(o.status) && !o.isGift).reduce((sum, order) => sum + (order?.total || 0), 0);
        const activeOrders = ordersData.filter(o => o.status === "Processing" || o.status === "Shipped").length;
        const totalProducts = products.length;
        const completedOrders = ordersData.filter(o => o.status === "Delivered").length;

        return [
            { label: "Total Revenue", value: formatPrice(totalRevenue), icon: DollarSign, color: "bg-green-50 text-green-600" },
            { label: "Net Profit", value: formatPrice(profitData.totalProfit), sub: `${profitData.margin}% margin`, icon: TrendingUp, color: profitData.totalProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500" },
            { label: "Active Orders", value: activeOrders.toString(), icon: ShoppingBag, color: "bg-brand-orange/10 text-brand-orange" },
            { label: "Catalog Size", value: totalProducts.toString(), icon: Package, color: "bg-blue-50 text-blue-600" },
            { label: "Fulfillment Rate", value: ordersData.length > 0 ? `${Math.round((completedOrders / ordersData.length) * 100)}%` : "0%", icon: CheckCircle2, color: "bg-purple-50 text-purple-600" },
        ];
    }, [products, ordersData, profitData]);

    const recentOrders = useMemo(() => {
        return ordersData.slice(0, 5);
    }, [ordersData]);

    const lowStockProducts = useMemo(() => {
        if (!products) return [];
        return products
            .filter(p => p.stock !== undefined && p.stock !== null && p.stock <= 5)
            .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
    }, [products]);

    const revenueByDay = useMemo(() => {
        const days = 14;
        const now = new Date();
        return Array.from({ length: days }, (_, i) => {
            const d = new Date(now);
            d.setDate(now.getDate() - (days - 1 - i));
            d.setHours(0, 0, 0, 0);
            const dayStart = d.getTime();
            const dayEnd = dayStart + 86400000;
            const CONFIRMED = ["Paid", "Processing", "Shipped", "Delivered"];
            const revenue = ordersData
                .filter(o => o.createdAt >= dayStart && o.createdAt < dayEnd && CONFIRMED.includes(o.status) && !o.isGift)
                .reduce((sum, o) => sum + (o.total || 0), 0);
            return {
                day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                revenue,
                isToday: i === days - 1
            };
        });
    }, [ordersData]);

    const topCategories = useMemo(() => {
        if (!products) return [];
        const counts = {};
        products.forEach(p => {
            const cat = p.category || "Uncategorized";
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
    }, [products]);

    const itemsSoldByProduct = useMemo(() => {
        if (!products) return [];
        const CONFIRMED = ["Paid", "Processing", "Shipped", "Delivered"];
        const soldMap = {};
        const grossMap = {};
        const actualMap = {};

        for (const order of ordersData) {
            if (!CONFIRMED.includes(order.status) || order.isGift) continue;
            const totalDiscount = (order.discount || 0) + (order.referralDiscount || 0) + (order.couponDiscount || 0);
            const orderSubtotal = order.subtotal || 0;

            for (const item of order.items || []) {
                const key = item.name || "Unknown";
                const itemTotal = (item.price || 0) * (item.qty || 1);
                soldMap[key] = (soldMap[key] || 0) + (item.qty || 1);
                grossMap[key] = (grossMap[key] || 0) + itemTotal;
                // Distribute order-level discounts proportionally
                const itemDiscount = orderSubtotal > 0 ? Math.round(totalDiscount * (itemTotal / orderSubtotal)) : 0;
                actualMap[key] = (actualMap[key] || 0) + (itemTotal - itemDiscount);
            }
        }

        // Match with product images
        const imageMap = {};
        for (const p of products) {
            imageMap[p.name] = p.image;
        }

        return Object.entries(soldMap)
            .map(([name, qty]) => ({
                name,
                qty,
                gross: grossMap[name] || 0,
                actual: actualMap[name] || 0,
                discounted: (grossMap[name] || 0) - (actualMap[name] || 0),
                image: imageMap[name],
            }))
            .sort((a, b) => b.qty - a.qty);
    }, [products, ordersData]);

    const exportItemsSoldCSV = () => {
        const headers = ["Product", "Qty Sold", "Gross Revenue (CFA)", "Discounts (CFA)", "Actual Revenue (CFA)"];
        const rows = itemsSoldByProduct.map(p => [
            p.name, p.qty, p.gross, p.discounted, p.actual
        ]);
        const csv = [headers, ...rows]
            .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `items-sold-by-product-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
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
                        {stat.sub && <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{stat.sub}</p>}
                    </div>
                ))}
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-black/[0.02]">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-brand-orange rounded-full" />
                    <h2 className="text-2xl font-[900] text-brand-navy tracking-tight">14-Day Revenue</h2>
                    <span className="ml-auto text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {formatPrice(revenueByDay.reduce((s, d) => s + d.revenue, 0))} total
                    </span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={revenueByDay} barCategoryGap="30%">
                        <XAxis
                            dataKey="day"
                            tick={{ fontSize: 10, fontWeight: 700, fill: "#9ca3af" }}
                            axisLine={false}
                            tickLine={false}
                            interval={1}
                        />
                        <YAxis hide />
                        <Tooltip
                            cursor={{ fill: "rgba(249,115,22,0.05)", radius: 8 }}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                    <div className="bg-brand-navy text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl">
                                        {formatPrice(payload[0].value)}
                                    </div>
                                );
                            }}
                        />
                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]} minPointSize={6}>
                            {revenueByDay.map((entry, i) => (
                                <Cell
                                    key={i}
                                    fill={entry.isToday ? "#f97316" : entry.revenue > 0 ? "#0A192F" : "#e5e7eb"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Profit Breakdown */}
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-black/[0.02]">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                    <h2 className="text-2xl font-[900] text-brand-navy tracking-tight">Profit Breakdown</h2>
                    <span className="ml-auto text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirmed orders only</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Revenue */}
                    <div className="bg-gray-50 rounded-[2rem] p-7 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Revenue</p>
                        <p className="text-3xl font-[900] text-brand-navy tracking-tighter">
                            {formatPrice(ordersData.filter(o => ["Paid","Processing","Shipped","Delivered"].includes(o.status) && !o.isGift).reduce((s,o) => s + (o.total||0), 0))}
                        </p>
                        <p className="text-xs text-gray-400 font-bold">Selling price × qty</p>
                    </div>
                    {/* Cost */}
                    <div className="bg-gray-50 rounded-[2rem] p-7 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Cost of Goods Sold</p>
                        <p className="text-3xl font-[900] text-brand-navy tracking-tighter">{formatPrice(profitData.totalCost)}</p>
                        <p className="text-xs text-gray-400 font-bold">
                            {profitData.totalCost === 0
                                ? "Set buying prices on products to track cost"
                                : "Buying price × qty sold"}
                        </p>
                    </div>
                    {/* Profit */}
                    <div className={`rounded-[2rem] p-7 space-y-2 ${profitData.totalProfit >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${profitData.totalProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>Net Profit</p>
                        <p className={`text-3xl font-[900] tracking-tighter flex items-center gap-2 ${profitData.totalProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {formatPrice(profitData.totalProfit)}
                            <ArrowUpRight size={20} />
                        </p>
                        <p className={`text-xs font-bold ${profitData.totalProfit >= 0 ? "text-emerald-500" : "text-red-400"}`}>{profitData.margin}% margin</p>
                    </div>
                </div>
                {profitData.totalCost === 0 && (
                    <p className="mt-6 text-xs text-gray-400 font-bold bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
                        Tip: Add buying prices to your products in the Products section to see accurate profit calculations.
                    </p>
                )}
            </div>

            {/* Items Sold by Product */}
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-black/[0.02]">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-1.5 h-8 bg-brand-navy rounded-full" />
                    <h2 className="text-2xl font-[900] text-brand-navy tracking-tight">Items Sold by Product</h2>
                    <div className="ml-auto flex items-center gap-4">
                        <button
                            onClick={exportItemsSoldCSV}
                            disabled={itemsSoldByProduct.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-navy bg-brand-navy/5 hover:bg-brand-navy/10 rounded-lg border border-brand-navy/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Export items sold as CSV"
                        >
                            <Download size={12} /> CSV
                        </button>
                        <div className="text-right">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
                                {itemsSoldByProduct.reduce((s, p) => s + p.qty, 0)} units
                            </span>
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">
                                {formatPrice(itemsSoldByProduct.reduce((s, p) => s + p.actual, 0))} collected
                            </span>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-gray-400 font-medium mb-8 ml-6">Confirmed orders only (Paid, Processing, Shipped, Delivered)</p>

                {itemsSoldByProduct.length > 0 ? (
                    <>
                        {/* Bar chart for top 10 */}
                        <ResponsiveContainer width="100%" height={Math.min(itemsSoldByProduct.length, 10) * 48 + 20}>
                            <BarChart
                                data={itemsSoldByProduct.slice(0, 10)}
                                layout="vertical"
                                barCategoryGap="20%"
                                margin={{ left: 0, right: 20 }}
                            >
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={160}
                                    tick={{ fontSize: 11, fontWeight: 700, fill: "#0A192F" }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: "rgba(10,25,47,0.03)", radius: 8 }}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const d = payload[0].payload;
                                        return (
                                            <div className="bg-brand-navy text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl space-y-1">
                                                <p>{d.name}</p>
                                                <p className="text-brand-orange">{d.qty} units sold</p>
                                                <p className="text-brand-cream/60">Full price: {formatPrice(d.gross)}</p>
                                                <p className="text-green-400">Collected: {formatPrice(d.actual)}</p>
                                                {d.discounted > 0 && <p className="text-red-400">Discounts: -{formatPrice(d.discounted)}</p>}
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="qty" radius={[0, 6, 6, 0]} minPointSize={4}>
                                    {itemsSoldByProduct.slice(0, 10).map((_, i) => (
                                        <Cell key={i} fill={i === 0 ? "#f97316" : "#0A192F"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                        {/* Full table below */}
                        <div className="mt-8 border border-gray-100 rounded-2xl overflow-hidden">
                            <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-brand-navy text-white text-[10px] font-black uppercase tracking-[0.15em]">
                                <span className="col-span-1">#</span>
                                <span className="col-span-3">Product</span>
                                <span className="col-span-2 text-right">Sold</span>
                                <span className="col-span-2 text-right">Full Price</span>
                                <span className="col-span-2 text-right">Discounts</span>
                                <span className="col-span-2 text-right">Collected</span>
                            </div>
                            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                                {itemsSoldByProduct.map((p, i) => (
                                    <div key={p.name} className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors">
                                        <span className="col-span-1 text-xs font-black text-gray-300">{i + 1}</span>
                                        <div className="col-span-3 flex items-center gap-3 min-w-0">
                                            {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />}
                                            <span className="text-sm font-bold text-brand-navy truncate">{p.name}</span>
                                        </div>
                                        <span className="col-span-2 text-right text-sm font-black text-brand-navy">{p.qty}</span>
                                        <span className="col-span-2 text-right text-sm font-bold text-gray-400 line-through">{formatPrice(p.gross)}</span>
                                        <span className="col-span-2 text-right text-sm font-bold text-red-400">{p.discounted > 0 ? `-${formatPrice(p.discounted)}` : "—"}</span>
                                        <span className="col-span-2 text-right text-sm font-black text-green-600">{formatPrice(p.actual)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                        <div className="inline-flex p-5 bg-white rounded-2xl shadow-sm mb-4">
                            <ShoppingBag size={28} className="text-gray-300" />
                        </div>
                        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">No confirmed sales yet</p>
                    </div>
                )}
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
                                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-5 py-2 rounded-full border ${
                                        order.status === "Processing" ? "bg-brand-orange/5 text-brand-orange border-brand-orange/10" :
                                        order.status === "Shipped" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                        order.status === "Pending Payment" ? "bg-yellow-50 text-yellow-600 border-yellow-100" :
                                        order.status === "Refunded" ? "bg-purple-50 text-purple-600 border-purple-100" :
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

                    {/* Stock Alerts */}
                    {lowStockProducts.length > 0 && (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-orange-100 shadow-2xl shadow-black/[0.02]">
                            <h2 className="text-base font-[900] text-brand-navy tracking-tight mb-6 flex items-center gap-3">
                                <AlertTriangle size={18} className="text-brand-orange" />
                                Stock Alerts
                                <span className="ml-auto text-[10px] font-black bg-brand-orange/10 text-brand-orange px-2.5 py-1 rounded-full">
                                    {lowStockProducts.length}
                                </span>
                            </h2>
                            <div className="space-y-3">
                                {lowStockProducts.map(p => (
                                    <div key={p._id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 hover:bg-orange-50 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                                            <p className="text-xs font-bold text-brand-navy truncate">{p.name}</p>
                                        </div>
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 ${p.stock === 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
                                            {p.stock === 0 ? "Out" : `${p.stock} left`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
