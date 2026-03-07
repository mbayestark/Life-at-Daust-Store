import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, ShoppingBag, ArrowRight, Home } from "lucide-react";
import Button from "../components/ui/Button";
import { useCart } from "../context/CartContext.jsx";

export default function OrderSuccess() {
    const { orderId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { clear } = useCart();
    const stateOrderId = location.state?.orderId;
    const statePaymentMethod = location.state?.paymentMethod;
    const [countdown, setCountdown] = useState(5);

    // Final ID to show
    const displayId = orderId || stateOrderId || "UNKNOWN";

    // Determine the order status based on payment method
    // For manual payments: state is passed, shows "Pending Verification"
    // For naboopay: no state passed (direct URL return), but we can infer it's paid since they're on success page
    // The order status will be updated to "Paid" in the backend via webhook
    const isManualPayment = statePaymentMethod === "manual";
    const orderStatus = isManualPayment ? "Pending Verification" : "Paid";
    const statusColor = isManualPayment 
        ? "bg-brand-orange/5 text-brand-orange border-brand-orange/10" 
        : "bg-green-50 text-green-600 border-green-100";

    useEffect(() => {
        // If we land here without an ID, redirect to shop
        if (displayId === "UNKNOWN") {
            const timer = setTimeout(() => navigate("/shop"), 5000);
            return () => clearTimeout(timer);
        }
        
        // Clear the cart when arriving on payment success page
        clear();
        
        // Auto-redirect to homepage after 5 seconds
        const timer = setTimeout(() => navigate("/"), 5000);
        
        // Countdown interval
        const countdownInterval = setInterval(() => {
            setCountdown(prev => Math.max(0, prev - 1));
        }, 1000);
        
        return () => {
            clearTimeout(timer);
            clearInterval(countdownInterval);
        };
    }, [displayId, navigate, clear]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
            {/* Celebration Background Element */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-navy/5 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="max-w-2xl w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl shadow-black/[0.03] border border-gray-100 relative z-10 animate-in fade-in zoom-in duration-700">
                {/* Success Icon */}
                <div className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-lg shadow-green-500/10">
                    <CheckCircle2 size={48} className="text-green-500 animate-in bounce-in duration-700" />
                </div>

                <h1 className="text-4xl sm:text-5xl font-[900] text-brand-navy tracking-tight mb-4">Payment Successful!</h1>
                <p className="text-gray-500 text-lg mb-10 font-medium">
                    Thank you for your payment. Your order has been confirmed and is being processed.
                </p>

                {/* Order Card */}
                <div className="bg-gray-50/80 rounded-[2rem] p-8 border border-gray-100 mb-12 transform hover:scale-[1.02] transition-transform duration-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Transaction ID</p>
                    <p className="text-2xl font-black text-brand-navy tracking-tighter">{displayId}</p>
                    <div className={`mt-6 flex items-center justify-center gap-2 text-xs font-bold py-3 px-6 rounded-full inline-flex border ${statusColor}`}>
                        <ShoppingBag size={14} /> Status: {orderStatus}
                    </div>
                </div>

                <div className="text-sm text-gray-400 mb-12 space-y-2 font-medium italic">
                    {isManualPayment ? (
                        <>
                            <p>Next Steps: Our dedicated team will verify your payment screenshot.</p>
                            <p>Once confirmed, your items will be prepared for delivery/pickup.</p>
                        </>
                    ) : (
                        <p>Your payment has been confirmed. Your items will be prepared for delivery/pickup.</p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    {displayId !== "UNKNOWN" && (
                        <p className="text-sm text-gray-400 mb-4">
                            Redirecting to homepage in <span className="font-bold text-brand-orange">{countdown}</span> seconds...
                        </p>
                    )}
                    <Link to="/" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:px-10 h-16 rounded-2xl flex items-center gap-2 group">
                            <Home size={18} className="group-hover:-translate-y-0.5 transition-transform" /> Back Home
                        </Button>
                    </Link>
                    <Link to="/shop" className="w-full sm:w-auto">
                        <Button className="w-full sm:px-10 h-16 rounded-2xl flex items-center gap-2 group">
                            Continue Shopping <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="mt-12 flex items-center gap-6 animate-in slide-in-from-bottom-5 duration-700 delay-300">
                <img src="/wave.png" alt="Wave" className="h-8 opacity-20 grayscale" />
                <img src="/orangemoney.png" alt="Orange Money" className="h-6 opacity-20 grayscale" />
                <div className="h-4 w-[1px] bg-gray-200" />
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">SECURE UNIVERSITY GATEWAY</p>
            </div>
        </div>
    );
}
