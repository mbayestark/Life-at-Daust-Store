import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { formatPrice } from "../utils/format.js";
import Button from "../components/ui/Button";

export default function Cart() {
  const { items, removeItem, setQty, count, subtotal } = useCart();

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

      <div className="grid gap-12 lg:grid-cols-12">
        {/* Cart Items */}
        <div className="lg:col-span-8 space-y-6">
          {items.map((item) => (
            <div key={`${item.id}-${item.selectedColor}-${item.selectedSize}-${item.selectedLogo}`} className="bg-white rounded-3xl premium-shadow p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-8 border border-gray-50 group transition-all duration-300">
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
                  {item.selectedLogo && (
                    <span className="flex items-center gap-2">Logo: <span className="text-brand-navy">{item.selectedLogo}</span></span>
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
                  <div className="flex items-center bg-gray-50 rounded-xl p-1 h-12">
                    <button
                      onClick={() => setQty(item.id, item.selectedColor, item.selectedSize, item.selectedLogo, item.qty - 1)}
                      className="w-10 h-full rounded-lg hover:bg-white hover:shadow-sm text-lg font-bold transition-all disabled:opacity-30"
                      disabled={item.qty <= 1}
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-black text-brand-navy text-sm">{item.qty}</span>
                    <button
                      onClick={() => setQty(item.id, item.selectedColor, item.selectedSize, item.selectedLogo, item.qty + 1)}
                      className="w-10 h-full rounded-lg hover:bg-white hover:shadow-sm text-lg font-bold transition-all"
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
                onClick={() => removeItem(item.id, item.selectedColor, item.selectedSize, item.selectedLogo)}
                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300 interactive-scale"
                title="Remove from bag"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-brand-navy rounded-[2rem] p-8 sm:p-10 sticky top-24 text-white shadow-2xl shadow-brand-navy/30">
            <h2 className="text-2xl font-black tracking-tight mb-8">Summary</h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-brand-cream/60 font-medium">Subtotal</span>
                <span className="font-bold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-brand-cream/60 font-medium">Est. Shipping</span>
                <span className="font-bold text-brand-orange uppercase text-xs tracking-widest">Complimentary</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-brand-cream/60 font-medium">Tax</span>
                <span className="font-bold">Calculated at checkout</span>
              </div>
            </div>

            <div className="h-[1px] bg-white/10 my-8" />

            <div className="flex justify-between items-end mb-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange">Estimated Total</p>
                <p className="text-4xl font-black tracking-tighter">{formatPrice(subtotal)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <Link to="/checkout" className="block">
                <Button variant="primary" size="lg" className="w-full !bg-white !text-brand-navy hover:!bg-brand-orange hover:!text-white rounded-2xl h-16 shadow-xl shadow-black/20 group">
                  Secure Checkout
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link to="/shop" className="block">
                <Button variant="ghost" className="w-full text-brand-cream/60 hover:text-white hover:bg-white/5 h-14">
                  Add more items
                </Button>
              </Link>
            </div>

            {/* Trusted indicators */}
            <div className="mt-10 pt-8 border-t border-white/10 flex justify-center gap-6 opacity-40 grayscale">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="Paypal" className="h-4" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
