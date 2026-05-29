"use client";

import { useEffect, useRef } from "react";
import TrialCursor from "./TrialCursor";
/* ── Spring config ────────────────────────────────────────────── */
const SPRING_STIFFNESS = 0.14; // lower = more lag / floatier
const SPRING_DAMPING   = 0.82; // 0-1, higher = less oscillation

/* ── Colour palette (same eras as trail) ──────────────────────── */
const PALETTE = [
  "#a78bfa", // violet  (Past)
  "#818cf8", // indigo  (Past)
  "#fbbf24", // amber   (Present)
  "#f59e0b", // gold    (Present)
  "#22d3ee", // cyan    (Future)
  "#2dd4bf", // teal    (Future)
];

/* ── Helpers ──────────────────────────────────────────────────── */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function cycleColor(t: number): string {
  // t in [0, PALETTE.length)
  const i = Math.floor(t) % PALETTE.length;
  const j = (i + 1) % PALETTE.length;
  const f = t - Math.floor(t);
  // Simple hex interpolation via canvas
  return PALETTE[f < 0.5 ? i : j];
}

export default function CursorTrialWrapper() {
  /* ── Refs ─────────────────────────────────────────────────── */
  const dotRef   = useRef<HTMLDivElement>(null);
  const ringRef  = useRef<HTMLDivElement>(null);
  const handRef  = useRef<HTMLDivElement>(null); // rotating clock hand inside ring

  const mouse    = useRef({ x: -200, y: -200 });
  const ring     = useRef({ x: -200, y: -200, vx: 0, vy: 0 });
  const rafRef   = useRef<number>(0);
  const colorT   = useRef(0);
  const rotRef   = useRef(0);
  const clickRef = useRef(false);
  const scaleRef = useRef(1);

  /* ── Inject global cursor:none ─────────────────────────────── */
  useEffect(() => {
    const style = document.createElement("style");
    style.id    = "timefall-cursor-override";
    style.textContent = `
      *, *::before, *::after { cursor: none !important; }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  /* ── Main animation loop ───────────────────────────────────── */
  useEffect(() => {
    const dot  = dotRef.current;
    const rng  = ringRef.current;
    const hand = handRef.current;
    if (!dot || !rng || !hand) return;

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const onDown = () => {
      clickRef.current = true;
    };
    const onUp = () => {
      clickRef.current = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);

    let frame = 0;

    const animate = () => {
      frame++;

      // ── Spring physics for ring ──────────────────────────────
      const dx = mouse.current.x - ring.current.x;
      const dy = mouse.current.y - ring.current.y;
      ring.current.vx = (ring.current.vx + dx * SPRING_STIFFNESS) * SPRING_DAMPING;
      ring.current.vy = (ring.current.vy + dy * SPRING_STIFFNESS) * SPRING_DAMPING;
      ring.current.x += ring.current.vx;
      ring.current.y += ring.current.vy;

      // ── Colour cycle ─────────────────────────────────────────
      colorT.current += 0.012;
      const color = cycleColor(colorT.current % PALETTE.length);

      // ── Scale on click ───────────────────────────────────────
      const targetScale = clickRef.current ? 0.55 : 1;
      scaleRef.current  = lerp(scaleRef.current, targetScale, 0.18);

      // ── Clock-hand rotation — accelerates on click ────────────
      rotRef.current += clickRef.current ? 6 : 1.4;

      // ── Apply styles ─────────────────────────────────────────
      // Dot — snaps to cursor
      dot.style.transform =
        `translate(${mouse.current.x - 4}px, ${mouse.current.y - 4}px)`;
      dot.style.background = color;
      dot.style.boxShadow  = `0 0 10px 3px ${color}`;

      // Ring — spring-lagged
      const RING_R = 22; // half the ring element width
      rng.style.transform =
        `translate(${ring.current.x - RING_R}px, ${ring.current.y - RING_R}px) scale(${scaleRef.current})`;
      rng.style.borderColor = color;
      rng.style.boxShadow   =
        `0 0 12px 2px ${color}, inset 0 0 8px 1px ${color}44`;

      // Clock hand
      hand.style.transform    = `rotate(${rotRef.current}deg)`;
      hand.style.background   = color;

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <>
      {/* Canvas trail layer */}
      <TrialCursor />

      {/* ── Inner dot ─────────────────────────────────────────── */}
      <div
        ref={dotRef}
        style={{
          position:        "fixed",
          top:             0,
          left:            0,
          width:           8,
          height:          8,
          borderRadius:    "50%",
          background:      "#fbbf24",
          pointerEvents:   "none",
          zIndex:          99999,
          willChange:      "transform",
          transition:      "background 0.1s",
        }}
      />

      {/* ── Outer ring with clock-hand ────────────────────────── */}
      <div
        ref={ringRef}
        style={{
          position:      "fixed",
          top:           0,
          left:          0,
          width:         38,
          height:        38,
          borderRadius:  "50%",
          border:        "1.5px solid #fbbf24",
          pointerEvents: "none",
          zIndex:        99999,
          willChange:    "transform",
          /* Clip so hand stays inside ring */
          overflow:      "hidden",
        }}
      >
        {/* Rotating clock-hand */}
        <div
          ref={handRef}
          style={{
            position:       "absolute",
            bottom:         "50%",
            left:           "calc(50% - 0.75px)",
            width:          1.5,
            height:         "46%",
            background:     "#fbbf24",
            transformOrigin: "bottom center",
            borderRadius:   2,
          }}
        />
        {/* Centre pivot dot */}
        <div
          style={{
            position:     "absolute",
            top:          "50%",
            left:         "50%",
            transform:    "translate(-50%, -50%)",
            width:        4,
            height:       4,
            borderRadius: "50%",
            background:   "#fff",
            opacity:      0.8,
          }}
        />
      </div>
    </>
  );
}
