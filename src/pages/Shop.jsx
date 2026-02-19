import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { useLocation } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import ProductCard from "../components/ProductCard.jsx";
import Newsletter from "../components/Newsletter.jsx";
import Hero from "../components/Hero.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { PRODUCTS as STATIC_PRODUCTS, CATEGORIES } from "../data/products.js";
import { Filter, ChevronDown, X, LayoutGrid, Search } from "lucide-react";
import shopHero from "../assets/shop-hero.jpg";

export default function Shop() {
  const location = useLocation();
  const convexProducts = useQuery(api.products.list);
  const collections = useQuery(api.collections.list);
  const [category, setCategory] = useState("All Categories");
  const [sort, setSort] = useState("Featured");
  const [searchQuery, setSearchQuery] = useState("");

  // Sync search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) setSearchQuery(q);
    else setSearchQuery("");
  }, [location.search]);

  // Use Convex products if available and not empty, otherwise fallback to static data
  const PRODUCTS = (convexProducts && convexProducts.length > 0) ? convexProducts : STATIC_PRODUCTS;
  const isLoading = convexProducts === undefined || collections === undefined;

  const itemsByCollection = useMemo(() => {
    if (isLoading) return {};

    let filtered = PRODUCTS.filter((p) =>
      category === "All Categories" ? true : p.category === category
    );

    // Filter by search query if present
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Apply sorting
    let sorted = [...filtered];
    if (sort === "Price: Low to High") sorted.sort((a, b) => a.price - b.price);
    if (sort === "Price: High to Low") sorted.sort((a, b) => b.price - a.price);
    if (sort === "Newest Arrivals") sorted.sort((a, b) => b.id - a.id);

    // Group by collection
    const groups = {};

    // Sort collections: Daustian x Uniwear first, then others alphabetically
    const sortedCollections = [...collections].sort((a, b) => {
      if (a.name.toLowerCase().includes('daustian')) return -1;
      if (b.name.toLowerCase().includes('daustian')) return 1;
      return a.name.localeCompare(b.name);
    });

    // Add collections to groups to maintain order even if empty
    sortedCollections.forEach(col => {
      groups[col.name] = [];
    });

    // Add "Other Items" group for products without collection
    groups["Other Items"] = [];

    sorted.forEach(p => {
      const colName = p.collection || "Other Items";
      if (!groups[colName]) {
        groups[colName] = [];
      }
      groups[colName].push(p);
    });

    // Remove empty groups except when filtering by category (we might want to show empty sections then too, or not)
    // Actually, let's remove empty groups for a cleaner look
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  }, [PRODUCTS, collections, category, sort, isLoading]);

  const totalItems = useMemo(() => {
    return Object.values(itemsByCollection).reduce((acc, curr) => acc + curr.length, 0);
  }, [itemsByCollection]);

  return (
    <main className="bg-gray-50/50 min-h-screen">
      <Hero
        title="Global DAUST Collection"
        subtitle="Discover premium university apparel and essentials designed for the ambitious."
        cta="New Arrivals"
        image={shopHero}
        to="#products"
      />

      {/* Filters & Header */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div>
            <h2 className="text-[var(--text-3xl)] font-black text-brand-navy tracking-tight mb-2">
              {category === "All Categories" ? "Store Catalog" : category}
            </h2>
            <p className="text-gray-500 text-sm font-medium">
              {isLoading ? "Fetching latest styles..." : `${totalItems} items found across ${Object.keys(itemsByCollection).length} collections`}
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
        {(category !== "All Categories" || searchQuery) && (
          <div className="flex flex-wrap items-center gap-3 mb-8 animate-in fade-in duration-500">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Filtered by:</span>

            {category !== "All Categories" && (
              <button
                onClick={() => setCategory("All Categories")}
                className="flex items-center gap-2 bg-brand-orange/10 text-brand-orange px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-orange/20 transition-colors"
              >
                Category: {category}
                <X size={14} />
              </button>
            )}

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  const params = new URLSearchParams(location.search);
                  params.delete("q");
                  window.history.replaceState({}, '', `/shop${params.toString() ? '?' + params.toString() : ''}`);
                }}
                className="flex items-center gap-2 bg-brand-navy/5 text-brand-navy px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-navy/10 transition-colors"
              >
                Search: "{searchQuery}"
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Dynamic Collection Sections */}
        <div className="space-y-24">
          {isLoading ? (
            // Skeleton Loading State
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {Array.from({ length: 8 }).map((_, i) => (
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
              ))}
            </div>
          ) : totalItems > 0 ? (
            Object.entries(itemsByCollection).map(([colName, products]) => (
              <div key={colName} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-navy/5 rounded-xl flex items-center justify-center">
                      <LayoutGrid className="text-brand-navy" size={20} />
                    </div>
                    <h3 className="text-2xl font-black text-brand-navy tracking-tight uppercase">
                      {colName}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {products.length} Products
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
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