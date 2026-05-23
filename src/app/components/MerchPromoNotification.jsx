'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Sparkles, X, ArrowUpRight } from 'lucide-react';

const DISMISS_KEY = 'merch_promo_dismissed';

export default function MerchPromoNotification() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const dismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed bottom-6 right-4 sm:right-6 z-[55] max-w-[min(100vw-2rem,22rem)]"
        >
          <Link
            href="/online-workshops"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="group relative block overflow-hidden rounded-2xl border border-cyan-500/35 bg-[#0a0a0f]/90 backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.25)] hover:border-cyan-400/60 hover:shadow-[0_0_60px_rgba(6,182,212,0.35)] transition-shadow duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/5 pointer-events-none" />
            <motion.div
              className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none"
              animate={{ scale: hovered ? 1.2 : 1, opacity: hovered ? 0.9 : 0.5 }}
              transition={{ duration: 0.4 }}
            />

            <button
              type="button"
              onClick={dismiss}
              className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-black/50 text-white/50 hover:text-white hover:bg-black/80 transition-colors"
              aria-label="Dismiss merch promo"
            >
              <X size={14} />
            </button>

            <div className="relative flex gap-3 p-3 pr-8">
              <div className="relative w-[88px] h-[88px] shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                <motion.div
                  className="absolute inset-0"
                  animate={{ opacity: hovered ? 0 : 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <Image
                    src="/assets/wsfront.png"
                    alt="Space Merch front"
                    fill
                    className="object-cover"
                    sizes="88px"
                  />
                </motion.div>
                <motion.div
                  className="absolute inset-0"
                  animate={{ opacity: hovered ? 1 : 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <Image
                    src="/assets/wsback.png"
                    alt="Space Merch back"
                    fill
                    className="object-cover"
                    sizes="88px"
                  />
                </motion.div>
                <span className="absolute top-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-cyan-500 text-[8px] font-black uppercase text-black">
                  <Sparkles size={8} />
                  New
                </span>
              </div>

              <div className="flex flex-col justify-center min-w-0 py-0.5">
                <div className="flex items-center gap-1.5 text-cyan-400 mb-0.5">
                  <Package size={12} className="shrink-0" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.35em]">
                    Exclusive
                  </span>
                </div>
                <p className="font-syncopate text-sm font-bold uppercase tracking-wide text-white leading-tight">
                  Space Merch
                </p>
                <p className="text-[10px] text-white/45 mt-1 leading-snug">
                  Official Conscientia 2026 kit — add at checkout
                </p>
                <p className="mt-2 flex items-center gap-2">
                  <span className="font-syncopate text-base font-black text-cyan-400">
                    ₹599
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/70 group-hover:text-cyan-300 transition-colors">
                    Shop now
                    <ArrowUpRight
                      size={12}
                      className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </span>
                </p>
              </div>
            </div>

            <motion.div
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              animate={{ opacity: hovered ? 1 : 0.4 }}
            />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
