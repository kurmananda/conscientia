'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff, Wifi, Loader2 } from 'lucide-react';
import { subscribeLoading, getLoadingCount } from '@/lib/loadingTracker';

/**
 * Global corner toast that surfaces network activity:
 *  - "Fetching…" while offline (any in-flight/queued Supabase or API calls
 *    just hang or fail silently otherwise — this makes that visible), and
 *    also briefly while any request is genuinely in flight (profile/cart/
 *    admin data loading etc.), fed by the window.fetch patch in
 *    FetchTracker.jsx.
 *  - a brief "Back online" flash on reconnect.
 * Shown with a short delay so near-instant requests don't cause flicker.
 */
export default function NetworkStatusToast() {
  const [online, setOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);
  const [showFetching, setShowFetching] = useState(false);
  const showTimer = useRef(null);
  const hideTimer = useRef(null);

  useEffect(() => {
    setOnline(navigator.onLine);

    const handleOffline = () => {
      setOnline(false);
      setShowReconnected(false);
    };
    const handleOnline = () => {
      setOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 2500);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    const onChange = (count) => {
      clearTimeout(showTimer.current);
      clearTimeout(hideTimer.current);
      if (count > 0) {
        // Only show if the request is still going after a short delay —
        // avoids a flash for fetches that resolve near-instantly.
        showTimer.current = setTimeout(() => setShowFetching(true), 250);
      } else {
        // Keep it visible briefly so a burst of quick sequential fetches
        // (e.g. profile + registrations + cart) reads as one steady toast
        // instead of blinking on/off between each.
        hideTimer.current = setTimeout(() => setShowFetching(false), 300);
      }
    };
    onChange(getLoadingCount());
    const unsubscribe = subscribeLoading(onChange);
    return () => {
      unsubscribe();
      clearTimeout(showTimer.current);
      clearTimeout(hideTimer.current);
    };
  }, []);

  const showOfflineToast = !online;
  const showFetchingToast = online && showFetching;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[300] flex flex-col items-end gap-2">
      <AnimatePresence>
        {showOfflineToast && (
          <motion.div
            key="offline"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-500/30 bg-[#0a0c10]/95 px-4 py-2.5 text-xs font-semibold text-amber-300 shadow-lg backdrop-blur-sm"
          >
            <motion.span
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="flex items-center gap-2"
            >
              <WifiOff size={14} />
              Fetching…
            </motion.span>
            <span className="hidden text-[10px] font-normal text-amber-300/60 sm:inline">
              No internet connection
            </span>
          </motion.div>
        )}
        {showFetchingToast && (
          <motion.div
            key="fetching"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-cyan-500/25 bg-[#0a0c10]/95 px-4 py-2.5 text-xs font-semibold text-cyan-300 shadow-lg backdrop-blur-sm"
          >
            <Loader2 size={14} className="animate-spin" />
            Fetching…
          </motion.div>
        )}
        {online && showReconnected && (
          <motion.div
            key="reconnected"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-cyan-500/30 bg-[#0a0c10]/95 px-4 py-2.5 text-xs font-semibold text-cyan-300 shadow-lg backdrop-blur-sm"
          >
            <Wifi size={14} />
            Back online
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
