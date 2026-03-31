import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Copy, Check, Users, Gift, Tag, LogOut, User, ChevronRight } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/ui/Button";

const TIER_TABLE = [
  { referrals: 1, coupon: "12.5% off" },
  { referrals: 2, coupon: "25% off" },
  { referrals: 3, coupon: "37.5% off" },
  { referrals: 4, coupon: "50% off" },
  { referrals: 5, coupon: "62.5% off" },
  { referrals: 6, coupon: "75% off (max)" },
];

export default function Account() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const user = useQuery(
    api.users.getById,
    session?.userId ? { id: session.userId } : "skip"
  );

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handleCopy = () => {
    const code = user?.referral_code || session?.referral_code || "";
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const referralCode = user?.referral_code || session?.referral_code || "";
  const referralCount = user?.referral_count ?? 0;
  const couponPercent = user?.coupon_percent ?? 0;
  const couponUsed = user?.coupon_used ?? false;

  const couponStatusLabel = couponPercent > 0
    ? couponUsed ? "Used" : "Active"
    : "None earned yet";
  const couponStatusColor = couponPercent > 0
    ? couponUsed ? "text-gray-400 bg-gray-100" : "text-green-700 bg-green-100"
    : "text-gray-400 bg-gray-100";

  const APP_URL = "https://shop.daustgov.com";
  const shareUrl = referralCode ? `${APP_URL}/referral?ref=${referralCode}` : "";

  return (
    <div className="bg-gray-50/50 min-h-screen pb-24">
      <div className="bg-white border-b border-gray-100 mb-10">
        <div className="max-w-5xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-[var(--text-2xl)] font-black text-brand-navy tracking-tight">My Account</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 space-y-8">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-brand-navy rounded-2xl flex items-center justify-center flex-shrink-0">
            <User size={28} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-black text-brand-navy truncate">{session?.name || "—"}</p>
            <p className="text-sm text-gray-500 font-medium truncate">{session?.email || "—"}</p>
          </div>
          <Link to="/shop">
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
              Shop Now <ChevronRight size={14} />
            </Button>
          </Link>
        </div>

        {/* Referral Code Card */}
        <div className="bg-brand-navy rounded-3xl p-8 text-white shadow-2xl shadow-brand-navy/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-orange mb-2">Your Referral Code</p>
            <div className="flex items-center gap-4 mt-4">
              <span className="text-4xl font-black tracking-widest font-mono">{referralCode}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/10"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-white/40 text-xs font-medium mt-4">
              Share this code — friends get 7% off their order, you earn discount milestones.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-brand-orange/10 rounded-2xl flex items-center justify-center mb-4">
              <Users size={20} className="text-brand-orange" />
            </div>
            <p className="text-3xl font-black text-brand-navy">{referralCount}</p>
            <p className="text-sm text-gray-500 font-medium mt-1">
              {referralCount === 1 ? "Successful Referral" : "Successful Referrals"}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
              <Tag size={20} className="text-green-500" />
            </div>
            <p className="text-3xl font-black text-brand-navy">
              {couponPercent > 0 ? `${couponPercent}%` : "0%"}
            </p>
            <p className="text-sm text-gray-500 font-medium mt-1">Current Coupon</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
              <Gift size={20} className="text-purple-500" />
            </div>
            <p className="text-sm font-bold text-brand-navy mt-1">Coupon Status</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${couponStatusColor}`}>
              {couponStatusLabel}
            </span>
          </div>
        </div>

        {/* Active Coupon Banner */}
        {couponPercent > 0 && !couponUsed && (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Gift size={22} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-black text-green-800 text-sm uppercase tracking-wide">You have an active coupon!</p>
              <p className="text-green-700 text-sm mt-0.5">
                <span className="font-black">{couponPercent}% off</span> your next order — applied automatically at checkout.
              </p>
            </div>
            <Link to="/checkout">
              <Button variant="secondary" size="sm" className="flex-shrink-0 !border-green-600 !text-green-700 hover:!bg-green-600 hover:!text-white">
                Use Now
              </Button>
            </Link>
          </div>
        )}

        {/* Tier Table */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-black text-brand-navy mb-6 tracking-tight">Referral Reward Tiers</h2>
          <div className="space-y-3">
            {TIER_TABLE.map((tier) => {
              const isReached = referralCount >= tier.referrals;
              const isCurrent = referralCount === tier.referrals;
              return (
                <div
                  key={tier.referrals}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                    isCurrent
                      ? "bg-brand-orange/10 border-2 border-brand-orange"
                      : isReached
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                      isReached ? "bg-brand-orange text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      {tier.referrals}
                    </div>
                    <span className={`text-sm font-bold ${isReached ? "text-brand-navy" : "text-gray-500"}`}>
                      {tier.referrals} {tier.referrals === 1 ? "referral" : "referrals"}
                    </span>
                  </div>
                  <span className={`text-sm font-black ${
                    isCurrent ? "text-brand-orange" : isReached ? "text-green-600" : "text-gray-400"
                  }`}>
                    {tier.coupon}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Share section */}
        {shareUrl && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-black text-brand-navy mb-2 tracking-tight">Share Your Link</h2>
            <p className="text-sm text-gray-500 mb-5">Send this link to friends — they get 7% off their order and land on the referral page with your code pre-filled.</p>
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <span className="flex-1 text-xs font-mono text-gray-700 truncate select-all">{shareUrl}</span>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
                className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-brand-orange transition-colors flex-shrink-0"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy Link"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
