import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatPrice } from "../utils/format.js";
import {
  Plus, Minus, ShoppingCart, X, Trash2,
  Download, ArrowLeft, Settings, Search, Package, PenLine, ChevronRight,
  Undo2, Check, Smartphone,
} from "lucide-react";

const STORAGE_KEYS = {
  TABLET_NAME: "dashop.pos.tabletName",
  INVENTORY: "dashop.pos.inventory",
  CART: "dashop.pos.cart",
  ORDERS: "dashop.pos.orders",
};

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", image: "/assets/paymentIcons/cash.webp" },
  { id: "wave", label: "Wave", image: "/assets/paymentIcons/wave.png" },
  { id: "orange_money", label: "Orange Money", image: "/assets/paymentIcons/OM.png" },
  { id: "free_money", label: "Free Money", icon: Smartphone },
];

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

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

function migrateLegacySales() {
  const legacy = loadJSON("dashop.pos.sales", null);
  if (!legacy || legacy.length === 0) return [];
  const orders = legacy.map((s) => ({
    id: s.id,
    items: [{ itemId: s.itemId, itemName: s.itemName, price: s.price, qty: 1 }],
    total: s.price,
    paymentMethod: "cash",
    tablet: s.tablet,
    timestamp: s.timestamp,
  }));
  saveJSON(STORAGE_KEYS.ORDERS, orders);
  localStorage.removeItem("dashop.pos.sales");
  return orders;
}

// --------------- Setup Screen: Tablet Identity ---------------
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

// --------------- Inventory Setup Screen ---------------
function InventorySetup({ onComplete }) {
  const isOnline = useOnlineStatus();
  const [tab, setTab] = useState(isOnline ? "import" : "manual");
  const [manualItems, setManualItems] = useState([
    { id: crypto.randomUUID(), name: "", price: "", stock: "" },
  ]);
  const [selectedConvex, setSelectedConvex] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  const convexProducts = useQuery(api.products.list);
  const isLoading = convexProducts === undefined;

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setLoadTimedOut(true), 6000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const categories = useMemo(() => {
    if (!convexProducts) return [];
    const cats = [...new Set(convexProducts.map((p) => p.category))];
    return cats.sort();
  }, [convexProducts]);

  const filteredProducts = useMemo(() => {
    if (!convexProducts) return [];
    return convexProducts.filter((p) => {
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === "all" || p.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [convexProducts, searchQuery, categoryFilter]);

  function toggleProduct(product) {
    setSelectedConvex((prev) => {
      const copy = { ...prev };
      if (copy[product._id]) {
        delete copy[product._id];
      } else {
        copy[product._id] = {
          convexId: product._id,
          name: product.name,
          price: product.price,
          stock: product.stock ?? 20,
          image: product.image || null,
          category: product.category,
        };
      }
      return copy;
    });
  }

  function updateConvexStock(id, stock) {
    setSelectedConvex((prev) => ({
      ...prev,
      [id]: { ...prev[id], stock: Math.max(0, Number(stock) || 0) },
    }));
  }

  // Manual entry helpers
  function updateManualItem(id, field, value) {
    setManualItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  }

  function addManualRow() {
    setManualItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", price: "", stock: "" },
    ]);
  }

  function removeManualRow(id) {
    setManualItems((prev) => prev.filter((it) => it.id !== id));
  }

  function submit() {
    const items = [];

    // Add imported products
    Object.values(selectedConvex).forEach((p) => {
      if (p.stock > 0) {
        items.push({
          id: crypto.randomUUID(),
          name: p.name,
          price: p.price,
          initialStock: p.stock,
          sold: 0,
          image: p.image,
          source: "convex",
          convexId: p.convexId,
        });
      }
    });

    // Add manual items
    manualItems
      .filter((it) => it.name.trim() && Number(it.price) > 0 && Number(it.stock) > 0)
      .forEach((it) => {
        items.push({
          id: it.id,
          name: it.name.trim(),
          price: Number(it.price),
          initialStock: Number(it.stock),
          sold: 0,
          image: null,
          source: "manual",
          convexId: null,
        });
      });

    if (items.length === 0) return;
    onComplete(items);
  }

  const totalSelected = Object.keys(selectedConvex).length;
  const hasManualValid = manualItems.some(
    (it) => it.name.trim() && Number(it.price) > 0 && Number(it.stock) > 0
  );
  const canSubmit = totalSelected > 0 || hasManualValid;

  return (
    <div className="pos-bg min-h-dvh p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-[var(--font-heading)] text-3xl font-extrabold text-white tracking-tight mb-1">
          Set Inventory
        </h1>
        <p className="text-zinc-400 mb-6">Choose items you'll sell today.</p>

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("import")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "import"
                ? "bg-[var(--color-brand-orange)] text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <Package size={16} />
            Import from Shop
            {totalSelected > 0 && (
              <span className="bg-white/20 text-white text-xs font-bold rounded-full px-2 py-0.5 ml-1">
                {totalSelected}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("manual")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === "manual"
                ? "bg-[var(--color-brand-orange)] text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <PenLine size={16} />
            Manual Entry
            {hasManualValid && (
              <span className="bg-white/20 text-white text-xs font-bold rounded-full px-2 py-0.5 ml-1">
                {manualItems.filter((it) => it.name.trim() && Number(it.price) > 0 && Number(it.stock) > 0).length}
              </span>
            )}
          </button>
        </div>

        {/* ---- Import Tab ---- */}
        {tab === "import" && (
          <div>
            {/* Search + Category Filter */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm
                             placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Product Grid */}
            {isLoading && !loadTimedOut && isOnline ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 h-44 animate-pulse">
                    <div className="bg-zinc-800 rounded-lg w-full h-20 mb-3" />
                    <div className="bg-zinc-800 rounded h-4 w-3/4 mb-2" />
                    <div className="bg-zinc-800 rounded h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : isLoading && (!isOnline || loadTimedOut) ? (
              <div className="text-center py-16">
                <div className="text-zinc-500 text-4xl mb-3">
                  {isOnline ? "⏳" : "📡"}
                </div>
                <p className="text-zinc-300 font-semibold mb-1">
                  {isOnline ? "Could not load products" : "You're offline"}
                </p>
                <p className="text-zinc-500 text-sm mb-4">
                  Switch to Manual Entry to add items without internet.
                </p>
                <button
                  onClick={() => setTab("manual")}
                  className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-light)]
                             text-white font-semibold text-sm rounded-xl px-5 py-2.5 transition-all"
                >
                  Use Manual Entry
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center text-zinc-500 py-16">
                {searchQuery || categoryFilter !== "all"
                  ? "No products match your search."
                  : "No products in the shop yet."}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredProducts.map((product) => {
                  const isSelected = !!selectedConvex[product._id];
                  return (
                    <div
                      key={product._id}
                      className={`relative bg-zinc-900/80 border-2 rounded-xl overflow-hidden transition-all cursor-pointer
                        ${isSelected ? "border-[var(--color-brand-orange)] ring-1 ring-[var(--color-brand-orange)]/30" : "border-zinc-800 hover:border-zinc-600"}`}
                    >
                      <div onClick={() => toggleProduct(product)} className="p-3">
                        {product.image && (
                          <div className="w-full h-20 rounded-lg overflow-hidden mb-2 bg-zinc-800">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <p className="text-white font-semibold text-sm leading-tight truncate">{product.name}</p>
                        <p className="text-zinc-400 text-xs mt-0.5">{formatPrice(product.price)}</p>
                        <p className="text-zinc-500 text-xs">{product.category}</p>
                      </div>

                      {isSelected && (
                        <>
                          <div className="absolute top-2 right-2 bg-[var(--color-brand-orange)] rounded-full w-6 h-6 flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                          <div className="px-3 pb-3 flex items-center gap-2">
                            <label className="text-zinc-400 text-xs whitespace-nowrap">Stock:</label>
                            <input
                              type="number"
                              value={selectedConvex[product._id].stock}
                              onChange={(e) => updateConvexStock(product._id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              min="1"
                              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-2 py-1.5 text-sm
                                         focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected summary */}
            {totalSelected > 0 && (
              <div className="mt-4 bg-zinc-800/50 border border-zinc-700 rounded-xl p-3">
                <p className="text-zinc-300 text-sm">
                  <span className="text-[var(--color-brand-orange)] font-bold">{totalSelected}</span> product{totalSelected !== 1 ? "s" : ""} selected from shop
                </p>
              </div>
            )}
          </div>
        )}

        {/* ---- Manual Tab ---- */}
        {tab === "manual" && (
          <div>
            <div className="space-y-3 mb-6">
              {manualItems.map((it, i) => (
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
                      onChange={(e) => updateManualItem(it.id, "name", e.target.value)}
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
                      onChange={(e) => updateManualItem(it.id, "price", e.target.value)}
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
                      onChange={(e) => updateManualItem(it.id, "stock", e.target.value)}
                      placeholder="20"
                      min="0"
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-base
                                 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]"
                    />
                  </div>
                  {manualItems.length > 1 && (
                    <button
                      onClick={() => removeManualRow(it.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-2"
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addManualRow}
              className="w-full border border-dashed border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white
                         font-medium rounded-xl py-3 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>
        )}

        {/* Submit */}
        <div className="mt-8">
          <button
            disabled={!canSubmit}
            onClick={submit}
            className="w-full bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-light)]
                       disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg
                       rounded-xl py-3.5 transition-all active:scale-[0.97]"
          >
            Start Selling ({totalSelected + (hasManualValid ? manualItems.filter((it) => it.name.trim() && Number(it.price) > 0 && Number(it.stock) > 0).length : 0)} items)
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------- Stock Colors ---------------
function stockColor(sold, initial, cartQty = 0) {
  const remaining = initial - sold - cartQty;
  const pct = remaining / initial;
  if (pct <= 0) return "text-red-500";
  if (pct <= 0.2) return "text-red-400";
  if (pct <= 0.4) return "text-amber-400";
  return "text-emerald-400";
}

function stockBorder(sold, initial, cartQty = 0) {
  const remaining = initial - sold - cartQty;
  const pct = remaining / initial;
  if (pct <= 0) return "border-red-500/40";
  if (pct <= 0.2) return "border-red-400/30";
  if (pct <= 0.4) return "border-amber-400/30";
  return "border-zinc-700";
}

// --------------- Cart Panel ---------------
function CartPanel({ cart, inventory, onUpdateQty, onRemove, onClose, onCheckout }) {
  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
      <div className="flex-1 bg-black/60 backdrop-blur-sm" />
      <div
        className="bg-zinc-950 border-t border-zinc-800 rounded-t-2xl max-h-[85dvh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-[var(--color-brand-orange)]" />
            <h2 className="text-white font-bold text-lg">Cart</h2>
            <span className="bg-zinc-800 text-zinc-300 text-xs font-bold rounded-full px-2 py-0.5">
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
            <X size={22} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-zinc-500 py-12">Cart is empty</div>
          ) : (
            cart.map((item) => {
              const inv = inventory.find((it) => it.id === item.itemId);
              const maxQty = inv ? inv.initialStock - inv.sold : item.qty;
              return (
                <div key={item.itemId} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.itemName}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{item.itemName}</p>
                      <p className="text-zinc-400 text-xs mt-0.5">{formatPrice(item.price)} each</p>
                    </div>
                    <button
                      onClick={() => onRemove(item.itemId)}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    {/* Qty Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateQty(item.itemId, -1)}
                        className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white
                                   flex items-center justify-center transition-all active:scale-90"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-10 text-center text-white font-bold text-lg">{item.qty}</span>
                      <button
                        onClick={() => onUpdateQty(item.itemId, 1)}
                        disabled={item.qty >= maxQty}
                        className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white
                                   disabled:opacity-30 disabled:cursor-not-allowed
                                   flex items-center justify-center transition-all active:scale-90"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="text-[var(--color-brand-orange)] font-bold text-sm">
                      {formatPrice(item.price * item.qty)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-5 py-4 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-zinc-400 text-sm">Total</span>
              <span className="text-white font-extrabold text-xl">{formatPrice(cartTotal)}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-light)]
                         text-white font-bold text-lg rounded-xl py-3.5 transition-all active:scale-[0.97]
                         flex items-center justify-center gap-2"
            >
              Confirm Order
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------- Payment Method Modal ---------------
function PaymentMethodModal({ cart, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(null);
  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-white font-bold text-lg mb-1">Payment Method</h2>
        <p className="text-zinc-400 text-sm mb-5">
          Order total: <span className="text-white font-semibold">{formatPrice(cartTotal)}</span>
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {PAYMENT_METHODS.map((pm) => {
            const Icon = pm.icon;
            const isActive = selected === pm.id;
            return (
              <button
                key={pm.id}
                onClick={() => setSelected(pm.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                  ${isActive
                    ? "border-[var(--color-brand-orange)] bg-[var(--color-brand-orange)]/10 text-white"
                    : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500 hover:text-white"
                  }`}
              >
                {pm.image ? (
                  <img src={pm.image} alt={pm.label} className="w-8 h-8 object-contain" />
                ) : (
                  Icon && <Icon size={24} />
                )}
                <span className="text-sm font-semibold">{pm.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl py-3 transition-all"
          >
            Back
          </button>
          <button
            disabled={!selected}
            onClick={() => onConfirm(selected)}
            className="flex-1 bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-light)]
                       disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold
                       rounded-xl py-3 transition-all active:scale-[0.97]"
          >
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------- Main Selling Screen ---------------
function SellingDashboard({ inventory, setInventory, tabletName, orders, setOrders, onReset }) {
  const [cart, setCart] = useState(() => loadJSON(STORAGE_KEYS.CART, []));
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [undoOrder, setUndoOrder] = useState(null);
  const undoTimerRef = useRef(null);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");

  const cartItemCount = cart.reduce((sum, c) => sum + c.qty, 0);
  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  const cartByItemId = useMemo(() => {
    const map = {};
    cart.forEach((c) => { map[c.itemId] = c.qty; });
    return map;
  }, [cart]);

  const filteredInventory = useMemo(() => {
    if (!searchQuery) return inventory;
    return inventory.filter((it) =>
      it.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventory, searchQuery]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalSold = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0);

  function showToastMsg(msg) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }

  function addToCart(itemId) {
    const item = inventory.find((it) => it.id === itemId);
    if (!item) return;
    const inCart = cartByItemId[itemId] || 0;
    const remaining = item.initialStock - item.sold - inCart;
    if (remaining <= 0) return;

    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === itemId);
      const updated = existing
        ? prev.map((c) => c.itemId === itemId ? { ...c, qty: c.qty + 1 } : c)
        : [...prev, { itemId, itemName: item.name, price: item.price, qty: 1, image: item.image || null }];
      saveJSON(STORAGE_KEYS.CART, updated);
      return updated;
    });
    showToastMsg(`Added ${item.name}`);
  }

  function updateCartQty(itemId, delta) {
    setCart((prev) => {
      const updated = prev
        .map((c) => {
          if (c.itemId !== itemId) return c;
          const newQty = c.qty + delta;
          if (newQty <= 0) return null;
          const item = inventory.find((it) => it.id === itemId);
          const maxQty = item ? item.initialStock - item.sold : c.qty;
          return { ...c, qty: Math.min(newQty, maxQty) };
        })
        .filter(Boolean);
      saveJSON(STORAGE_KEYS.CART, updated);
      return updated;
    });
  }

  function removeFromCart(itemId) {
    setCart((prev) => {
      const updated = prev.filter((c) => c.itemId !== itemId);
      saveJSON(STORAGE_KEYS.CART, updated);
      return updated;
    });
  }

  function confirmOrder(paymentMethod) {
    const order = {
      id: crypto.randomUUID(),
      items: cart.map((c) => ({
        itemId: c.itemId,
        itemName: c.itemName,
        price: c.price,
        qty: c.qty,
      })),
      total: cartTotal,
      paymentMethod,
      tablet: tabletName,
      timestamp: Date.now(),
    };

    const newInventory = inventory.map((item) => {
      const cartItem = cart.find((c) => c.itemId === item.id);
      if (!cartItem) return item;
      return { ...item, sold: item.sold + cartItem.qty };
    });
    setInventory(newInventory);
    saveJSON(STORAGE_KEYS.INVENTORY, newInventory);

    const newOrders = [...orders, order];
    setOrders(newOrders);
    saveJSON(STORAGE_KEYS.ORDERS, newOrders);

    setCart([]);
    saveJSON(STORAGE_KEYS.CART, []);

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoOrder(order);
    setUndoCountdown(30);
    undoTimerRef.current = setTimeout(() => {
      setUndoOrder(null);
      setUndoCountdown(0);
    }, 30000);

    setShowPayment(false);
    setShowCart(false);

    const summary = order.items.map((i) => `${i.qty}x ${i.itemName}`).join(", ");
    showToastMsg(`Sold: ${summary}`);
  }

  useEffect(() => {
    if (!undoOrder) return;
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
  }, [undoOrder]);

  function handleUndo() {
    if (!undoOrder) return;

    const newInventory = inventory.map((item) => {
      const orderItem = undoOrder.items.find((oi) => oi.itemId === item.id);
      if (!orderItem) return item;
      return { ...item, sold: Math.max(0, item.sold - orderItem.qty) };
    });
    setInventory(newInventory);
    saveJSON(STORAGE_KEYS.INVENTORY, newInventory);

    const newOrders = orders.filter((o) => o.id !== undoOrder.id);
    setOrders(newOrders);
    saveJSON(STORAGE_KEYS.ORDERS, newOrders);

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoOrder(null);
    setUndoCountdown(0);
    showToastMsg("Order undone");
  }

  const [showReport, setShowReport] = useState(false);
  if (showReport) {
    return (
      <ReportView
        inventory={inventory}
        orders={orders}
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
          <div className="text-right mr-2 hidden sm:block">
            <div className="text-zinc-400 text-xs">Revenue</div>
            <div className="text-white font-bold text-sm">{formatPrice(totalRevenue)}</div>
          </div>
          <div className="text-right mr-2 hidden sm:block">
            <div className="text-zinc-400 text-xs">Sold</div>
            <div className="text-white font-bold text-sm">{totalSold}</div>
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
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Mobile stats bar */}
      <div className="sm:hidden flex items-center justify-between px-4 py-2 bg-zinc-900/60 border-b border-zinc-800">
        <span className="text-zinc-400 text-xs">{tabletName}</span>
        <span className="text-white font-bold text-sm">{totalSold} sold &middot; {formatPrice(totalRevenue)}</span>
      </div>

      {/* Search */}
      {inventory.length > 6 && (
        <div className="px-4 pt-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full bg-zinc-900/80 border border-zinc-800 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm
                         placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-orange)]"
            />
          </div>
        </div>
      )}

      {/* Item Grid */}
      <div className="flex-1 p-4 overflow-y-auto pb-24">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredInventory.map((item) => {
            const inCart = cartByItemId[item.id] || 0;
            const remaining = item.initialStock - item.sold - inCart;
            const outOfStock = remaining <= 0;

            return (
              <button
                key={item.id}
                onClick={() => addToCart(item.id)}
                disabled={outOfStock}
                className={`relative flex flex-col items-center justify-center rounded-2xl min-h-[140px]
                           border-2 transition-all active:scale-[0.95] overflow-hidden
                           ${outOfStock
                    ? "bg-zinc-900/50 border-zinc-800 opacity-50 cursor-not-allowed"
                    : `bg-zinc-900/80 hover:bg-zinc-800/80 ${stockBorder(item.sold, item.initialStock, inCart)} cursor-pointer`
                  }`}
              >
                {item.image && (
                  <div className="w-full h-16 bg-zinc-800">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`flex flex-col items-center justify-center flex-1 p-3 ${!item.image ? "p-5" : ""}`}>
                  <span className="text-white font-bold text-base text-center leading-tight mb-1 line-clamp-2">
                    {item.name}
                  </span>
                  <span className="text-zinc-400 text-sm mb-1">{formatPrice(item.price)}</span>
                  <span className={`font-extrabold text-2xl ${stockColor(item.sold, item.initialStock, inCart)}`}>
                    {remaining}
                  </span>
                  <span className="text-zinc-500 text-xs">left</span>
                </div>

                {/* Cart badge */}
                {inCart > 0 && (
                  <div className="absolute top-2 right-2 bg-[var(--color-brand-orange)] text-white
                                  text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                    {inCart}
                  </div>
                )}

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

      {/* Floating Cart Button */}
      {cartItemCount > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 z-20 bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange-light)]
                     text-white rounded-2xl shadow-2xl shadow-orange-500/20
                     px-5 py-3.5 flex items-center gap-3 transition-all active:scale-95"
        >
          <ShoppingCart size={20} />
          <span className="font-bold">{cartItemCount} item{cartItemCount !== 1 ? "s" : ""}</span>
          <span className="text-white/70">|</span>
          <span className="font-bold">{formatPrice(cartTotal)}</span>
        </button>
      )}

      {/* Cart Panel */}
      {showCart && (
        <CartPanel
          cart={cart}
          inventory={inventory}
          onUpdateQty={updateCartQty}
          onRemove={removeFromCart}
          onClose={() => setShowCart(false)}
          onCheckout={() => {
            setShowCart(false);
            setShowPayment(true);
          }}
        />
      )}

      {/* Payment Modal */}
      {showPayment && (
        <PaymentMethodModal
          cart={cart}
          onConfirm={confirmOrder}
          onCancel={() => setShowPayment(false)}
        />
      )}

      {/* Undo bar */}
      {undoOrder && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800
                        flex items-center justify-between">
          <span className="text-zinc-300 text-sm truncate mr-3">
            {undoOrder.items.map((i) => `${i.qty}x ${i.itemName}`).join(", ")}
          </span>
          <button
            onClick={handleUndo}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold text-sm
                       rounded-lg px-4 py-2 transition-all flex items-center gap-2 flex-shrink-0"
          >
            <Undo2 size={16} />
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

// --------------- End-of-Day Report ---------------
function ReportView({ inventory, orders, tabletName, onBack }) {
  const itemStats = inventory.map((item) => {
    let totalSold = 0;
    let revenue = 0;
    orders.forEach((order) => {
      order.items.forEach((oi) => {
        if (oi.itemId === item.id) {
          totalSold += oi.qty;
          revenue += oi.price * oi.qty;
        }
      });
    });
    return {
      ...item,
      totalSold,
      revenue,
      remaining: item.initialStock - item.sold,
    };
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalSold = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0);
  const totalRemaining = inventory.reduce((sum, it) => sum + (it.initialStock - it.sold), 0);

  const paymentBreakdown = PAYMENT_METHODS.map((pm) => {
    const pmOrders = orders.filter((o) => o.paymentMethod === pm.id);
    return {
      ...pm,
      total: pmOrders.reduce((sum, o) => sum + o.total, 0),
      count: pmOrders.length,
    };
  }).filter((pm) => pm.count > 0);

  function exportCSV() {
    const header = "OrderID,Time,Items,Qty,Unit Price,Line Total,Payment Method\n";
    const rows = orders
      .map((order) =>
        order.items
          .map(
            (item) =>
              `"${order.id.slice(0, 8)}","${new Date(order.timestamp).toLocaleString()}","${item.itemName}",${item.qty},${item.price},${item.price * item.qty},"${order.paymentMethod}"`
          )
          .join("\n")
      )
      .join("\n");

    const summaryHeader = "\n\nItem Summary\nItem,Price,Sold,Revenue,Remaining\n";
    const summaryRows = itemStats
      .map((it) => `"${it.name}",${it.price},${it.totalSold},${it.revenue},${it.remaining}`)
      .join("\n");

    const paymentHeader = "\n\nPayment Summary\nMethod,Orders,Total\n";
    const paymentRows = paymentBreakdown
      .map((pm) => `"${pm.label}",${pm.count},${pm.total}`)
      .join("\n");

    const footer = `\n\nGrand Total,,${totalSold},${totalRevenue},${totalRemaining}\nTablet,"${tabletName}"\nExported,"${new Date().toLocaleString()}"`;

    const blob = new Blob([header + rows + summaryHeader + summaryRows + paymentHeader + paymentRows + footer], {
      type: "text/csv",
    });
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
              <ArrowLeft size={16} />
              Back
            </button>
            <h1 className="font-[var(--font-heading)] text-2xl font-extrabold text-white">
              End-of-Day Report
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              {tabletName} &middot;{" "}
              {new Date().toLocaleDateString("en-US", {
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
                       text-white font-semibold text-sm rounded-lg px-4 py-2.5 transition-all active:scale-[0.97]
                       flex items-center gap-2"
          >
            <Download size={16} />
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

        {/* Payment Breakdown */}
        {paymentBreakdown.length > 0 && (
          <div className="mb-6">
            <h2 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">
              Payment Breakdown
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {paymentBreakdown.map((pm) => {
                const Icon = pm.icon;
                return (
                  <div key={pm.id} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      {pm.image ? (
                        <img src={pm.image} alt={pm.label} className="w-6 h-6 object-contain" />
                      ) : (
                        Icon && <Icon size={18} className="text-[var(--color-brand-orange)]" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{pm.label}</p>
                      <p className="text-zinc-400 text-xs">{pm.count} order{pm.count !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-emerald-400 font-bold text-sm">{formatPrice(pm.total)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Per-item breakdown */}
        <div className="mb-6">
          <h2 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">
            Items Breakdown
          </h2>
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
                    <td className="text-white font-medium px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {item.image && (
                          <img src={item.image} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                        )}
                        <span className="truncate">{item.name}</span>
                      </div>
                    </td>
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
        </div>

        {/* Orders log */}
        {orders.length > 0 && (
          <div>
            <h2 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">
              Orders Log ({orders.length})
            </h2>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl max-h-80 overflow-y-auto">
              {[...orders].reverse().map((order) => {
                const pm = PAYMENT_METHODS.find((p) => p.id === order.paymentMethod);
                return (
                  <div
                    key={order.id}
                    className="px-4 py-3 border-b border-zinc-800/50 last:border-0"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm">
                          {formatPrice(order.total)}
                        </span>
                        {pm && (
                          <span className="bg-zinc-800 text-zinc-400 text-xs font-medium rounded-md px-2 py-0.5">
                            {pm.label}
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-500 text-xs">
                        {new Date(order.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs">
                      {order.items.map((i) => `${i.qty}x ${i.itemName}`).join(", ")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------- Reset Confirmation Modal ---------------
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

// --------------- Main POS Component ---------------
export default function SalesDashboard() {
  const [tabletName, setTabletName] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.TABLET_NAME) || ""
  );
  const [inventory, setInventory] = useState(() =>
    loadJSON(STORAGE_KEYS.INVENTORY, null)
  );
  const [orders, setOrders] = useState(() => {
    const saved = loadJSON(STORAGE_KEYS.ORDERS, null);
    if (saved) return saved;
    return migrateLegacySales();
  });
  const [showResetModal, setShowResetModal] = useState(false);

  function handleTabletSetup(name) {
    localStorage.setItem(STORAGE_KEYS.TABLET_NAME, name);
    setTabletName(name);
  }

  function handleInventorySetup(items) {
    saveJSON(STORAGE_KEYS.INVENTORY, items);
    saveJSON(STORAGE_KEYS.ORDERS, []);
    saveJSON(STORAGE_KEYS.CART, []);
    setInventory(items);
    setOrders([]);
  }

  function handleReset() {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setTabletName("");
    setInventory(null);
    setOrders([]);
    setShowResetModal(false);
  }

  if (!tabletName) {
    return <TabletSetup onComplete={handleTabletSetup} />;
  }

  if (!inventory) {
    return <InventorySetup onComplete={handleInventorySetup} />;
  }

  return (
    <>
      <SellingDashboard
        inventory={inventory}
        setInventory={setInventory}
        tabletName={tabletName}
        orders={orders}
        setOrders={setOrders}
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
