import React, { useState } from "react";
import { Link, useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { Lock, Mail, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/ui/Button";
import logo from "../assets/logo.png";

export default function Signup() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const createUser = useMutation(api.users.createUser);

  if (isLoggedIn) return <Navigate to="/account" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[0-9]/.test(form.password)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      login(result);
      if (refCode) {
        navigate(`/shop?ref=${refCode}`, { replace: true });
      } else {
        navigate("/account", { replace: true });
      }
    } catch (err) {
      setError(err.data || err.message || "Sign up failed. Please try again.");
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
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Create your account</h1>
          <p className="text-gray-400 text-sm">Join and get your unique referral code instantly</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Moussa Diop"
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 text-white placeholder-gray-600 focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/30 outline-none transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 text-white placeholder-gray-600 focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/30 outline-none transition-all font-medium text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 text-white placeholder-gray-600 focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/30 outline-none transition-all font-medium text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Re-enter password"
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
            className="w-full h-14 rounded-2xl bg-brand-orange hover:bg-orange-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 group transition-all mt-2 !rounded-2xl"
          >
            Create Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-orange font-bold hover:underline">
            Sign in
          </Link>
        </p>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-white/10 font-black uppercase tracking-[0.4em] font-mono">
            Life at DAUST · Secure Signup
          </p>
        </div>
      </div>
    </div>
  );
}
