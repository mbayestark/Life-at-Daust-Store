import React, { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAdmin } from "../../context/AdminContext";
import { ClipboardList, Search, Filter, ChevronDown, ChevronRight, X } from "lucide-react";

const ACTION_COLORS = {
    "auth": "text-blue-400 bg-blue-500/10",
    "user": "text-purple-400 bg-purple-500/10",
    "product": "text-green-400 bg-green-500/10",
    "product_set": "text-emerald-400 bg-emerald-500/10",
    "order": "text-amber-400 bg-amber-500/10",
    "collection": "text-cyan-400 bg-cyan-500/10",
    "media": "text-pink-400 bg-pink-500/10",
    "settings": "text-indigo-400 bg-indigo-500/10",
    "webhook": "text-orange-400 bg-orange-500/10",
};

const SEVERITY = {
    "delete": "border-l-red-400",
    "clear_all": "border-l-red-400",
    "create": "border-l-green-400",
    "login": "border-l-blue-400",
};

function getCategory(action) {
    return action.split(".")[0];
}

function getColorClass(action) {
    return ACTION_COLORS[getCategory(action)] || "text-gray-400 bg-gray-500/10";
}

function getSeverityClass(action) {
    const verb = action.split(".").slice(1).join(".");
    return SEVERITY[verb] || "border-l-transparent";
}

function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    if (diffMs < 60000) return "Just now";
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    if (d.toDateString() === new Date(now - 86400000).toDateString()) return "Yesterday " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatFullTime(ts) {
    return new Date(ts).toLocaleString("en-US", {
        weekday: "short", year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
}

function humanizeAction(action) {
    const [cat, ...rest] = action.split(".");
    const verb = rest.join(" ");
    const labels = {
        auth: "Auth", user: "User", product: "Product", product_set: "Bundle",
        order: "Order", collection: "Collection", media: "Media",
        settings: "Settings", webhook: "Webhook",
    };
    return `${labels[cat] || cat} — ${verb.replace(/_/g, " ")}`;
}

export default function AuditLog() {
    const { adminToken } = useAdmin();
    const logs = useQuery(api.auth.listAuditLogs, adminToken ? { adminToken, limit: 500 } : "skip");

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [actorFilter, setActorFilter] = useState("all");
    const [expandedId, setExpandedId] = useState(null);

    const categories = useMemo(() => {
        if (!logs) return [];
        return [...new Set(logs.map((l) => getCategory(l.action)))].sort();
    }, [logs]);

    const actors = useMemo(() => {
        if (!logs) return [];
        return [...new Set(logs.map((l) => l.actor))].sort();
    }, [logs]);

    const filtered = useMemo(() => {
        if (!logs) return [];
        return logs.filter((log) => {
            if (categoryFilter !== "all" && getCategory(log.action) !== categoryFilter) return false;
            if (actorFilter !== "all" && log.actor !== actorFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                return (
                    log.action.toLowerCase().includes(q) ||
                    log.actor.toLowerCase().includes(q) ||
                    (log.target || "").toLowerCase().includes(q) ||
                    (log.details || "").toLowerCase().includes(q) ||
                    (log.actorEmail || "").toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [logs, search, categoryFilter, actorFilter]);

    const hasFilters = search || categoryFilter !== "all" || actorFilter !== "all";

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <ClipboardList className="text-brand-orange" size={24} />
                    <h1 className="text-2xl font-bold text-brand-navy">Audit Log</h1>
                    {logs && (
                        <span className="text-xs text-gray-400 font-bold">
                            {hasFilters ? `${filtered.length} / ${logs.length}` : logs.length} entries
                        </span>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder="Search actions, targets, details..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange"
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    <Filter size={14} className="text-gray-400" />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                    >
                        <option value="all">All categories</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    <select
                        value={actorFilter}
                        onChange={(e) => setActorFilter(e.target.value)}
                        className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                    >
                        <option value="all">All actors</option>
                        {actors.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>

                    {hasFilters && (
                        <button
                            onClick={() => { setSearch(""); setCategoryFilter("all"); setActorFilter("all"); }}
                            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                        >
                            <X size={12} /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            {!logs ? (
                <div className="text-gray-400 text-center py-12">Loading...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">{hasFilters ? "No matching entries" : "No activity yet"}</p>
                    {hasFilters && <p className="text-xs mt-1">Try adjusting your filters</p>}
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-left">
                                    <th className="w-8"></th>
                                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">When</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Who</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Action</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Target</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((log) => {
                                    const isExpanded = expandedId === log._id;
                                    const hasDetails = log.details || log.target;
                                    return (
                                        <React.Fragment key={log._id}>
                                            <tr
                                                className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors border-l-2 ${getSeverityClass(log.action)} ${hasDetails ? "cursor-pointer" : ""}`}
                                                onClick={() => hasDetails && setExpandedId(isExpanded ? null : log._id)}
                                            >
                                                <td className="pl-3 py-3 text-gray-300">
                                                    {hasDetails ? (
                                                        isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap" title={formatFullTime(log.timestamp)}>
                                                    {formatTime(log.timestamp)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-xs font-bold text-brand-navy">{log.actor}</div>
                                                    {log.actorEmail && <div className="text-[10px] text-gray-400">{log.actorEmail}</div>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${getColorClass(log.action)}`}>
                                                        {humanizeAction(log.action)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-700 max-w-[250px] truncate">{log.target || "—"}</td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-gray-50/80">
                                                    <td></td>
                                                    <td colSpan={4} className="px-4 py-3">
                                                        <div className="text-xs space-y-1.5">
                                                            <div className="flex gap-6">
                                                                <div>
                                                                    <span className="text-gray-400 font-bold">Timestamp: </span>
                                                                    <span className="text-gray-600">{formatFullTime(log.timestamp)}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-400 font-bold">Action: </span>
                                                                    <span className="text-gray-600 font-mono">{log.action}</span>
                                                                </div>
                                                            </div>
                                                            {log.target && (
                                                                <div>
                                                                    <span className="text-gray-400 font-bold">Target: </span>
                                                                    <span className="text-gray-600">{log.target}</span>
                                                                </div>
                                                            )}
                                                            {log.details && (
                                                                <div>
                                                                    <span className="text-gray-400 font-bold">Details: </span>
                                                                    <span className="text-gray-600">{log.details}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
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
