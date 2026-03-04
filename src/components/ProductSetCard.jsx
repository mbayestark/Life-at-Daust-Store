import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { ShoppingBag, Tag, ArrowRight, X, Check } from "lucide-react";
import { formatPrice } from "../utils/format.js";
import Button from "./ui/Button";

export default function ProductSetCard({ productSet }) {
  const { addProductSet } = useCart();
  const [showModal, setShowModal] = useState(false);
  const [selections, setSelections] = useState({});

  // Check if any product in the set has variants
  const hasVariants = productSet.products?.some(
    (item) => (item.colors && item.colors.length > 0) || (item.sizes && item.sizes.length > 0)
  );

  const initSelections = () => {
    const initial = {};
    productSet.products?.forEach((item) => {
      initial[item.productId] = {
        color: item.colors?.[0]?.name || null,
        size: item.sizes?.[0] || null,
      };
    });
    return initial;
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants) {
      setSelections(initSelections());
      setShowModal(true);
    } else {
      addProductSet(productSet);
    }
  };

  const handleConfirmAdd = () => {
    addProductSet(productSet, selections);
    setShowModal(false);
  };

  // Check all required selections are made
  const allSelected = productSet.products?.every((item) => {
    const sel = selections[item.productId];
    if (!sel) return false;
    if (item.colors?.length > 0 && !sel.color) return false;
    if (item.sizes?.length > 0 && !sel.size) return false;
    return true;
  });

  return (
    <>
      <div className="group bg-white rounded-3xl premium-shadow overflow-hidden border border-gray-50 hover:border-brand-orange/30 transition-all duration-300 hover:shadow-xl">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
          {productSet.image ? (
            <img
              src={productSet.image}
              alt={productSet.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : productSet.products?.length > 0 ? (
            <div className="w-full h-full grid grid-cols-2 gap-0.5">
              {productSet.products.slice(0, 4).map((item, idx) => (
                <div key={idx} className="relative overflow-hidden bg-gray-100">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold">
                      {item.productName?.[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag size={48} className="text-gray-200" />
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
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-1 text-sm font-bold text-brand-orange hover:text-brand-navy transition-colors"
            >
              Add to Bag
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Variant Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-black text-brand-navy">{productSet.name}</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select options for each item</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Product Variant Selectors */}
            <div className="p-6 space-y-6">
              {productSet.products?.map((item) => (
                <div key={item.productId} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex gap-4 mb-4">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-20 h-20 rounded-xl object-cover border border-gray-100"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-brand-navy text-sm truncate">{item.productName}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold text-brand-orange mt-1">{formatPrice(item.productPrice)}</p>
                    </div>
                  </div>

                  {/* Color Selector */}
                  {item.colors && item.colors.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                        Color · <span className="text-brand-navy">{selections[item.productId]?.color || "Select"}</span>
                      </p>
                      <div className="flex gap-2.5">
                        {item.colors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() =>
                              setSelections((prev) => ({
                                ...prev,
                                [item.productId]: { ...prev[item.productId], color: color.name },
                              }))
                            }
                            className={`relative w-9 h-9 rounded-full ring-2 ring-offset-2 transition-all ${
                              selections[item.productId]?.color === color.name
                                ? "ring-brand-orange"
                                : "ring-transparent hover:ring-gray-300"
                            }`}
                          >
                            <span
                              className="block w-full h-full rounded-full border border-black/10"
                              style={{ backgroundColor: color.hex }}
                            />
                            {selections[item.productId]?.color === color.name && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <Check size={14} className="text-white drop-shadow-md" strokeWidth={3} />
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size Selector */}
                  {item.sizes && item.sizes.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Size</p>
                      <div className="flex flex-wrap gap-2">
                        {item.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() =>
                              setSelections((prev) => ({
                                ...prev,
                                [item.productId]: { ...prev[item.productId], size },
                              }))
                            }
                            className={`min-w-[48px] h-10 px-3 rounded-lg font-black text-xs transition-all border-2 ${
                              selections[item.productId]?.size === size
                                ? "border-brand-navy bg-brand-navy text-white"
                                : "border-gray-200 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-500">Bundle Price</span>
                <span className="text-xl font-black text-brand-navy">{formatPrice(productSet.specialPrice)}</span>
              </div>
              <Button
                onClick={handleConfirmAdd}
                variant="primary"
                disabled={!allSelected}
                className={`w-full !rounded-xl h-14 text-base ${!allSelected ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <ShoppingBag size={20} className="mr-2" />
                Add Set to Bag
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
