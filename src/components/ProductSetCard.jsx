import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { ShoppingBag, Tag, ArrowRight, X, Check } from "lucide-react";
import { formatPrice } from "../utils/format.js";
import Button from "./ui/Button";

export default function ProductSetCard({ productSet }) {
  const { addProductSet, showToast } = useCart();
  const [showModal, setShowModal] = useState(false);
  const [selections, setSelections] = useState({});

  // Check if any product in the set has variants (including logos)
  const hasVariants = productSet.products?.some(
    (item) =>
      (item.colors && item.colors.length > 0) ||
      (item.sizes && item.sizes.length > 0)
  );

  const initSelections = () => {
    const initial = {};
    productSet.products?.forEach((item) => {
      initial[item.productId] = {
        color: item.colors?.[0]?.name || null,
        size: item.sizes?.[0] || null,
        frontLogo: null, // Logo is optional
        backLogo: null,
        sideLogo: null,
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
      showToast(`${productSet.name} added to bag!`);
    }
  };

  const handleConfirmAdd = () => {
    addProductSet(productSet, selections);
    showToast(`${productSet.name} added to bag!`);
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10 flex-shrink-0">
              <div className="flex-1 pr-3">
                <h3 className="text-base sm:text-lg font-black text-brand-navy leading-tight">{productSet.name}</h3>
                <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Select options for each item</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Product Variant Selectors - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {productSet.products?.map((item) => (
                  <div key={item.productId} className="bg-gray-50 rounded-xl p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4 mb-3 sm:mb-4">
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl object-cover border border-gray-100 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-brand-navy text-sm sm:text-base leading-tight mb-1">{item.productName}</p>
                        <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qty: {item.quantity}</p>
                        <p className="text-sm sm:text-base font-bold text-brand-orange mt-1">{formatPrice(item.productPrice)}</p>
                      </div>
                    </div>

                    {/* Color Selector */}
                    {item.colors && item.colors.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5">
                          Color · <span className="text-brand-navy">{selections[item.productId]?.color || "Select"}</span>
                        </p>
                        <div className="flex flex-wrap gap-2 sm:gap-2.5">
                          {item.colors.map((color) => (
                            <button
                              key={color.name}
                              onClick={() =>
                                setSelections((prev) => ({
                                  ...prev,
                                  [item.productId]: { ...prev[item.productId], color: color.name },
                                }))
                              }
                              className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full ring-2 ring-offset-2 transition-all active:scale-95 ${
                                selections[item.productId]?.color === color.name
                                  ? "ring-brand-orange scale-110"
                                  : "ring-transparent hover:ring-gray-300"
                              }`}
                            >
                              <span
                                className="block w-full h-full rounded-full border border-black/10"
                                style={{ backgroundColor: color.hex }}
                              />
                              {selections[item.productId]?.color === color.name && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <Check size={16} className="text-white drop-shadow-md" strokeWidth={3} />
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Size Selector */}
                    {item.sizes && item.sizes.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5">Size</p>
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
                              className={`min-w-[52px] h-11 sm:h-12 px-3 sm:px-4 rounded-lg font-black text-sm sm:text-base transition-all border-2 active:scale-95 ${
                                selections[item.productId]?.size === size
                                  ? "border-brand-navy bg-brand-navy text-white scale-105"
                                  : "border-gray-200 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Front Logo Selector */}
                    {item.logos && item.logos.filter(l => !l.positions || l.positions.includes("front")).length > 0 && (
                      <div className="mb-3">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5">
                          Front Logo · <span className="text-brand-navy">{selections[item.productId]?.frontLogo || "None"}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              setSelections((prev) => ({
                                ...prev,
                                [item.productId]: { ...prev[item.productId], frontLogo: null },
                              }))
                            }
                            className={`px-3 sm:px-4 h-11 sm:h-12 rounded-lg font-black text-xs sm:text-sm transition-all border-2 active:scale-95 ${
                              !selections[item.productId]?.frontLogo
                                ? "border-brand-navy bg-brand-navy text-white scale-105"
                                : "border-gray-200 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                            }`}
                          >
                            None
                          </button>
                          {item.logos.filter(l => !l.positions || l.positions.includes("front")).map((logo) => (
                            <button
                              key={logo.id || logo.name}
                              onClick={() =>
                                setSelections((prev) => ({
                                  ...prev,
                                  [item.productId]: { ...prev[item.productId], frontLogo: logo.name },
                                }))
                              }
                              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 h-11 sm:h-12 rounded-lg font-black text-xs sm:text-sm transition-all border-2 active:scale-95 ${
                                selections[item.productId]?.frontLogo === logo.name
                                  ? "border-brand-navy bg-brand-navy text-white scale-105"
                                  : "border-gray-200 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                              }`}
                            >
                              {logo.image && (
                                <img src={logo.image} alt={logo.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded object-cover flex-shrink-0" />
                              )}
                              <span className="truncate">{logo.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Back Logo Selector */}
                    {item.logos && item.logos.filter(l => !l.positions || l.positions.includes("back")).length > 0 && (
                      <div className="mb-3">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5">
                          Back Logo · <span className="text-brand-navy">{selections[item.productId]?.backLogo || "None"}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              setSelections((prev) => ({
                                ...prev,
                                [item.productId]: { ...prev[item.productId], backLogo: null },
                              }))
                            }
                            className={`px-3 sm:px-4 h-11 sm:h-12 rounded-lg font-black text-xs sm:text-sm transition-all border-2 active:scale-95 ${
                              !selections[item.productId]?.backLogo
                                ? "border-brand-navy bg-brand-navy text-white scale-105"
                                : "border-gray-200 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                            }`}
                          >
                            None
                          </button>
                          {item.logos.filter(l => !l.positions || l.positions.includes("back")).map((logo) => (
                            <button
                              key={logo.id || logo.name}
                              onClick={() =>
                                setSelections((prev) => ({
                                  ...prev,
                                  [item.productId]: { ...prev[item.productId], backLogo: logo.name },
                                }))
                              }
                              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 h-11 sm:h-12 rounded-lg font-black text-xs sm:text-sm transition-all border-2 active:scale-95 ${
                                selections[item.productId]?.backLogo === logo.name
                                  ? "border-brand-navy bg-brand-navy text-white scale-105"
                                  : "border-gray-200 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                              }`}
                            >
                              {logo.image && (
                                <img src={logo.image} alt={logo.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded object-cover flex-shrink-0" />
                              )}
                              <span className="truncate">{logo.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Side Logo Selector */}
                    {item.logos && item.logos.filter(l => !l.positions || l.positions.includes("side")).length > 0 && (
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5">
                          Side Logo · <span className="text-brand-navy">{selections[item.productId]?.sideLogo || "None"}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              setSelections((prev) => ({
                                ...prev,
                                [item.productId]: { ...prev[item.productId], sideLogo: null },
                              }))
                            }
                            className={`px-3 sm:px-4 h-11 sm:h-12 rounded-lg font-black text-xs sm:text-sm transition-all border-2 active:scale-95 ${
                              !selections[item.productId]?.sideLogo
                                ? "border-brand-navy bg-brand-navy text-white scale-105"
                                : "border-gray-200 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                            }`}
                          >
                            None
                          </button>
                          {item.logos.filter(l => !l.positions || l.positions.includes("side")).map((logo) => (
                            <button
                              key={logo.id || logo.name}
                              onClick={() =>
                                setSelections((prev) => ({
                                  ...prev,
                                  [item.productId]: { ...prev[item.productId], sideLogo: logo.name },
                                }))
                              }
                              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 h-11 sm:h-12 rounded-lg font-black text-xs sm:text-sm transition-all border-2 active:scale-95 ${
                                selections[item.productId]?.sideLogo === logo.name
                                  ? "border-brand-navy bg-brand-navy text-white scale-105"
                                  : "border-gray-200 text-gray-500 hover:border-brand-navy hover:text-brand-navy"
                              }`}
                            >
                              {logo.image && (
                                <img src={logo.image} alt={logo.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded object-cover flex-shrink-0" />
                              )}
                              <span className="truncate">{logo.name}</span>
                            </button>
                          ))}
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-gray-500 mt-2 italic">Logo selection is optional for bundles</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer - Sticky */}
            <div className="px-4 sm:px-6 py-4 sm:py-6 border-t border-gray-100 bg-white flex-shrink-0 safe-area-bottom">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-xs sm:text-sm font-bold text-gray-500">Bundle Price</span>
                <span className="text-lg sm:text-xl font-black text-brand-navy">{formatPrice(productSet.specialPrice)}</span>
              </div>
              <Button
                onClick={handleConfirmAdd}
                variant="primary"
                disabled={!allSelected}
                className={`w-full !rounded-xl h-14 sm:h-16 text-sm sm:text-base active:scale-[0.98] ${!allSelected ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <ShoppingBag size={20} className="mr-2" />
                Add Set to Bag
              </Button>
              {!allSelected && (
                <p className="text-[10px] text-center text-red-500 font-bold mt-2">Please select all required options</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
