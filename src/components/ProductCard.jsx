import React, { useState } from "react";
import { Heart, Star, ShoppingCart, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext";
import { formatPrice } from "../utils/format.js";
import Button from "./ui/Button";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);

  if (!product) return null;

  // If product has multiple images, show the second on hover
  const displayImage = isHovered && product.images?.length > 1
    ? product.images[1]
    : product.image;

  const productId = product._id || product.id;

  return (
    <div
      className="product-card group relative bg-white rounded-xl overflow-hidden premium-shadow transition-all duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <Link to={`/product/${productId}`} className="block w-full h-full">
          <img
            className={`w-full h-full object-cover transition-transform duration-700 ease-out ${isHovered ? 'scale-110' : 'scale-100'}`}
            src={displayImage}
            alt={product.name}
            loading="lazy"
          />
        </Link>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-2.5 rounded-full glass-morphism transition-all duration-300 z-10 interactive-scale ${isInWishlist(productId) ? "text-red-500 bg-red-50/50" : "text-brand-navy hover:text-red-500"
            }`}
          aria-label={isInWishlist(productId) ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isInWishlist(productId) ? "fill-current" : ""}`} />
        </button>

        {/* Badge */}
        {product.badge && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-brand-orange text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
              {product.badge}
            </span>
          </div>
        )}

        {/* Quick Add Overlay (Desktop) */}
        <div className={`absolute inset-x-0 bottom-0 p-4 transition-all duration-300 translate-y-full group-hover:translate-y-0 hidden lg:block bg-gradient-to-t from-black/20 to-transparent z-20`}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full glass-morphism border-none text-brand-navy font-black transition-all duration-300 shadow-lg"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0a2342';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#0a2342';
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addItem(product, 1);
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Info Container */}
      <div className="p-3 sm:p-5">
        <div className="flex justify-between items-start mb-1 sm:mb-2">
          <Link to={`/product/${productId}`} className="block flex-1 mr-2">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-brand-orange transition-colors duration-300 tracking-tight">
              {product.name}
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{product.category}</p>
          </Link>
          <div className="flex items-center bg-gray-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md">
            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-400 fill-current" />
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-700 ml-1">{product.rating}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 sm:mt-4">
          <p className="text-sm sm:text-lg font-extrabold text-brand-navy tracking-tight">
            {formatPrice(product.price)}
          </p>

          {/* Mobile Add to Cart (Visible on mobile, hidden on desktop hover) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              addItem(product, 1);
            }}
            className="lg:hidden p-2 rounded-lg bg-gray-100 text-brand-navy active:bg-brand-navy active:text-white transition-all duration-200"
            aria-label="Add to Cart"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}