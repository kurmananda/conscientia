"use client";

import { useEffect, useRef } from "react";

interface TrailPoint {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  initialSize: number;
  life: number;
  decay: number;
  rotation: number;
  vRotation: number;
  type: "circle" | "diamond" | "star";
}

const MAX_POINTS = 22;

const CURSOR_COLOR = {
  r: 0,
  g: 200,
  b: 255,
};

export default function TrialCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<TrailPoint[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = document.createElement("canvas");

    canvas.style.cssText = `
      position:fixed;
      inset:0;
      width:100vw;
      height:100vh;
      pointer-events:none;
      z-index:99998;
      mix-blend-mode:screen;
    `;

    document.body.appendChild(canvas);

    canvasRef.current = canvas;

    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;

      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;

      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resize();

    window.addEventListener("resize", resize);

    let targetX = -100;
    let targetY = -100;

    let smoothX = -100;
    let smoothY = -100;

    let lastSpawnX = -100;
    let lastSpawnY = -100;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    window.addEventListener("mousemove", onMove);

    const onMouseDown = (e: MouseEvent) => {
      const particleCount = 18;
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.5 + 1.5;
        const size = Math.random() * 3 + 2;
        const typeRand = Math.random();
        const type = typeRand < 0.4 ? "diamond" : typeRand < 0.7 ? "star" : "circle";

        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: size,
          initialSize: size,
          life: 1.0,
          decay: Math.random() * 0.02 + 0.015,
          rotation: Math.random() * Math.PI * 2,
          vRotation: (Math.random() - 0.5) * 0.15,
          type: type as any,
        });
      }
    };

    window.addEventListener("mousedown", onMouseDown);

    const animate = () => {
      smoothX += (targetX - smoothX) * 0.35;
      smoothY += (targetY - smoothY) * 0.35;

      pointsRef.current.push({
        x: smoothX,
        y: smoothY,
      });

      while (pointsRef.current.length > MAX_POINTS) {
        pointsRef.current.shift();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pts = pointsRef.current;

      // ── 1. DRAW TAPERED TRAIL ───────────────────────────
      if (pts.length > 1) {
        for (let i = 1; i < pts.length; i++) {
          const p1 = pts[i - 1];
          const p2 = pts[i];
          const ratio = i / pts.length; // 0 at tail, 1 at head

          // Draw Outer Glow segment
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${CURSOR_COLOR.r},${CURSOR_COLOR.g},${CURSOR_COLOR.b},${ratio * 0.18})`;
          ctx.lineWidth = ratio * 16;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Draw Mid Glow segment
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${CURSOR_COLOR.r},${CURSOR_COLOR.g},${CURSOR_COLOR.b},${ratio * 0.55})`;
          ctx.lineWidth = ratio * 9;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Draw Core segment
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255,255,255,${ratio * 0.95})`;
          ctx.lineWidth = ratio * 2.5;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // ── 2. SPAWN MOVEMENT PARTICLES ──────────────────────
      const moveDist = Math.hypot(smoothX - lastSpawnX, smoothY - lastSpawnY);
      if (moveDist > 6 && smoothX > -50 && smoothY > -50) {
        if (particlesRef.current.length < 80) {
          const size = Math.random() * 2.2 + 1.2;
          const typeRand = Math.random();
          const type = typeRand < 0.3 ? "diamond" : typeRand < 0.55 ? "star" : "circle";

          particlesRef.current.push({
            x: smoothX + (Math.random() - 0.5) * 6,
            y: smoothY + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 0.8 - (targetX - smoothX) * 0.04,
            vy: (Math.random() - 0.5) * 0.8 - (targetY - smoothY) * 0.04,
            size: size,
            initialSize: size,
            life: 1.0,
            decay: Math.random() * 0.02 + 0.015,
            rotation: Math.random() * Math.PI * 2,
            vRotation: (Math.random() - 0.5) * 0.08,
            type: type as any,
          });
        }
        lastSpawnX = smoothX;
        lastSpawnY = smoothY;
      }

      // ── 3. UPDATE & DRAW PARTICLES ───────────────────────
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= 0.95; // drag
        p.vy *= 0.95; // drag
        p.vy -= 0.04; // upward float
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRotation;
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = p.life * 0.85;
        const rgbaColor = `rgba(${CURSOR_COLOR.r},${CURSOR_COLOR.g},${CURSOR_COLOR.b},${alpha})`;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.type === "diamond") {
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size, 0);
          ctx.closePath();
          ctx.fillStyle = rgbaColor;
          ctx.fill();
        } else if (p.type === "star") {
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.quadraticCurveTo(0, 0, p.size, 0);
          ctx.quadraticCurveTo(0, 0, 0, p.size);
          ctx.quadraticCurveTo(0, 0, -p.size, 0);
          ctx.quadraticCurveTo(0, 0, 0, -p.size);
          ctx.closePath();
          ctx.fillStyle = rgbaColor;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = rgbaColor;
          ctx.fill();
        }

        ctx.restore();
      }

      // Slowly decay when cursor stops
      if (Math.abs(targetX - smoothX) < 0.2 && Math.abs(targetY - smoothY) < 0.2) {
        if (pointsRef.current.length > 0) {
          pointsRef.current.shift();
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("resize", resize);
      canvas.remove();
    };
  }, []);

  return null;
}