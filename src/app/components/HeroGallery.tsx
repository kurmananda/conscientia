"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";

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

export default function HeroGallery() {
  const [active, setActive] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [hovered, setHovered] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCardRef = useRef<HTMLDivElement>(null);

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
    if (dragX < -80) next();
    else if (dragX > 80) prev();
    setDragX(0);
  }, [dragX, next, prev]);

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
    const effectiveOffset = isHovered ? Math.sign(offset) * 0.5 : offset;

    const translateX = effectiveOffset * 42 + (isDragging ? dragX * 0.3 : 0);
    const translateZ = isHovered ? -30 : -absOffset * 120;
    const rotateY = effectiveOffset * -8;
    const scale = isHovered ? 0.92 : 1 - absOffset * 0.12;
    const opacity = absOffset > 2 ? 0 : 1 - absOffset * 0.25;

    return {
      position: "absolute",
      left: "50%",
      top: "42%",
      width: "clamp(280px, 40vw, 500px)",
      height: "clamp(350px, 55vh, 600px)",
      transform: `translateX(calc(-50% + ${translateX}vw)) translateY(-50%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      transformStyle: "preserve-3d",
      transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.5s ease",
      opacity,
      zIndex: isHovered ? 9 : 10 - absOffset,
      borderRadius: "20px",
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
        perspective: "1200px",
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
                transform: `translateX(calc(-50% + ${isDragging ? dragX * 0.3 : 0}vw)) translateY(-50%) translateZ(10px) rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg) scale(1)`,
              } : {}),
            }}
            onMouseEnter={() => { setHovered(i); setPaused(true); }}
            onMouseLeave={() => { setHovered(null); setPaused(false); }}
          >
            {/* ── Animated gradient border ──────────────────── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "20px",
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

            {/* ── Top vignette ─────────────────────────────── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "20px",
                background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 35%)",
                pointerEvents: "none",
                zIndex: 2,
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
                zIndex: 2,
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
                zIndex: 3,
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
                    fontFamily: "'Syncopate', sans-serif",
                    fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    textShadow: `0 2px 20px rgba(0,0,0,0.5), 0 0 40px ${img.color}50`,
                    margin: 0,
                    animation: "titleSlide 0.5s ease forwards",
                  }}
                >
                  {img.title}
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
                <span
                  style={{
                    fontFamily: "'Syncopate', sans-serif",
                    fontSize: "0.6rem",
                    letterSpacing: "0.25em",
                    color: `${img.color}cc`,
                    textTransform: "uppercase",
                    marginTop: "0.4rem",
                    display: "block",
                    opacity: 0,
                    animation: "fadeInUp 0.5s ease 0.3s forwards",
                  }}
                >
                  Workshop {String(active + 1).padStart(2, "0")} / {String(IMAGES.length).padStart(2, "0")}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Controls bar ───────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          zIndex: 20,
          padding: "10px 20px",
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(12px)",
          borderRadius: "40px",
          border: `1px solid ${activeColor}20`,
        }}
      >
        <button
          onClick={prev}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: `1px solid ${activeColor}44`,
            background: "rgba(0,0,0,0.4)",
            color: activeColor,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
            boxShadow: `0 0 12px ${activeColor}15`,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${activeColor}33`;
            e.currentTarget.style.boxShadow = `0 0 25px ${activeColor}40`;
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.4)";
            e.currentTarget.style.boxShadow = `0 0 12px ${activeColor}15`;
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          &#8592;
        </button>

        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {IMAGES.map((img, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === active ? "24px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background: i === active ? img.color : "rgba(255,255,255,0.2)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                boxShadow: i === active ? `0 0 14px ${img.color}80` : "none",
                transform: i === active ? "scaleY(1.2)" : "scaleY(1)",
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: `1px solid ${activeColor}44`,
            background: "rgba(0,0,0,0.4)",
            color: activeColor,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
            boxShadow: `0 0 12px ${activeColor}15`,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${activeColor}33`;
            e.currentTarget.style.boxShadow = `0 0 25px ${activeColor}40`;
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.4)";
            e.currentTarget.style.boxShadow = `0 0 12px ${activeColor}15`;
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          &#8594;
        </button>
      </div>

      {/* ── Progress bar ───────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "rgba(255,255,255,0.05)",
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
        style={{
          position: "absolute",
          top: "2rem",
          right: "2rem",
          zIndex: 20,
          fontFamily: "'Syncopate', sans-serif",
          fontSize: "0.7rem",
          letterSpacing: "0.2em",
          color: `${activeColor}aa`,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "1.2rem", color: activeColor, fontWeight: 700 }}>
          {String(active + 1).padStart(2, "0")}
        </span>
        <span style={{ opacity: 0.4 }}>/</span>
        <span style={{ opacity: 0.5 }}>{String(IMAGES.length).padStart(2, "0")}</span>
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
      `}</style>
    </div>
  );
}
