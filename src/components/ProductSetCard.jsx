import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { ShoppingBag, Tag, ArrowRight } from "lucide-react";
import { formatPrice } from "../utils/format.js";
import Button from "./ui/Button";

export default function ProductSetCard({ productSet }) {
  const { addProductSet } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addProductSet(productSet);
  };

  return (
    <div className="group bg-white rounded-3xl premium-shadow overflow-hidden border border-gray-50 hover:border-brand-orange/30 transition-all duration-300 hover:shadow-xl">
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        {productSet.image ? (
          <img
            src={productSet.image}
            alt={productSet.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="grid grid-cols-2 gap-2 p-4">
              {productSet.products?.slice(0, 4).map((item, idx) => (
                <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Badge */}
        {productSet.badge && (
          <div className="absolute top-4 left-4 bg-brand-orange text-white px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">
            {productSet.badge}
          </div>
        )}

        {/* Savings Badge */}
        {productSet.savings > 0 && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
            <Tag size={12} />
            Save {formatPrice(productSet.savings)}
          </div>
        )}

        {/* Quick Add Button */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button
            onClick={handleAddToCart}
            variant="primary"
            size="sm"
            className="w-full !rounded-xl shadow-lg"
          >
            <ShoppingBag size={16} className="mr-2" />
            Add Set to Bag
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <h3 className="text-lg font-black text-brand-navy group-hover:text-brand-orange transition-colors duration-300 mb-2">
          {productSet.name}
        </h3>

        {productSet.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {productSet.description}
          </p>
        )}

        {/* Products Included */}
        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
            Includes:
          </p>
          <div className="flex flex-wrap gap-2">
            {productSet.products?.map((item, idx) => (
              <span
                key={idx}
                className="text-xs font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg"
              >
                {item.quantity}x {item.productName}
              </span>
            ))}
          </div>
        </div>

        {/* Price Section */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold line-through mb-1">
              {formatPrice(productSet.originalPrice)}
            </p>
            <p className="text-2xl font-black text-brand-navy">
              {formatPrice(productSet.specialPrice)}
            </p>
          </div>
          <Link
            to="/shop"
            className="flex items-center gap-1 text-sm font-bold text-brand-orange hover:text-brand-navy transition-colors"
          >
            View Details
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
