import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
    Package,
    Clock,
    CheckCircle2,
    Truck,
    ChevronRight,
    User,
    Mail,
    Calendar,
    DollarSign,
    AlertCircle
} from "lucide-react";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

export default function AdminOrders() {
    const orders = useQuery(api.orders.list);
    const updateStatus = useMutation(api.orders.updateStatus);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const isLoading = orders === undefined;

    const getStatusColor = (status) => {
        switch (status) {
            case "Processing": return "bg-brand-orange/10 text-brand-orange";
            case "Shipped": return "bg-blue-50 text-blue-600";
            case "Delivered": return "bg-green-50 text-green-600";
            case "Cancelled": return "bg-red-50 text-red-600";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await updateStatus({ id, status: newStatus });
            if (selectedOrder && selectedOrder._id === id) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (err) {
            console.error("Failed to update status", err);
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
                    <div className="p-6 border-b border-gray-50">
                        <h2 className="text-lg font-black text-brand-navy">All Orders</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{orders.length} total shipments</p>
                    </div>

                    <div className="divide-y divide-gray-50 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                        {orders.map((order) => (
                            <button
                                key={order._id}
                                onClick={() => setSelectedOrder(order)}
                                className={`w-full text-left p-6 hover:bg-gray-50 transition-all flex items-center justify-between group ${selectedOrder?._id === order._id ? "bg-gray-50 ring-1 ring-inset ring-brand-orange/10" : ""
                                    }`}
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-black text-brand-navy text-sm">{order.orderId}</span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-500">{order.customer.name}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                    <p className="font-black text-brand-navy text-sm">${(order?.total || 0).toFixed(2)}</p>
                                    <ChevronRight size={16} className={`text-gray-300 group-hover:text-brand-orange transition-all ${selectedOrder?._id === order._id ? "translate-x-1 text-brand-orange" : ""}`} />
                                </div>
                            </button>
                        ))}

                        {orders.length === 0 && (
                            <div className="p-20 text-center">
                                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                                    <Package className="h-8 w-8 text-gray-200" />
                                </div>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No orders placed yet</p>
                            </div>
                        )}
                    </div>
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
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-gray-400 hover:text-brand-navy font-bold text-xs uppercase tracking-widest"
                            >
                                Close Details
                            </button>
                        </div>

                        <div className="p-8 space-y-10">
                            {/* Status Actions */}
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => handleStatusUpdate(selectedOrder._id, "Processing")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedOrder.status === "Processing" ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    <Clock size={16} /> Processing
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(selectedOrder._id, "Shipped")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedOrder.status === "Shipped" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    <Truck size={16} /> Shipped
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(selectedOrder._id, "Delivered")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedOrder.status === "Delivered" ? "bg-green-600 text-white shadow-lg shadow-green-600/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    <CheckCircle2 size={16} /> Delivered
                                </button>
                            </div>

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
                                                <p className="text-[10px] font-black uppercase text-gray-400">FullName</p>
                                                <p className="font-bold text-brand-navy">{selectedOrder.customer.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                <Mail size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-gray-400">Email Address</p>
                                                <p className="font-bold text-brand-navy">{selectedOrder.customer.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-gray-400">Academic Year</p>
                                                <p className="font-bold text-brand-navy">{selectedOrder.customer.year}</p>
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
                                                        <p className="text-sm font-bold text-brand-navy truncate">{item.name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            QTY: {item.qty} {item?.size ? `• Size: ${item.size}` : ""} {item?.color ? `• ${item.color}` : ""}
                                                        </p>
                                                    </div>
                                                    <p className="font-black text-brand-navy text-sm">${((item.price || 0) * (item.qty || 1)).toFixed(2)}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-4 bg-brand-navy text-white flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Grand Total</span>
                                            <span className="text-lg font-black">${(selectedOrder?.total || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
