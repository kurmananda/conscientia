'use client';

// Tiny pub-sub so any component can fire a "added to cart" toast without
// prop-drilling through the page tree — mirrors loadingTracker.js's shape.
const listeners = new Set();

export function showCartToast(message) {
  for (const fn of listeners) fn(message);
}

export function subscribeCartToast(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
