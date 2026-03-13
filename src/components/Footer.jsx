import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook } from "lucide-react";
import logo from "../assets/logo.png";

const SHOP_LINKS = [
  { label: "All Products", to: "/shop" },
  { label: "New Arrivals", to: "/shop" },
  { label: "Best Sellers", to: "/shop" },
];

const COMPANY_LINKS = [
  { label: "About Us", to: "/about" },
];

const SUPPORT_LINKS = [
  { label: "Shipping & Returns", href: "#" },
  { label: "Size Guide", href: "#" },
];

const SOCIALS = [
  { Icon: Instagram, label: "Instagram", href: "https://www.instagram.com/life_at_daust/" },
  { label: "TikTok", href: "https://www.tiktok.com/@life_at_daust" }, // Custom icon handle
];

function FooterLink({ label, to, href }) {
  const cls = "text-white/45 hover:text-white text-sm font-[500] transition-colors duration-300";
  return (
    <li>
      {to ? (
        <Link to={to} className={cls}>{label}</Link>
      ) : (
        <a href={href} className={cls}>{label}</a>
      )}
    </li>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 className="text-[11px] font-[800] text-white tracking-[0.15em] mb-6">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map(l => <FooterLink key={l.label} {...l} />)}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-white relative overflow-hidden">
      {/* Top orange accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand-orange/50 to-transparent" />

      {/* Subtle glow */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-orange/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Brand header row */}
        <div className="py-10 sm:py-14 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Life at DAUST" className="h-[120px] w-auto object-contain flex-shrink-0" />
          </div>
          <p className="text-white/35 text-sm leading-relaxed max-w-xs">
            Campus apparel and essentials made for and by the DAUST community.
          </p>
        </div>

        {/* Links grid */}
        <div className="py-8 sm:py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          <FooterColumn title="Shop" links={SHOP_LINKS} />
          <FooterColumn title="Information" links={COMPANY_LINKS} />
          <FooterColumn title="Support" links={SUPPORT_LINKS} />

          {/* Social column */}
          <div>
            <h4 className="text-[11px] font-[800] text-white tracking-[0.15em] mb-6">
              Connect
            </h4>
            <div className="flex gap-2.5">
              {SOCIALS.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-brand-orange/15 hover:text-brand-orange text-white/40 flex items-center justify-center transition-all duration-300 group"
                >
                  {Icon ? <Icon size={18} className="group-hover:scale-110 transition-transform" /> : <span className="text-[9px] font-[900] tracking-tighter">TT</span>}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs font-medium">
            &copy; {new Date().getFullYear()} Life at DAUST Store. Handcrafted with pride in Dakar.
          </p>
          <div className="flex gap-5">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(l => (
              <a key={l} href="#" className="text-white/20 hover:text-white/50 text-xs font-[500] transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
