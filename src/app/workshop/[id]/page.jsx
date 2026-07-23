"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import TimeFallScene from "@/app/components/TimeFallScene";
import { workshopCards } from "@/app/workshop/workshopData";
import useSound from "@/app/hooks/useSound";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/* ── Digital Interference Text Wrapper ─────────────────────── */
function InterferenceText({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={`digital-interference scanline-sweep digital-flicker ${className}`} style={{ ...style, position: "relative" }}>
      <span className="glitch-text" data-text={typeof children === "string" ? children : ""}>
        {children}
      </span>
    </span>
  );
}

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function ScrambleText({ text, color, delay = 0 }: { text: string; color: string; delay?: number }) {
  const [display, setDisplay] = useState(text.split("").map(() => "\u00A0").join(""));

  useEffect(() => {
    setDisplay(text.split("").map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join(""));
    const target = text.split("");
    let frame = 0;
    const total = 22;
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
      }, 40);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay]);

  return <span style={{ color }}>{display}</span>;
}

function CinematicBox({
  title,
  accentColor,
  glowColor,
  children,
  delay = 0,
}: {
  title: string;
  accentColor: string;
  glowColor: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const { ref, visible } = useReveal(0.05);
  const boxRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const playGlass = useSound("/sounds/glass.mp3", 0.05);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const handle = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
      });
    };
    window.addEventListener("mousemove", handle, { passive: true });
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  const tx = (mousePos.y - 0.5) * 3;
  const ty = (mousePos.x - 0.5) * -3;

  return (
    <div ref={ref}>
      <div
        ref={boxRef}
        className="cinematic-box"
        onMouseEnter={() => { playGlass(); setHovered(true); }}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          borderRadius: "24px",
          overflow: "visible",
          padding: "2.5rem",
          opacity: visible ? 1 : 0,
          transform: visible
            ? hovered
              ? `perspective(1200px) rotateX(${tx * 0.5}deg) rotateY(${ty * 0.5}deg) translateY(-12px) scale(1.03) translateZ(30px)`
              : `perspective(1200px) rotateX(${tx}deg) rotateY(${ty}deg) translateY(0) scale(1)`
            : `perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(50px) scale(0.9)`,
          clipPath: visible ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
          transition: visible
            ? hovered
              ? "transform 0.4s cubic-bezier(0.23,1,0.32,1), opacity 0.8s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s ease, clip-path 1s cubic-bezier(0.23,1,0.32,1)"
              : "transform 0.5s cubic-bezier(0.23,1,0.32,1), opacity 0.8s cubic-bezier(0.23,1,0.32,1), box-shadow 0.5s ease, clip-path 1s cubic-bezier(0.23,1,0.32,1)"
            : "transform 0.12s ease-out, opacity 0.3s ease-in, clip-path 0.3s ease-in",
          willChange: "transform, opacity",
          background: `linear-gradient(135deg, ${accentColor}25 0%, rgba(0,0,0,0.88) 50%, ${accentColor}18 100%)`,
          backgroundSize: "200% 200%",
          animation: visible ? "boxGradientShift 4s ease-in-out infinite alternate" : "none",
          border: `1px solid ${hovered ? accentColor + "99" : accentColor + "55"}`,
          boxShadow: hovered
            ? `0 20px 60px ${accentColor}40, 0 0 40px ${accentColor}20, inset 0 1px 0 rgba(255,255,255,0.1)`
            : `0 4px 20px ${accentColor}15`,
        }}
      >
        {/* Animated border */}
        <div
          style={{
            position: "absolute",
            top: "-2px",
            left: "-2px",
            right: "-2px",
            bottom: "-2px",
            borderRadius: "26px",
            padding: "1.5px",
            background: `conic-gradient(from ${(mousePos.x * 360)}deg, ${accentColor}00, ${accentColor}55, ${accentColor}00, ${accentColor}33, ${accentColor}00)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            pointerEvents: "none",
            opacity: 0.85,
          }}
        />

        {/* Ambient glow — broad */}
        <div
          style={{
            position: "absolute",
            inset: "-50%",
            background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${glowColor} 0%, transparent 40%)`,
            opacity: visible ? 0.2 : 0,
            transition: "opacity 1.5s ease",
            pointerEvents: "none",
          }}
        />

        {/* Mouse spotlight — tight, bright */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle 180px at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${accentColor}50 0%, ${accentColor}20 30%, transparent 70%)`,
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s ease",
            pointerEvents: "none",
            borderRadius: "24px",
          }}
        />

        {/* Mouse edge highlight */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle 100px at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
            opacity: visible ? 1 : 0,
            pointerEvents: "none",
            borderRadius: "24px",
          }}
        />

        {/* Grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${accentColor}08 1px, transparent 1px), linear-gradient(90deg, ${accentColor}08 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            backgroundPosition: `${mousePos.x * 30}px ${mousePos.y * 30}px`,
            pointerEvents: "none",
            borderRadius: "24px",
          }}
        />

        {/* Scan lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.01) 3px, rgba(255,255,255,0.01) 4px)",
            pointerEvents: "none",
            borderRadius: "24px",
          }}
        />

        {/* Pulse glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "24px",
            boxShadow: `inset 0 0 60px ${accentColor}0a, inset 0 0 120px ${accentColor}06`,
            animation: visible ? "boxPulse 4s ease-in-out infinite alternate" : "none",
            pointerEvents: "none",
          }}
        />

        {/* Floating particles */}
        {visible && Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              borderRadius: "50%",
              background: accentColor,
              opacity: 0.2,
              left: `${(i * 13.7) % 100}%`,
              top: `${(i * 17.3) % 100}%`,
              animation: `floatBox ${5 + (i % 3)}s ease-in-out ${i * 0.5}s infinite alternate`,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Corner brackets */}
        {[
          { top: "10px", left: "10px", borderTop: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}` },
          { top: "10px", right: "10px", borderTop: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}` },
          { bottom: "10px", left: "10px", borderBottom: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}` },
          { bottom: "10px", right: "10px", borderBottom: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}` },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "22px",
              height: "22px",
              opacity: visible ? 0.5 : 0,
              transition: `opacity 0.5s ease ${delay + 0.3 + i * 0.08}s`,
              ...pos,
            } as React.CSSProperties}
          />
        ))}

        {/* Title */}
        {title && (
          <div style={{ position: "relative", zIndex: 2, marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <div
                style={{
                  width: visible ? "40px" : "0px",
                  height: "2px",
                  background: `linear-gradient(90deg, ${accentColor}, transparent)`,
                  transition: `width 0.6s ease ${delay + 0.2}s`,
                  boxShadow: `0 0 12px ${accentColor}60`,
                }}
              />
              <h2
                style={{
                  fontFamily: "'Rubik Glitch', sans-serif",
                  fontSize: "1rem",
                  fontWeight: 400,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  margin: 0,
                  textShadow: `0 0 30px ${glowColor}`,
                }}
              >
                <InterferenceText>
                  <ScrambleText text={title} color={accentColor} delay={delay * 1000 + 200} />
                </InterferenceText>
              </h2>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function WorkshopDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const card = workshopCards.find((c) => c.id === id);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const playGlitch = useSound("/sounds/glitch.wav", 0.2, 0.15);
  const playClick = useSound("/sounds/click.mp3", 0.25, 0.08);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener("mousemove", handle, { passive: true });
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  if (!card) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Workshop Not Found</h1>
          <Link href="/workshop" className="text-cyan-400 hover:underline">
            Back to Workshops
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", color: "#fff" }}>
      {/* Ambient background music — loops while on this page */}


      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: -10 }}>
        <TimeFallScene />
      </div>

      {/* Ambient gradient */}
      <div
        style={{
          position: "fixed",
          inset: "-30%",
          background: `radial-gradient(ellipse at ${mousePos.x * 100}% ${mousePos.y * 100}%, ${card.accentColor}12 0%, transparent 45%)`,
          transition: "background 0.6s ease",
          pointerEvents: "none",
          zIndex: -5,
        }}
      />

      {/* Back button */}
      <div style={{ position: "fixed", bottom: "1.5rem", left: "1.5rem", zIndex: 50, perspective: "600px" }}>
        <Link
          href="/workshop"
          onClick={() => playClick()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.7rem 1.5rem",
            borderRadius: "40px",
            border: `1.5px solid ${card.accentColor}55`,
            background: `linear-gradient(135deg, ${card.accentColor}18, rgba(0,0,0,0.6))`,
            backdropFilter: "blur(16px)",
            color: card.accentColor,
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textDecoration: "none",
            transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
            boxShadow: `0 4px 20px ${card.accentColor}20, inset 0 1px 0 rgba(255,255,255,0.05)`,
            transformStyle: "preserve-3d",
            fontStyle: "italic",
            textTransform: "uppercase",
            fontFamily: 'var(--font-display), sans-serif',
          }}
          onMouseEnter={(e) => {
            playGlitch();
            e.currentTarget.style.transform = "translateZ(20px) scale(1.06) translateX(-6px)";
            e.currentTarget.style.background = `linear-gradient(135deg, ${card.accentColor}40, ${card.accentColor}15)`;
            e.currentTarget.style.borderColor = card.accentColor;
            e.currentTarget.style.boxShadow = `0 10px 40px ${card.accentColor}50, 0 0 50px ${card.accentColor}25, inset 0 1px 0 rgba(255,255,255,0.15)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateZ(0) scale(1) translateX(0)";
            e.currentTarget.style.background = `linear-gradient(135deg, ${card.accentColor}18, rgba(0,0,0,0.6))`;
            e.currentTarget.style.borderColor = `${card.accentColor}55`;
            e.currentTarget.style.boxShadow = `0 4px 20px ${card.accentColor}20, inset 0 1px 0 rgba(255,255,255,0.05)`;
          }}
        >
          <span style={{ transition: "transform 0.3s ease", display: "inline-block" }}>&larr;</span>
          <span>Back to Workshops</span>
        </Link>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>
        {/* ── Hero Header ──────────────────────────────────── */}
        <div style={{ marginBottom: "3rem" }}>
          <CinematicBox title="" accentColor={card.accentColor} glowColor={card.glowColor} delay={0}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "2rem" }}>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.3rem 0.9rem",
                    borderRadius: "20px",
                    background: `${card.accentColor}22`,
                    color: card.accentColor,
                    border: `1px solid ${card.accentColor}55`,
                    fontFamily: 'var(--font-display), sans-serif',
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginBottom: "1rem",
                  }}
                >
                  <InterferenceText>{card.type}</InterferenceText>
                </span>
                <h1
                  style={{
                    fontFamily: 'Black Mustang, sans-serif',
                    fontSize: "clamp(1.8rem, 4.5vw, 3.2rem)",
                    fontWeight: 400,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    margin: 0,
                    textShadow: `0 0 40px ${card.glowColor}, 0 0 80px ${card.glowColor}44`,
                    lineHeight: 1.2,
                    fontStyle: "italic",
                    transform: "skewX(-1deg)",
                  }}
                >
                  <InterferenceText>
                    <ScrambleText text={card.title} color="#fff" delay={300} />
                  </InterferenceText>
                </h1>
                <p style={{
                  marginTop: "0.8rem",
                  fontSize: "0.9rem",
                  fontFamily: "var(--font-body), sans-serif",
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.04em",
                  lineHeight: 1.6,
                  fontStyle: "italic",
                  transform: "skewX(-0.5deg)",
                }}>
                  {card.subtitle}
                </p>
              </div>
              <div
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "20px",
                  background: `${card.accentColor}18`,
                  border: `1px solid ${card.accentColor}44`,
                  boxShadow: `0 0 40px ${card.accentColor}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  flexShrink: 0,
                }}
              >
                {card.badgeIcon}
              </div>
            </div>
          </CinematicBox>
        </div>

        {/* ── Two Column Layout ────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem", alignItems: "start" }}
          className="workshop-detail-grid"
        >
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Image */}
            <CinematicBox title="" accentColor={card.accentColor} glowColor={card.glowColor} delay={0.1}>
              <div style={{ borderRadius: "16px", overflow: "hidden", margin: "-2.5rem", width: "calc(100% + 5rem)", height: "300px", position: "relative" }}>
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="100vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </CinematicBox>

            {/* About */}
            <CinematicBox title="About This Workshop" accentColor={card.accentColor} glowColor={card.glowColor} delay={0.2}>
              <p style={{
                lineHeight: 1.9,
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.9rem",
                fontFamily: "var(--font-body), sans-serif",
                letterSpacing: "0.04em",
                fontStyle: "italic",
                transform: "skewX(-0.3deg)",
              }}>
                {card.description}
              </p>
              <p style={{
                lineHeight: 1.9,
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.9rem",
                fontFamily: "var(--font-body), sans-serif",
                letterSpacing: "0.04em",
                marginTop: "1rem",
                fontStyle: "italic",
                transform: "skewX(-0.3deg)",
              }}>
                This immersive workshop provides hands-on experience with industry-standard tools and methodologies. Participants will work on real-world projects and receive a certificate of completion.
              </p>
              <p style={{
                lineHeight: 1.9,
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.9rem",
                fontFamily: "var(--font-body), sans-serif",
                letterSpacing: "0.04em",
                marginTop: "1rem",
                fontStyle: "italic",
                transform: "skewX(-0.3deg)",
              }}>
                Led by experienced professionals and researchers, this program bridges the gap between academic knowledge and industry requirements. You will gain practical skills that are immediately applicable in professional settings.
              </p>
            </CinematicBox>

            {/* What You'll Learn */}
            <CinematicBox title="What You Will Learn" accentColor={card.accentColor} glowColor={card.glowColor} delay={0.3}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {[
                  "Core concepts and theoretical foundations",
                  "Hands-on lab sessions with expert guidance",
                  "Industry best practices and workflows",
                  "Real-world project implementation",
                  "Portfolio-worthy completed projects",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: card.accentColor,
                        boxShadow: `0 0 8px ${card.accentColor}`,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "0.9rem",
                      fontFamily: "var(--font-body), sans-serif",
                      letterSpacing: "0.04em",
                      fontStyle: "italic",
                      transform: "skewX(-0.3deg)",
                    }}>{item}</span>
                  </div>
                ))}
              </div>
            </CinematicBox>

            {/* Prerequisites */}
            <CinematicBox title="Prerequisites" accentColor={card.accentColor} glowColor={card.glowColor} delay={0.4}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {[
                  "Basic programming knowledge recommended",
                  "Laptop with internet connection required",
                  "Enthusiasm to learn and experiment",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.2)",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "0.9rem",
                      fontFamily: "var(--font-body), sans-serif",
                      letterSpacing: "0.04em",
                      fontStyle: "italic",
                      transform: "skewX(-0.3deg)",
                    }}>{item}</span>
                  </div>
                ))}
              </div>
            </CinematicBox>
          </div>

          {/* Right Column - Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "sticky", top: "2rem" }}>
            {/* Price Card */}
            <CinematicBox title="" accentColor={card.accentColor} glowColor={card.glowColor} delay={0.15}>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <span style={{
                  fontSize: "0.65rem",
                  fontFamily: 'var(--font-body), sans-serif',
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}>
                  <InterferenceText>Price</InterferenceText>
                </span>
                <div
                  style={{
                    fontFamily: 'var(--font-display), sans-serif',
                    fontSize: "2.2rem",
                    fontWeight: 700,
                    color: card.accentColor,
                    textShadow: `0 0 30px ${card.glowColor}, 0 0 60px ${card.glowColor}44`,
                    marginTop: "0.3rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  <InterferenceText>{card.price}</InterferenceText>
                </div>
              </div>
              <button
                onClick={() => playClick()}
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  borderRadius: "12px",
                  border: "none",
                  background: card.accentColor,
                  color: "#000",
                  fontFamily: 'var(--font-display), sans-serif',
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                  transformStyle: "preserve-3d",
                  boxShadow: `0 4px 25px ${card.glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}
                onMouseEnter={(e) => {
                  playGlitch();
                  e.currentTarget.style.transform = "translateZ(30px) scale(1.08)";
                  e.currentTarget.style.boxShadow = `0 15px 50px ${card.glowColor}, 0 0 70px ${card.glowColor}50, inset 0 1px 0 rgba(255,255,255,0.3)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateZ(0) scale(1)";
                  e.currentTarget.style.boxShadow = `0 4px 25px ${card.glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`;
                }}
              >
                <InterferenceText>Register Now</InterferenceText>
              </button>
              <p style={{
                textAlign: "center",
                fontSize: "0.6rem",
                fontFamily: "var(--font-body), sans-serif",
                color: "rgba(255,255,255,0.3)",
                marginTop: "0.8rem",
                letterSpacing: "0.05em",
              }}>
                Early bird pricing. Limited seats available.
              </p>
            </CinematicBox>

            {/* Workshop Details */}
            <CinematicBox title="Workshop Details" accentColor={card.accentColor} glowColor={card.glowColor} delay={0.25}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                {[
                  { label: "Duration", value: `${card.Duration} Days` },
                  { label: "Total Seats", value: String(card.Seats) },
                  { label: "Difficulty", value: `Level ${card.Level}` },
                  { label: "Format", value: "In-Person + Online" },
                  { label: "Certificate", value: "Included" },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: "0.7rem",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span style={{
                      fontSize: "0.7rem",
                      fontFamily: 'var(--font-body), sans-serif',
                      color: "rgba(255,255,255,0.4)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}><InterferenceText>{item.label}</InterferenceText></span>
                    <span style={{
                      fontSize: "0.8rem",
                      fontFamily: "var(--font-body), sans-serif",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.8)",
                      letterSpacing: "0.03em",
                    }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </CinematicBox>

            {/* Tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "0.35rem 0.8rem",
                    borderRadius: "20px",
                    background: `${card.accentColor}12`,
                    color: `${card.accentColor}bb`,
                    border: `1px solid ${card.accentColor}28`,
                    fontFamily: 'var(--font-body), sans-serif',
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontStyle: "italic",
                  }}
                >
                  <InterferenceText>{tag}</InterferenceText>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floatBox {
          0% { transform: translateY(0px) translateX(0px); }
          100% { transform: translateY(-15px) translateX(8px); }
        }
        @keyframes boxPulse {
          0% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        @keyframes boxGradientShift {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
        @media (min-width: 768px) {
          .workshop-detail-grid {
            grid-template-columns: 1fr 340px !important;
          }
        }
        @media (max-width: 767px) {
          .cinematic-box {
            padding: 1.25rem !important;
          }
        }
      `}</style>
    </div>
  );
}
