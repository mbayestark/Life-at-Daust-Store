import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Circle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Button from "../components/ui/Button";
import logo from "../assets/logo.png";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const resetPassword = useMutation(api.users.resetPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
      return;
    }
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
      await resetPassword({ token, newPassword: form.password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.data || err.message || "Failed to reset password. The link may be expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-brand-navy flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle size={40} className="text-red-400 mx-auto" />
          <h1 className="text-xl font-black text-white">Invalid Link</h1>
          <p className="text-gray-400 text-sm">This reset link is missing a token. Please request a new one.</p>
          <Link to="/forgot-password">
            <Button className="mt-4 !bg-brand-orange hover:!bg-orange-500">Request New Link</Button>
          </Link>
        </div>
      </div>
    );
  }

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
            {success ? "Password updated" : "Choose a new password"}
          </h1>
          <p className="text-gray-400 text-sm">
            {success
              ? "Your password has been reset. Redirecting to sign in..."
              : "Must be at least 8 characters with one uppercase letter and one number."}
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
              <CheckCircle size={32} className="text-green-400" />
              <p className="text-green-400 text-sm font-bold">
                Your password has been updated successfully.
              </p>
            </div>
            <Link to="/login">
              <Button className="w-full h-14 rounded-2xl !bg-brand-orange hover:!bg-orange-500 text-white font-black uppercase tracking-widest !rounded-2xl">
                Sign In Now
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">New Password</label>
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
              {form.password.length > 0 && (
                <div className="flex gap-4 pt-1">
                  {[{ ok: form.password.length >= 8, label: "8+ chars" }, { ok: /[A-Z]/.test(form.password), label: "Uppercase" }, { ok: /[0-9]/.test(form.password), label: "Number" }].map(({ ok, label }) => (
                    <span key={label} className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${ok ? "text-green-400" : "text-gray-600"}`}>
                      {ok ? <CheckCircle size={12} /> : <Circle size={12} />} {label}
                    </span>
                  ))}
                </div>
              )}
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
                  placeholder="Re-enter new password"
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
              className="w-full h-14 rounded-2xl bg-brand-orange hover:bg-orange-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all mt-2 !rounded-2xl"
            >
              Update Password
            </Button>

            <Link to="/forgot-password" className="flex items-center justify-center text-gray-500 hover:text-gray-300 text-xs font-medium transition-colors pt-2">
              Request a new reset link
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
