"use client";

import { useState } from "react";

/**
 * True for touch/no-hover devices. Computed once, synchronously, so the
 * very first render already knows — avoids a flash of desktop-only hover
 * effects (parallax tilt, cursor-follow glows) on phones.
 */
export default function useIsTouch() {
  const [isTouch] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia?.("(hover: none), (pointer: coarse)").matches
    );
  });
  return isTouch;
}
