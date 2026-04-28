import React, { useEffect, useState, useRef } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, ShoppingBag, ArrowRight, Home, Loader2, AlertCircle } from "lucide-react";
import Button from "../components/ui/Button";
import { useCart } from "../context/CartContext.jsx";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function OrderSuccess() {
    const { orderId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { clear } = useCart();
    const stateOrderId = location.state?.orderId;
    const statePaymentMethod = location.state?.paymentMethod;
    const [countdown, setCountdown] = useState(8);
    const cartCleared = useRef(false);

    const displayId = orderId || stateOrderId || "UNKNOWN";

    const order = useQuery(
        api.orders.getByOrderIdPublic,
        displayId !== "UNKNOWN" ? { orderId: displayId } : "skip"
    );

    const isManualPayment = statePaymentMethod === "manual";
    const isConfirmed = order?.status === "Paid";
    const isPending = order?.status === "Pending Payment";
    const isExpired = order?.status === "Expired" || order?.status === "Cancelled" || order?.status === "Failed";
    const orderNotFound = order === null;

    const orderStatus = isManualPayment
        ? "Pending Verification"
        : isConfirmed ? "Paid"
        : isPending ? "Confirming Payment..."
        : isExpired ? order?.status
        : order?.status ?? "Loading...";

    const statusColor = isManualPayment
        ? "bg-brand-orange/5 text-brand-orange border-brand-orange/10"
        : isConfirmed ? "bg-green-50 text-green-600 border-green-100"
        : isPending ? "bg-yellow-50 text-yellow-600 border-yellow-100"
        : isExpired ? "bg-red-50 text-red-600 border-red-100"
        : "bg-gray-50 text-gray-500 border-gray-100";

    useEffect(() => {
        if (displayId === "UNKNOWN" || orderNotFound) {
            const timer = setTimeout(() => navigate("/shop"), 5000);
            return () => clearTimeout(timer);
        }
    }, [displayId, orderNotFound, navigate]);

    useEffect(() => {
        if (cartCleared.current) return;
        if (isConfirmed || isManualPayment) {
            clear();
            cartCleared.current = true;
        }
    }, [isConfirmed, isManualPayment, clear]);

    useEffect(() => {
        if (!isConfirmed && !isManualPayment) return;
        const timer = setTimeout(() => navigate("/"), 8000);
        const countdownInterval = setInterval(() => {
            setCountdown(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => {
            clearTimeout(timer);
            clearInterval(countdownInterval);
        };
    }, [isConfirmed, isManualPayment, navigate]);

    if (orderNotFound) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-20">
                <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl border border-gray-100">
                    <AlertCircle size={48} className="text-red-400 mx-auto mb-6" />
                    <h1 className="text-2xl font-black text-brand-navy mb-3">Order Not Found</h1>
                    <p className="text-gray-500 text-sm mb-8">This order does not exist. Redirecting to shop...</p>
                    <Link to="/shop"><Button>Go to Shop</Button></Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-navy/5 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="max-w-2xl w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl shadow-black/[0.03] border border-gray-100 relative z-10 animate-in fade-in zoom-in duration-700">
                {(isConfirmed || isManualPayment) ? (
                    <div className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-lg shadow-green-500/10">
                        <CheckCircle2 size={48} className="text-green-500 animate-in bounce-in duration-700" />
                    </div>
                ) : isPending ? (
                    <div className="w-24 h-24 bg-yellow-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-lg shadow-yellow-500/10">
                        <Loader2 size={48} className="text-yellow-500 animate-spin" />
                    </div>
                ) : isExpired ? (
                    <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-lg shadow-red-500/10">
                        <AlertCircle size={48} className="text-red-400" />
                    </div>
                ) : (
                    <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-lg">
                        <Loader2 size={48} className="text-gray-400 animate-spin" />
                    </div>
                )}

                <h1 className="text-4xl sm:text-5xl font-[900] text-brand-navy tracking-tight mb-4">
                    {isConfirmed || isManualPayment ? "Payment Successful!" : isPending ? "Confirming Payment..." : isExpired ? "Payment Failed" : "Checking Payment..."}
                </h1>
                <p className="text-gray-500 text-lg mb-10 font-medium">
                    {isConfirmed
                        ? "Your payment has been confirmed. Your order is being processed."
                        : isPending
                        ? "We're waiting for payment confirmation from your provider. This usually takes a few seconds."
                        : isExpired
                        ? "This order was not completed. Please try placing a new order."
                        : isManualPayment
                        ? "Thank you for your payment. Your order has been submitted for verification."
                        : "Loading order details..."}
                </p>

                <div className="bg-gray-50/80 rounded-[2rem] p-8 border border-gray-100 mb-12 transform hover:scale-[1.02] transition-transform duration-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Transaction ID</p>
                    <p className="text-2xl font-black text-brand-navy tracking-tighter">{displayId}</p>
                    <div className={`mt-6 flex items-center justify-center gap-2 text-xs font-bold py-3 px-6 rounded-full inline-flex border ${statusColor}`}>
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />} Status: {orderStatus}
                    </div>
                </div>

                <div className="text-sm text-gray-400 mb-12 space-y-2 font-medium italic">
                    {isManualPayment ? (
                        <>
                            <p>Next Steps: Our dedicated team will verify your payment screenshot.</p>
                            <p>Once confirmed, your items will be prepared for delivery/pickup.</p>
                        </>
                    ) : isConfirmed ? (
                        <p>Your items will be prepared for delivery/pickup.</p>
                    ) : isPending ? (
                        <p>Please don't close this page. It will update automatically once your payment is confirmed.</p>
                    ) : isExpired ? (
                        <p>If you believe this is an error, please contact support.</p>
                    ) : null}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    {(isConfirmed || isManualPayment) && (
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
