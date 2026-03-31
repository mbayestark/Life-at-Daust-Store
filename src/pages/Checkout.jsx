import React, { useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { Shield, ChevronLeft, Lock, Info, AlertCircle, Package, Tag, ChevronUp } from "lucide-react";
import { formatPrice } from "../utils/format.js";
import Button from "../components/ui/Button";

import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext.jsx";

const QUARTER_ZIP_RE = /quarter.?zip/i;
const isQuarterZip = (name) => QUARTER_ZIP_RE.test(name);

const fmt = (n) => formatPrice(n);

function makeOrderId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

const locations = [
  { name: "DAUST Campus", fee: 0 },
  { name: "Other Location (Calculated on arrival)", fee: 0 },
];

export default function Checkout() {
  const { items, subtotal, clear, totalSavings, logoFees } = useCart();
  const { session } = useAuth();
  const [orderId] = useState(makeOrderId());
  const [loading, setLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", location: "" });
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(
    searchParams.get("error") === "payment_failed"
      ? "Your payment was not completed. Please try again."
      : ""
  );
  const nav = useNavigate();

  // Referral code state
  const [referralInput, setReferralInput] = useState("");
  const [appliedReferral, setAppliedReferral] = useState(null);
  const [referralError, setReferralError] = useState("");
  const [referralLoading, setReferralLoading] = useState(false);

  // Coupon state
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponResult, setCouponResult] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const addOrder = useMutation(api.orders.addOrder);
  const updateNabooPayDetails = useMutation(api.orders.updateNabooPayDetails);
  const createNabooPayTransaction = useAction(api.naboopay.createTransaction);
  const applyReferralCodeMutation = useMutation(api.referrals.applyReferralCode);
  const applyCouponMutation = useMutation(api.referrals.applyCoupon);

  // Fetch user's coupon if logged in
  const userCoupon = useQuery(
    api.referrals.getUserCoupon,
    session?.userId ? { userId: session.userId } : "skip"
  );

  const deliveryFee = useMemo(() => {
    const loc = locations.find(l => l.name === form.location);
    return loc ? loc.fee : 0;
  }, [form.location]);

  const discountInfo = useQuery(api.orders.getDiscountEligibility, { phone: form.phone || "" });

  const baseTotal = subtotal + deliveryFee + logoFees;
  const setSubtotal = items.filter(i => i.isProductSet).reduce((s, i) => s + i.price * i.qty, 0);
  const regularBase = baseTotal - setSubtotal;
  const regularDiscount = discountInfo?.eligible ? Math.round(regularBase * 0.15) : 0;
  const setDiscount = discountInfo?.eligible ? Math.round(setSubtotal * 0.05) : 0;
  const discountAmount = regularDiscount + setDiscount;
  const referralDiscount = appliedReferral?.discount || 0;
  const couponDiscount = couponResult?.discount || 0;
  const total = baseTotal - discountAmount - referralDiscount - couponDiscount;

  // Separate product sets and regular items
  const productSetItems = items.filter(item => item.isProductSet);
  const regularItems = items.filter(item => !item.isProductSet);

  const lines = useMemo(
    () =>
      items.map((it) => {
        const line = {
          productId: it.isProductSet ? it.productSetId : it.id,
          name: it.name,
          qty: it.qty,
          price: it.price,
        };
        if (it.selectedHoodieType) line.hoodieType = it.selectedHoodieType;
        if (it.isCropTop) line.isCropTop = true;
        if (it.selectedColor) line.color = it.selectedColor;
        if (it.selectedSize) line.size = it.selectedSize;
        if (it.selectedFrontLogo) line.frontLogo = it.selectedFrontLogo;
        if (it.selectedBackLogo) line.backLogo = it.selectedBackLogo;
        if (it.selectedSideLogo) line.sideLogo = it.selectedSideLogo;
        if (it.isProductSet) {
          line.isProductSet = true;
          line.productSetName = it.productSetName;
        }
        return line;
      }),
    [items]
  );

  const handleApplyReferral = async () => {
    if (!referralInput.trim()) return;
    setReferralError("");
    setReferralLoading(true);
    try {
      const result = await applyReferralCodeMutation({
        code: referralInput.trim().toUpperCase(),
        buyerUserId: session?.userId || undefined,
        cartItems: items.map((it) => ({ name: it.name, price: it.price, qty: it.qty })),
      });
      setAppliedReferral({ ...result, code: referralInput.trim().toUpperCase() });
      setReferralError("");
    } catch (err) {
      setReferralError(err.data || err.message || "Invalid referral code.");
      setAppliedReferral(null);
    } finally {
      setReferralLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!session?.userId) return;
    setCouponError("");
    setCouponLoading(true);
    try {
      const result = await applyCouponMutation({
        userId: session.userId,
        cartItems: items.map((it) => ({ name: it.name, price: it.price, qty: it.qty })),
      });
      setCouponResult(result);
      setCouponApplied(true);
      setCouponError("");
    } catch (err) {
      setCouponError(err.message || "Could not apply coupon.");
      setCouponResult(null);
      setCouponApplied(false);
    } finally {
      setCouponLoading(false);
    }
  };

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
        paymentMethod: "naboopay",
        ...(discountAmount > 0 ? { discount: discountAmount } : {}),
        ...(session?.userId ? { buyerUserId: session.userId } : {}),
        ...(appliedReferral ? { referralCode: appliedReferral.code || referralInput.trim().toUpperCase(), referralDiscount } : {}),
        ...(couponApplied ? { couponApplied: true, couponDiscount } : {}),
      });

      // Create NabooPay transaction
      try {
        const nabooResponse = await createNabooPayTransaction({
            orderId,
            customer: {
              name: form.name,
              phone: form.phone.startsWith("+")
                ? form.phone.replace(/\s/g, "")
                : `+221${form.phone.replace(/\s/g, "")}`,
            },
            items: [
              ...lines.map(it => ({
                name: it.name,
                qty: it.qty,
                price: it.price,
              })),
              ...(discountAmount > 0 ? [{
                name: "Early Customer Discount (-15%)",
                qty: 1,
                price: -discountAmount,
              }] : []),
              ...(referralDiscount > 0 ? [{
                name: "Referral Discount (-7%)",
                qty: 1,
                price: -referralDiscount,
              }] : []),
              ...(couponDiscount > 0 ? [{
                name: `Coupon Discount (-${couponResult?.coupon_percent}%)`,
                qty: 1,
                price: -couponDiscount,
              }] : []),
            ],
            successUrl: `https://shop.daustgov.com/order/success/${orderId}`,
            errorUrl: `https://shop.daustgov.com/checkout?error=payment_failed`,
          });

        if (nabooResponse && nabooResponse.checkout_url) {
          await updateNabooPayDetails({
            orderId,
            naboopayOrderId: nabooResponse.order_id,
            naboopayCheckoutUrl: nabooResponse.checkout_url,
          });
          window.location.href = nabooResponse.checkout_url;
          return;
        } else {
          throw new Error("Failed to get checkout URL from NabooPay");
        }
      } catch (nabooErr) {
        // Handle payment service errors gracefully - don't expose internal errors to users
        const errorMessage = nabooErr.message || "";
        if (errorMessage.includes("NABOOPAY_TOKEN") ||
          errorMessage.includes("not set") ||
          errorMessage.includes("environment") ||
          errorMessage.includes("API")) {
          setError("Online payment is temporarily unavailable. Please contact support.");
          setLoading(false);
          return;
        }
        throw nabooErr;
      }
    } catch {
      setError("Could not secure the transaction. Check your internet or try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50/50 min-h-screen pb-32 sm:pb-32 lg:pb-24 overflow-x-hidden">
      <div className="bg-white border-b border-gray-100 mb-8 sm:mb-12 lg:mb-20">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 flex justify-between items-center">
          <Link to="/cart" className="flex items-center gap-2 text-gray-400 hover:text-brand-orange active:text-brand-orange text-[10px] font-black uppercase tracking-[0.2em] transition-colors">
            <ChevronLeft size={14} /> Back to Bag
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <Lock size={12} className="text-green-500" /> Secure
          </div>
        </div>
      </div>

      <main className={`max-w-7xl mx-auto px-4 grid gap-12 sm:gap-16 lg:grid-cols-12 items-start lg:pb-0 transition-all duration-300 ${summaryOpen ? "pb-[550px]" : "pb-28"}`}>
        <div className="lg:col-span-7 animate-in slide-in-from-left-5 duration-700">
          <h1 className="text-3xl sm:text-[var(--text-4xl)] font-black text-brand-navy tracking-tighter mb-3 sm:mb-4">Complete Your Order</h1>
          <p className="text-gray-500 mb-8 sm:mb-12 text-base sm:text-lg">Enter your details to finalize your university essentials.</p>


          {error && (
            <div className="mb-8 sm:mb-10 p-4 sm:p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 sm:gap-4 text-red-700 text-xs sm:text-sm font-bold animate-in bounce-in duration-500">
              <AlertCircle size={20} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {discountInfo?.eligible && (
            <div className="mb-8 sm:mb-10 p-4 sm:p-5 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 sm:gap-4 animate-in slide-in-from-top-3 duration-500">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Tag size={18} className="text-green-600" />
              </div>
              <div>
                <p className="font-black text-sm text-green-800 uppercase tracking-wide">Early Customer Discount Applied!</p>
                <p className="text-xs text-green-600 font-medium mt-0.5">
                  You save {fmt(discountAmount)} on this order.
                  {discountInfo?.slotsRemaining <= 3 && (
                    <span className="ml-1 font-black text-brand-orange">Only {discountInfo.slotsRemaining} spot{discountInfo.slotsRemaining !== 1 ? "s" : ""} left!</span>
                  )}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={submit} className="space-y-6 sm:space-y-8">
            <div className="grid gap-6 sm:gap-8 sm:grid-cols-2">
              <div className="space-y-3">
                <label htmlFor="name" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <input
                  id="name"
                  required
                  className="w-full h-14 sm:h-16 bg-white border border-gray-100 rounded-2xl px-5 sm:px-6 text-brand-navy font-bold text-sm sm:text-base focus:ring-4 focus:ring-brand-orange/5 focus:border-brand-orange outline-none transition-all shadow-sm"
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
                  className="w-full h-14 sm:h-16 bg-white border border-gray-100 rounded-2xl px-5 sm:px-6 text-brand-navy font-bold text-sm sm:text-base focus:ring-4 focus:ring-brand-orange/5 focus:border-brand-orange outline-none transition-all shadow-sm"
                  placeholder="e.g. +221 77 123 45 67"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <p className="text-[10px] text-gray-500 ml-1 italic font-medium">Country code will be added if not included</p>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="location" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Delivery Location</label>
              <div className="relative">
                <select
                  id="location"
                  required
                  className="w-full h-14 sm:h-16 bg-white border border-gray-100 rounded-2xl px-5 sm:px-6 text-brand-navy font-bold text-sm sm:text-base focus:ring-4 focus:ring-brand-orange/5 focus:border-brand-orange outline-none appearance-none transition-all cursor-pointer shadow-sm"
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
                <div className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
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

            {/* Referral Code */}
            <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-black text-brand-navy uppercase tracking-wider">Referral Code</h3>
              {!session ? (
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium">Have a referral code? Sign in to use it.</p>
                  <Link to="/login" state={{ from: { pathname: "/checkout" } }} className="text-xs font-black text-brand-orange hover:underline">
                    Sign in
                  </Link>
                </div>
              ) : appliedReferral ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-green-800">Code applied: {referralInput.toUpperCase()}</p>
                    <p className="text-[10px] text-green-600 mt-0.5">You save {fmt(referralDiscount)} (7% off eligible items)</p>
                  </div>
                  <button type="button" onClick={() => { setAppliedReferral(null); setReferralInput(""); }} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">Remove</button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value)}
                    placeholder="Enter referral code"
                    className="flex-1 h-12 bg-white border border-gray-100 rounded-xl px-4 text-brand-navy font-bold text-sm focus:ring-2 focus:ring-brand-orange/10 focus:border-brand-orange outline-none transition-all"
                  />
                  <Button type="button" onClick={handleApplyReferral} loading={referralLoading} className="h-12 px-5 !text-xs !rounded-xl">
                    Apply
                  </Button>
                </div>
              )}
              {referralError && <p className="text-xs text-red-500 font-bold">{referralError}</p>}
            </div>

            {/* Coupon */}
            {session && userCoupon?.hasActiveCoupon && !couponApplied && (
              <div className="border border-green-200 bg-green-50 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-green-800 uppercase tracking-wider">Referral Coupon Available</h3>
                    <p className="text-xs text-green-600 mt-1">You have a {userCoupon.coupon_percent}% coupon from referrals!</p>
                  </div>
                  <Button type="button" onClick={handleApplyCoupon} loading={couponLoading} className="h-10 px-5 !text-xs !rounded-xl">
                    Use Coupon
                  </Button>
                </div>
                {couponError && <p className="text-xs text-red-500 font-bold">{couponError}</p>}
              </div>
            )}
            {couponApplied && couponResult && (
              <div className="border border-green-200 bg-green-50 rounded-2xl p-5 sm:p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-green-800">Coupon applied: {couponResult.coupon_percent}% off</p>
                  <p className="text-[10px] text-green-600 mt-0.5">You save {fmt(couponDiscount)} on eligible items</p>
                </div>
                <button type="button" onClick={() => { setCouponApplied(false); setCouponResult(null); }} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">Remove</button>
              </div>
            )}

            <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-5 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-black text-brand-navy tracking-tight">Payment Method</h3>

              <div className="flex flex-col items-center justify-center p-5 sm:p-6 rounded-xl border-2 border-brand-orange bg-brand-orange/5">
                <Shield size={24} className="text-brand-orange" />
                <span className="font-bold mt-2 text-brand-navy text-sm sm:text-base">Online Payment</span>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Wave, Orange Money</p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 sm:p-4 flex gap-3">
                <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  You will be redirected to NabooPay's secure portal to complete your payment using Wave or Orange Money.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-gray-100 shadow-sm mt-8 sm:mt-12 space-y-6">
              <div className="flex items-center gap-3 sm:gap-4 text-brand-navy">
                <Shield size={20} className="sm:w-[22px] sm:h-[22px] text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-black text-xs sm:text-sm uppercase tracking-wider">Campus Purchase Guarantee</p>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Direct from the University Shop. Verified & Secured.</p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full h-16 sm:h-20 rounded-2xl sm:rounded-[1.5rem] !text-base sm:!text-lg shadow-2xl shadow-brand-orange/20 mt-6 sm:mt-8 font-bold active:scale-[0.98]"
            >
              Proceed to Payment
            </Button>
          </form>
        </div>

        <aside className="lg:col-span-5 h-fit animate-in slide-in-from-right-5 duration-700 delay-100 fixed lg:relative bottom-0 left-0 right-0 lg:bottom-auto z-50">
          <div className="bg-brand-navy rounded-t-3xl lg:rounded-[2.5rem] text-white shadow-2xl shadow-brand-navy/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />

            {/* Mobile toggle bar */}
            <div className="lg:hidden flex items-center justify-between px-5 py-4 relative z-10">
              <button
                onClick={() => setSummaryOpen(s => !s)}
                className="flex items-center gap-2 flex-1"
                aria-expanded={summaryOpen}
                aria-label={summaryOpen ? "Collapse order summary" : "Expand order summary"}
              >
                <ChevronUp
                  size={20}
                  className={`text-brand-orange transition-transform duration-300 ${summaryOpen ? "" : "rotate-180"}`}
                />
                <span className="font-black text-sm">Order Summary</span>
              </button>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-orange">Total</p>
                <p className="text-lg font-black">{fmt(total)}</p>
              </div>
            </div>

            {/* Collapsible body */}
            <div className={`${summaryOpen ? "block" : "hidden"} lg:block p-6 sm:p-8 lg:p-10 pt-0 lg:pt-10 overflow-y-auto max-h-[calc(85vh-64px)] lg:max-h-none relative z-10`}>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mb-6 sm:mb-8 hidden lg:block">Review Selection</h2>

              {/* Product Sets Section */}
              {productSetItems.length > 0 && (
                <div className="mb-6 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Package size={16} className="text-brand-orange" />
                    <span className="text-xs font-black uppercase tracking-widest text-brand-orange">Special Bundles</span>
                  </div>
                  <ul className="space-y-4">
                    {productSetItems.map((it) => (
                      <li key={`${it.id}-${it.productSetId}`} className="flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                          {it.image ? (
                            <img src={it.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full grid grid-cols-2 gap-0.5 p-1">
                              {it.products?.slice(0, 4).map((p, idx) => (
                                <div key={idx} className="rounded bg-white/20">
                                  {p.productImage && <img src={p.productImage} alt="" className="w-full h-full object-cover" />}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs truncate">{it.name}</p>
                          <p className="text-[10px] font-bold text-brand-cream/40 uppercase tracking-widest mt-0.5">
                            QTY: {it.qty}
                          </p>
                          <div className="mt-1 space-y-0.5">
                            {it.products?.map((p, idx) => {
                              const sel = it.variantSelections?.[p.productId];
                              const color = sel?.color || p.selectedColor;
                              const size = sel?.size || p.selectedSize;
                              return (
                                <p key={idx} className="text-[9px] font-bold text-brand-cream/60 tracking-widest leading-tight">
                                  {p.quantity}x {p.productName}
                                  {color ? ` · ${color}` : ""}
                                  {size ? ` · ${size}` : ""}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-xs">{fmt(it.price * it.qty)}</span>
                          {it.savings > 0 && (
                            <p className="text-[8px] text-green-400 font-bold">Save {fmt(it.savings)}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Regular Items Section */}
              {regularItems.length > 0 && (
                <div className={productSetItems.length > 0 ? "pt-2" : ""}>
                  {productSetItems.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-black uppercase tracking-widest text-gray-400">Individual Items</span>
                    </div>
                  )}
                  <ul className="space-y-4 max-h-[200px] overflow-y-auto pr-2">
                    {regularItems.map((it) => (
                      <li key={`${it.id}-${it.selectedSize}-${it.selectedFrontLogo}-${it.selectedBackLogo}`} className="flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                          <img src={it.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs truncate">{it.name}</p>
                          <p className="text-[10px] font-bold text-brand-cream/40 uppercase tracking-widest mt-0.5">
                            QTY: {it.qty}
                            {it.selectedFrontLogo ? ` • Front: ${it.selectedFrontLogo}` : ""}
                            {it.selectedBackLogo ? ` • Back: ${it.selectedBackLogo}` : ""}
                            {it.selectedSize ? ` • ${it.selectedSize}` : ""}
                          </p>
                        </div>
                        <span className="font-black text-xs">{fmt(it.price * it.qty)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {discountInfo?.eligible && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 mb-4">
                  <Tag size={14} className="text-green-400 flex-shrink-0" />
                  <p className="text-[11px] font-black text-green-400 uppercase tracking-wider">Early Customer Discount Applied!</p>
                </div>
              )}

              <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm font-medium border-t border-white/10 pt-5 sm:pt-6 mt-5 sm:mt-6">
                <div className="flex justify-between items-center text-brand-cream/60">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between items-center text-green-400">
                    <span>Bundle Savings</span>
                    <span>-{fmt(totalSavings)}</span>
                  </div>
                )}
                {logoFees > 0 && (
                  <div className="flex justify-between items-center text-brand-cream/60">
                    <span>Additional Logo Fees</span>
                    <span>{fmt(logoFees)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-brand-cream/60">
                  <span>Shipping</span>
                  <span className="text-brand-orange uppercase text-[10px] font-black tracking-widest">Free</span>
                </div>
                {discountInfo?.eligible && regularBase > 0 && (
                  <div className="flex justify-between items-center text-green-400 font-black">
                    <span>15% Discount</span>
                    <span>-{fmt(regularDiscount)}</span>
                  </div>
                )}
                {discountInfo?.eligible && setSubtotal > 0 && (
                  <div className="flex justify-between items-center text-green-400 font-black">
                    <span>5% Discount (Bundles)</span>
                    <span>-{fmt(setDiscount)}</span>
                  </div>
                )}
                {referralDiscount > 0 && (
                  <div className="flex justify-between items-center text-green-400 font-black">
                    <span>Referral Discount (7%)</span>
                    <span>-{fmt(referralDiscount)}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-green-400 font-black">
                    <span>Coupon ({couponResult?.coupon_percent}%)</span>
                    <span>-{fmt(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg sm:text-xl font-black pt-3 sm:pt-4">
                  <span>Final Total</span>
                  <span className="text-brand-orange">{fmt(total)}</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4 border border-white/5 mt-6 sm:mt-8 lg:block hidden">
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
