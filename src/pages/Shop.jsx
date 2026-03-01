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

  // Use STATIC products (with logo variants) instead of Convex data
  // This ensures the new products and variants are displayed
  const PRODUCTS = STATIC_PRODUCTS;
  const isLoading = false; // No loading since we use static data

  const itemsByCollection = useMemo(() => {
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
    const sortedCollections = collections ? [...collections].sort((a, b) => {
      const aIsDaustian = a.name.toLowerCase().includes("daustian") || a.name.toLowerCase().includes("uniwear");
      const bIsDaustian = b.name.toLowerCase().includes("daustian") || b.name.toLowerCase().includes("uniwear");
      if (aIsDaustian && !bIsDaustian) return -1;
      if (!aIsDaustian && bIsDaustian) return 1;
      return a.name.localeCompare(b.name);
    }) : [];

    // If no collections, create default groups
    if (!collections || collections.length === 0) {
      // Group by category instead
      sorted.forEach(p => {
        const cat = p.category || "Other";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(p);
      });
      return groups;
    }

    // Group by collection with proper sorting
    sortedCollections.forEach(c => {
      const productsInCollection = sorted.filter(p => p.collection === c.slug);
      if (productsInCollection.length > 0) {
        groups[c.name] = productsInCollection;
      }
    });

    // Also include products without a collection
    const ungrouped = sorted.filter(p => !p.collection);
    if (ungrouped.length > 0) {
      groups["Other Products"] = ungrouped;
    }

    return groups;
  }, [PRODUCTS, category, sort, searchQuery, collections]);

  const totalItems = Object.values(itemsByCollection).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <main className="min-h-screen bg-gray-50/50">
      <Hero 
        title="University Merch"
        subtitle="Rep DAUST with Pride"
        image={shopHero}
      />

      <section className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
          <div className="flex items-center gap-3">
            <Filter className="text-brand-navy" size={20} />
            <span className="font-black text-brand-navy uppercase tracking-widest text-xs">Filter by:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Category Filter */}
            <div className="relative group">
              <button className="flex items-center gap-3 px-5 py-3 bg-white rounded-full shadow-sm border border-gray-100 hover:border-brand-orange transition-all font-bold text-sm">
                {category}
                <ChevronDown size={16} className="text-gray-400 group-hover:text-brand-orange transition-colors" />
              </button>
              
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        category === cat 
                          ? "bg-brand-navy text-white" 
                          : "text-gray-600 hover:bg-gray-50 hover:text-brand-orange"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sort */}
            <div className="relative group">
              <button className="flex items-center gap-3 px-5 py-3 bg-white rounded-full shadow-sm border border-gray-100 hover:border-brand-orange transition-all font-bold text-sm">
                {sort}
                <ChevronDown size={16} className="text-gray-400 group-hover:text-brand-orange transition-colors" />
              </button>
              
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-2">
                  {["Featured", "Price: Low to High", "Price: High to Low", "Newest Arrivals"].map(s => (
                    <button
                      key={s}
                      onClick={() => setSort(s)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        sort === s 
                          ? "bg-brand-navy text-white" 
                          : "text-gray-600 hover:bg-gray-50 hover:text-brand-orange"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-3 bg-white rounded-full shadow-sm border border-gray-100 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/5 outline-none transition-all w-64 font-bold text-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-orange"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-8 sm:gap-y-12">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-80 w-full rounded-3xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/3" />
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

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-8 sm:gap-y-12">
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
