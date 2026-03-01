import React from "react";
import { Link } from "react-router-dom";
import Button from "./ui/Button";
import { ArrowRight, ChevronDown } from "lucide-react";

export default function Hero({
  title,
  subtitle,
  cta,
  to = "/",
  image,
  align = "left",
}) {
  const isCenter = align === "center";

  return (
    <section className="relative min-h-[calc(100vh-72px)] flex items-center bg-brand-navy overflow-hidden">

      {/* ── Background: dot pattern ── */}
      <div className="absolute inset-0 dot-pattern pointer-events-none z-0" />

      {/* ── Background image (reduced overlay opacity for clarity) ── */}
      {image && (
        <div className="absolute inset-0 z-0 text-gray-500">
          {/* Unsplash/Local image with softer overlays */}
          <div className="absolute inset-y-0 right-0 w-full lg:w-[58%]">
            <img
              src={image}
              alt=""
              className="w-full h-full object-cover object-center"
              decoding="async"
            />
            {/* Lighter gradients to reduce the "blurred" feel of dark overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/60 to-transparent lg:from-brand-navy lg:via-brand-navy/50 lg:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/40 via-transparent to-brand-navy/20" />
          </div>
          {/* Extra mobile overlay - lighter */}
          <div className="absolute inset-0 bg-brand-navy/35 lg:hidden" />
        </div>
      )}

      {/* No image fallback */}
      {!image && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-navy" />
      )}

      {/* ── Glow blobs ── */}
      <div className="absolute -bottom-48 -left-48 w-[550px] h-[550px] bg-brand-orange/15 rounded-full blur-[150px] animate-pulse-glow pointer-events-none z-0" />
      <div className="absolute top-16 right-[35%] w-[300px] h-[300px] bg-brand-orange/8 rounded-full blur-[100px] animate-pulse-glow delay-500 pointer-events-none z-0" />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 w-full">
        <div
          className={`flex flex-col gap-4 sm:gap-6 ${isCenter ? "items-center text-center max-w-3xl mx-auto" : "items-start text-left w-full sm:max-w-[50%] sm:min-w-[320px]"
            }`}
        >
          {/* Badge Removed per user request */}

          {/* Title with font-switching animation */}
          {title && (
            <h1
              className="font-[900] tracking-[-0.04em] text-white leading-[0.95] animate-font-swap"
              style={{
                fontSize: "clamp(2.2rem, 8vw, 6rem)",
              }}
            >
              {title}
            </h1>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p
              className="text-sm sm:text-base lg:text-lg text-white/55 leading-relaxed max-w-full sm:max-w-md animate-fade-in-up delay-200"
              style={{ animationFillMode: "both" }}
            >
              {subtitle}
            </p>
          )}

          {/* CTA group */}
          {cta && (
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2 animate-fade-in-up delay-300 w-full sm:w-auto"
              style={{ animationFillMode: "both" }}
            >
              <Link to={to}>
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-full shadow-2xl shadow-brand-orange/40 hover:shadow-brand-orange/55 group gap-2.5 pr-5 transition-shadow"
                >
                  {cta}
                  <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link
                to="/shop"
                className="hidden sm:flex items-center gap-1.5 text-white/45 hover:text-white text-sm font-[600] transition-colors duration-300 group px-2"
              >
                Browse all
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in delay-700 pointer-events-none"
        style={{ animationFillMode: "both" }}
      >
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        <ChevronDown size={15} className="text-white/25 animate-bounce-y" />
      </div>
    </section>
  );
}
