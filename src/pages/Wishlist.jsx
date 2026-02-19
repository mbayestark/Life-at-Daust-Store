import React from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, ArrowLeft } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";
import Button from "../components/ui/Button";

export default function Wishlist() {
    const { wishlist } = useWishlist();

    return (
        <div className="min-h-screen bg-gray-50 pt-28 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-2 text-brand-orange text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        <Heart size={14} className="fill-current" />
                        My Collection
                    </div>
                    <h1 className="text-[var(--text-4xl)] font-black text-brand-navy tracking-tight mb-4">
                        Wishlist
                    </h1>
                    <p className="text-gray-500 max-w-lg">
                        Keep track of the pieces you love and wait for the perfect moment to make them yours.
                    </p>
                </div>

                {wishlist.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {wishlist.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[3rem] p-12 sm:p-20 text-center border border-gray-100 premium-shadow">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Heart size={32} className="text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-black text-brand-navy mb-4">Your wishlist is empty</h2>
                        <p className="text-gray-400 max-w-xs mx-auto mb-10 text-sm leading-relaxed">
                            Explore our collections and tap the heart icon to save products you're eyeing.
                        </p>
                        <Link to="/shop">
                            <Button variant="primary" size="lg" className="rounded-2xl px-10">
                                Explore Shop
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Explore More Section */}
                {wishlist.length > 0 && (
                    <div className="mt-20 pt-20 border-t border-gray-200">
                        <div className="flex justify-between items-end mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-brand-navy tracking-tight">Need more?</h3>
                                <p className="text-gray-400 text-sm">Check out our latest drops.</p>
                            </div>
                            <Link to="/shop" className="text-brand-orange text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-2">
                                View All Products <ArrowLeft size={14} className="rotate-180" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
