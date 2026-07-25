"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

export default function PrePaymentReminderModal({ open, missingMerch, missingAccommodation, onContinue, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0c10] p-5 sm:p-7"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-400/90 mb-2">
              Before You Pay
            </p>
            <h2 className="mb-4 text-xl font-bold text-white sm:text-2xl">
              Don&apos;t Forget…
            </h2>
            <ul className="mb-6 space-y-2 text-sm text-white/60">
              {missingMerch && (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-cyan-400">•</span>
                  You haven&apos;t added any <span className="text-white">merch</span> to your cart yet.
                </li>
              )}
              {missingAccommodation && (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-cyan-400">•</span>
                  You haven&apos;t added <span className="text-white">accommodation</span> to your cart yet.
                </li>
              )}
            </ul>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/accommodation"
                onClick={onClose}
                className="flex-1 rounded-full border border-white/15 px-6 py-2.5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:border-cyan-400/50 hover:text-cyan-300 transition-colors"
              >
                Add Merch / Stay
              </Link>
              <button
                type="button"
                onClick={onContinue}
                className="flex-1 rounded-full bg-cyan-400 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors"
              >
                Continue to Payment
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
