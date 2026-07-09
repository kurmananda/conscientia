"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import useSound from "../hooks/useSound";

const IMAGES = [
  { src: "/tiles/tile-01.jpg", title: "Rocketry", color: "#33d6ff" },
  { src: "/tiles/tile-02.jpg", title: "AI & Machine Learning", color: "#a855f7" },
  { src: "/tiles/tile-03.jpg", title: "Cybersecurity", color: "#22c55e" },
  { src: "/tiles/tile-04.jpg", title: "Robotics", color: "#f97316" },
  { src: "/tiles/tile-05.jpeg", title: "Quantum Computing", color: "#ec4899" },
  { src: "/tiles/tile-06.jpg", title: "Aerospace", color: "#06b6d4" },
  { src: "/tiles/tile-07.jpg", title: "Blockchain", color: "#eab308" },
  { src: "/tiles/tile-08.jpg", title: "IoT & Edge", color: "#14b8a6" },
];

const AUTO_INTERVAL = 2200;
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

function ScrambleText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [display, setDisplay] = useState(text.split("").map(() => "\u00A0").join(""));

  useEffect(() => {
    setDisplay(text.split("").map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join(""));
    const target = text.split("");
    let frame = 0;
    const total = 28;
    const timer = setTimeout(() => {
      const iv = setInterval(() => {
        frame++;
        const p = frame / total;
        setDisplay(target.map((c, i) => {
          if (c === " ") return " ";
          if (p > (i / target.length) * 0.6 + 0.35) return c;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join(""));
        if (frame >= total) { clearInterval(iv); setDisplay(text); }
      }, 35);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay]);

  return <span>{display}</span>;
}

export default function HeroGallery() {
  const [active, setActive] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [hovered, setHovered] = useState<number | null>(null);
  const [isCenterHovered, setIsCenterHovered] = useState(false);
  const [paused, setPaused] = useState(false);
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCardRef = useRef<HTMLDivElement>(null);

  const playGlitch = useSound("/sounds/glitch.wav", 0.2, 0.15);
  const playClick = useSound("/sounds/click.mp3", 0.25, 0.08);
  const playWhoosh = useSound("/sounds/whoosh.mp3", 0.85);
  const playTapGallery = useSound("/sounds/tapgallery.mp3", 0.3, undefined, true);
  const playTap = useSound("/sounds/tap.mp3", 0.3, undefined, true);

  const goTo = useCallback((index: number) => {
    setActive(Math.max(0, Math.min(IMAGES.length - 1, index)));
  }, []);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % IMAGES.length);
  }, []);

  const prev = useCallback(() => {
    setActive((prev) => (prev - 1 + IMAGES.length) % IMAGES.length);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (paused || isDragging) return;
    const timer = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(timer);
  }, [paused, isDragging, next]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      setDragX(e.clientX - startX.current);
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    if (dragX < -80) { next(); playWhoosh(); }
    else if (dragX > 80) { prev(); playWhoosh(); }
    setDragX(0);
  }, [dragX, next, prev, playWhoosh]);

  // Mouse position for ambient light + card tilt
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
      // Card-specific tilt
      if (activeCardRef.current) {
        const rect = activeCardRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const tx = ((e.clientX - cx) / (rect.width / 2)) * 6;
        const ty = ((e.clientY - cy) / (rect.height / 2)) * -6;
        setCardTilt({ x: ty, y: tx });
      }
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, prev]);

  // Wheel to navigate
  useEffect(() => {
    let cooldown = false;
    const handleWheel = (e: WheelEvent) => {
      if (cooldown) return;
      if (Math.abs(e.deltaX) > 30 || Math.abs(e.deltaY) > 30) {
        cooldown = true;
        if (e.deltaX > 0 || e.deltaY > 0) next();
        else prev();
        setTimeout(() => { cooldown = false; }, 600);
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [next, prev]);

  const particles = React.useMemo(
    () =>
      Array.from({ length: 30 }).map(() => ({
        w: 1 + Math.random() * 3,
        h: 1 + Math.random() * 3,
        left: Math.random() * 100,
        top: Math.random() * 100,
        dur: 4 + Math.random() * 10,
        delay: Math.random() * 6,
        drift: -15 + Math.random() * 30,
      })),
    []
  );

  const activeColor = IMAGES[active].color;

  const getSlideStyle = (i: number): React.CSSProperties => {
    const offset = i - active;
    const absOffset = Math.abs(offset);
    const isHovered = hovered === i && absOffset > 0 && absOffset <= 2;

    const angleStep = 72;
    const radius = 180;
    const dragAngle = isDragging ? dragX * 0.06 : 0;
    const angle = offset * angleStep + dragAngle;

    const hoverZ = isHovered ? 50 : 0;
    const scale = isHovered ? 1.15 : Math.max(0.2, 1 - absOffset * 0.3);
    const opacity = absOffset > 2 ? 0 : Math.max(0.05, 1 - absOffset * 0.4);

    return {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: "clamp(280px, 40vw, 500px)",
      height: "clamp(350px, 55vh, 600px)",
      WebkitMaskImage: "radial-gradient(ellipse 100% 94% at 50% 50%, black 72%, transparent 100%)",
      maskImage: "radial-gradient(ellipse 100% 94% at 50% 50%, black 72%, transparent 100%)",
      transform: `translateX(-50%) translateY(-50%) rotateY(${angle}deg) translateZ(${radius + hoverZ}px) scale(${scale})`,
      transformStyle: "preserve-3d",
      transition: isDragging ? "none" : "transform 0.55s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.5s ease",
      opacity,
      zIndex: isHovered ? 9 : 10 - absOffset,
      borderRadius: "0px",
      overflow: "hidden",
      cursor: isDragging ? "grabbing" : "grab",
      pointerEvents: absOffset <= 2 ? "auto" : "none",
    };
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        perspective: "800px",
        background: "#000",
        userSelect: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* ── Animated background gradient ───────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: "-30%",
          background: `radial-gradient(ellipse at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${activeColor}18 0%, transparent 45%)`,
          transition: "background 0.6s ease",
          pointerEvents: "none",
        }}
      />

      {/* ── Secondary ambient glow ─────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          background: `radial-gradient(circle at ${100 - mousePos.x * 100}% ${100 - mousePos.y * 100}%, ${activeColor}08 0%, transparent 40%)`,
          transition: "background 0.8s ease",
          pointerEvents: "none",
        }}
      />

      {/* ── Grid pattern (animated offset) ─────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${activeColor}04 1px, transparent 1px),
            linear-gradient(90deg, ${activeColor}04 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          backgroundPosition: `${mousePos.x * 20}px ${mousePos.y * 20}px`,
          pointerEvents: "none",
          opacity: 0.6,
        }}
      />

      {/* ── Floating particles ─────────────────────────────── */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: `${p.w}px`,
            height: `${p.h}px`,
            borderRadius: "50%",
            background: i % 3 === 0 ? activeColor : `${activeColor}60`,
            opacity: 0.15 + (i % 5) * 0.06,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animation: `floatGallery ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* ── Horizontal scan line ───────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${activeColor}30, transparent)`,
          animation: "scanLine 6s linear infinite",
          pointerEvents: "none",
          zIndex: 15,
        }}
      />

      {/* ── Main Gallery Title ──────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "4vh",
          left: 0,
          right: 0,
          zIndex: 25,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        {/* Top line accent */}
        <div
          style={{
            width: "120px",
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${activeColor}, transparent)`,
            marginBottom: "1rem",
            boxShadow: `0 0 20px ${activeColor}60`,
            animation: "titleLineExpand 1s ease forwards",
          }}
        />

        {/* Subtitle label */}
        <div
          className="digital-interference digital-flicker"
          style={{
            fontFamily: "var(--font-display), sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.5em",
            color: `${activeColor}aa`,
            textTransform: "uppercase",
            marginBottom: "0.6rem",
          }}
        >
          <span className="glitch-text" data-text="Conscientia 2025 Showcase">
            Conscientia 2025 Showcase
          </span>
        </div>

        {/* Main title */}
        <div
          style={{
            fontFamily: "'Black Mustang', sans-serif",
            fontSize: "clamp(2rem, 6vw, 4.5rem)",
            fontWeight: 400,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#fff",
            textShadow: `0 0 40px ${activeColor}60, 0 0 80px ${activeColor}30`,
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          <span className="digital-interference scanline-sweep digital-flicker" style={{ position: "relative" }}>
            <span className="glitch-text" data-text="Previous Workshops">
              <ScrambleText text="Previous Workshops" delay={200} />
            </span>
          </span>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "1rem",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "1px",
              background: `linear-gradient(90deg, transparent, ${activeColor}80)`,
            }}
          />
          <div
            className="digital-flicker"
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: activeColor,
              boxShadow: `0 0 12px ${activeColor}, 0 0 24px ${activeColor}60`,
              animation: "glowPulse 2s ease-in-out infinite",
            }}
          />
          <div
            style={{
              width: "40px",
              height: "1px",
              background: `linear-gradient(90deg, ${activeColor}80, transparent)`,
            }}
          />
        </div>

        {/* Year badges */}
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            marginTop: "0.8rem",
            fontFamily: "var(--font-display), sans-serif",
            fontSize: "0.5rem",
            letterSpacing: "0.3em",
            color: `${activeColor}66`,
            textTransform: "uppercase",
          }}
        >
          <span className="digital-flicker" style={{ opacity: 0.5 }}>
            <span className="glitch-text" data-text="2023">2023</span>
          </span>
          <span style={{ color: activeColor, opacity: 0.8 }}>
            <span className="glitch-text" data-text="2024">2024</span>
          </span>
          <span className="digital-flicker" style={{ opacity: 0.5 }}>
            <span className="glitch-text" data-text="2025">2025</span>
          </span>
        </div>
      </div>

      {/* ── Slides ─────────────────────────────────────────── */}
      {IMAGES.map((img, i) => {
        const isActive = i === active;
        return (
          <div
            key={i}
            ref={isActive ? activeCardRef : undefined}
            style={{
              ...getSlideStyle(i),
              ...(isActive ? {
                transform: isCenterHovered
                  ? `translateX(-50%) translateY(-50%) rotateY(${isDragging ? dragX * 0.06 : 0}deg) translateZ(210px) rotateX(${cardTilt.x * 0.5}deg) rotateY(${cardTilt.y * 0.5}deg) scale(1.12)`
                  : `translateX(-50%) translateY(-50%) rotateY(${isDragging ? dragX * 0.06 : 0}deg) translateZ(190px) rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg) scale(1)`,
                transition: isCenterHovered
                  ? "transform 0.4s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s ease"
                  : "transform 0.5s cubic-bezier(0.23,1,0.32,1), box-shadow 0.5s ease",
              } : {}),
            }}
            onMouseEnter={() => { 
              setHovered(i); 
              setPaused(true); 
              if (isActive) {
                setIsCenterHovered(true);
                playTapGallery();
              } else {
                playGlitch();
              }
            }}
            onMouseLeave={() => { 
              setHovered(null); 
              setPaused(false); 
              if (isActive) setIsCenterHovered(false); 
            }}
            onClick={() => { 
              if (!isDragging && Math.abs(dragX) < 5) { 
                goTo(i); 
                if (!isActive) playTap();
                else { playClick(); playWhoosh(); }
              } 
            }}
          >
            {/* ── Animated gradient border ──────────────────── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "0px",
                padding: "2px",
                background: isActive
                  ? `conic-gradient(from ${(Date.now() / 20) % 360}deg, ${img.color}00, ${img.color}88, ${img.color}00, ${img.color}55, ${img.color}00)`
                  : `linear-gradient(135deg, ${img.color}20, transparent 50%, ${img.color}10)`,
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                pointerEvents: "none",
                opacity: isActive ? 1 : 0.3,
                transition: "opacity 0.4s ease",
                zIndex: 1,
              }}
            />

            {/* ── Card glow ────────────────────────────────── */}
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  inset: "-4px",
                  borderRadius: "24px",
                  background: `radial-gradient(ellipse at 50% 80%, ${img.color}40 0%, transparent 60%)`,
                  opacity: 0.8,
                  filter: "blur(20px)",
                  pointerEvents: "none",
                  zIndex: -1,
                  animation: "glowPulse 3s ease-in-out infinite alternate",
                }}
              />
            )}

            <Image
              src={img.src}
              alt={img.title}
              fill
              sizes="500px"
              style={{ objectFit: "cover", borderRadius: "20px" }}
              draggable={false}
            />

            {/* ── Holographic sheen (active only) ──────────── */}
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "20px",
                  background: `linear-gradient(135deg, transparent 20%, ${img.color}15 40%, transparent 50%, ${img.color}10 70%, transparent 80%)`,
                  backgroundSize: "200% 200%",
                  animation: "holoSheen 4s ease-in-out infinite",
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              />
            )}

            {/* ── Curvature overlay (convex cylinder) ──────── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "20px",
                background: isActive
                  ? `linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 20%, rgba(255,255,255,0.06) 48%, rgba(255,255,255,0.04) 52%, transparent 80%, rgba(0,0,0,0.35) 100%)`
                  : `linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 18%, transparent 50%, transparent 82%, rgba(0,0,0,0.4) 100%)`,
                pointerEvents: "none",
                zIndex: 2,
              }}
            />

            {/* ── Top vignette ─────────────────────────────── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "20px",
                background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 35%)",
                pointerEvents: "none",
                zIndex: 3,
              }}
            />

            {/* ── Bottom gradient ──────────────────────────── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "20px",
                background: `linear-gradient(to top, ${img.color}40 0%, transparent 50%)`,
                pointerEvents: "none",
                zIndex: 3,
              }}
            />

            {/* ── Scan lines ───────────────────────────────── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "20px",
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)",
                pointerEvents: "none",
                zIndex: 4,
              }}
            />

            {/* ── Corner brackets (active only) ────────────── */}
            {isActive && [
              { top: "10px", left: "10px", borderTop: `2px solid ${img.color}`, borderLeft: `2px solid ${img.color}` },
              { top: "10px", right: "10px", borderTop: `2px solid ${img.color}`, borderRight: `2px solid ${img.color}` },
              { bottom: "10px", left: "10px", borderBottom: `2px solid ${img.color}`, borderLeft: `2px solid ${img.color}` },
              { bottom: "10px", right: "10px", borderBottom: `2px solid ${img.color}`, borderRight: `2px solid ${img.color}` },
            ].map((pos, j) => (
              <div
                key={j}
                style={{
                  position: "absolute",
                  width: "24px",
                  height: "24px",
                  opacity: 0.5,
                  animation: `bracketFade 0.4s ease ${j * 0.08}s forwards`,
                  ...pos,
                } as React.CSSProperties}
              />
            ))}

            {/* ── Title overlay ────────────────────────────── */}
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  bottom: "2rem",
                  left: "1.5rem",
                  right: "1.5rem",
                  zIndex: 10,
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Black Mustang', sans-serif",
                    fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
                    fontWeight: 400,
                    color: "#fff",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    textShadow: `0 2px 20px rgba(0,0,0,0.5), 0 0 40px ${img.color}50`,
                    margin: 0,
                    animation: "titleSlide 0.5s ease forwards",
                    fontStyle: "italic",
                    transform: "skewX(-1deg)",
                  }}
                >
                  <span className="digital-interference scanline-sweep digital-flicker" style={{ position: "relative" }}>
                    <span className="glitch-text" data-text={img.title}>{img.title}</span>
                  </span>
                </h2>
                <div
                  style={{
                    width: "0px",
                    height: "2px",
                    background: `linear-gradient(90deg, ${img.color}, transparent)`,
                    marginTop: "0.5rem",
                    boxShadow: `0 0 20px ${img.color}80`,
                    animation: "lineExpand 0.6s ease 0.2s forwards",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* ── Image Counter Below Slide ──────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "10rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          fontFamily: 'var(--font-display), sans-serif',
          fontSize: "0.75rem",
          letterSpacing: "0.25em",
          color: `${activeColor}aa`,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          pointerEvents: "none",
        }}
      >
        <div style={{ width: "30px", height: "1px", background: `${activeColor}40` }} />
        <span style={{ fontWeight: 700, color: activeColor }}>
          {String(active + 1).padStart(2, "0")}
        </span>
        <span style={{ opacity: 0.3 }}>/</span>
        <span style={{ opacity: 0.5 }}>{String(IMAGES.length).padStart(2, "0")}</span>
        <div style={{ width: "30px", height: "1px", background: `${activeColor}40` }} />
      </div>

      {/* ── Controls bar ───────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "6rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          zIndex: 20,
          padding: "12px 28px",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(16px)",
          borderRadius: "50px",
          border: `1px solid ${activeColor}30`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 ${activeColor}15`,
        perspective: "650px",
        }}
      >
        {/* Left arrow */}
        <button
          onClick={() => { prev(); playClick(); }}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: `1.5px solid ${activeColor}55`,
            background: `linear-gradient(135deg, ${activeColor}15, rgba(0,0,0,0.5))`,
            color: activeColor,
            fontSize: "1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
            boxShadow: `0 4px 15px ${activeColor}20, inset 0 1px 0 rgba(255,255,255,0.05)`,
            flexShrink: 0,
            transformStyle: "preserve-3d",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            playGlitch();
            e.currentTarget.style.transform = "translateZ(15px) scale(1.12) rotate(-5deg)";
            e.currentTarget.style.background = `linear-gradient(135deg, ${activeColor}40, ${activeColor}15)`;
            e.currentTarget.style.borderColor = activeColor;
            e.currentTarget.style.boxShadow = `0 8px 30px ${activeColor}50, 0 0 40px ${activeColor}30, inset 0 1px 0 rgba(255,255,255,0.15)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateZ(0) scale(1) rotate(0deg)";
            e.currentTarget.style.background = `linear-gradient(135deg, ${activeColor}15, rgba(0,0,0,0.5))`;
            e.currentTarget.style.borderColor = `${activeColor}55`;
            e.currentTarget.style.boxShadow = `0 4px 15px ${activeColor}20, inset 0 1px 0 rgba(255,255,255,0.05)`;
          }}
        >
          <span style={{ transition: "transform 0.3s ease" }}>&#8592;</span>
        </button>

        {/* Dots */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {IMAGES.map((img, i) => {
            const isActive = i === active;
            return (
              <button
                key={i}
                onClick={() => { goTo(i); playClick(); }}
                style={{
                  width: isActive ? "32px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: isActive
                    ? `linear-gradient(90deg, ${img.color}, ${img.color}cc)`
                    : "rgba(255,255,255,0.15)",
                  border: isActive ? `1px solid ${img.color}88` : "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
                  boxShadow: isActive
                    ? `0 0 12px ${img.color}60, 0 0 24px ${img.color}30, inset 0 1px 0 rgba(255,255,255,0.2)`
                    : "none",
                  transform: isActive ? "scaleY(1.3)" : "scaleY(1)",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  playGlitch();
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                    e.currentTarget.style.transform = "scaleY(1.3) scaleX(1.2)";
                    e.currentTarget.style.boxShadow = `0 0 8px ${img.color}30`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                    e.currentTarget.style.transform = "scaleY(1) scaleX(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              />
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => { next(); playClick(); }}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: `1.5px solid ${activeColor}55`,
            background: `linear-gradient(135deg, ${activeColor}15, rgba(0,0,0,0.5))`,
            color: activeColor,
            fontSize: "1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
            boxShadow: `0 4px 15px ${activeColor}20, inset 0 1px 0 rgba(255,255,255,0.05)`,
            flexShrink: 0,
            transformStyle: "preserve-3d",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            playGlitch();
            e.currentTarget.style.transform = "translateZ(15px) scale(1.12) rotate(5deg)";
            e.currentTarget.style.background = `linear-gradient(135deg, ${activeColor}40, ${activeColor}15)`;
            e.currentTarget.style.borderColor = activeColor;
            e.currentTarget.style.boxShadow = `0 8px 30px ${activeColor}50, 0 0 40px ${activeColor}30, inset 0 1px 0 rgba(255,255,255,0.15)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateZ(0) scale(1) rotate(0deg)";
            e.currentTarget.style.background = `linear-gradient(135deg, ${activeColor}15, rgba(0,0,0,0.5))`;
            e.currentTarget.style.borderColor = `${activeColor}55`;
            e.currentTarget.style.boxShadow = `0 4px 15px ${activeColor}20, inset 0 1px 0 rgba(255,255,255,0.05)`;
          }}
        >
          <span style={{ transition: "transform 0.3s ease" }}>&#8594;</span>
        </button>
      </div>

      {/* ── Progress bar ───────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "4rem",
          left: "50%",
          transform: "translateX(-50%)",
          width: "200px",
          height: "2px",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "1px",
          zIndex: 20,
        }}
      >
        <div
          key={active}
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${activeColor}, ${activeColor}88)`,
            boxShadow: `0 0 12px ${activeColor}80, 0 0 30px ${activeColor}30`,
            animation: paused ? "none" : `progressFill ${AUTO_INTERVAL}ms linear`,
          }}
        />
      </div>

      {/* ── Slide counter ──────────────────────────────────── */}
      <div
        className="digital-interference digital-flicker"
        style={{
          position: "absolute",
          top: "50%",
          right: "2rem",
          transform: "translateY(-50%)",
          zIndex: 20,
          fontFamily: 'var(--font-display), sans-serif',
          fontSize: "0.7rem",
          letterSpacing: "0.2em",
          color: `${activeColor}aa`,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span className="glitch-text" data-text={String(active + 1).padStart(2, "0")} style={{ fontSize: "1.8rem", color: activeColor, fontWeight: 700 }}>
          {String(active + 1).padStart(2, "0")}
        </span>
        <span style={{ opacity: 0.3, fontSize: "0.8rem" }}>/</span>
        <span style={{ opacity: 0.5, fontSize: "0.8rem" }}>{String(IMAGES.length).padStart(2, "0")}</span>
      </div>

      <style>{`
        @keyframes floatGallery {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.15; }
          100% { transform: translateY(-25px) translateX(12px); opacity: 0.4; }
        }
        @keyframes progressFill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes scanLine {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes glowPulse {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 0.9; transform: scale(1.05); }
        }
        @keyframes holoSheen {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
        @keyframes bracketFade {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 0.5; transform: scale(1); }
        }
        @keyframes titleSlide {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineExpand {
          0% { width: 0px; }
          100% { width: 50px; }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes titleLineExpand {
          0% { width: 0px; opacity: 0; }
          100% { width: 120px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
