import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext.jsx";
import { Gift, Users, Tag, ArrowRight, Copy, Check } from "lucide-react";
import Button from "../components/ui/Button";

const TIER_TABLE = [
  { referrals: 1, coupon: "12.5% off" },
  { referrals: 2, coupon: "25% off" },
  { referrals: 3, coupon: "37.5% off" },
  { referrals: 4, coupon: "50% off" },
  { referrals: 5, coupon: "62.5% off" },
  { referrals: 6, coupon: "75% off (max)" },
];

const HOW_IT_WORKS = [
  {
    icon: <Users size={24} className="text-brand-orange" />,
    step: "01",
    title: "Share Your Code",
    desc: "Sign up to get a unique referral code. Share it with DAUST students and friends.",
  },
  {
    icon: <Tag size={24} className="text-brand-orange" />,
    step: "02",
    title: "Friends Save 7%",
    desc: "When a friend enters your code at checkout, they get 7% off eligible items in their order.",
  },
  {
    icon: <Gift size={24} className="text-brand-orange" />,
    step: "03",
    title: "You Earn Coupons",
    desc: "Every confirmed order earns you 12.5% towards your personal coupon — up to 75% off.",
  },
];

export default function Referral() {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const { session, isLoggedIn } = useAuth();
  const [copied, setCopied] = useState(false);

  const user = useQuery(
    api.users.getById,
    session?.userId ? { id: session.userId } : "skip"
  );

  const referralCode = user?.referral_code || session?.referral_code || "";

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* Hero */}
      <div className="bg-brand-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-[0.03] pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 sm:w-[500px] sm:h-[500px] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20 relative z-10 text-center">
          <div className="inline-block bg-brand-orange/20 text-brand-orange px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] mb-5">
            Referral Program
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-5 leading-tight">
            Share &amp; Save Together
          </h1>
          <p className="text-white/60 text-base sm:text-lg max-w-xl mx-auto font-medium mb-8 leading-relaxed px-2">
            Refer friends to Life at DAUST. They get{" "}
            <span className="text-brand-orange font-black">7% off</span> their eligible order. You earn discount milestones up to{" "}
            <span className="text-brand-orange font-black">75% off</span>.
          </p>
          {isLoggedIn ? (
            <Link to="/account">
              <Button className="h-12 sm:h-14 px-8 sm:px-10 rounded-2xl shadow-2xl shadow-brand-orange/20 !bg-brand-orange hover:!bg-orange-500 gap-2 w-full sm:w-auto">
                View My Dashboard <ArrowRight size={16} />
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center px-2 sm:px-0">
              <Link to={`/signup${refCode ? `?ref=${refCode}` : ""}`} className="w-full sm:w-auto">
                <Button className="h-12 sm:h-14 px-8 sm:px-10 rounded-2xl shadow-2xl shadow-brand-orange/20 !bg-brand-orange hover:!bg-orange-500 gap-2 w-full">
                  Join Now &mdash; It's Free <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="secondary" className="h-12 sm:h-14 px-8 sm:px-10 rounded-2xl !border-white/20 !text-white hover:!bg-white/10 w-full">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10 sm:space-y-14">

        {/* Your code (logged in) */}
        {isLoggedIn && referralCode && (
          <div className="bg-brand-navy rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-brand-navy/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-orange mb-3">Your Referral Code</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <p className="text-3xl sm:text-4xl font-black tracking-widest font-mono break-all">{referralCode}</p>
                <button
                  onClick={() => handleCopy(referralCode)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-brand-orange rounded-xl text-sm font-black uppercase tracking-wider border border-white/10 transition-all flex-shrink-0"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy Code"}
                </button>
              </div>
              <p className="text-white/40 text-xs mt-4">Share this code with friends — they enter it at checkout to get 7% off.</p>
            </div>
          </div>
        )}

        {/* Ref code notice (not logged in) */}
        {!isLoggedIn && refCode && (
          <div className="bg-brand-orange/10 border border-brand-orange/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Tag size={20} className="text-brand-orange flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-black text-brand-navy text-sm">You were referred!</p>
              <p className="text-gray-600 text-sm mt-1">
                Code <span className="font-black text-brand-orange font-mono">{refCode}</span> gives you{" "}
                <strong>7% off</strong> eligible items when you sign up and checkout.
              </p>
            </div>
          </div>
        )}

        {/* How it works */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-brand-orange/10 rounded-xl flex items-center justify-center mb-5">
                  {item.icon}
                </div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-1.5">Step {item.step}</p>
                <h3 className="text-base font-black text-brand-navy mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tier Table */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-black text-brand-navy tracking-tight mb-1">Reward Tiers</h2>
          <p className="text-gray-500 text-sm mb-6">Your coupon grows with every confirmed referral — up to 75% off.</p>
          <div className="divide-y divide-gray-50">
            {TIER_TABLE.map((tier) => (
              <div key={tier.referrals} className="flex items-center justify-between py-3.5 px-1">
                <span className="text-sm font-bold text-brand-navy">
                  {tier.referrals} {tier.referrals === 1 ? "referral" : "referrals"}
                </span>
                <span className="text-sm font-black text-brand-orange">{tier.coupon}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="bg-gray-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
          <h3 className="text-sm font-black text-brand-navy mb-4 uppercase tracking-wider">Program Rules</h3>
          <ul className="space-y-2.5 text-sm text-gray-600">
            {[
              "You cannot use your own referral code.",
              "Referrals only count on fully paid, confirmed orders.",
              "The Quarter Zip product is excluded from all discounts.",
              "Coupon resets to 0% after one redemption — earn again from scratch.",
              "Maximum coupon value is capped at 75%.",
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-brand-orange font-black mt-0.5 flex-shrink-0">&bull;</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA (not logged in) */}
        {!isLoggedIn && (
          <div className="text-center py-6 sm:py-10">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight mb-3">Ready to start earning?</h2>
            <p className="text-gray-500 text-sm sm:text-base mb-7">Create a free account and get your referral code instantly.</p>
            <Link to={`/signup${refCode ? `?ref=${refCode}` : ""}`}>
              <Button className="h-12 sm:h-14 px-10 sm:px-12 rounded-2xl shadow-xl shadow-brand-orange/20 !bg-brand-orange hover:!bg-orange-500 gap-2 w-full sm:w-auto">
                Get My Referral Code <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
