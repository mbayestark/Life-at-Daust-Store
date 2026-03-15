import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import ProductCard from "../components/ProductCard.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { ArrowRight, Filter, SlidersHorizontal, ShoppingBag } from "lucide-react";

export default function Collection() {
  const { slug } = useParams();
  const collection = useQuery(api.collections.getBySlug, { slug });
  const allProducts = useQuery(api.products.list);

  const isLoading = collection === undefined || allProducts === undefined;

  // Optimize product filtering with useMemo to prevent lag on re-renders
  const filteredProducts = useMemo(() => {
    if (!allProducts || !collection) return [];
    return allProducts.filter((p) => p.collection === collection.name);
  }, [allProducts, collection]);

  if (isLoading) {
    return (
      <main className="min-h-screen">
        <div className="bg-brand-navy h-64 sm:h-[400px] relative overflow-hidden flex items-center justify-center">
          <Skeleton className="absolute inset-0 w-full h-full opacity-20" />
          <div className="relative z-10 text-center space-y-6">
            <Skeleton className="h-16 w-80 mx-auto rounded-2xl" />
            <Skeleton className="h-4 w-96 mx-auto rounded-lg" />
          </div>
        </div>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/4] rounded-[2rem]" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3 opacity-50" />
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (!collection) {
    return (
      <main className="min-h-screen pt-40 px-4 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-gray-100">
            <ShoppingBag size={32} className="text-gray-300" />
          </div>
          <h1 className="text-4xl font-[900] text-brand-navy tracking-tight mb-4">Collection Not Found</h1>
          <p className="text-gray-500 mb-10 leading-relaxed">The curation you're looking for might have been moved or archived.</p>
          <Link to="/shop" className="inline-flex items-center gap-3 px-8 py-4 bg-brand-navy text-white rounded-full font-[900] uppercase tracking-[0.15em] text-xs hover:bg-brand-orange transition-all duration-300">
            Back to Shop <ArrowRight size={14} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Premium Header */}
      <header className="relative min-h-[50vh] flex items-end bg-brand-navy overflow-hidden p-8 sm:p-12 lg:p-20">
        <div className="absolute inset-0">
          {collection.image && (
            <img
              className="w-full h-full object-cover opacity-50 scale-105 animate-float"
              src={collection.image}
              alt={collection.name}
              loading="eager"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/60 via-transparent to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="px-4 py-1.5 bg-brand-orange/10 backdrop-blur-md border border-brand-orange/20 text-brand-orange text-[10px] font-black uppercase tracking-[0.25em] rounded-full animate-fade-in">
              Curated Edit
            </span>
            <span className="px-4 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-[0.25em] rounded-full animate-fade-in delay-100">
              {filteredProducts.length} Items
            </span>
          </div>

          <h1 className="text-[clamp(3rem,8vw,6rem)] font-[900] tracking-[-0.04em] text-white leading-[0.9] mb-8 animate-font-swap">
            {collection.name}
          </h1>

          {collection.description && (
            <p className="text-lg text-white/50 max-w-2xl leading-relaxed animate-fade-in-up delay-300">
              {collection.description}
            </p>
          )}
        </div>
      </header>

      {/* Grid Controls */}
      <section className="sticky top-[72px] z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Filtering</span>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-[700] text-gray-600 hover:bg-gray-100 transition-all">
                <SlidersHorizontal size={14} />
                Refine
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select className="bg-transparent border-none text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 focus:ring-0 cursor-pointer">
              <option>Recommended</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest</option>
            </select>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-10 sm:gap-y-20">
            {filteredProducts.map((p, idx) => (
              <div
                key={p._id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${(idx % 4) * 100}ms` }}
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 bg-brand-cream/30 rounded-[3rem] border border-dashed border-brand-cream-dark">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <ShoppingBag size={24} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-[900] text-brand-navy mb-2 tracking-tight">No products found</h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8 leading-relaxed">This selection is currently undergoing a refresh. Please check back soon.</p>
            <Link to="/shop" className="text-brand-orange font-black uppercase tracking-widest text-[10px] hover:underline">
              Return to Catalog
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
