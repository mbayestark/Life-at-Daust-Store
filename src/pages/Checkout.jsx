// src/pages/Checkout.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { Shield, ChevronLeft, Lock, Info, AlertCircle } from "lucide-react";
import { formatPrice } from "../utils/format.js";
import Button from "../components/ui/Button";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const fmt = (n) => formatPrice(n);

function makeOrderId() {
  // More secure: timestamp + random string
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// Delivery Locations in Senegal
const locations = [
  { name: "DAUST Campus", fee: 0 },
  { name: "Somone", fee: 1000 },
  { name: "Saly", fee: 2000 },
  { name: "Mbour", fee: 2500 },
  { name: "Thies", fee: 3500 },
  { name: "Dakar", fee: 5000 },
  { name: "Other (Calculate on delivery)", fee: 0 },
];

export default function Checkout() {
  const { items, subtotal, tax, clear } = useCart();
  const [orderId] = useState(makeOrderId());
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", location: "" });
  const [error, setError] = useState("");
  const nav = useNavigate();

  const addOrder = useMutation(api.orders.addOrder);

  const deliveryFee = useMemo(() => {
    const loc = locations.find(l => l.name === form.location);
    return loc ? loc.fee : 0;
  }, [form.location]);

  const total = subtotal + tax + deliveryFee;

  const lines = useMemo(
    () =>
      items.map((it) => ({
        name: it.name,
        qty: it.qty,
        price: it.price,
        color: it.selectedColor,
        size: it.selectedSize
      })),
    [items]
  );

  if (items.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-32 text-center animate-in fade-in duration-700">
        <h1 className="text-[var(--text-3xl)] font-black text-brand-navy mb-4">No items to checkout</h1>
        <p className="text-gray-500 mb-8">Your shopping bag is currently empty.</p>
        <Link to="/shop">
          <Button variant="secondary">Go back to Shop</Button>
        </Link>
      </main>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.phone || !form.location) {
      setError("Please ensure all fields are completed before proceeding.");
      return;
    }

    setLoading(true);
    try {
      // Save order to Convex (includes automatic Google Sheets backup)
      await addOrder({
        orderId,
        customer: {
          name: form.name,
          phone: form.phone,
          location: form.location,
        },
        items: lines,
        subtotal,
        deliveryFee,
        total,
      });

      clear();
      nav(`/order/success/${orderId}`, { state: { orderId } });
    } catch (err) {
      console.error(err);
      setError("Could not secure the transaction. Check your internet or try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-gray-50/50 min-h-screen pb-24 sm:pb-32 overflow-x-hidden">
      {/* Mini Header */}
      <div className="bg-white border-b border-gray-100 mb-12 sm:mb-20">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <Link to="/cart" className="flex items-center gap-2 text-gray-400 hover:text-brand-orange text-[10px] font-black uppercase tracking-[0.2em] transition-colors">
            <ChevronLeft size={14} /> Back to Bag
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <Lock size={12} className="text-green-500" /> Secure Checkout
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 grid gap-16 lg:grid-cols-12 items-start">
        {/* Left: Input (Span 7) */}
        <div className="lg:col-span-7 animate-in slide-in-from-left-5 duration-700">
          <h1 className="text-[var(--text-4xl)] font-black text-brand-navy tracking-tighter mb-4">Complete Your Order</h1>
          <p className="text-gray-500 mb-12 text-lg">Enter your details to finalize your university essentials.</p>

          {error && (
            <div className="mb-10 p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-700 text-sm font-bold animate-in bounce-in duration-500">
              <AlertCircle size={20} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-3">
                <label htmlFor="name" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <input
                  id="name"
                  required
                  className="w-full h-16 bg-white border border-gray-100 rounded-2xl px-6 text-brand-navy font-bold focus:ring-4 focus:ring-brand-orange/5 focus:border-brand-orange outline-none transition-all shadow-sm"
                  placeholder="e.g. Moussa Diop"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="phone" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                <input
                  id="phone"
                  required
                  className="w-full h-16 bg-white border border-gray-100 rounded-2xl px-6 text-brand-navy font-bold focus:ring-4 focus:ring-brand-orange/5 focus:border-brand-orange outline-none transition-all shadow-sm"
                  placeholder="e.g. 77 123 45 67"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="location" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Delivery Location</label>
              <div className="relative">
                <select
                  id="location"
                  required
                  className="w-full h-16 bg-white border border-gray-100 rounded-2xl px-6 text-brand-navy font-bold focus:ring-4 focus:ring-brand-orange/5 focus:border-brand-orange outline-none appearance-none transition-all cursor-pointer shadow-sm"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                >
                  <option value="">Select delivery location</option>
                  {locations.map(loc => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name} {loc.fee > 0 ? `(+${fmt(loc.fee)})` : loc.name === "DAUST Campus" ? "(Free)" : ""}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronLeft className="rotate-[-90deg]" size={18} />
                </div>
              </div>
              {form.location && form.location !== "DAUST Campus" && form.location !== "Other (Calculate on delivery)" && (
                <p className="text-[10px] text-gray-500 ml-1 italic font-medium">Delivery fee to {form.location}: {fmt(deliveryFee)}</p>
              )}
              {form.location === "Other (Calculate on delivery)" && (
                <p className="text-[10px] text-brand-orange ml-1 italic font-bold">A staff member will contact you to confirm the delivery fee for your specific location.</p>
              )}
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mt-12 space-y-6">
              <div className="flex items-center gap-4 text-brand-navy">
                <Shield size={22} className="text-green-500" />
                <div>
                  <p className="font-black text-sm uppercase tracking-wider">Campus Purchase Guarantee</p>
                  <p className="text-xs text-gray-500 mt-1">Direct from the University Shop. Verified & Secured.</p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full h-20 rounded-[1.5rem] !text-lg shadow-2xl shadow-brand-orange/20 mt-8"
            >
              Confirm Order
            </Button>
          </form>
        </div>

        {/* Right: Summary (Span 5) */}
        <aside className="lg:col-span-5 h-fit animate-in slide-in-from-right-5 duration-700 delay-100">
          <div className="bg-brand-navy rounded-[2.5rem] p-10 text-white shadow-2xl shadow-brand-navy/40 relative overflow-hidden">
            {/* Decorative Pattern Overlay */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />

            <div className="relative z-10">
              <h2 className="text-xl font-black tracking-tight mb-8">Review Selection</h2>
              <ul className="space-y-6 mb-10 overflow-y-auto max-h-[300px] pr-4 scrollbar-hide">
                {items.map((it) => (
                  <li key={`${it.id}-${it.selectedSize}`} className="flex items-center gap-4 group">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/10">
                      <img src={it.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{it.name}</p>
                      <p className="text-[10px] font-bold text-brand-cream/40 uppercase tracking-widest mt-1">QTY: {it.qty} {it.selectedSize ? `• ${it.selectedSize}` : ""}</p>
                    </div>
                    <span className="font-black text-sm">{fmt(it.price * it.qty)}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-4 text-sm font-medium border-t border-white/10 pt-8 mb-10">
                <div className="flex justify-between items-center text-brand-cream/60">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-brand-cream/60">
                  <span>Shipping</span>
                  <span className="text-brand-orange uppercase text-xs font-black tracking-widest">Complimentary</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between items-center text-brand-cream/60">
                    <span>Estimated Tax</span>
                    <span>{fmt(tax)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xl font-black pt-4">
                  <span>Final Total</span>
                  <span className="text-brand-orange">{fmt(total)}</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 flex flex-col items-center gap-4 border border-white/5">
                <div className="flex items-center gap-2 text-brand-cream/40 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  <Lock size={12} /> Encrypted Transaction
                </div>
                <p className="text-[10px] text-center text-brand-cream/30 italic">Proceeding confirms your order for processing at the DAUST Student Services Center.</p>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}