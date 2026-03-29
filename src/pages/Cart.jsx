import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { Trash2, ShoppingBag, ArrowRight, Package, Tag, ChevronUp } from "lucide-react";
import { formatPrice } from "../utils/format.js";
import Button from "../components/ui/Button";

export default function Cart() {
  const { items, removeItem, setQty, count, subtotal, totalSavings, logoFees, total } = useCart();
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Separate product sets from regular items
  const productSetItems = items.filter(item => item.isProductSet);
  const regularItems = items.filter(item => !item.isProductSet);

  if (items.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-32 text-center animate-in fade-in duration-700">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gray-50 mb-10">
          <ShoppingBag className="h-16 w-16 text-gray-200" />
        </div>
        <h1 className="text-[var(--text-4xl)] font-black text-brand-navy tracking-tighter mb-4">Your Bag is Empty</h1>
        <p className="text-gray-500 mb-12 max-w-md mx-auto text-lg">Items stay in your bag for a limited time. Don't let your favorites slip away!</p>
        <Link to="/shop">
          <Button variant="primary" size="lg" className="rounded-full shadow-xl">
            Discover What's New
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <h1 className="text-[var(--text-4xl)] font-black text-brand-navy tracking-tighter mb-2">Shopping Bag</h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">Review your selection · {count} items</p>
        </div>
        <Link to="/shop" className="text-gray-400 hover:text-brand-orange transition-colors text-sm font-bold flex items-center gap-2">
          ← Keep Browsing
        </Link>
      </div>

      <div className={`grid gap-12 lg:grid-cols-12 lg:pb-0 transition-all duration-300 ${summaryOpen ? "pb-[440px]" : "pb-24"}`}>
        {/* Cart Items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Product Sets Section */}
          {productSetItems.length > 0 && (
            <div className="bg-gradient-to-r from-brand-orange/5 to-transparent rounded-3xl p-6 sm:p-8 border border-brand-orange/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center">
                  <Package className="text-brand-orange" size={20} />
                </div>
                <h2 className="text-xl font-black text-brand-navy">Special Bundles</h2>
              </div>

              <div className="space-y-4">
                {productSetItems.map((item) => (
                  <div key={`${item.id}-${item.productSetId}`} className="bg-white rounded-2xl premium-shadow p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6 border border-gray-50 group transition-all duration-300">
                    <div className="relative w-full sm:w-28 aspect-square rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full grid grid-cols-2 gap-1 p-2">
                          {item.products?.slice(0, 4).map((p, idx) => (
                            <div key={idx} className="rounded-lg overflow-hidden bg-gray-100">
                              {p.productImage && <img src={p.productImage} alt="" className="w-full h-full object-cover" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-base font-black text-brand-navy">{item.name}</h3>
                        {item.savings > 0 && (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <Tag size={12} />
                            Save {formatPrice(item.savings)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.products?.map((p, idx) => {
                          const sel = item.variantSelections?.[p.productId];
                          const color = sel?.color || p.selectedColor;
                          const size = sel?.size || p.selectedSize;
                          const logo = sel?.logo || p.selectedLogo;

                          return (
                            <span key={idx} className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                              {p.quantity}x {p.productName}
                              {color ? ` · ${color}` : ""}
                              {size ? ` · ${size}` : ""}
                              {logo ? ` · ${logo}` : ""}
                            </span>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-gray-50 rounded-xl p-1 h-11 sm:h-10">
                          <button
                            onClick={() => setQty(item.productSetId, null, null, null, null, null, item.qty - 1, true)}
                            className="w-10 sm:w-8 h-full rounded-lg hover:bg-white hover:shadow-sm active:scale-95 active:bg-brand-navy active:text-white text-lg font-bold transition-all disabled:opacity-30"
                            disabled={item.qty <= 1}
                          >
                            −
                          </button>
                          <span className="w-10 sm:w-8 text-center font-black text-brand-navy text-sm">{item.qty}</span>
                          <button
                            onClick={() => setQty(item.productSetId, null, null, null, null, null, item.qty + 1, true)}
                            className="w-10 sm:w-8 h-full rounded-lg hover:bg-white hover:shadow-sm active:scale-95 active:bg-brand-navy active:text-white text-lg font-bold transition-all"
                            disabled={item.qty >= 99}
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-black text-brand-navy">
                            {formatPrice(item.price * item.qty)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.productSetId, null, null, null, null, null, true)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-95 active:bg-red-500 active:text-white rounded-xl transition-all duration-300"
                      title="Remove from bag"
                      aria-label="Remove product set from bag"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Items Section */}
          {regularItems.length > 0 && (
            <div className={productSetItems.length > 0 ? "pt-4" : ""}>
              {productSetItems.length > 0 && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-navy/5 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="text-brand-navy" size={20} />
                  </div>
                  <h2 className="text-xl font-black text-brand-navy">Individual Items</h2>
                </div>
              )}

              {regularItems.map((item) => (
                <div key={`${item.id}-${item.selectedColor}-${item.selectedSize}-${item.selectedFrontLogo}-${item.selectedBackLogo}-${item.selectedSideLogo}-${item.selectedHoodieType}`} className="bg-white rounded-3xl premium-shadow p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-8 border border-gray-50 group transition-all duration-300 mb-4">
                  <div className="relative w-full sm:w-32 aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex-1 w-full text-center sm:text-left">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-black text-brand-navy group-hover:text-brand-orange transition-colors duration-300">{item.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">
                      {item.selectedHoodieType && (
                        <span className="flex items-center gap-2">Style: <span className="text-brand-navy">{item.selectedHoodieType}</span></span>
                      )}
                      {item.isCropTop && (
                        <span className="flex items-center gap-2">Cut: <span className="text-brand-navy">Crop Top</span></span>
                      )}
                      {item.selectedFrontLogo && (
                        <span className="flex items-center gap-2">Front: <span className="text-brand-navy">{item.selectedFrontLogo}</span></span>
                      )}
                      {item.selectedBackLogo && (
                        <span className="flex items-center gap-2">Back: <span className="text-brand-navy">{item.selectedBackLogo}</span></span>
                      )}
                      {item.selectedSideLogo && (
                        <span className="flex items-center gap-2">Side: <span className="text-brand-navy">{item.selectedSideLogo}</span></span>
                      )}
                      {item.selectedColor && (
                        <span className="flex items-center gap-2">Color: <span className="text-brand-navy">{item.selectedColor}</span></span>
                      )}
                      {item.selectedSize && (
                        <span className="flex items-center gap-2">Size: <span className="text-brand-navy">{item.selectedSize}</span></span>
                      )}
                    </div>

                    {/* Mobile: Price & Actions row */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center bg-gray-50 rounded-xl p-1 h-12 sm:h-11">
                        <button
                          onClick={() => setQty(item.id, item.selectedColor, item.selectedSize, item.selectedFrontLogo, item.selectedBackLogo, item.selectedSideLogo, item.qty - 1, false, item.selectedHoodieType, item.isCropTop)}
                          className="w-11 sm:w-10 h-full rounded-lg hover:bg-white hover:shadow-sm active:scale-95 active:bg-brand-navy active:text-white text-lg font-bold transition-all disabled:opacity-30"
                          disabled={item.qty <= 1}
                        >
                          −
                        </button>
                        <span className="w-11 sm:w-10 text-center font-black text-brand-navy text-sm">{item.qty}</span>
                        <button
                          onClick={() => setQty(item.id, item.selectedColor, item.selectedSize, item.selectedFrontLogo, item.selectedBackLogo, item.selectedSideLogo, item.qty + 1, false, item.selectedHoodieType, item.isCropTop)}
                          className="w-11 sm:w-10 h-full rounded-lg hover:bg-white hover:shadow-sm active:scale-95 active:bg-brand-navy active:text-white text-lg font-bold transition-all"
                          disabled={item.qty >= 99}
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total</p>
                        <p className="text-xl font-black text-brand-navy">
                          {formatPrice(item.price * item.qty)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-[1px] w-full sm:h-24 sm:w-[1px] bg-gray-100 hidden sm:block" />

                  <button
                    onClick={() => removeItem(item.id, item.selectedColor, item.selectedSize, item.selectedFrontLogo, item.selectedBackLogo, item.selectedSideLogo, false, item.selectedHoodieType, item.isCropTop)}
                    className="p-3 sm:p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-95 active:bg-red-500 active:text-white rounded-2xl transition-all duration-300"
                    title="Remove from bag"
                    aria-label="Remove item from bag"
                  >
                    <Trash2 size={22} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-brand-navy rounded-t-[2rem] lg:rounded-[2rem] fixed lg:sticky bottom-0 left-0 right-0 lg:top-24 text-white shadow-2xl shadow-brand-navy/30 z-50 lg:max-h-none">

            {/* Mobile toggle bar */}
            <div className="lg:hidden flex items-center justify-between px-5 py-4">
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
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-orange">Total</p>
                  <p className="text-lg font-black">{formatPrice(total)}</p>
                </div>
                {!summaryOpen && (
                  <Link to="/checkout" onClick={e => e.stopPropagation()}>
                    <span className="bg-white text-brand-navy text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 active:scale-95 transition-transform">
                      Checkout <ArrowRight size={14} />
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* Collapsible body */}
            <div className={`${summaryOpen ? "block" : "hidden"} lg:block p-6 sm:p-8 lg:p-10 pt-0 lg:pt-10 overflow-y-auto max-h-[calc(85vh-64px)] lg:max-h-none`}>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-6 sm:mb-8 hidden lg:block">Summary</h2>

              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 font-medium text-sm sm:text-base">Subtotal</span>
                  <span className="font-bold text-sm sm:text-base">{formatPrice(subtotal)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-400 font-medium text-sm sm:text-base">Bundle Savings</span>
                    <span className="font-bold text-green-400 text-sm sm:text-base">-{formatPrice(totalSavings)}</span>
                  </div>
                )}
                {logoFees > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 font-medium text-sm sm:text-base">Additional Logo Fees</span>
                    <span className="font-bold text-sm sm:text-base">{formatPrice(logoFees)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-white/60 font-medium text-sm sm:text-base">Est. Shipping</span>
                  <span className="font-bold text-brand-orange uppercase text-xs tracking-widest">Complimentary</span>
                </div>
              </div>

              <div className="h-[1px] bg-white/10 my-6 sm:my-8" />

              <div className="flex justify-between items-end mb-6 sm:mb-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange">Estimated Total</p>
                  <p className="text-3xl sm:text-4xl font-black tracking-tighter">{formatPrice(total)}</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <Link to="/checkout" className="block">
                  <Button variant="primary" size="lg" className="w-full !bg-white !text-brand-navy hover:!bg-brand-orange hover:!text-white active:scale-[0.98] rounded-2xl h-14 sm:h-16 shadow-xl shadow-black/20 group">
                    <span className="text-base font-bold">Secure Checkout</span>
                    <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>

                <Link to="/shop" className="hidden lg:block">
                  <Button variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/5 h-12 sm:h-14">
                    Add more items
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
