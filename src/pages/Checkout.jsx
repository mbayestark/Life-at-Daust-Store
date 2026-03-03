// src/pages/ Checkout.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { Shield, ChevronLeft, Lock, Info, AlertCircle } from "lucide-react";
import { formatPrice } from "../utils/format.js";
import Button from "../components/ui/Button";

import { useMutation, useAction } from "convex/react";
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
  { name: "Other Location (Calculated on arrival)", fee: 0 },
];

export default function Checkout() {
  const { items, subtotal, tax, clear } = useCart();
  const [orderId] = useState(makeOrderId());
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", location: "" });
  const [paymentMethod, setPaymentMethod] = useState("naboopay"); // Default to NabooPay
  const [paymentFile, setPaymentFile] = useState(null);
  const [error, setError] = useState("");
  const nav = useNavigate();

  const addOrder = useMutation(api.orders.addOrder);
  const updateNabooPayDetails = useMutation(api.orders.updateNabooPayDetails);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createNabooPayTransaction = useAction(api.naboopay.createTransaction);

  const deliveryFee = useMemo(() => {
    const loc = locations.find(l => l.name === form.location);
    return loc ? loc.fee : 0;
  }, [form.location]);

  const total = subtotal + tax + deliveryFee;

  const lines = useMemo(
    () =>
      items.map((it) => {
        const line = {
          name: it.name,
          qty: it.qty,
          price: it.price,
        };
        // Convex v.optional(v.string()) rejects null — only omit the field
        if (it.selectedColor) line.color = it.selectedColor;
        if (it.selectedSize) line.size = it.selectedSize;
        if (it.selectedLogo) line.logo = it.selectedLogo;
        return line;
      }),
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

    if (paymentMethod === "manual" && !paymentFile) {
      setError("Please upload your proof of payment screenshot to confirm the order.");
      return;
    }

    setLoading(true);
    try {
      let storageId = undefined;
      
      if (paymentMethod === "manual") {
        // Post file to Convex storage
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": paymentFile.type },
          body: paymentFile,
        });
        const uploadResult = await result.json();
        storageId = uploadResult.storageId;
      }

      // Save order to Convex
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
        paymentMethod,
        paymentStorageId: storageId,
      });

      if (paymentMethod === "naboopay") {
        // Create NabooPay transaction
        const nabooResponse = await createNabooPayTransaction({
          orderId,
          customer: {
            name: form.name,
            phone: form.phone.startsWith("+") ? form.phone : `+221${form.phone.replace(/\s/g, "")}`, // Assuming Senegal if no plus
          },
          items: lines.map(it => ({
            name: it.name,
            qty: it.qty,
            price: it.price,
          })),
          successUrl: `https://shop.daustgov.com/order/success/${orderId}`,
          errorUrl: `https://shop.daustgov.com/checkout?error=payment_failed`,
        });

        if (nabooResponse && nabooResponse.checkout_url) {
          // Update order with NabooPay ID and redirect
          await updateNabooPayDetails({
            orderId,
            naboopayOrderId: nabooResponse.order_id,
            naboopayCheckoutUrl: nabooResponse.checkout_url,
          });

          // Redirect to NabooPay
          window.location.href = nabooResponse.checkout_url;
          return;
        } else {
          throw new Error("Failed to get checkout URL from NabooPay");
        }
      }

      clear();
      nav(`/order/success/${orderId}`, { state: { orderId } });
    } catch (err) {
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
              {form.location && form.location !== "DAUST Campus" && form.location !== "Other Location (Calculated on arrival)" && (
                <p className="text-[10px] text-gray-500 ml-1 italic font-medium">Delivery fee to {form.location}: {fmt(deliveryFee)}</p>
              )}
              {form.location === "Other Location (Calculated on arrival)" && (
                <p className="text-[10px] text-brand-orange ml-1 italic font-bold">A staff member will contact you to confirm the delivery fee for your specific location prior to dispatch.</p>
              )}
            </div>

            <div className="border border-gray-200 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-black text-brand-navy tracking-tight">Payment Method</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("naboopay")}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${paymentMethod === "naboopay" ? "border-brand-orange bg-brand-orange/5" : "border-gray-100 bg-white"}`}
                >
                  <Shield size={24} className={paymentMethod === "naboopay" ? "text-brand-orange" : "text-gray-400"} />
                  <span className={`font-bold mt-2 ${paymentMethod === "naboopay" ? "text-brand-navy" : "text-gray-500"}`}>Online Payment</span>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Wave, Orange Money</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("manual")}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${paymentMethod === "manual" ? "border-brand-orange bg-brand-orange/5" : "border-gray-100 bg-white"}`}
                >
                  <AlertCircle size={24} className={paymentMethod === "manual" ? "text-brand-orange" : "text-gray-400"} />
                  <span className={`font-bold mt-2 ${paymentMethod === "manual" ? "text-brand-navy" : "text-gray-500"}`}>Manual Proof</span>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Upload Screenshot</p>
                </button>
              </div>

              {paymentMethod === "naboopay" && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                  <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    You will be redirected to NabooPay's secure portal to complete your payment using Wave or Orange Money.
                  </p>
                </div>
              )}

              {paymentMethod === "manual" && (
                <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-sm text-gray-500 font-medium">Please send the total amount (<span className="text-brand-orange font-bold font-black">{fmt(total)}</span>) via Wave or Orange Money, then upload a screenshot.</p>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-blue-500/20 bg-blue-50/50">
                      <span className="font-bold text-blue-700 mb-2">Wave Payment</span>
                      <img src="/wave.png" alt="Wave QR Code" className="w-[120px] h-[120px] object-contain rounded-lg shadow-sm bg-white p-2" />
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-orange-500/20 bg-orange-50/50">
                      <span className="font-bold text-orange-600 mb-2">Orange Money</span>
                      <img src="/orangemoney.png" alt="Orange Money QR Code" className="w-[120px] h-[120px] object-contain rounded-lg shadow-sm bg-white p-2" />
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <label htmlFor="proof" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <span className="text-red-500">*</span> Proof of Payment
                    </label>
                    <input
                      id="proof"
                      type="file"
                      accept="image/*"
                      required={paymentMethod === "manual"}
                      onChange={(e) => setPaymentFile(e.target.files[0])}
                      className="w-full h-16 bg-white border border-gray-100 rounded-2xl px-6 text-brand-navy font-bold focus:ring-4 focus:ring-brand-orange/5 focus:border-brand-orange outline-none transition-all shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-orange/10 file:text-brand-orange hover:file:bg-brand-orange/20 file:transition-colors pt-[18px]"
                    />
                  </div>
                </div>
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
              {paymentMethod === "naboopay" ? "Proceed to Payment" : "Confirm Order"}
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
                  <li key={`${it.id}-${it.selectedSize}-${it.selectedLogo}`} className="flex items-center gap-4 group">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/10">
                      <img src={it.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{it.name}</p>
                      <p className="text-[10px] font-bold text-brand-cream/40 uppercase tracking-widest mt-1">
                        QTY: {it.qty}
                        {it.selectedLogo ? ` • ${it.selectedLogo}` : ""}
                        {it.selectedSize ? ` • ${it.selectedSize}` : ""}
                      </p>
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
