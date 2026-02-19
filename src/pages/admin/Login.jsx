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

            <div className="relative z-10 w-full max-w-[440px] animate-fade-in-up">
                {/* Logo & Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center mb-6 p-4 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl">
                        <img src={logo} alt="Life at DAUST" className="h-[70px] w-auto" />
                    </div>
                    <h1 className="text-3xl font-[900] text-white tracking-tight mb-3">Admin Portal</h1>
                    <p className="text-white/40 text-sm font-medium tracking-wide">Secure access for authorized DAUST personnel</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-50" />

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="space-y-2.6">
                            <label htmlFor="password" className="block text-[10px] font-[900] text-brand-orange uppercase tracking-[3px] ml-1">
                                Security Key
                            </label>
                            <div className="relative group/input">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 h-4 w-4 transition-colors group-focus-within/input:text-brand-orange" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-13 pr-5 py-5 text-white font-semibold text-sm placeholder-white/20 focus:bg-white/10 focus:border-brand-orange/50 focus:ring-4 focus:ring-brand-orange/10 transition-all outline-none"
                                    placeholder="••••••••••••"
                                    required
                                />
                            </div>
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
                            className="w-full rounded-2xl h-16 group bg-brand-orange hover:bg-orange-500 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-orange/20"
                            loading={loading}
                        >
                            Authenticate
                            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        <Link to="/" className="inline-flex items-center text-white/30 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">
                            <span className="mr-2">←</span> Return to Shop
                        </Link>
                    </div>
                </div>

                <div className="mt-12 text-center space-y-2">
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] font-mono">
                        Life at DAUST · V2.4.0
                    </p>
                </div>
            </div>
        </div>
    );
}
