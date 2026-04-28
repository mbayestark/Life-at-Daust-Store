import React, { useState, useEffect, useCallback, useRef } from "react";
import { formatPrice } from "../utils/format.js";

const STORAGE_KEYS = {
  TABLET_NAME: "dashop.pos.tabletName",
  INVENTORY: "dashop.pos.inventory",
  SALES: "dashop.pos.sales",
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Setup Screen: Tablet Identity ---
function TabletSetup({ onComplete }) {
  const [name, setName] = useState("");

  return (
    <div className="pos-bg min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <h1 className="font-[var(--font-heading)] text-4xl font-extrabold text-white tracking-tight mb-2">
          DA<span className="text-[var(--color-brand-orange)]">SHOP</span>
        </h1>
        <p className="text-zinc-400 mb-8 text-lg">Point of Sale</p>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8">
          <label className="block text-left text-zinc-300 text-sm font-medium mb-2">
            Tablet / Seller Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Table 1 — Awa"
            autoFocus
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-lg
                       placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)] mb-6"
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) onComplete(name.trim());
            }}
          />
          <button
            disabled={!name.trim()}
            onClick={() => onComplete(name.trim())}
            className="w-full bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-light)]
                       disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg
                       rounded-xl py-3.5 transition-all active:scale-[0.97]"
          >
            Start Selling
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Inventory Setup Screen (Admin) ---
function InventorySetup({ onComplete }) {
  const [items, setItems] = useState([
    { id: crypto.randomUUID(), name: "", price: "", stock: "" },
  ]);

  function updateItem(id, field, value) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  }

  function addRow() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", price: "", stock: "" },
    ]);
  }

  function removeRow(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function submit() {
    const valid = items
      .filter((it) => it.name.trim() && Number(it.price) > 0 && Number(it.stock) > 0)
      .map((it) => ({
        id: it.id,
        name: it.name.trim(),
        price: Number(it.price),
        initialStock: Number(it.stock),
        sold: 0,
      }));
    if (valid.length === 0) return;
    onComplete(valid);
  }

  const allValid = items.some(
    (it) => it.name.trim() && Number(it.price) > 0 && Number(it.stock) > 0
  );

  return (
    <div className="pos-bg min-h-dvh p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-[var(--font-heading)] text-3xl font-extrabold text-white tracking-tight mb-1">
          Set Inventory
        </h1>
        <p className="text-zinc-400 mb-6">Add items you'll sell today.</p>

        <div className="space-y-3 mb-6">
          {items.map((it, i) => (
            <div
              key={it.id}
              className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-wrap gap-3 items-end"
            >
              <div className="flex-1 min-w-[140px]">
                {i === 0 && (
                  <label className="block text-zinc-400 text-xs mb-1">Item Name</label>
                )}
                <input
                  type="text"
                  value={it.name}
                  onChange={(e) => updateItem(it.id, "name", e.target.value)}
                  placeholder="Black Hoodie"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-base
                             placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]"
                />
              </div>
              <div className="w-28">
                {i === 0 && (
                  <label className="block text-zinc-400 text-xs mb-1">Price (CFA)</label>
                )}
                <input
                  type="number"
                  value={it.price}
                  onChange={(e) => updateItem(it.id, "price", e.target.value)}
                  placeholder="7500"
                  min="0"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-base
                             placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]"
                />
              </div>
              <div className="w-24">
                {i === 0 && (
                  <label className="block text-zinc-400 text-xs mb-1">Stock</label>
                )}
                <input
                  type="number"
                  value={it.stock}
                  onChange={(e) => updateItem(it.id, "stock", e.target.value)}
                  placeholder="20"
                  min="0"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-base
                             placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]"
                />
              </div>
              {items.length > 1 && (
                <button
                  onClick={() => removeRow(it.id)}
                  className="text-zinc-500 hover:text-red-400 transition-colors p-2"
                  aria-label="Remove item"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={addRow}
            className="flex-1 border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white
                       font-medium rounded-xl py-3 transition-all"
          >
            + Add Item
          </button>
          <button
            disabled={!allValid}
            onClick={submit}
            className="flex-1 bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-light)]
                       disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold
                       rounded-xl py-3 transition-all active:scale-[0.97]"
          >
            Start Selling
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Stock level color ---
function stockColor(sold, initial) {
  const remaining = initial - sold;
  const pct = remaining / initial;
  if (pct <= 0) return "text-red-500";
  if (pct <= 0.2) return "text-red-400";
  if (pct <= 0.4) return "text-amber-400";
  return "text-emerald-400";
}

function stockBorder(sold, initial) {
  const remaining = initial - sold;
  const pct = remaining / initial;
  if (pct <= 0) return "border-red-500/40";
  if (pct <= 0.2) return "border-red-400/30";
  if (pct <= 0.4) return "border-amber-400/30";
  return "border-zinc-700";
}

// --- Main Selling Screen ---
function SellingDashboard({ inventory, setInventory, tabletName, sales, setSales, onReset }) {
  const [undoSale, setUndoSale] = useState(null);
  const undoTimerRef = useRef(null);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  function showToast(msg) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }

  function sell(itemId) {
    const item = inventory.find((it) => it.id === itemId);
    if (!item || item.sold >= item.initialStock) return;

    const sale = {
      id: crypto.randomUUID(),
      itemId,
      itemName: item.name,
      price: item.price,
      tablet: tabletName,
      timestamp: Date.now(),
    };

    const newInventory = inventory.map((it) =>
      it.id === itemId ? { ...it, sold: it.sold + 1 } : it
    );
    setInventory(newInventory);
    saveJSON(STORAGE_KEYS.INVENTORY, newInventory);

    const newSales = [...sales, sale];
    setSales(newSales);
    saveJSON(STORAGE_KEYS.SALES, newSales);

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoSale(sale);
    setUndoCountdown(30);
    undoTimerRef.current = setTimeout(() => {
      setUndoSale(null);
      setUndoCountdown(0);
    }, 30000);

    showToast(`Sold 1x ${item.name}`);
  }

  useEffect(() => {
    if (!undoSale) return;
    const interval = setInterval(() => {
      setUndoCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [undoSale]);

  function handleUndo() {
    if (!undoSale) return;

    const newInventory = inventory.map((it) =>
      it.id === undoSale.itemId ? { ...it, sold: Math.max(0, it.sold - 1) } : it
    );
    setInventory(newInventory);
    saveJSON(STORAGE_KEYS.INVENTORY, newInventory);

    const newSales = sales.filter((s) => s.id !== undoSale.id);
    setSales(newSales);
    saveJSON(STORAGE_KEYS.SALES, newSales);

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoSale(null);
    setUndoCountdown(0);
    showToast("Sale undone");
  }

  const totalRevenue = sales.reduce((sum, s) => sum + s.price, 0);
  const totalSold = sales.length;

  if (showReport) {
    return (
      <ReportView
        inventory={inventory}
        sales={sales}
        tabletName={tabletName}
        onBack={() => setShowReport(false)}
      />
    );
  }

  return (
    <div className="pos-bg min-h-dvh flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <h1 className="font-[var(--font-heading)] text-xl font-extrabold text-white tracking-tight">
            DA<span className="text-[var(--color-brand-orange)]">SHOP</span>
          </h1>
          <span className="text-zinc-500 text-sm hidden sm:inline">|</span>
          <span className="text-zinc-400 text-sm hidden sm:inline">{tabletName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-3 hidden sm:block">
            <div className="text-zinc-400 text-xs">Revenue</div>
            <div className="text-white font-bold text-sm">{formatPrice(totalRevenue)}</div>
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium
                       rounded-lg px-3 py-2 transition-all"
          >
            Report
          </button>
          <button
            onClick={onReset}
            className="text-zinc-500 hover:text-zinc-300 text-sm px-2 py-2 transition-all"
            title="Reset"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile revenue bar */}
      <div className="sm:hidden flex items-center justify-between px-4 py-2 bg-zinc-900/60 border-b border-zinc-800">
        <span className="text-zinc-400 text-xs">{tabletName}</span>
        <span className="text-white font-bold text-sm">{totalSold} sold &middot; {formatPrice(totalRevenue)}</span>
      </div>

      {/* Item Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {inventory.map((item) => {
            const remaining = item.initialStock - item.sold;
            const outOfStock = remaining <= 0;

            return (
              <button
                key={item.id}
                onClick={() => sell(item.id)}
                disabled={outOfStock}
                className={`relative flex flex-col items-center justify-center rounded-2xl p-5 min-h-[140px]
                           border-2 transition-all active:scale-[0.95]
                           ${outOfStock
                    ? "bg-zinc-900/50 border-zinc-800 opacity-50 cursor-not-allowed"
                    : `bg-zinc-900/80 hover:bg-zinc-800/80 ${stockBorder(item.sold, item.initialStock)} cursor-pointer`
                  }`}
              >
                <span className="text-white font-bold text-lg text-center leading-tight mb-2">
                  {item.name}
                </span>
                <span className="text-zinc-400 text-sm mb-1">{formatPrice(item.price)}</span>
                <span className={`font-extrabold text-2xl ${stockColor(item.sold, item.initialStock)}`}>
                  {remaining}
                </span>
                <span className="text-zinc-500 text-xs">left</span>
                {outOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60">
                    <span className="text-red-400 font-bold text-lg -rotate-12">SOLD OUT</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Undo bar */}
      {undoSale && (
        <div className="sticky bottom-0 z-30 px-4 py-3 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800
                        flex items-center justify-between">
          <span className="text-zinc-300 text-sm">
            Sold <strong>{undoSale.itemName}</strong>
          </span>
          <button
            onClick={handleUndo}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold text-sm
                       rounded-lg px-4 py-2 transition-all flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" /><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6.69 3L3 13" />
            </svg>
            Undo ({undoCountdown}s)
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600/90 backdrop-blur text-white
                        font-medium text-sm rounded-full px-5 py-2 shadow-lg animate-fade-in pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}

// --- End-of-Day Report ---
function ReportView({ inventory, sales, tabletName, onBack }) {
  const itemStats = inventory.map((item) => {
    const itemSales = sales.filter((s) => s.itemId === item.id);
    return {
      ...item,
      totalSold: itemSales.length,
      revenue: itemSales.reduce((sum, s) => sum + s.price, 0),
      remaining: item.initialStock - item.sold,
    };
  });

  const totalRevenue = sales.reduce((sum, s) => sum + s.price, 0);
  const totalSold = sales.length;
  const totalRemaining = inventory.reduce(
    (sum, it) => sum + (it.initialStock - it.sold),
    0
  );

  function exportCSV() {
    const header = "Item,Price,Sold,Revenue,Remaining\n";
    const rows = itemStats
      .map((it) => `"${it.name}",${it.price},${it.totalSold},${it.revenue},${it.remaining}`)
      .join("\n");
    const footer = `\n\nTotal,,${totalSold},${totalRevenue},${totalRemaining}\nTablet,${tabletName}\nExported,${new Date().toLocaleString()}`;

    const blob = new Blob([header + rows + footer], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashop-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="pos-bg min-h-dvh p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={onBack}
              className="text-zinc-400 hover:text-white text-sm mb-2 flex items-center gap-1 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="font-[var(--font-heading)] text-2xl font-extrabold text-white">
              End-of-Day Report
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              {tabletName} &middot; {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-light)]
                       text-white font-semibold text-sm rounded-lg px-4 py-2.5 transition-all active:scale-[0.97]"
          >
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-zinc-400 text-xs mb-1">Total Revenue</div>
            <div className="text-white font-extrabold text-xl">{formatPrice(totalRevenue)}</div>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-zinc-400 text-xs mb-1">Items Sold</div>
            <div className="text-white font-extrabold text-xl">{totalSold}</div>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-zinc-400 text-xs mb-1">Stock Left</div>
            <div className="text-white font-extrabold text-xl">{totalRemaining}</div>
          </div>
        </div>

        {/* Per-item breakdown */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-zinc-400 text-xs font-medium px-4 py-3">Item</th>
                <th className="text-zinc-400 text-xs font-medium px-4 py-3 text-right">Price</th>
                <th className="text-zinc-400 text-xs font-medium px-4 py-3 text-right">Sold</th>
                <th className="text-zinc-400 text-xs font-medium px-4 py-3 text-right">Revenue</th>
                <th className="text-zinc-400 text-xs font-medium px-4 py-3 text-right">Left</th>
              </tr>
            </thead>
            <tbody>
              {itemStats.map((item) => (
                <tr key={item.id} className="border-b border-zinc-800/50 last:border-0">
                  <td className="text-white font-medium px-4 py-3 text-sm">{item.name}</td>
                  <td className="text-zinc-300 px-4 py-3 text-sm text-right">{formatPrice(item.price)}</td>
                  <td className="text-white font-semibold px-4 py-3 text-sm text-right">{item.totalSold}</td>
                  <td className="text-emerald-400 font-semibold px-4 py-3 text-sm text-right">
                    {formatPrice(item.revenue)}
                  </td>
                  <td className={`font-semibold px-4 py-3 text-sm text-right ${stockColor(item.sold, item.initialStock)}`}>
                    {item.remaining}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-700 bg-zinc-800/30">
                <td className="text-white font-bold px-4 py-3 text-sm">Total</td>
                <td className="px-4 py-3"></td>
                <td className="text-white font-bold px-4 py-3 text-sm text-right">{totalSold}</td>
                <td className="text-emerald-400 font-bold px-4 py-3 text-sm text-right">
                  {formatPrice(totalRevenue)}
                </td>
                <td className="text-white font-bold px-4 py-3 text-sm text-right">{totalRemaining}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Sales log */}
        {sales.length > 0 && (
          <div className="mt-6">
            <h2 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">
              Sales Log ({sales.length})
            </h2>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl max-h-64 overflow-y-auto">
              {[...sales].reverse().map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/50 last:border-0"
                >
                  <span className="text-white text-sm">{sale.itemName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-300 text-sm">{formatPrice(sale.price)}</span>
                    <span className="text-zinc-500 text-xs">
                      {new Date(sale.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Reset Confirmation Modal ---
function ResetModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm text-center">
        <h2 className="text-white font-bold text-lg mb-2">Reset Everything?</h2>
        <p className="text-zinc-400 text-sm mb-6">
          This will clear all inventory, sales data, and tablet name. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl py-3 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl py-3 transition-all active:scale-[0.97]"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main POS Component ---
export default function SalesDashboard() {
  const [tabletName, setTabletName] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.TABLET_NAME) || ""
  );
  const [inventory, setInventory] = useState(() =>
    loadJSON(STORAGE_KEYS.INVENTORY, null)
  );
  const [sales, setSales] = useState(() =>
    loadJSON(STORAGE_KEYS.SALES, [])
  );
  const [showResetModal, setShowResetModal] = useState(false);

  function handleTabletSetup(name) {
    localStorage.setItem(STORAGE_KEYS.TABLET_NAME, name);
    setTabletName(name);
  }

  function handleInventorySetup(items) {
    saveJSON(STORAGE_KEYS.INVENTORY, items);
    saveJSON(STORAGE_KEYS.SALES, []);
    setInventory(items);
    setSales([]);
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEYS.TABLET_NAME);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    setTabletName("");
    setInventory(null);
    setSales([]);
    setShowResetModal(false);
  }

  // Step 1: Tablet name
  if (!tabletName) {
    return <TabletSetup onComplete={handleTabletSetup} />;
  }

  // Step 2: Inventory
  if (!inventory) {
    return <InventorySetup onComplete={handleInventorySetup} />;
  }

  // Step 3: Selling
  return (
    <>
      <SellingDashboard
        inventory={inventory}
        setInventory={setInventory}
        tabletName={tabletName}
        sales={sales}
        setSales={setSales}
        onReset={() => setShowResetModal(true)}
      />
      {showResetModal && (
        <ResetModal
          onConfirm={handleReset}
          onCancel={() => setShowResetModal(false)}
        />
      )}
    </>
  );
}
