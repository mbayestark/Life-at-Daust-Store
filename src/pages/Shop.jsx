import React, { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import ProductCard from "../components/ProductCard.jsx";
import Newsletter from "../components/Newsletter.jsx";
import Hero from "../components/Hero.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { PRODUCTS as STATIC_PRODUCTS, CATEGORIES } from "../data/products.js";
import { Filter, ChevronDown, X } from "react-feather";

export default function Shop() {
  const convexProducts = useQuery(api.products.list);
  const [category, setCategory] = useState("All Categories");
  const [sort, setSort] = useState("Featured");

  // Use Convex products if available and not empty, otherwise fallback to static data
  const PRODUCTS = (convexProducts && convexProducts.length > 0) ? convexProducts : STATIC_PRODUCTS;
  const isLoading = convexProducts === undefined;

  const items = useMemo(() => {
    const filtered = PRODUCTS.filter((p) =>
      category === "All Categories" ? true : p.category === category
    );

    if (sort === "Price: Low to High") return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === "Price: High to Low") return [...filtered].sort((a, b) => b.price - a.price);
    if (sort === "Newest Arrivals") return [...filtered].sort((a, b) => b.id - a.id);
    return filtered;
  }, [PRODUCTS, category, sort]);

  return (
    <main className="bg-gray-50/50 min-h-screen">
      <Hero
        title="Global DAUST Collection"
        subtitle="Discover premium university apparel and essentials designed for the ambitious."
        cta="New Arrivals"
        image="http://static.photos/fashion/1200x630/42"
        to="#products"
      />

      {/* Filters & Header */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div>
            <h2 className="text-[var(--text-3xl)] font-black text-brand-navy tracking-tight mb-2">
              Showing {category === "All Categories" ? "All Products" : category}
            </h2>
            <p className="text-gray-500 text-sm font-medium">
              {isLoading ? "Fetching latest styles..." : `${items.length} items found`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* Category Pill selection */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              {CATEGORIES.slice(0, 4).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${category === c
                      ? "bg-brand-navy text-white shadow-lg shadow-brand-navy/20"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100"
                    }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="h-8 w-[1px] bg-gray-200 hidden md:block" />

            {/* Sort Select */}
            <div className="relative group">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none bg-white text-gray-900 font-bold text-xs uppercase tracking-widest pl-5 pr-10 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 shadow-sm cursor-pointer"
              >
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest Arrivals</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {category !== "All Categories" && (
          <div className="flex items-center gap-2 mb-8 animate-in fade-in duration-500">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Filtered by:</span>
            <button
              onClick={() => setCategory("All Categories")}
              className="flex items-center gap-2 bg-brand-orange/10 text-brand-orange px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-orange/20 transition-colors"
            >
              {category}
              <X size={14} />
            </button>
          </div>
        )}

        {/* Grid System: 4 Desktop -> 2 Tablet -> 1 Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {isLoading ? (
            // Skeleton Loading State
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                <div className="space-y-2 px-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-6 w-6 rounded-lg" />
                  </div>
                </div>
              </div>
            ))
          ) : items.length > 0 ? (
            items.map((p, idx) => (
              <ProductCard key={p.id} product={p} />
            ))
          ) : (
            <div className="col-span-full py-32 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <Filter className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">Try adjusting your filters or search criteria to find what you're looking for.</p>
              <button
                onClick={() => { setCategory("All Categories"); setSort("Featured"); }}
                className="text-brand-orange font-bold uppercase tracking-widest text-sm hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      <Newsletter />
    </main>
  );
}