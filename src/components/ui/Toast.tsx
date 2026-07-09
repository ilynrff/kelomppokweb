"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle } from "lucide-react";

export function Toast({
  isOpen,
  message,
  type = "success",
  onClose,
}: {
  isOpen: boolean;
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => onClose(), 4000); // 4 seconds auto-dismiss
    return () => clearTimeout(t);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed md:top-28 md:right-8 top-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 w-[calc(100%-2rem)] sm:max-w-sm z-[300] bg-[#0F0F0F]/95 backdrop-blur-md border border-white/10 rounded-[1.25rem] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 text-white cursor-default select-none"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                type === "success"
                  ? "bg-neon/10 border-neon/20 text-neon"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
            >
              {type === "success" ? (
                <CheckCircle2 size={16} className="animate-pulse" />
              ) : (
                <AlertCircle size={16} className="animate-bounce" />
              )}
            </div>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider leading-relaxed text-white/90">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors p-1 hover:bg-white/5 rounded-lg shrink-0 focus:outline-none"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
