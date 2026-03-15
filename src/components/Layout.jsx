import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import { CartProvider } from "../context/CartContext.jsx";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Tag } from "lucide-react";

function DiscountBanner() {
  const discountInfo = useQuery(api.orders.getDiscountEligibility, { phone: "" });
  if (discountInfo?.slotsRemaining === 0) return null;
  return (
    <div style={{ background: "#f97316" }} className="px-4 py-2.5 flex items-center justify-center gap-2 text-white text-xs font-black uppercase tracking-wider">
      <Tag size={13} />
      <span>
        🎉 Early Launch Offer — First 10 customers get 15% off!&nbsp;
        {discountInfo && (
          <span className="opacity-80 font-medium normal-case tracking-normal">
            {discountInfo.slotsRemaining} spot{discountInfo.slotsRemaining !== 1 ? "s" : ""} remaining
          </span>
        )}
      </span>
    </div>
  );
}

export default function Layout() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <DiscountBanner />
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}