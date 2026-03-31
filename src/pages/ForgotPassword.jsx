import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import Button from "../components/ui/Button";
import logo from "../assets/logo.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const requestPasswordReset = useAction(api.users.requestPasswordReset);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px] animate-fade-in-up">
        <div className="text-center mb-10">
          <Link to="/">
            <img src={logo} alt="Life at DAUST" className="h-[80px] w-auto mx-auto mb-8 drop-shadow-2xl" />
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            {sent ? "Check your inbox" : "Reset your password"}
          </h1>
          <p className="text-gray-400 text-sm">
            {sent
              ? "We sent a reset link to your email address."
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {sent ? (
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
              <CheckCircle size={32} className="text-green-400" />
              <p className="text-green-400 text-sm font-bold">
                If an account exists for <span className="font-black">{email}</span>, a reset link has been sent. Check your spam folder if you don't see it.
              </p>
            </div>
            <p className="text-center text-gray-500 text-xs font-medium">
              The link expires in 1 hour.
            </p>
            <Link to="/login">
              <Button variant="secondary" className="w-full h-14 rounded-2xl !border-white/10 !text-white hover:!bg-white/10 flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 text-white placeholder-gray-600 focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/30 outline-none transition-all font-medium text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 text-xs font-bold text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full h-14 rounded-2xl bg-brand-orange hover:bg-orange-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all !rounded-2xl"
            >
              Send Reset Link
            </Button>

            <Link to="/login" className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 text-sm font-medium transition-colors pt-2">
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </form>
        )}

        <div className="mt-12 text-center">
          <p className="text-[10px] text-white/10 font-black uppercase tracking-[0.4em] font-mono">
            Life at DAUST &nbsp;&bull;&nbsp; shop.daustgov.com
          </p>
        </div>
      </div>
    </div>
  );
}
