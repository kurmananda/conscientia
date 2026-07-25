'use client';

import { useEffect } from 'react';
import { startRequest, endRequest } from '@/lib/loadingTracker';

/**
 * Patches window.fetch once (guarded against double-patching on
 * remounts/HMR) so every fetch()-based request — /api/* routes and
 * Supabase JS's own REST/auth calls, which use the global fetch under the
 * hood — bumps the shared loading counter without any call site needing to
 * opt in. Renders nothing; just wires the patch up on mount.
 */
export default function FetchTracker() {
  useEffect(() => {
    if (typeof window === 'undefined' || window.__fetchTrackerPatched) return;
    window.__fetchTrackerPatched = true;

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      startRequest();
      try {
        return await originalFetch(...args);
      } finally {
        endRequest();
      }
    };
  }, []);

  return null;
}
