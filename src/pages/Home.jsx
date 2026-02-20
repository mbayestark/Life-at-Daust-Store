import React, { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowRight, ChevronLeft, ChevronRight, Quote, Star, Zap } from "lucide-react";
import { useMemo } from "react";
import Hero from "../components/Hero.jsx";
import Newsletter from "../components/Newsletter.jsx";
import ProductCard from "../components/ProductCard.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import Button from "../components/ui/Button.jsx";
import { PRODUCTS } from "../data/products.js";

/* ─── Data ─────────────────────────────────────────────────── */

const testimonials = [
  { name: "Amadou D.", role: "CS, Class of 2026", text: "The hoodie quality is unreal. I wear mine almost every day. Everyone asks where I got it." },
  { name: "Fatou S.", role: "EE, Class of 2025", text: "Ordered the ELEC Engineer tee and it fit perfectly. The print has held up through dozens of washes." },
  { name: "Moussa K.", role: "Proud Parent", text: "Bought the Proud Parent hoodie for my wife and she absolutely loves it. Thoughtful design." },
  { name: "Aïda B.", role: "Business, Class of 2027", text: "Finally campus merch I'm proud to wear off-campus too. The quality is genuinely premium." },
  { name: "Omar T.", role: "Alumni, Class of 2024", text: "Ordered three hoodies for graduation week. They arrived on time and looked amazing in photos." },
  { name: "Rama N.", role: "CS, Class of 2026", text: "The limited edition drop sold out fast. Glad I caught it. Wearing it at every hackathon now." },
];

const STRIP_ITEMS = [
  "New Drops",
  "Campus Delivery",
  "Premium Quality",
  "Daustian Pride",
  "Limited Edition",
  "Student Designed",
  "Made for DAUST",
];


/* ─── Helpers ────────────────────────────────────────────────── */

/** IntersectionObserver–based reveal for a single element */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─── Sub-components ─────────────────────────────────────────── */

function AnnouncementStrip() {
  const items = [...STRIP_ITEMS, ...STRIP_ITEMS]; // double for seamless loop
  return (
    <div className="bg-brand-orange overflow-hidden py-3.5 select-none">
      <div className="flex animate-marquee" style={{ width: "max-content" }}>
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2 mx-6 text-white text-[11px] font-[800] uppercase tracking-[0.18em] whitespace-nowrap">
            <Zap size={11} className="fill-current opacity-80" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function CollectionCard({ collection, index }) {
  return (
    <Link
      to={`/collections/${collection.slug}`}
      className="group relative rounded-2xl overflow-hidden bg-gray-100 block"
    >
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={
            collection.image ||
            `https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=640&q=80`
          }
          alt={collection.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          loading="lazy"
        />
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-300" />
      {/* Number badge */}
      <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-1 text-white text-[10px] font-[900] tracking-widest">
        0{index + 1}
      </div>
      {/* Text */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <h3 className="text-white text-lg sm:text-xl font-[900] tracking-tight mb-1.5 group-hover:text-brand-orange transition-colors duration-300">
          {collection.name}
        </h3>
        <span className="inline-flex items-center gap-1.5 text-white/55 text-[10px] font-[800] uppercase tracking-[0.15em] group-hover:text-white/80 transition-colors duration-300">
          Shop now
          <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform duration-300" />
        </span>
      </div>
    </Link>
  );
}

function CollectionSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden aspect-[3/4] bg-gray-100">
      <Skeleton className="w-full h-full" />
    </div>
  );
}


function TestimonialCard({ t }) {
  const initials = t.name.split(" ").map(w => w[0]).join("");
  return (
    <div className="flex-shrink-0 w-[300px] sm:w-[340px] bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mx-2.5 flex flex-col">
      <Quote size={18} className="text-brand-orange/25 mb-3" />
      <p className="text-gray-600 text-sm leading-relaxed flex-1">{t.text}</p>
      <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-50">
        <div className="w-9 h-9 rounded-full bg-brand-navy text-white flex items-center justify-center text-xs font-[800] flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-sm font-[800] text-brand-navy leading-tight">{t.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{t.role}</p>
        </div>
      </div>
    </div>
  );
}

function TestimonialMarquee() {
  const half1 = testimonials;
  const half2 = [...testimonials].reverse();
  const doubled1 = [...half1, ...half1];
  const doubled2 = [...half2, ...half2];

  const ref = useReveal(0.1);

  return (
    <section className="bg-gray-50/70 py-20 sm:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div ref={ref} className="section-reveal text-center">
          <h2 className="text-[var(--text-4xl)] font-[900] text-brand-navy tracking-tight mb-3">
            Community Voices
          </h2>
          <p className="text-gray-400 text-base max-w-md mx-auto">
            Hear from students, parents, and alumni who wear DAUST with pride.
          </p>
        </div>
      </div>

      {/* Row 1 · left to right */}
      <div className="overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 mb-4">
        <div className="flex animate-marquee" style={{ width: "max-content" }}>
          {doubled1.map((t, i) => <TestimonialCard key={i} t={t} />)}
        </div>
      </div>

      {/* Row 2 – right to left */}
      <div className="overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="flex animate-marquee-rev" style={{ width: "max-content" }}>
          {doubled2.map((t, i) => <TestimonialCard key={i} t={t} />)}
        </div>
      </div>
    </section>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function Home() {
  const convexProducts = useQuery(api.products.list);
  const collections = useQuery(api.collections.list);
  const scrollRef = useRef(null);

  // Sync products with Convex if available. Only fallback if loading (undefined).
  const PRODUCTS_DATA = (convexProducts !== undefined) ? convexProducts : PRODUCTS;

  // Derive featured and trending from the current data source
  const featuredProduct = useMemo(() => {
    return PRODUCTS_DATA.find(p => p.category === "Hoodies" && p.rating >= 4.8) ||
      PRODUCTS_DATA.find(p => p.category === "Hoodies") ||
      PRODUCTS_DATA[0];
  }, [PRODUCTS_DATA]);

  const trendingProducts = useMemo(() => {
    return [...PRODUCTS_DATA].sort((a, b) => b.rating - a.rating).slice(0, 8);
  }, [PRODUCTS_DATA]);

  const collectionsRef = useReveal(0.08);
  const spotlightRef = useReveal(0.1);
  const trendingRef = useReveal(0.08);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <div className="w-full overflow-x-hidden">

      {/* 1 ── HERO ── */}
      <Hero
        title="Welcome to the Life At Daust Store"
        subtitle="Campus apparel and essentials designed by students, made for the DAUST community."
        cta="Shop Collection"
        image="/assets/DaustianShoot/Homepage.jpg"
        to="/shop"
      />

      {/* 2 ── ANNOUNCEMENT STRIP ── */}
      <AnnouncementStrip />

      {/* 3 ── FEATURED COLLECTIONS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div ref={collectionsRef} className="section-reveal">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-14 gap-4">
            <div>
              <h2 className="text-[var(--text-4xl)] font-[900] text-brand-navy tracking-tight mb-3">
                Featured Collections
              </h2>
              <p className="text-gray-400 text-base max-w-md">
                Curated categories that define the DAUST experience.
              </p>
            </div>
            <Link
              to="/shop"
              className="text-brand-orange font-[800] uppercase tracking-[0.12em] text-[11px] hover:underline flex items-center gap-2 group shrink-0"
            >
              View All <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {collections === undefined ? (
              Array.from({ length: 4 }).map((_, i) => <CollectionSkeleton key={i} />)
            ) : collections.length > 0 ? (
              collections.slice(0, 4).map((c, i) => (
                <CollectionCard key={c.slug || i} collection={c} index={i} />
              ))
            ) : (
              ["Hoodies", "T-Shirts", "Caps", "Drinkware"].map((cat, i) => {
                const p = PRODUCTS_DATA.find(p => p.category === cat);
                return p ? (
                  <CollectionCard
                    key={cat}
                    collection={{ slug: `/shop?category=${cat}`, name: cat, image: p.image }}
                    index={i}
                  />
                ) : null;
              })
            )}
          </div>
        </div>
      </section>

      {/* 4 ── Removed Brand Stats Section ── */}

      {/* 5 ── PRODUCT SPOTLIGHT ── */}
      {featuredProduct && (
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <div ref={spotlightRef} className="section-reveal grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

              {/* Image */}
              <div className="relative">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-50 shadow-2xl shadow-brand-navy/10">
                  <img
                    src={featuredProduct.image}
                    alt={featuredProduct.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                {/* Accent blobs */}
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-brand-orange/12 rounded-full blur-[70px]" />
                <div className="absolute -top-8 -left-8 w-32 h-32 bg-brand-navy/8 rounded-full blur-[60px]" />
              </div>

              {/* Copy */}
              <div>
                <span className="inline-block text-brand-orange text-[11px] font-[900] uppercase tracking-[0.22em] mb-4 px-3 py-1.5 bg-brand-orange/8 rounded-full">
                  Featured Product
                </span>
                <h2 className="text-[var(--text-4xl)] font-[900] text-brand-navy tracking-tight mb-4 leading-[1.05]">
                  {featuredProduct.name}
                </h2>
                <p className="text-gray-500 text-base leading-relaxed mb-6 max-w-md">
                  {featuredProduct.description}
                </p>

                {/* Stars */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={15}
                        className={
                          i < Math.floor(featuredProduct.rating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-200"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-sm font-[700] text-gray-400">{featuredProduct.rating} / 5</span>
                </div>

                <Link to={`/product/${featuredProduct._id || featuredProduct.id}`}>
                  <Button variant="primary" size="lg" className="rounded-full group gap-2.5 pr-5">
                    Shop Now
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6 ── TRENDING NOW ── */}
      <section className="bg-brand-cream py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={trendingRef} className="section-reveal">
            <div className="flex items-end justify-between mb-10 sm:mb-14">
              <div>
                <h2 className="text-[var(--text-4xl)] font-[900] text-brand-navy tracking-tight mb-3">
                  Trending Now
                </h2>
                <p className="text-gray-400 text-base max-w-md">
                  The pieces everyone on campus is wearing right now.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => scroll("left")}
                  className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  onClick={() => scroll("right")}
                  className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              {trendingProducts.map(product => (
                <div
                  key={product._id || product.id}
                  className="min-w-[260px] sm:min-w-[280px] max-w-[280px] snap-start flex-shrink-0"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7 ── TESTIMONIALS MARQUEE ── */}
      <TestimonialMarquee />

      {/* 8 ── NEWSLETTER ── */}
      <Newsletter />
    </div>
  );
}
