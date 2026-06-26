"use client";

import React, { useRef, useState, useEffect, ReactNode } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";

interface CategoryBoxProps {
  title: string;
  accentColor: string;
  glowColor: string;
  children: ReactNode;
  style?: React.CSSProperties;
}

export default function CategoryBox({
  title,
  accentColor,
  glowColor,
  children,
  style,
}: CategoryBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [displayText, setDisplayText] = useState(
    title.split("").map(() => "\u00A0").join("")
  );

  // Scroll-triggered reveal
  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !revealed) {
          setRevealed(true);
        }
      },
      { threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [revealed]);

  // Mouse tracking for 3D tilt
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // Scroll-based parallax within box
  useEffect(() => {
    const handleScroll = () => {
      const el = boxRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = 1 - (rect.top + rect.height) / (vh + rect.height);
      setScrollProgress(Math.max(0, Math.min(1, progress)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scramble text animation
  useEffect(() => {
    if (!revealed) return;

    const target = title.split("");
    const totalFrames = 25;
    let frame = 0;

    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;

      const result = target.map((char, i) => {
        if (char === " ") return " ";
        const charThreshold = (i / target.length) * 0.6;
        if (progress > charThreshold + 0.35) return char;
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join("");

      setDisplayText(result);

      if (frame >= totalFrames) {
        clearInterval(interval);
        setDisplayText(title);
      }
    }, 45);

    return () => clearInterval(interval);
  }, [revealed, title]);

  const tiltX = (mousePos.y - 0.5) * 4;
  const tiltY = (mousePos.x - 0.5) * -4;

  return (
    <>
      <div ref={triggerRef} style={{ height: "1px", width: "100%" }} />

      <div
        ref={boxRef}
        style={{
          position: "relative",
          margin: "0 auto",
          width: "85vw",
          minHeight: "500px",
          padding: "3rem 2.5rem 2.5rem",
          borderRadius: "24px",
          overflow: "hidden",
          transform: revealed
            ? `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateX(0)`
            : "perspective(1200px) rotateX(0deg) rotateY(0deg) translateX(-80px)",
          opacity: revealed ? 1 : 0,
          clipPath: revealed ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
          transition: revealed
            ? "transform 0.15s ease-out, opacity 0.8s cubic-bezier(0.23, 1, 0.32, 1), clip-path 1.1s cubic-bezier(0.23, 1, 0.32, 1)"
            : "transform 0.15s ease-out, opacity 0.3s ease-in, clip-path 0.4s ease-in",
          willChange: "transform, opacity",
          ...style,
        }}
      >
        {/* ── Animated gradient border ──────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "24px",
            padding: "1.5px",
            background: `conic-gradient(from ${scrollProgress * 360}deg, ${accentColor}00, ${accentColor}66, ${accentColor}00, ${accentColor}44, ${accentColor}00)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            pointerEvents: "none",
            opacity: 0.8,
          }}
        />

        {/* ── Floating particles ────────────────────────────── */}
        {revealed && (
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: `${2 + (i % 3)}px`,
                  height: `${2 + (i % 3)}px`,
                  borderRadius: "50%",
                  background: accentColor,
                  opacity: 0.15 + (i % 5) * 0.05,
                  left: `${(i * 7.3) % 100}%`,
                  top: `${(i * 11.7) % 100}%`,
                  animation: `floatBox ${5 + (i % 4)}s ease-in-out ${(i * 0.4)}s infinite alternate`,
                }}
              />
            ))}
          </div>
        )}

        {/* ── Ambient glow that follows mouse ───────────────── */}
        <div
          style={{
            position: "absolute",
            inset: "-50%",
            background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${glowColor} 0%, transparent 40%)`,
            opacity: revealed ? 0.12 : 0,
            transition: "opacity 1.5s ease",
            pointerEvents: "none",
          }}
        />

        {/* ── Pulse glow on edges ───────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "24px",
            boxShadow: `inset 0 0 80px ${accentColor}08, inset 0 0 160px ${accentColor}04`,
            animation: revealed ? "pulseGlow 4s ease-in-out infinite alternate" : "none",
            pointerEvents: "none",
          }}
        />

        {/* ── Scan lines ────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.006) 3px, rgba(255,255,255,0.006) 4px)",
            pointerEvents: "none",
            borderRadius: "24px",
          }}
        />

        {/* ── Holographic foil strip ────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: `linear-gradient(90deg, transparent, ${accentColor}44, ${accentColor}88, ${accentColor}44, transparent)`,
            opacity: revealed ? 1 : 0,
            transition: "opacity 1s ease 0.5s",
            pointerEvents: "none",
          }}
        />

        {/* ── Corner brackets (animated) ────────────────────── */}
        {[
          { top: "12px", left: "12px", borderTop: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}` },
          { top: "12px", right: "12px", borderTop: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}` },
          { bottom: "12px", left: "12px", borderBottom: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}` },
          { bottom: "12px", right: "12px", borderBottom: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}` },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "28px",
              height: "28px",
              opacity: revealed ? 0.4 : 0,
              transition: `opacity 0.5s ease ${0.3 + i * 0.1}s`,
              ...pos,
            } as React.CSSProperties}
          />
        ))}

        {/* ── Subtle grid ───────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(${accentColor}04 1px, transparent 1px),
              linear-gradient(90deg, ${accentColor}04 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
            backgroundPosition: `${scrollProgress * 50}px ${scrollProgress * 50}px`,
            pointerEvents: "none",
            borderRadius: "24px",
          }}
        />

        {/* ── Category Title ────────────────────────────────── */}
        <div style={{ position: "relative", zIndex: 2, marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                width: revealed ? "60px" : "0px",
                height: "2px",
                background: `linear-gradient(90deg, ${accentColor}, transparent)`,
                transition: "width 0.8s ease 0.3s",
                boxShadow: `0 0 15px ${accentColor}80`,
              }}
            />

            <h2
              style={{
                fontFamily: "'Syncopate', sans-serif",
                fontSize: "clamp(1.2rem, 3vw, 2rem)",
                fontWeight: 700,
                color: accentColor,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                margin: 0,
                textShadow: `0 0 40px ${glowColor}, 0 0 80px ${accentColor}30`,
                whiteSpace: "nowrap",
              }}
            >
              {displayText}
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.8rem",
              marginLeft: "0.3rem",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: accentColor,
                boxShadow: `0 0 12px ${accentColor}`,
                opacity: revealed ? 1 : 0,
                transition: "opacity 0.6s ease 0.5s",
                animation: revealed ? "dotPulse 2s ease-in-out infinite" : "none",
              }}
            />
            <span
              style={{
                fontFamily: "'Syncopate', sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.3em",
                color: `${accentColor}88`,
                textTransform: "uppercase",
                opacity: revealed ? 1 : 0,
                transition: "opacity 0.8s ease 0.6s",
              }}
            >
              Workshops
            </span>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────── */}
        <div style={{ position: "relative", zIndex: 2 }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes floatBox {
          0% { transform: translateY(0px) translateX(0px); }
          100% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes pulseGlow {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.6; }
        }
      `}</style>
    </>
  );
}
