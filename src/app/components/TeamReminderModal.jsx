"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

// Nudges an already-registered user toward /profile to finish adding their
// teammates' CNS-ids — shown when they click their "Registered" state on a
// group event/workshop whose team roster isn't confirmed yet.
export default function TeamReminderModal({ open, onClose }) {
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
              Almost There
            </p>
            <h2 className="mb-3 text-xl font-bold text-white sm:text-2xl">
              Add Your Teammates
            </h2>
            <p className="mb-6 text-sm text-white/60">
              This event/workshop needs your teammates&apos; CNS-ids before your team is complete. Head over to
              your profile page to add them.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-white/15 px-6 py-2.5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:border-cyan-400/50 hover:text-cyan-300 transition-colors"
              >
                Not Now
              </button>
              <Link
                href="/profile"
                onClick={onClose}
                className="flex-1 rounded-full bg-cyan-400 px-6 py-2.5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-white transition-colors"
              >
                Go to Profile
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
