import React, { useState } from "react";
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import { Lock, ArrowRight } from "lucide-react";
import Button from "../../components/ui/Button";
import logo from "../../assets/logo.png";

export default function AdminLogin() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
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

        setTimeout(() => {
            if (login(password)) {
                navigate(from, { replace: true });
            } else {
                setError("Invalid password. Please try again.");
                setLoading(false);
            }
        }, 600);
    };

    return (
        <div className="min-h-screen bg-brand-navy flex items-center justify-center p-4 relative overflow-hidden">
            {/* Premium Background Elements */}
            <div className="absolute inset-0 dot-pattern opacity-[0.03] pointer-events-none" />
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-[400px] animate-fade-in-up">
                {/* Logo & Header */}
                <div className="text-center mb-12">
                    <img src={logo} alt="Life at DAUST" className="h-[90px] w-auto mx-auto mb-8 drop-shadow-2xl" />
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Log in to your account</h1>
                </div>

                {/* Login Form (No Card) */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <label htmlFor="password" className="text-sm font-bold text-gray-300 uppercase tracking-widest">
                                Admin Portal Access
                            </label>
                        </div>
                        <div className="relative">
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Access Password"
                                className="w-full bg-brand-navy border border-gray-800 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/30 outline-none transition-all text-center tracking-[0.5em]"
                                required
                            />
                            <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-700 h-4 w-4" />
                        </div>
                        <p className="text-[10px] text-center text-gray-500 font-bold uppercase tracking-widest mt-4 opacity-50">
                            Secure single-factor authentication
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-shake">
                            <p className="text-red-400 text-xs font-bold text-center">
                                {error}
                            </p>
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

                <div className="mt-20 text-center">
                    <p className="text-[10px] text-white/10 font-black uppercase tracking-[0.4em] font-mono">
                        Life at DAUST · V2.4.2
                    </p>
                </div>
            </div>
        </div>
    );
}
