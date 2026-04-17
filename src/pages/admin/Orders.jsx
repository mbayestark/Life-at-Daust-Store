import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    Package,
    Clock,
    CheckCircle2,
    Truck,
    ChevronRight,
    User,
    Phone,
    MapPin,
    AlertCircle,
    Trash2,
    Search,
    Tag,
    RotateCcw,
    Download,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    Printer,
    MessageCircle,
    History,
    Gift
} from "lucide-react";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { formatPrice } from "../../utils/format.js";
import { useAdmin } from "../../context/AdminContext";

const ITEMS_PER_PAGE = 15;

export default function AdminOrders() {
    const { adminToken, adminRole } = useAdmin();
    const isPartner = adminRole === "partner";
    const orders = useQuery(api.orders.list, adminToken ? { adminToken } : "skip");
    const products = useQuery(api.products.list) || [];
    const updateStatus = useMutation(api.orders.updateStatus);
    const bulkUpdateStatusMutation = useMutation(api.orders.bulkUpdateStatus);
    const checkNabooStatus = useAction(api.naboopay.getTransaction);
    const deleteNabooTransaction = useAction(api.naboopay.deleteTransaction);
    const refundNabooTransaction = useAction(api.naboopay.refundTransaction);
    const [refunding, setRefunding] = useState(false);
    const deleteOrderMutation = useMutation(api.orders.deleteOrder);
    const toggleGiftMutation = useMutation(api.orders.toggleGift);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkStatus, setBulkStatus] = useState("");
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    const isLoading = orders === undefined;

    const selectedOrder = orders?.find((o) => o._id === selectedOrderId) ?? null;

    const PARTNER_STATUSES = ["Paid", "Processing", "Shipped", "Delivered"];
    const ALL_STATUSES = isPartner
        ? ["All", ...PARTNER_STATUSES]
        : ["All", "Pending Verification", "Pending Payment", "Paid", "Processing", "Shipped", "Delivered", "Cancelled", "Refunded"];

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        setCurrentPage(1);
        return orders.filter(o => {
            const matchesSearch = !searchTerm ||
                o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.customer.phone.includes(searchTerm);
            const matchesStatus = statusFilter === "All" || o.status === statusFilter;
            const matchesRole = !isPartner || PARTNER_STATUSES.includes(o.status);
            return matchesSearch && matchesStatus && matchesRole;
        });
    }, [orders, searchTerm, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const exportCSV = () => {
        const productMap = {};
        for (const p of products) {
            productMap[p._id] = p;
        }
        const headers = ["Order ID", "Date", "Customer Name", "Phone", "Location", "Payment Method", "Status", "Item", "Qty", "Unit Price", "Buying Price", "Color", "Size", "Hoodie Type", "Crop Top", "Front Logo", "Back Logo", "Side Logo", "Subtotal", "Buying Subtotal", "Delivery Fee", "Discount", "Total", "Profit"];
        const rows = filteredOrders.flatMap(o => {
            let buyingSubtotal = 0;
            o.items.forEach(item => {
                const prod = item.productId ? productMap[item.productId] : null;
                const buyingPrice = prod?.buyingPrice ?? 0;
                buyingSubtotal += buyingPrice * item.qty;
            });
            const profit = (o.total || 0) - buyingSubtotal;
            return o.items.map((item, idx) => {
                const prod = item.productId ? productMap[item.productId] : null;
                const buyingPrice = prod?.buyingPrice ?? "";
                return [
                    idx === 0 ? o.orderId : "",
                    idx === 0 ? new Date(o.createdAt).toLocaleDateString() : "",
                    idx === 0 ? o.customer.name : "",
                    idx === 0 ? o.customer.phone : "",
                    idx === 0 ? o.customer.location : "",
                    idx === 0 ? (o.paymentMethod || "") : "",
                    idx === 0 ? o.status : "",
                    item.isProductSet ? `[Bundle] ${item.name}` : item.name,
                    item.qty,
                    item.price,
                    buyingPrice,
                    item.color || "",
                    item.size || "",
                    item.hoodieType || "",
                    item.isCropTop ? "Yes" : "",
                    item.frontLogo || "",
                    item.backLogo || "",
                    item.sideLogo || "",
                    idx === 0 ? (o.subtotal || 0) : "",
                    idx === 0 ? buyingSubtotal : "",
                    idx === 0 ? (o.deliveryFee || 0) : "",
                    idx === 0 ? (o.discount || 0) : "",
                    idx === 0 ? (o.total || 0) : "",
                    idx === 0 ? profit : "",
                ];
            });
        });
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const toggleSelectOrder = (id, e) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedOrders.length && paginatedOrders.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedOrders.map(o => o._id)));
        }
    };

    const handleBulkUpdate = async () => {
        if (!bulkStatus || selectedIds.size === 0) return;
        setIsBulkUpdating(true);
        try {
            await bulkUpdateStatusMutation({ ids: [...selectedIds], status: bulkStatus, adminToken });
            setSelectedIds(new Set());
            setBulkStatus("");
        } catch {
            alert("Failed to bulk update orders.");
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const printPackingSlip = (order) => {
        const w = window.open("", "_blank", "width=700,height=900");
        w.document.write(`<!DOCTYPE html><html><head><title>Packing Slip - ${order.orderId}</title>
<style>
  body{font-family:Arial,sans-serif;padding:40px;color:#0A192F;max-width:600px;margin:0 auto}
  h1{font-size:22px;margin-bottom:4px}
  .meta{font-size:12px;color:#888;margin-bottom:24px}
  .section{font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:.15em;color:#aaa;margin:20px 0 8px}
  .customer{background:#f9f9f9;padding:14px 18px;border-radius:8px;font-size:13px;line-height:2}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{background:#0A192F;color:#fff;padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.1em}
  td{padding:8px 10px;border-bottom:1px solid #eee;font-size:13px}
  .totals td{padding:6px 10px}
  .grand td{font-size:15px;font-weight:900;border-top:2px solid #0A192F;padding-top:10px}
  .footer{margin-top:40px;text-align:center;font-size:10px;color:#ccc}
  .status{display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:bold;background:#f3f4f6}
</style></head><body>
<h1>Life at DAUST &mdash; Packing Slip</h1>
<div class="meta">Order <strong>${order.orderId}</strong> &nbsp;·&nbsp; ${new Date(order.createdAt).toLocaleString()} &nbsp;·&nbsp; <span class="status">${order.status}</span></div>
<div class="section">Customer</div>
<div class="customer"><strong>${order.customer.name}</strong><br>📞 ${order.customer.phone}<br>📍 ${order.customer.location}</div>
<div class="section">Items</div>
<table><thead><tr><th>Item</th><th>Details</th><th>Qty</th><th>Price</th></tr></thead><tbody>
${order.items.map(item => `<tr>
  <td>${item.isProductSet ? "<strong style='color:#FF6B00'>[Bundle]</strong> " : ""}${item.name}</td>
  <td style="color:#999;font-size:11px">${[item.size ? `Size: ${item.size}` : "", item.color ? `Color: ${item.color}` : "", item.hoodieType ? `Type: ${item.hoodieType}` : "", item.isCropTop ? "Crop Top" : "", item.frontLogo ? `Front: ${item.frontLogo}` : ""].filter(Boolean).join(" · ") || "—"}${item.isProductSet && item.setProducts?.length ? "<br>" + item.setProducts.map(sp => `<span style="color:#666;font-size:10px">&nbsp;&nbsp;${sp.quantity}x ${sp.productName}${sp.color ? " · " + sp.color : ""}${sp.size ? " · " + sp.size : ""}</span>`).join("<br>") : ""}</td>
  <td>${item.qty}</td>
  <td>${((item.price || 0) * (item.qty || 1)).toLocaleString()} CFA</td>
</tr>`).join("")}
</tbody></table>
<table class="totals"><tbody>
  <tr><td>Subtotal</td><td style="text-align:right">${(order.subtotal || 0).toLocaleString()} CFA</td></tr>
  ${order.deliveryFee > 0 ? `<tr><td>Delivery</td><td style="text-align:right">${order.deliveryFee.toLocaleString()} CFA</td></tr>` : ""}
  ${order.discount > 0 ? `<tr style="color:green"><td>Early Discount (15%)</td><td style="text-align:right">-${order.discount.toLocaleString()} CFA</td></tr>` : ""}
  <tr class="grand"><td><strong>Total</strong></td><td style="text-align:right"><strong>${(order.total || 0).toLocaleString()} CFA</strong></td></tr>
</tbody></table>
<div class="footer">Life at DAUST Store &nbsp;·&nbsp; DAUST Campus &nbsp;·&nbsp; Printed ${new Date().toLocaleString()}</div>
</body></html>`);
        w.document.close();
        setTimeout(() => w.print(), 300);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Pending Verification": return "bg-purple-50 text-purple-600";
            case "Pending Payment": return "bg-yellow-50 text-yellow-600";
            case "Paid": return "bg-emerald-50 text-emerald-600 font-bold";
            case "Processing": return "bg-indigo-50 text-indigo-600";
            case "Shipped": return "bg-cyan-50 text-cyan-600";
            case "Delivered": return "bg-teal-50 text-teal-600";
            case "Cancelled": return "bg-red-50 text-red-600";
            case "Refunded": return "bg-rose-50 text-rose-600";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    const handleCheckStatus = async (naboopayId) => {
        try {
            const result = await checkNabooStatus({ orderId: naboopayId });
            if (result && result.transaction_status) {
                alert(`NabooPay Status: ${result.transaction_status}`);
            }
        } catch {
            alert("Failed to check status. Make sure the NabooPay ID is valid.");
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            if (newStatus === "Cancelled" && selectedOrder?.naboopayOrderId) {
                try {
                    await deleteNabooTransaction({ orderId: selectedOrder.naboopayOrderId });
                } catch {
                    // Continue anyway — transaction may already be deleted or expired
                }
            }
            await updateStatus({ id, status: newStatus, adminToken });
        } catch {
            alert("Failed to update order status. Please try again.");
        }
    };

    const handleRefund = async () => {
        if (!selectedOrder?.naboopayOrderId) return;
        if (!window.confirm(`Issue a refund for order ${selectedOrder.orderId}? This will contact NabooPay and cannot be undone.`)) return;
        setRefunding(true);
        try {
            await refundNabooTransaction({ naboopayOrderId: selectedOrder.naboopayOrderId });
            await updateStatus({ id: selectedOrder._id, status: "Refunded", adminToken });
        } catch (err) {
            alert(`Refund failed: ${err?.message || "Unknown error"}`);
        } finally {
            setRefunding(false);
        }
    };

    const handleDeleteOrder = async () => {
        try {
            await deleteOrderMutation({ id: selectedOrder._id, adminToken });
            setSelectedOrderId(null);
            setShowDeleteConfirm(false);
        } catch {
            alert("Failed to delete order. Please try again.");
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Orders...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Orders List */}
            <div className={`${selectedOrder ? "lg:col-span-4" : "lg:col-span-12"} transition-all duration-500`}>
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-brand-navy">All Orders</h2>
                            <div className="flex items-center gap-3">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{filteredOrders.length} / {isPartner ? orders.filter(o => PARTNER_STATUSES.includes(o.status)).length : orders.length}</p>
                                <button
                                    onClick={exportCSV}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-brand-navy hover:text-white font-bold text-xs uppercase tracking-widest transition-all"
                                    title="Export filtered orders as CSV"
                                >
                                    <Download size={13} /> CSV
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search by order ID, name or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-widest text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-orange/20 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_12px_center] bg-no-repeat"
                        >
                            {ALL_STATUSES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>

                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-brand-navy/5 rounded-xl border border-brand-navy/10 animate-in fade-in duration-200">
                                <span className="text-xs font-black text-brand-navy">{selectedIds.size} selected</span>
                                <select
                                    value={bulkStatus}
                                    onChange={e => setBulkStatus(e.target.value)}
                                    className="text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-1.5 flex-1 focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                                >
                                    <option value="">Change status to...</option>
                                    {ALL_STATUSES.filter(s => s !== "All").map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <button
                                    onClick={handleBulkUpdate}
                                    disabled={!bulkStatus || isBulkUpdating}
                                    className="px-3 py-1.5 bg-brand-navy text-white text-xs font-black rounded-lg disabled:opacity-40 hover:bg-brand-orange transition-all"
                                >
                                    {isBulkUpdating ? "Updating..." : "Apply"}
                                </button>
                                <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-400 hover:text-red-500 font-bold transition-colors">
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="divide-y divide-gray-50 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
                        {paginatedOrders.length > 0 && (
                            <div className="px-6 py-2 flex items-center gap-3 bg-gray-50/50 border-b border-gray-50">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size === paginatedOrders.length && paginatedOrders.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-3.5 h-3.5 rounded accent-brand-orange cursor-pointer"
                                />
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Select all</span>
                            </div>
                        )}
                        {paginatedOrders.map((order) => (
                            <div
                                key={order._id}
                                onClick={() => setSelectedOrderId(order._id)}
                                className={`w-full text-left p-6 hover:bg-gray-50 transition-all flex items-center gap-3 group cursor-pointer ${selectedOrder?._id === order._id ? "bg-gray-50 ring-1 ring-inset ring-brand-orange/10" : ""
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(order._id)}
                                    onChange={e => toggleSelectOrder(order._id, e)}
                                    onClick={e => e.stopPropagation()}
                                    className="w-3.5 h-3.5 rounded accent-brand-orange cursor-pointer flex-shrink-0"
                                />
                                <div className="flex-1 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-black text-brand-navy text-sm">{order.orderId}</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                            {order.isGift && (
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-pink-50 text-pink-500">
                                                    <Gift size={10} className="inline -mt-0.5 mr-0.5" />Gift
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-gray-500">{order.customer.name}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <p className="font-black text-brand-navy text-sm">{formatPrice(order?.total || 0)}</p>
                                        <ChevronRight size={16} className={`text-gray-300 group-hover:text-brand-orange transition-all ${selectedOrder?._id === order._id ? "translate-x-1 text-brand-orange" : ""}`} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredOrders.length === 0 && (
                            <div className="p-20 text-center">
                                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                                    <Package className="h-8 w-8 text-gray-200" />
                                </div>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No orders placed yet</p>
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-50 flex items-center justify-between">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-brand-navy disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsLeft size={16} />
                            </button>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-navy disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-xs font-bold text-gray-500 px-3">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-navy disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-brand-navy disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Details */}
            {selectedOrder && (
                <div className="lg:col-span-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden sticky top-8">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-xl font-black text-brand-navy">{selectedOrder.orderId}</h2>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => printPackingSlip(selectedOrder)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-brand-navy hover:text-white font-bold text-xs uppercase tracking-widest transition-all"
                                >
                                    <Printer size={14} /> Print
                                </button>
                                {selectedOrder.naboopayOrderId && selectedOrder.status === "Paid" && (
                                    <button
                                        onClick={handleRefund}
                                        disabled={refunding}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                                    >
                                        <RotateCcw size={14} className={refunding ? "animate-spin" : ""} />
                                        {refunding ? "Refunding..." : "Refund"}
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold text-xs uppercase tracking-widest transition-all"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                                <button
                                    onClick={() => setSelectedOrderId(null)}
                                    className="text-gray-400 hover:text-brand-navy font-bold text-xs uppercase tracking-widest"
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>

                        <div className="p-8 space-y-10">
                            {/* Status Actions */}
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => handleStatusUpdate(selectedOrder._id, "Processing")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedOrder.status === "Processing" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                        }`}
                                >
                                    <Clock size={16} /> Processing
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(selectedOrder._id, "Shipped")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedOrder.status === "Shipped" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20" : "bg-cyan-50 text-cyan-600 hover:bg-cyan-100"
                                        }`}
                                >
                                    <Truck size={16} /> Shipped
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(selectedOrder._id, "Delivered")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedOrder.status === "Delivered" ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20" : "bg-teal-50 text-teal-600 hover:bg-teal-100"
                                        }`}
                                >
                                    <CheckCircle2 size={16} /> Delivered
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(selectedOrder._id, "Paid")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedOrder.status === "Paid" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                        }`}
                                >
                                    <CheckCircle2 size={16} /> Paid
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(selectedOrder._id, "Cancelled")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedOrder.status === "Cancelled" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    <AlertCircle size={16} /> Cancelled
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(selectedOrder._id, "Pending Verification")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedOrder.status === "Pending Verification" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    <AlertCircle size={16} /> Pending Verification
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(selectedOrder._id, "Pending Payment")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedOrder.status === "Pending Payment" ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    <Clock size={16} /> Pending Payment
                                </button>
                            </div>

                            {/* Gift Toggle */}
                            <div className={`p-4 rounded-2xl border flex items-center justify-between ${selectedOrder.isGift ? "bg-pink-50 border-pink-200" : "bg-gray-50 border-gray-100"}`}>
                                <div className="flex items-center gap-3">
                                    <Gift size={18} className={selectedOrder.isGift ? "text-pink-500" : "text-gray-400"} />
                                    <div>
                                        <p className={`text-xs font-black uppercase tracking-widest ${selectedOrder.isGift ? "text-pink-600" : "text-gray-500"}`}>
                                            {selectedOrder.isGift ? "Marked as Gift" : "Mark as Gift"}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">Gift orders are excluded from revenue & profit stats</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleGiftMutation({ id: selectedOrder._id, isGift: !selectedOrder.isGift, adminToken })}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${selectedOrder.isGift ? "bg-pink-500" : "bg-gray-300"}`}
                                >
                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${selectedOrder.isGift ? "translate-x-6" : "translate-x-0.5"}`} />
                                </button>
                            </div>

                            {selectedOrder.naboopayOrderId && (
                                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">NabooPay Transaction</h3>
                                        <button
                                            onClick={() => handleCheckStatus(selectedOrder.naboopayOrderId)}
                                            className="px-3 py-1 bg-white border border-blue-200 rounded-lg text-[10px] font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        >
                                            REFRESH STATUS
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-blue-400">Order ID</p>
                                            <p className="font-bold text-blue-900 break-all">{selectedOrder.naboopayOrderId}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-blue-400">Checkout Link</p>
                                            <a href={selectedOrder.naboopayCheckoutUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 underline">Open Link</a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedOrder.proofOfPaymentUrl && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Proof of Payment</h3>
                                    <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                                        <a href={selectedOrder.proofOfPaymentUrl} target="_blank" rel="noreferrer">
                                            <img src={selectedOrder.proofOfPaymentUrl} alt="Proof of payment" className="w-full object-cover hover:opacity-90 transition-opacity" />
                                        </a>
                                    </div>
                                    <p className="text-[10px] text-gray-400 italic font-bold">Click image to view in full size</p>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-10">
                                {/* Customer Info */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Customer Details</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-gray-400">Full Name</p>
                                                <p className="font-bold text-brand-navy">{selectedOrder.customer.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                <Phone size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black uppercase text-gray-400">Phone</p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-bold text-brand-navy">{selectedOrder.customer.phone}</p>
                                                    <a
                                                        href={`https://wa.me/${selectedOrder.customer.phone.replace(/\D/g, "")}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all"
                                                        title="Open WhatsApp chat"
                                                    >
                                                        <MessageCircle size={10} /> WhatsApp
                                                    </a>
                                                    <button
                                                        onClick={() => { setSearchTerm(selectedOrder.customer.phone); setSelectedOrderId(null); }}
                                                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-navy/5 text-brand-navy/50 hover:bg-brand-orange/10 hover:text-brand-orange transition-all"
                                                        title="View all orders from this customer"
                                                    >
                                                        All orders
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                <MapPin size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-gray-400">Delivery Location</p>
                                                <p className="font-bold text-brand-navy">{selectedOrder.customer.location}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Summary */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Order Items</h3>
                                    <div className="bg-gray-50 rounded-2xl overflow-hidden">
                                        <div className="divide-y divide-gray-100">
                                            {selectedOrder.items.map((item, i) => (
                                                <div key={i} className="p-4 flex items-center justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-brand-navy truncate">
                                                            {item.isProductSet && <span className="text-brand-orange mr-1">[Bundle]</span>}
                                                            {item.name}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            QTY: {item.qty} {item?.size ? `• Size: ${item.size}` : ""} {item?.color ? `• ${item.color}` : ""} {item?.hoodieType ? `• Type: ${item.hoodieType}` : ""} {item?.frontLogo ? `• Front: ${item.frontLogo}` : ""} {item?.backLogo ? `• Back: ${item.backLogo}` : ""} {item?.sideLogo ? `• Side: ${item.sideLogo}` : ""} {item?.logo ? `• Logo: ${item.logo}${item.logoPosition ? ` (${item.logoPosition})` : ""}` : ""}
                                                        </p>
                                                        {item.isProductSet && item.setProducts?.length > 0 && (
                                                            <div className="mt-2 ml-2 pl-3 border-l-2 border-brand-orange/20 space-y-1">
                                                                {item.setProducts.map((sp, j) => (
                                                                    <p key={j} className="text-[10px] font-bold text-gray-500 tracking-wide">
                                                                        {sp.quantity}x {sp.productName}
                                                                        {sp.color ? ` · ${sp.color}` : ""}
                                                                        {sp.size ? ` · ${sp.size}` : ""}
                                                                        {sp.frontLogo ? ` · Front: ${sp.frontLogo}` : ""}
                                                                        {sp.backLogo ? ` · Back: ${sp.backLogo}` : ""}
                                                                        {sp.sideLogo ? ` · Side: ${sp.sideLogo}` : ""}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="font-black text-brand-navy text-sm">{formatPrice((item.price || 0) * (item.qty || 1))}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-brand-navy text-white divide-y divide-white/10">
                                            <div className="px-4 py-2.5 flex justify-between items-center">
                                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Subtotal</span>
                                                <span className="text-sm font-bold">{formatPrice(selectedOrder.subtotal || 0)}</span>
                                            </div>
                                            {selectedOrder.deliveryFee > 0 && (
                                                <div className="px-4 py-2.5 flex justify-between items-center">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Delivery</span>
                                                    <span className="text-sm font-bold">{formatPrice(selectedOrder.deliveryFee)}</span>
                                                </div>
                                            )}
                                            {selectedOrder.discount > 0 && (
                                                <div className="px-4 py-2.5 flex justify-between items-center">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 flex items-center gap-1.5">
                                                        <Tag size={10} /> Early Discount (15%)
                                                    </span>
                                                    <span className="text-sm font-bold text-green-400">-{formatPrice(selectedOrder.discount)}</span>
                                                </div>
                                            )}
                                            <div className="px-4 py-3 flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Grand Total</span>
                                                <span className="text-lg font-black">{formatPrice(selectedOrder?.total || 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                        <History size={13} /> Status Timeline
                                    </h3>
                                    <div className="relative pl-5 space-y-3">
                                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-100" />
                                        {[...selectedOrder.statusHistory].reverse().map((h, i) => (
                                            <div key={i} className="flex items-start gap-3 relative">
                                                <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 border-2 ${i === 0 ? "border-brand-orange bg-brand-orange" : "border-gray-200 bg-white"}`} />
                                                <div>
                                                    <p className={`text-xs font-black ${i === 0 ? "text-brand-orange" : "text-brand-navy"}`}>{h.status}</p>
                                                    <p className="text-[10px] text-gray-400">{new Date(h.timestamp).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-black text-brand-navy text-center mb-2">Delete Order?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Are you sure you want to delete order <span className="font-bold text-brand-navy">{selectedOrder?.orderId}</span>? This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteOrder}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
