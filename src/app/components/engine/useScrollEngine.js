"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { decodeScrollProgress } from "./config";

export interface ScrollEngineState {
  progressRef: React.MutableRefObject<number>;
  velocityRef: React.MutableRefObject<number>;
  activeIndex: number;
  scrollToSection: (index: number) => void;
  hasScrolled: boolean;
  mouseSmoothRef: React.MutableRefObject<{ x: number; y: number }>;
}

const LERP_FACTOR = 0.075;
const VELOCITY_DECAY = 0.85;
const MOUSE_INERTIA = 0.04;

export function useScrollEngine(
  scrollHeightVh: number
): ScrollEngineState {
  const progressRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const mouseSmoothRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseRawRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const rawProgressRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const lastScrollY = useRef<number>(0);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRawRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  useEffect(() => {
    let prevActive = 0;

    const tick = () => {
      const prev = progressRef.current;
      progressRef.current += (rawProgressRef.current - prev) * LERP_FACTOR;

      const vel = progressRef.current - prev;
      velocityRef.current = velocityRef.current * VELOCITY_DECAY + vel * (1 - VELOCITY_DECAY);

      const { activeIndex: ai } = decodeScrollProgress(progressRef.current);
      if (ai !== prevActive) {
        prevActive = ai;
        setActiveIndex(ai);
      }

      mouseSmoothRef.current.x += (mouseRawRef.current.x - mouseSmoothRef.current.x) * MOUSE_INERTIA;
      mouseSmoothRef.current.y += (mouseRawRef.current.y - mouseSmoothRef.current.y) * MOUSE_INERTIA;

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      if (maxScroll > 0) {
        rawProgressRef.current = Math.max(0, Math.min(1, scrollY / maxScroll));
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

  const scrollToSection = useCallback(
    (index: number) => {
      const sectionTargets = [0.1, 0.52, 0.91];
      const target = sectionTargets[Math.min(index, 2)] ?? 0;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: target * maxScroll, behavior: "smooth" });
    },
    []
  );

  return { progressRef, velocityRef, activeIndex, scrollToSection, hasScrolled, mouseSmoothRef };
}
