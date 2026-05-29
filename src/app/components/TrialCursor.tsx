"use client";

import { useEffect, useRef } from "react";

/* ── Types ───────────────────────────────────────────────────── */
interface TrailPoint {
  x: number;
  y: number;
  lifetime: number;
  maxLife: number;
  size: number;
  hue: number;       // HSL hue — drifts across the timeline palette
  sat: number;
  lit: number;
}

/* ── Constants ───────────────────────────────────────────────── */
const MAX_POINTS   = 120;   // trail length
const BASE_LIFE    = 38;    // frames each point lives
const LIFE_RAND    = 18;    // random jitter on lifetime
const BASE_SIZE    = 7;     // starting radius of each particle
const SIZE_RAND    = 5;
const SPAWN_EVERY  = 1;     // add a point every N mousemove events
const GLOW_BLUR    = 18;    // canvas shadowBlur

// Colour stops that represent Past → Present → Future
// We'll cycle through them based on trail position
const ERA_HUES = [
  { hue: 270, sat: 90, lit: 65 },  // Past    — violet
  { hue: 240, sat: 80, lit: 60 },  // Past    — indigo
  { hue: 45,  sat: 100, lit: 60 }, // Present — amber
  { hue: 36,  sat: 100, lit: 55 }, // Present — gold
  { hue: 185, sat: 90, lit: 55 },  // Future  — teal
  { hue: 200, sat: 100, lit: 60 }, // Future  — cyan
];

export default function TrialCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<TrailPoint[]>([]);
  const rafRef    = useRef<number>(0);
  const spawnRef  = useRef(0);
  const hueIdxRef = useRef(0);

  useEffect(() => {
    // ── Canvas setup ──────────────────────────────────────────
    const canvas = document.createElement("canvas");
    canvas.style.cssText = [
      "position:fixed",
      "inset:0",
      "width:100vw",
      "height:100vh",
      "pointer-events:none",
      "z-index:99998",
      "mix-blend-mode:screen",
    ].join(";");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext("2d")!;

    // ── Resize ────────────────────────────────────────────────
    const onResize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    // ── Mouse tracking ────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      spawnRef.current++;
      if (spawnRef.current % SPAWN_EVERY !== 0) return;

      // Advance hue slowly — time drifting
      hueIdxRef.current = (hueIdxRef.current + 0.3) % ERA_HUES.length;
      const eraA = ERA_HUES[Math.floor(hueIdxRef.current) % ERA_HUES.length];
      const eraB = ERA_HUES[(Math.floor(hueIdxRef.current) + 1) % ERA_HUES.length];
      const t    = hueIdxRef.current - Math.floor(hueIdxRef.current);
      const hue  = eraA.hue + (eraB.hue - eraA.hue) * t;
      const sat  = eraA.sat + (eraB.sat - eraA.sat) * t;
      const lit  = eraA.lit + (eraB.lit - eraA.lit) * t;

      const maxLife = BASE_LIFE + Math.random() * LIFE_RAND;

      pointsRef.current.push({
        x:       e.clientX,
        y:       e.clientY,
        lifetime: 0,
        maxLife,
        size:    BASE_SIZE + Math.random() * SIZE_RAND,
        hue,
        sat,
        lit,
      });

      // Trim oldest points if buffer full
      if (pointsRef.current.length > MAX_POINTS) {
        pointsRef.current.shift();
      }
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── Animation loop ────────────────────────────────────────
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pts = pointsRef.current;

      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        p.lifetime++;

        if (p.lifetime > p.maxLife) {
          pts.splice(i, 1);
          continue;
        }

        const life    = p.lifetime / p.maxLife;          // 0→1
        const alpha   = Math.pow(1 - life, 1.6);         // fast fade
        const radius  = p.size * (1 - life * 0.7);       // shrink

        // Glow
        ctx.shadowBlur  = GLOW_BLUR * (1 - life);
        ctx.shadowColor = `hsla(${p.hue},${p.sat}%,${p.lit}%,1)`;

        // Draw circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, radius), 0, Math.PI * 2);

        // Radial gradient per particle — inner bright, outer transparent
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        grad.addColorStop(0,   `hsla(${p.hue},${p.sat}%,${Math.min(p.lit + 20, 95)}%,${alpha})`);
        grad.addColorStop(0.5, `hsla(${p.hue},${p.sat}%,${p.lit}%,${alpha * 0.6})`);
        grad.addColorStop(1,   `hsla(${p.hue},${p.sat}%,${p.lit}%,0)`);

        ctx.fillStyle = grad;
        ctx.fill();
        ctx.closePath();

        // Connecting line to previous point (comet tail)
        if (i > 0) {
          const prev = pts[i - 1];
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `hsla(${p.hue},${p.sat}%,${p.lit}%,${alpha * 0.25})`;
          ctx.lineWidth   = radius * 0.5;
          ctx.lineCap     = "round";
          ctx.stroke();
          ctx.closePath();
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      canvas.remove();
    };
  }, []);

  return null; // renders nothing into React tree — canvas appended to body
}