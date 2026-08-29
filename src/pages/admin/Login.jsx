import React, { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import { Lock, Mail, ArrowRight } from "lucide-react";
import Button from "../../components/ui/Button";
import logo from "../../assets/logo.png";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState("email"); // "email" or "legacy"
    const { login, isAdmin } = useAdmin();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/admin";

    if (isAdmin) {
        return <Navigate to={from} replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = mode === "email"
                ? await login(password, email)
                : await login(password);

            if (result.success) {
                navigate(from, { replace: true });
            } else {
                setError(result.error || "Invalid credentials. Please try again.");
                setLoading(false);
            }
        } catch {
            setError("Login failed. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-navy flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 dot-pattern opacity-[0.03] pointer-events-none" />
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-[400px] animate-fade-in-up">
                <div className="text-center mb-12">
                    <img src={logo} alt="Life at DAUST" className="h-[90px] w-auto mx-auto mb-8 drop-shadow-2xl" />
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Log in to your account</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {mode === "email" && (
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-bold text-gray-300 uppercase tracking-widest px-1">
                                Email
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@mydaust.org"
                                    className="w-full bg-brand-navy border border-gray-800 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/30 outline-none transition-all"
                                    required
                                />
                                <Mail className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-700 h-4 w-4" />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-bold text-gray-300 uppercase tracking-widest px-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={mode === "email" ? "Enter your password" : "Enter access password"}
                                className="w-full bg-brand-navy border border-gray-800 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/30 outline-none transition-all"
                                required
                            />
                            <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-700 h-4 w-4" />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-shake">
                            <p className="text-red-400 text-xs font-bold text-center">{error}</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full rounded-2xl h-14 bg-brand-orange hover:bg-orange-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 group transition-all"
                        loading={loading}
                    >
                        Enter Portal
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => { setMode(mode === "email" ? "legacy" : "email"); setError(""); }}
                        className="text-xs text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-widest"
                    >
                        {mode === "email" ? "Use access password instead" : "Use email login"}
                    </button>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-white/10 font-black uppercase tracking-[0.4em] font-mono">
                        Life at DAUST · V2.5.0
                    </p>
                </div>
            </div>
        </div>
    );
}
