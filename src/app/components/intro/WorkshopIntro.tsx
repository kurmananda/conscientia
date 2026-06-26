"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";

interface WorkshopIntroProps {
  onComplete: () => void;
}

const LAYERS = 5;
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";

export default function WorkshopIntro({ onComplete }: WorkshopIntroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const topRefs = useRef<(HTMLDivElement | null)[]>([]);
  const botRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [glitchText, setGlitchText] = useState("WORKSHOPS");
  const [showTagline, setShowTagline] = useState(false);

  // Scramble text effect
  useEffect(() => {
    if (done) return;
    const target = "WORKSHOPS";
    let frame = 0;
    const iv = setInterval(() => {
      frame++;
      const p = frame / 30;
      if (p >= 1) {
        setGlitchText(target);
        clearInterval(iv);
        return;
      }
      setGlitchText(
        target
          .split("")
          .map((c, i) => {
            if (c === " ") return " ";
            if (p > (i / target.length) * 0.7 + 0.25) return c;
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join("")
      );
    }, 50);
    return () => clearInterval(iv);
  }, [done]);

  // Show tagline after scramble
  useEffect(() => {
    const t = setTimeout(() => setShowTagline(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Progress counter
  useEffect(() => {
    if (done) return;
    const iv = setInterval(() => {
      setProgress((p) => Math.min(100, p + Math.random() * 8 + 2));
    }, 50);
    return () => clearInterval(iv);
  }, [done]);

  useEffect(() => {
    if (done) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => setDone(true),
      });

      // Set all layers at center
      for (let i = 0; i < LAYERS; i++) {
        const top = topRefs.current[i];
        const bot = botRefs.current[i];
        if (!top || !bot) continue;
        gsap.set(top, { y: 0, opacity: 1 - i * 0.15 });
        gsap.set(bot, { y: 0, opacity: 1 - i * 0.15 });
      }

      // Animate center line
      tl.fromTo(
        lineRef.current,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.6, ease: "power2.out" },
        0
      );

      // Staggered layer reveal with accelerating speed
      for (let i = 0; i < LAYERS; i++) {
        const top = topRefs.current[i];
        const bot = botRefs.current[i];
        if (!top || !bot) continue;

        const delay = i * 0.45;
        const duration = 2.0 + (LAYERS - i) * 0.2;

        tl.to(top, {
          y: -1200,
          duration,
          ease: "power3.in",
        }, delay);

        tl.to(bot, {
          y: 1200,
          duration,
          ease: "power3.in",
        }, delay);
      }

      // Flash effect before zoom
      tl.to(containerRef.current, {
        filter: "brightness(3)",
        duration: 0.15,
        ease: "none",
      }, 1.8);

      tl.to(containerRef.current, {
        filter: "brightness(1)",
        duration: 0.2,
        ease: "none",
      }, 1.95);

      // Zoom into center
      tl.to(containerRef.current, {
        scale: 8,
        opacity: 0,
        duration: 0.6,
        ease: "power2.in",
      }, 2.1);

    }, containerRef);

    return () => ctx.revert();
  }, [done]);

  useEffect(() => {
    if (done) {
      onComplete();
    }
  }, [done, onComplete]);

  const wordStyle: React.CSSProperties = {
    fontFamily: "'Syncopate', sans-serif",
    fontSize: "clamp(3rem, 13vw, 10rem)",
    fontWeight: 900,
    letterSpacing: "0.07em",
    color: "#fff",
    textTransform: "uppercase",
    lineHeight: 1,
    whiteSpace: "nowrap",
    position: "absolute",
    left: "50%",
    willChange: "transform",
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "#000",
        overflow: "hidden",
        transformOrigin: "center center",
      }}
    >
      {/* Background ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: "-50%",
          background: "radial-gradient(circle at 50% 50%, rgba(51,214,255,0.06) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      {/* Animated grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(51,214,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(51,214,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.5,
          animation: "gridShift 8s linear infinite",
          pointerEvents: "none",
        }}
      />

      {/* Horizontal scan lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.008) 3px, rgba(255,255,255,0.008) 4px)",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* Moving scan line */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg, transparent, rgba(51,214,255,0.4), transparent)",
          animation: "scanMove 3s linear infinite",
          pointerEvents: "none",
          zIndex: 6,
        }}
      />

      {/* TOP HALF */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", overflow: "hidden" }}>
        {Array.from({ length: LAYERS }).map((_, i) => (
          <div
            key={i}
            ref={(el) => { topRefs.current[i] = el; }}
            style={{
              ...wordStyle,
              top: "100%",
              transform: "translateX(-50%)",
              opacity: 1 - i * 0.15,
              ...(i === 0
                ? { color: "#fff", textShadow: "0 0 40px rgba(51,214,255,0.5)" }
                : { color: `rgba(255,255,255,${0.3 - i * 0.05})` }),
            }}
          >
            {i === 0 ? glitchText : "WORKSHOPS"}
          </div>
        ))}
      </div>

      {/* BOTTOM HALF */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", overflow: "hidden" }}>
        {Array.from({ length: LAYERS }).map((_, i) => (
          <div
            key={i}
            ref={(el) => { botRefs.current[i] = el; }}
            style={{
              ...wordStyle,
              bottom: "100%",
              transform: "translateX(-50%) scaleY(-1)",
              opacity: 1 - i * 0.15,
              WebkitMaskImage: "linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 60%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 60%, transparent 100%)",
              ...(i === 0
                ? { textShadow: "0 0 40px rgba(51,214,255,0.3)" }
                : {}),
            }}
          >
            WORKSHOPS
          </div>
        ))}
      </div>

      {/* Center line */}
      <div
        ref={lineRef}
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg, transparent 5%, rgba(51,214,255,0.5) 50%, transparent 95%)",
          transform: "translateY(-1px) scaleX(0)",
          zIndex: 10,
          pointerEvents: "none",
          boxShadow: "0 0 20px rgba(51,214,255,0.3), 0 0 60px rgba(51,214,255,0.1)",
        }}
      />

      {/* Glowing dot at center of line */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "#33d6ff",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 15px #33d6ff, 0 0 40px #33d6ff, 0 0 80px #33d6ff",
          animation: "dotPulse 1.5s ease-in-out infinite",
          zIndex: 11,
          pointerEvents: "none",
        }}
      />

      {/* Corner brackets */}
      {[
        { top: "2rem", left: "2rem", borderTop: "2px solid rgba(51,214,255,0.3)", borderLeft: "2px solid rgba(51,214,255,0.3)" },
        { top: "2rem", right: "2rem", borderTop: "2px solid rgba(51,214,255,0.3)", borderRight: "2px solid rgba(51,214,255,0.3)" },
        { bottom: "2rem", left: "2rem", borderBottom: "2px solid rgba(51,214,255,0.3)", borderLeft: "2px solid rgba(51,214,255,0.3)" },
        { bottom: "2rem", right: "2rem", borderBottom: "2px solid rgba(51,214,255,0.3)", borderRight: "2px solid rgba(51,214,255,0.3)" },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: "40px",
            height: "40px",
            opacity: 0.4,
            animation: `bracketFadeIn 0.8s ease ${i * 0.1}s forwards`,
            ...pos,
          } as React.CSSProperties}
        />
      ))}

      {/* Tagline */}
      <div
        style={{
          position: "absolute",
          bottom: "6rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: "'Syncopate', sans-serif",
            fontSize: "0.6rem",
            letterSpacing: "0.4em",
            color: "rgba(51,214,255,0.5)",
            textTransform: "uppercase",
            opacity: showTagline ? 1 : 0,
            transition: "opacity 1s ease",
          }}
        >
          Engineering the Future
        </span>
      </div>

      {/* Progress indicator */}
      <div
        style={{
          position: "absolute",
          bottom: "3rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: "100px",
            height: "1px",
            background: "rgba(51,214,255,0.15)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: `${Math.min(progress, 100)}%`,
              background: "linear-gradient(90deg, #33d6ff, #33d6ff88)",
              transition: "width 0.1s linear",
              boxShadow: "0 0 10px #33d6ff60",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'Syncopate', sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.15em",
            color: "rgba(51,214,255,0.4)",
            minWidth: "30px",
          }}
        >
          {Math.floor(Math.min(progress, 100))}%
        </span>
      </div>

      <style>{`
        @keyframes gridShift {
          0% { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
        @keyframes scanMove {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes dotPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.8); opacity: 0.4; }
        }
        @keyframes bracketFadeIn {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 0.4; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
