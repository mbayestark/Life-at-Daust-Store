import React, { useState } from "react";
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import { Lock, ArrowRight, Shield } from "lucide-react";
import Button from "../../components/ui/Button";

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

        // Simulate delay
        setTimeout(() => {
            if (login(password)) {
                navigate(from, { replace: true });
            } else {
                setError("Invalid administrative password");
                setLoading(false);
            }
        }, 800);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-[440px] animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-navy text-white mb-6">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-brand-navy tracking-tighter mb-2">Admin Portal</h1>
                    <p className="text-gray-500 font-medium max-w-[280px] mx-auto">Access restricted to DAUST staff and administrators</p>
                </div>

                <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-2xl shadow-gray-200/50 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                                Security Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 text-brand-navy font-bold focus:ring-2 focus:ring-brand-orange/20 transition-all"
                                    placeholder="Enter admin password"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm font-bold ml-1 animate-in slide-in-from-top-1 duration-200">
                                {error}
                            </p>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full rounded-2xl h-14 group"
                            loading={loading}
                        >
                            Verify Identity
                            <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                        <Link to="/" className="text-gray-400 hover:text-brand-orange text-xs font-bold uppercase tracking-widest transition-colors">
                            ← Return to Store
                        </Link>
                    </div>
                </div>

                <p className="text-center mt-10 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                    Life at DAUST © 2026 Admin Infrastructure
                </p>
            </div>
        </div>
    );
}
