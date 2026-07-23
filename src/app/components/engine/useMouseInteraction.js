/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Conscientia — Time Fall  |  Mouse Interaction Hook
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Tracks normalised mouse position (-1 → 1 on each axis) and provides a
 * smoothed version that the active object uses for its parallax tilt.
 * The lag / inertia is deliberately exaggerated to feel premium.
 */

"use client";

import { useEffect, useRef } from "react";

export interface MouseState {
  /** Raw normalised mouse position, updated per event */
  rawRef: React.MutableRefObject<{ x: number; y: number }>;
  /** Smoothed position, updated per RAF – read this in the 3D loop */
  smoothRef: React.MutableRefObject<{ x: number; y: number }>;
}

/** How quickly the smoothed position chases the raw position. */
const INERTIA = 0.04; // Very low = very heavy / premium

export function useMouseInteraction(): MouseState {
  const rawRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const smoothRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      rawRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const tick = () => {
      smoothRef.current.x +=
        (rawRef.current.x - smoothRef.current.x) * INERTIA;
      smoothRef.current.y +=
        (rawRef.current.y - smoothRef.current.y) * INERTIA;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return { rawRef, smoothRef };
}
