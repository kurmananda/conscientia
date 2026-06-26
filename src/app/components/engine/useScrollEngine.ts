/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Conscientia — Time Fall  |  Scroll Engine Hook
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Manages smooth scroll state using a ref-based approach so that the 3D
 * canvas can read the latest scroll value every frame WITHOUT causing React
 * re-renders. Only the discrete "activeIndex" triggers a re-render (used for
 * UI elements like the dot navigator).
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { decodeScrollProgress } from "./config";

export interface ScrollEngineState {
  /** Smoothed scroll progress 0→1 (read every frame from 3D canvas) */
  progressRef: React.MutableRefObject<number>;
  /** Smoothed velocity (for squash/stretch effects) */
  velocityRef: React.MutableRefObject<number>;
  /** React state: current active object index (triggers UI re-renders) */
  activeIndex: number;
  /** Scroll to a specific section index (0, 1, 2) */
  scrollToSection: (index: number) => void;
  /** Whether the user has scrolled at all */
  hasScrolled: boolean;
}

const LERP_FACTOR = 0.075; // lower = smoother / heavier
const VELOCITY_DECAY = 0.85;

export function useScrollEngine(
  scrollHeightVh: number
): ScrollEngineState {
  const progressRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);

  const rawProgressRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const lastScrollY = useRef<number>(0);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);

  /* ── Smooth interpolation loop ───────────────────────────────────────────── */
  useEffect(() => {
    let prevActive = 0;

    const tick = () => {
      // Lerp smoothed progress toward raw
      const prev = progressRef.current;
      progressRef.current += (rawProgressRef.current - prev) * LERP_FACTOR;

      // Velocity
      const vel = progressRef.current - prev;
      velocityRef.current = velocityRef.current * VELOCITY_DECAY + vel * (1 - VELOCITY_DECAY);

      // Decode active index
      const { activeIndex: ai } = decodeScrollProgress(progressRef.current);
      if (ai !== prevActive) {
        prevActive = ai;
        setActiveIndex(ai);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  /* ── Native scroll listener ──────────────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      if (maxScroll > 0) {
        rawProgressRef.current = Math.max(0, Math.min(1, scrollY / maxScroll));
        console.log(rawProgressRef.current);
      }

      const delta = scrollY - lastScrollY.current;
      lastScrollY.current = scrollY;

      if (!hasScrolled && Math.abs(delta) > 2) {
        setHasScrolled(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasScrolled]);

  /* ── Programmatic scroll to section ─────────────────────────────────────── */
  const scrollToSection = useCallback(
    (index: number) => {
      const sectionTargets = [0.1, 0.52, 0.91]; // representative progress for each obj
      const target = sectionTargets[Math.min(index, 2)] ?? 0;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: target * maxScroll, behavior: "smooth" });
    },
    []
  );

  return { progressRef, velocityRef, activeIndex, scrollToSection, hasScrolled };
}
