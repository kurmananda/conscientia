'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ShoppingCart } from 'lucide-react';
import { subscribeCartToast } from '@/lib/cartToast';

/**
 * Global bottom-center toast fired via showCartToast() whenever something
 * lands in the cart from a page that isn't /cart itself, so the user has
 * confirmation without being redirected there, plus a link to go check out.
 */
export default function CartToast() {
  const [message, setMessage] = useState('');
  const hideTimer = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = subscribeCartToast((msg) => {
      clearTimeout(hideTimer.current);
      setMessage(msg);
      hideTimer.current = setTimeout(() => setMessage(''), 6000);
    });
    return () => {
      unsubscribe();
      clearTimeout(hideTimer.current);
    };
  }, []);

  // Full-width fixed strip with the card centred by flexbox — no
  // translate-x on the wrapper, and the card is width-capped, so it can
  // never poke past the viewport edge and add a scrollbar.
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[300] flex justify-center px-4 pb-6">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            role="status"
            className="pointer-events-auto flex w-full max-w-md items-center gap-4 rounded-2xl border border-cyan-400/50 bg-[#0a0c10]/95 p-4 shadow-[0_0_40px_rgba(34,211,238,0.25)] backdrop-blur-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">
              <Check size={22} strokeWidth={3} />
            </span>
            <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-white">{message}</p>
            {pathname !== '/cart' && (
              <Link
                href="/cart"
                onClick={() => setMessage('')}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-cyan-400 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-black transition-colors hover:bg-white"
              >
                <ShoppingCart size={14} />
                Go to cart
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
