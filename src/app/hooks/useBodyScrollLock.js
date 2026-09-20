'use client';

import { useEffect } from 'react';

// Freezes background scrolling while a modal/menu overlay is open, so the
// page behind it can't be scrolled (which, with fixed background elements
// like the footer's big text, otherwise visibly bleeds through the popup's
// backdrop blur while scrolling).
export default function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [active]);
}
