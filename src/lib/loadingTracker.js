'use client';

// Tiny pub-sub counter for "is the app currently talking to the network".
// Fed by a single window.fetch patch (see FetchTracker.jsx) so every
// fetch()-based call — API routes under /api/*, and Supabase JS's own
// REST/auth calls, which use the global fetch under the hood — bumps this
// without every call site needing to opt in individually.
let count = 0;
const listeners = new Set();

function notify() {
  for (const fn of listeners) fn(count);
}

export function startRequest() {
  count += 1;
  notify();
}

export function endRequest() {
  count = Math.max(0, count - 1);
  notify();
}

export function subscribeLoading(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getLoadingCount() {
  return count;
}
