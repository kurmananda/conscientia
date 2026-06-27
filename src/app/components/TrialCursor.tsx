"use client";

import { useEffect, useRef } from "react";

interface TrailPoint {
  x: number;
  y: number;
  life: number;    // 0 → 1 as it dies
  size: number;
  hue: number;
  sat: number;
  lit: number;
}

const MAX_POINTS = 100;
const POINT_LIFE = 0.012;   // how fast each point dies per frame (~83 frames to die)
const BASE_SIZE  = 5;
const GLOW       = 16;

const ERA_HUES = [
  { hue: 270, sat: 85, lit: 70 },
  { hue: 240, sat: 75, lit: 60 },
  { hue: 45,  sat: 100, lit: 65 },
  { hue: 36,  sat: 100, lit: 55 },
  { hue: 185, sat: 85, lit: 60 },
  { hue: 200, sat: 100, lit: 65 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function TrialCursor() {
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99998;mix-blend-mode:screen";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const points: TrailPoint[] = [];
    let hueIdx = 0;
    let prevX = -1;
    let prevY = -1;

    const onMouseMove = (e: MouseEvent) => {
      const mx = e.clientX;
      const my = e.clientY;

      // Interpolate between previous and current mouse to fill gaps
      const dist = prevX < 0 ? 0 : Math.sqrt((mx - prevX) ** 2 + (my - prevY) ** 2);
      const steps = Math.max(1, Math.floor(dist / 4)); // one point every ~4px

      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const px = lerp(prevX < 0 ? mx : prevX, mx, t);
        const py = lerp(prevY < 0 ? my : prevY, my, t);

        hueIdx = (hueIdx + 0.18) % ERA_HUES.length;
        const i0 = Math.floor(hueIdx) % ERA_HUES.length;
        const i1 = (i0 + 1) % ERA_HUES.length;
        const frac = hueIdx - Math.floor(hueIdx);

        points.push({
          x: px,
          y: py,
          life: 0,
          size: BASE_SIZE + Math.random() * 3,
          hue: lerp(ERA_HUES[i0].hue, ERA_HUES[i1].hue, frac),
          sat: lerp(ERA_HUES[i0].sat, ERA_HUES[i1].sat, frac),
          lit: lerp(ERA_HUES[i0].lit, ERA_HUES[i1].lit, frac),
        });

        if (points.length > MAX_POINTS) points.shift();
      }

      prevX = mx;
      prevY = my;
    };
    window.addEventListener("mousemove", onMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      // ── Draw trail as a smooth connected stroke ─────────────
      if (points.length > 1) {
        // Build the main glowing stroke
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (let i = 1; i < points.length; i++) {
          const p = points[i];
          p.life += POINT_LIFE;

          if (p.life >= 1) {
            points.splice(i, 1);
            i--;
            continue;
          }

          const prev = points[i - 1];
          const alpha = Math.pow(1 - p.life, 2.5); // smooth ease-out fade

          // Segment glow
          ctx.shadowBlur  = GLOW * (1 - p.life);
          ctx.shadowColor = `hsla(${p.hue},${p.sat}%,${p.lit}%,${alpha * 0.6})`;

          // Gradient along segment
          const grad = ctx.createLinearGradient(prev.x, prev.y, p.x, p.y);
          grad.addColorStop(0, `hsla(${prev.hue},${prev.sat}%,${prev.lit}%,${alpha * 0.5})`);
          grad.addColorStop(1, `hsla(${p.hue},${p.sat}%,${p.lit}%,${alpha * 0.9})`);

          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = p.size * (1 - p.life * 0.6);
          ctx.stroke();
          ctx.closePath();
        }

        ctx.shadowBlur = 0;
      }

      // ── Draw soft orbs at each point ────────────────────────
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const alpha = Math.pow(1 - p.life, 2.5);
        const r = p.size * (1 - p.life * 0.5);

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2);
        grad.addColorStop(0, `hsla(${p.hue},${p.sat}%,${Math.min(p.lit + 20, 95)}%,${alpha * 0.7})`);
        grad.addColorStop(0.4, `hsla(${p.hue},${p.sat}%,${p.lit}%,${alpha * 0.3})`);
        grad.addColorStop(1, `hsla(${p.hue},${p.sat}%,${p.lit}%,0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      canvas.remove();
    };
  }, []);

  return null;
}
