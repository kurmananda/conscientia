'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { subscribeCartToast } from '@/lib/cartToast';

/**
 * Global bottom-center toast fired via showCartToast() whenever something
 * lands in the cart from a page that isn't /cart itself, so the user has
 * confirmation without being redirected there.
 */
export default function CartToast() {
  const [message, setMessage] = useState('');
  const hideTimer = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeCartToast((msg) => {
      clearTimeout(hideTimer.current);
      setMessage(msg);
      hideTimer.current = setTimeout(() => setMessage(''), 2500);
    });
    return () => {
      unsubscribe();
      clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[300] -translate-x-1/2">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-cyan-500/30 bg-[#0a0c10]/95 px-4 py-2.5 text-xs font-semibold text-cyan-300 shadow-lg backdrop-blur-sm"
          >
            <Check size={14} />
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
