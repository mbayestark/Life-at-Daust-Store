import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAdmin } from "../../context/AdminContext";
import { ClipboardList } from "lucide-react";

const ACTION_COLORS = {
    "auth.login": "text-blue-400 bg-blue-500/10",
    "user.create": "text-green-400 bg-green-500/10",
    "user.update": "text-yellow-400 bg-yellow-500/10",
    "user.delete": "text-red-400 bg-red-500/10",
    "user.change_password": "text-purple-400 bg-purple-500/10",
    "product.create": "text-green-400 bg-green-500/10",
    "product.update": "text-yellow-400 bg-yellow-500/10",
    "product.delete": "text-red-400 bg-red-500/10",
    "product.activate": "text-green-400 bg-green-500/10",
    "product.deactivate": "text-orange-400 bg-orange-500/10",
    "product_set.create": "text-green-400 bg-green-500/10",
    "product_set.update": "text-yellow-400 bg-yellow-500/10",
    "product_set.delete": "text-red-400 bg-red-500/10",
    "order.status": "text-blue-400 bg-blue-500/10",
    "order.bulk_status": "text-blue-400 bg-blue-500/10",
    "order.delete": "text-red-400 bg-red-500/10",
    "order.clear_all": "text-red-400 bg-red-500/10",
    "order.mark_gift": "text-pink-400 bg-pink-500/10",
    "order.unmark_gift": "text-gray-400 bg-gray-500/10",
    "collection.create": "text-green-400 bg-green-500/10",
    "collection.update": "text-yellow-400 bg-yellow-500/10",
    "collection.delete": "text-red-400 bg-red-500/10",
    "media.upload": "text-cyan-400 bg-cyan-500/10",
    "media.delete": "text-red-400 bg-red-500/10",
    "settings.hero_media": "text-indigo-400 bg-indigo-500/10",
    "settings.reel_videos": "text-indigo-400 bg-indigo-500/10",
};

function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    if (diffMs < 60000) return "Just now";
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    if (diffMs < 172800000) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AuditLog() {
    const { adminToken } = useAdmin();
    const logs = useQuery(api.auth.listAuditLogs, adminToken ? { adminToken, limit: 200 } : "skip");

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <ClipboardList className="text-brand-orange" size={24} />
                <h1 className="text-2xl font-bold text-brand-navy">Audit Log</h1>
                {logs && <span className="text-xs text-gray-400 font-bold">{logs.length} entries</span>}
            </div>

            {!logs ? (
                <div className="text-gray-400 text-center py-12">Loading...</div>
            ) : logs.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">No activity yet</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-left">
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">When</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Who</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Action</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Target</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => {
                                    const colorClass = ACTION_COLORS[log.action] || "text-gray-400 bg-gray-500/10";
                                    return (
                                        <tr key={log._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{formatTime(log.timestamp)}</td>
                                            <td className="px-5 py-3">
                                                <div className="text-xs font-bold text-brand-navy">{log.actor}</div>
                                                {log.actorEmail && <div className="text-[10px] text-gray-400">{log.actorEmail}</div>}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${colorClass}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-xs text-gray-700 max-w-[200px] truncate">{log.target || "—"}</td>
                                            <td className="px-5 py-3 text-xs text-gray-500 max-w-[250px] truncate">{log.details || "—"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
