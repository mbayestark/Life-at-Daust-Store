import React, { useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

export default function Toast({ message, onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle size={20} className="text-green-500" />
        </div>
        <p className="text-sm font-bold text-brand-navy flex-1 pr-2">{message}</p>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 active:scale-95"
          aria-label="Close notification"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}
