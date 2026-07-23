"use client";

import { useEffect, useRef, useState } from "react";
import TrialCursor from "./TrialCursor";

/* ── Colour palette ─────────────────────────────────────────── */
const PALETTE = [
  "#a78bfa", "#818cf8", // Past — violet, indigo
  "#fbbf24", "#f59e0b", // Present — amber, gold
  "#22d3ee", "#2dd4bf", // Future — cyan, teal
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function cycleColor(t: number): string {
  const i = Math.floor(t) % PALETTE.length;
  const j = (i + 1) % PALETTE.length;
  const f = t - Math.floor(t);
  const [r1, g1, b1] = hexToRgb(PALETTE[i]);
  const [r2, g2, b2] = hexToRgb(PALETTE[j]);
  return `rgb(${Math.round(lerp(r1, r2, f))},${Math.round(lerp(g1, g2, f))},${Math.round(lerp(b1, b2, f))})`;
}

export default function CursorTrialWrapper() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const minHandRef = useRef<HTMLDivElement>(null);

  const [isTouch] = useState(
    () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );

  if (isTouch) return null;

  // All positions and velocities live here
  const state = useRef({
    mx: -200, my: -200,
    dx: -200, dy: -200,
    rx: -200, ry: -200,
    colorT: 0,
    rot: 0,
    clicking: false,
    dotScale: 1,
    ringScale: 1,
    speed: 0,
    prevMx: -200,
    prevMy: -200,
  });

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "timefall-cursor-override";
    style.textContent = `*, *::before, *::after { cursor: none !important; }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  useEffect(() => {
    const dot  = dotRef.current;
    const rng  = ringRef.current;
    const hand = handRef.current;
    const minHand = minHandRef.current;
    if (!dot || !rng || !hand || !minHand) return;

    const s = state.current;

    const onMove = (e: MouseEvent) => { s.mx = e.clientX; s.my = e.clientY; };
    const onDown = () => { s.clicking = true; };
    const onUp   = () => { s.clicking = false; };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);

    const animate = () => {
      // ── Speed ──────────────────────────────────────────────
      const dxM = s.mx - s.prevMx;
      const dyM = s.my - s.prevMy;
      s.speed = lerp(s.speed, Math.sqrt(dxM * dxM + dyM * dyM), 0.12);
      s.prevMx = s.mx;
      s.prevMy = s.my;
      const sf = Math.min(s.speed / 28, 1); // 0–1 speed factor

      // ── Dot follows mouse directly (no lag) ──────────────────
      s.dx = lerp(s.dx, s.mx, 0.45);
      s.dy = lerp(s.dy, s.my, 0.45);

      // ── Ring follows dot with slight delay, no spring ────────
      s.rx = lerp(s.rx, s.dx, 0.35);
      s.ry = lerp(s.ry, s.dy, 0.35);

      // ── Colour ──────────────────────────────────────────────
      s.colorT += 0.006;
      const color = cycleColor(s.colorT % PALETTE.length);

      // ── Click scale ─────────────────────────────────────────
      const tScale = s.clicking ? 0.55 : 1;
      s.dotScale  = lerp(s.dotScale, tScale, 0.18);
      s.ringScale = lerp(s.ringScale, tScale * (1 + sf * 0.08), 0.15);

      // ── Clock hand ──────────────────────────────────────────
      s.rot += s.clicking ? 7 : 1;

      // ── Apply: dot ──────────────────────────────────────────
      const dotR = 4 * s.dotScale;
      dot.style.transform = `translate(${s.dx - dotR}px, ${s.dy - dotR}px)`;
      dot.style.width  = `${dotR * 2}px`;
      dot.style.height = `${dotR * 2}px`;
      dot.style.background = color;
      dot.style.boxShadow  = `0 0 6px 2px ${color}, 0 0 14px 4px ${color}44`;

      // ── Apply: ring ─────────────────────────────────────────
      const ringR = 20;
      rng.style.transform = `translate(${s.rx - ringR}px, ${s.ry - ringR}px) scale(${s.ringScale})`;
      rng.style.borderColor = color;
      rng.style.boxShadow  = `0 0 12px 3px ${color}77, inset 0 0 8px 1px ${color}22`;

      // ── Apply: hand ─────────────────────────────────────────
      hand.style.transform  = `rotate(${s.rot}deg)`;
      hand.style.background = color;
      minHand.style.transform = `rotate(${s.rot * 0.7}deg)`;
      minHand.style.background = color;

      requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);

  return (
    <>
      <TrialCursor />

      {/* Dot */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 99999,
          willChange: "transform",
        }}
      />

      {/* Ring */}
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "1.5px solid #fbbf24",
          pointerEvents: "none",
          zIndex: 99999,
          willChange: "transform",
          overflow: "hidden",
        }}
      >
        {/* Clock hand — thick, clear, visible */}
        <div
          ref={handRef}
          style={{
            position: "absolute",
            bottom: "50%",
            left: "calc(50% - 1px)",
            width: 2,
            height: "46%",
            background: "#fbbf24",
            transformOrigin: "bottom center",
            borderRadius: 1,
          }}
        />
        {/* Small minute hand (rotates slower) */}
        <div
          ref={minHandRef}
          style={{
            position: "absolute",
            bottom: "50%",
            left: "calc(50% - 0.75px)",
            width: 1.5,
            height: "30%",
            background: "#fbbf24",
            transformOrigin: "bottom center",
            borderRadius: 1,
            opacity: 0.5,
          }}
        />
        {/* Pivot */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "#fff",
            opacity: 0.85,
          }}
        />
      </div>
    </>
  );
}