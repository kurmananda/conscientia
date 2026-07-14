import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParallaxTilt } from "../../hooks/useParallaxTilt";
import useSound from "../../hooks/useSound";

export interface CardData {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  category?: "pre" | "live";
  Duration: number;
  Seats: number;
  Level: number;
  image: string;
  accentColor: string;
  glowColor: string;
  foilGradient: string;
  badgeIcon: string;
  description: string;
  tags: string[];
  price: string;
  layout?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    width?: string;
  };
}

interface ParallaxCardProps {
  card: CardData;
  index: number;
}

const ParallaxCard: React.FC<ParallaxCardProps> = ({ card, index }) => {
  const { ref, tilt, handleMouseMove, handleMouseLeave, handleMouseEnter } = useParallaxTilt(20);
  const cardWidth = card.layout?.width || "500px";
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const playGlitch = useSound("/sounds/glitch.wav", 0.2, 0.15);
  const playClick = useSound("/sounds/click.mp3", 0.25, 0.08);
  const playTap = useSound("/sounds/tap.mp3", 0.3, undefined, true);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cardStyle: React.CSSProperties = {
    transform: `
      perspective(1000px)
      rotateX(${tilt.rotateX}deg)
      rotateY(${tilt.rotateY}deg)
      scale(${tilt.scale})
    `,
    transition: "transform 0.08s ease-out, box-shadow 0.08s ease-out",
    boxShadow: tilt.isHovered
      ? `
          ${tilt.shadowX}px ${tilt.shadowY + 20}px 60px rgba(0,0,0,0.7),
          ${tilt.shadowX * 0.5}px ${tilt.shadowY * 0.5 + 10}px 30px rgba(0,0,0,0.4),
          0 0 80px ${card.glowColor},
          0 0 120px ${card.glowColor}
        `
      : `0 20px 60px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3), 0 0 40px ${card.glowColor}`,
    transformStyle: "preserve-3d",
  };

  const layer1Style: React.CSSProperties = {
    transform: tilt.isHovered
      ? `translateX(${tilt.rotateY * 0.4}px) translateY(${-tilt.rotateX * 0.4}px) translateZ(20px)`
      : "translateZ(0px)",
    transition: tilt.isHovered ? "transform 0.08s ease-out" : "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
  };

  const layer2Style: React.CSSProperties = {
    transform: tilt.isHovered
      ? `translateX(${tilt.rotateY * 0.7}px) translateY(${-tilt.rotateX * 0.7}px) translateZ(35px)`
      : "translateZ(0px)",
    transition: tilt.isHovered ? "transform 0.08s ease-out" : "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
  };

  const shineStyle: React.CSSProperties = {
    background: `radial-gradient(
      circle at ${tilt.glareX}% ${tilt.glareY}%,
      rgba(255, 255, 255, ${tilt.glareOpacity * 0.9}) 0%,
      rgba(255, 255, 255, ${tilt.glareOpacity * 0.4}) 25%,
      transparent 60%
    )`,
    transition: tilt.isHovered ? "opacity 0.08s ease-out" : "opacity 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
    opacity: tilt.isHovered ? 1 : 0,
  };

  const rainbowShineStyle: React.CSSProperties = {
    background: `linear-gradient(
      ${tilt.rotateY * 3 + 135}deg,
      rgba(255, 0, 0, 0.08) 0%,
      rgba(255, 165, 0, 0.08) 15%,
      rgba(255, 255, 0, 0.08) 30%,
      rgba(0, 255, 0, 0.08) 45%,
      rgba(0, 0, 255, 0.08) 60%,
      rgba(238, 130, 238, 0.08) 75%,
      rgba(255, 0, 0, 0.08) 100%
    )`,
    opacity: tilt.isHovered ? 1 : 0,
    transition: tilt.isHovered ? "opacity 0.08s ease-out" : "opacity 0.6s",
  };

  const foilStyle: React.CSSProperties = {
    background: card.foilGradient,
    opacity: tilt.isHovered ? 0.65 + tilt.glareOpacity * 0.3 : 0.4,
    transition: tilt.isHovered ? "opacity 0.08s ease-out" : "opacity 0.6s",
  };

  return (
    <div
      ref={wrapperRef}
      className="group relative cursor-pointer"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? "translateY(0) scale(1) rotateX(0deg)"
          : "translateY(80px) scale(0.7) rotateX(8deg)",
        filter: isVisible ? "blur(0px)" : "blur(8px)",
        transition: isVisible
          ? "opacity 0.8s cubic-bezier(0.23, 1, 0.32, 1), transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), filter 0.8s cubic-bezier(0.23, 1, 0.32, 1)"
          : "opacity 0.3s ease-in, transform 0.3s ease-in, filter 0.3s ease-in",
        overflow: "visible",
      }}
    >
      {/* Main Card */}
      <div
        ref={ref}
        onMouseEnter={() => { playTap(); handleMouseEnter(); }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative select-none overflow-hidden rounded-2xl"
        style={{ ...cardStyle, width: cardWidth }}
      >
        {/* Card Base Background */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950" />

        {/* Foil / Holographic Base Layer */}
        <div className="absolute inset-0 rounded-2xl" style={foilStyle} />

        {/* Rainbow Holographic Sheen */}
        <div className="pointer-events-none absolute inset-0 z-30 rounded-2xl" style={rainbowShineStyle} />

        {/* Shine Highlight Overlay */}
        <div className="pointer-events-none absolute inset-0 z-40 rounded-2xl" style={shineStyle} />

        {/* Card Border */}
        <div
          className="absolute rounded-2xl"
          style={{
            top: "-2px",
            left: "-2px",
            right: "-2px",
            bottom: "-2px",
            borderRadius: "18px",
            background: `linear-gradient(135deg, ${card.accentColor}88 0%, transparent 50%, ${card.accentColor}44 100%)`,
            padding: "1.5px",
          }}
        >
          <div className="h-full w-full rounded-2xl bg-transparent" />
        </div>

        {/* Inner border line */}
        <div
          className="absolute rounded-2xl"
          style={{
            top: "-0.5px",
            left: "-0.5px",
            right: "-0.5px",
            bottom: "-0.5px",
            borderRadius: "15px",
            border: `1px solid ${card.accentColor}55`,
          }}
        />

        {/* Card Content - Landscape Layout */}
        <div className="relative z-10 flex flex-row p-3">
          {/* Left Side - Image */}
          <div style={layer2Style} className="relative mr-3 flex-shrink-0 overflow-hidden rounded-xl">
            <div className="relative h-[200px] w-[160px] overflow-hidden rounded-xl">
              <Image
                src={card.image}
                alt={card.title}
                fill
                sizes="160px"
                className="object-cover"
                style={{
                  transform: tilt.isHovered
                    ? `scale(1.08) translateX(${-tilt.rotateY * 0.3}px) translateY(${tilt.rotateX * 0.3}px)`
                    : "scale(1)",
                  transition: tilt.isHovered
                    ? "transform 0.1s ease-out"
                    : "transform 0.7s cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              />
              {/* Image overlay gradient */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right, transparent 60%, ${card.glowColor.replace("0.3", "0.4")} 100%)`,
                }}
              />
              {/* Image scan lines */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 3px)",
                }}
              />
              {/* Type badge on image */}
              <div className="absolute bottom-2 left-2">
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white"
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${card.accentColor}66`,
                  }}
                >
                  {card.type}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            {/* Header */}
            <div style={layer1Style} className="mb-2">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div
                    className="mb-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{
                      background: `${card.accentColor}33`,
                      color: card.accentColor,
                      border: `1px solid ${card.accentColor}66`,
                      textShadow: `0 0 10px ${card.accentColor}`,
                      fontFamily: 'var(--font-display), sans-serif',
                    }}
                  >
                    {card.type}
                  </div>
                  <h3
                    className="text-base font-black uppercase leading-tight tracking-tight text-white"
                    style={{
                      textShadow: `0 0 20px ${card.accentColor}`,
                      fontFamily: "'Rubik Glitch', sans-serif",
                      fontWeight: 400,
                      letterSpacing: "0.08em",
                      fontStyle: "italic",
                      transform: "skewX(-0.8deg)",
                    }}
                  >
                    <span className="digital-interference scanline-sweep digital-flicker" style={{ position: "relative" }}>
                      <span className="glitch-text" data-text={card.title}>{card.title}</span>
                    </span>
                  </h3>
                  <p className="mt-0.5 text-[10px] text-white/50 italic" style={{ fontFamily: 'var(--font-body), sans-serif', letterSpacing: "0.04em" }}>{card.subtitle}</p>
                </div>
                <div
                  className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xl"
                  style={{
                    background: `${card.accentColor}22`,
                    border: `1px solid ${card.accentColor}55`,
                    boxShadow: `0 0 15px ${card.accentColor}66`,
                  }}
                >
                  {card.badgeIcon}
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={layer1Style} className="mb-2">
              <p className="text-[11px] leading-relaxed text-white/60 italic" style={{ fontFamily: 'var(--font-body), sans-serif', letterSpacing: "0.04em", transform: "skewX(-0.5deg)" }}>{card.description}</p>
            </div>

            {/* Tags */}
            <div style={layer1Style} className="mb-2 flex flex-wrap gap-1">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-medium italic"
                  style={{
                    background: `${card.accentColor}18`,
                    color: `${card.accentColor}cc`,
                    border: `1px solid ${card.accentColor}33`,
                    fontFamily: 'var(--font-body), sans-serif',
                    letterSpacing: "0.04em",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Price */}
            <div style={layer1Style} className="mb-2">
              <span
                className="text-lg font-black"
                style={{
                  color: card.accentColor,
                  textShadow: `0 0 15px ${card.glowColor}`,
                  fontFamily: 'var(--font-display), sans-serif',
                }}
              >
                {card.price}
              </span>
            </div>

            {/* Buttons */}
            <div style={{ ...layer1Style, perspective: "600px" }} className="flex gap-2">
              <a
                href={`/workshop/${card.id}`}
                className="flex-1 rounded-lg py-1.5 text-center text-[11px] font-bold uppercase tracking-wider"
                style={{
                  background: `${card.accentColor}22`,
                  color: card.accentColor,
                  border: `1px solid ${card.accentColor}55`,
                  fontFamily: 'var(--font-display), sans-serif',
                  transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                  transformStyle: "preserve-3d",
                  boxShadow: `0 4px 15px ${card.accentColor}15`,
                }}
                onMouseEnter={(e) => {
                  playGlitch();
                  e.currentTarget.style.background = card.accentColor;
                  e.currentTarget.style.color = "#000";
                  e.currentTarget.style.transform = "translateZ(20px) scale(1.05)";
                  e.currentTarget.style.boxShadow = `0 8px 30px ${card.accentColor}50, 0 0 40px ${card.accentColor}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${card.accentColor}22`;
                  e.currentTarget.style.color = card.accentColor;
                  e.currentTarget.style.transform = "translateZ(0) scale(1)";
                  e.currentTarget.style.boxShadow = `0 4px 15px ${card.accentColor}15`;
                }}
                onClick={() => playClick()}
              >
                View
              </a>
              <button
                className="flex-1 rounded-lg py-1.5 text-[11px] font-bold uppercase tracking-wider"
                style={{
                  background: card.accentColor,
                  color: "#000",
                  fontFamily: 'var(--font-display), sans-serif',
                  transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                  transformStyle: "preserve-3d",
                  boxShadow: `0 4px 20px ${card.glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}
                onClick={() => playClick()}
                onMouseEnter={(e) => {
                  playGlitch();
                  e.currentTarget.style.transform = "translateZ(25px) scale(1.08)";
                  e.currentTarget.style.boxShadow = `0 12px 40px ${card.glowColor}, 0 0 60px ${card.glowColor}40, inset 0 1px 0 rgba(255,255,255,0.3)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateZ(0) scale(1)";
                  e.currentTarget.style.boxShadow = `0 4px 20px ${card.glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`;
                }}
              >
                Register
              </button>
            </div>
          </div>
        </div>

        {/* Corner accents */}
        {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos) => (
          <div
            key={pos}
            className={`absolute ${pos} h-3 w-3 opacity-60`}
            style={{
              background: "transparent",
              border: `1.5px solid ${card.accentColor}`,
              borderRadius: "2px",
              clipPath:
                pos.includes("top-2 left-2")
                  ? "polygon(0 0, 100% 0, 0 100%)"
                  : pos.includes("top-2 right-2")
                  ? "polygon(0 0, 100% 0, 100% 100%)"
                  : pos.includes("bottom-2 left-2")
                  ? "polygon(0 0, 100% 100%, 0 100%)"
                  : "polygon(100% 0, 100% 100%, 0 100%)",
            }}
          />
        ))}
      </div>

      {/* ── Side Fire / Aura Effects ───────────────────────────── */}
      {isVisible && <>
      {/* Left fire column — positioned fully outside the card */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: "100%",
          top: "-5%",
          bottom: "-5%",
          width: "200px",
          zIndex: 5,
        }}
      >
        {/* Deep background glow */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "-25%",
            bottom: "-25%",
            width: "180px",
            background: `radial-gradient(ellipse at 90% 50%, ${card.accentColor}${tilt.isHovered ? "70" : "30"}, transparent 65%)`,
            filter: `blur(${tilt.isHovered ? "10px" : "22px"})`,
            transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        />
        {/* Bright core strip */}
        <div
          style={{
            position: "absolute",
            right: "0px",
            top: "5%",
            bottom: "5%",
            width: "24px",
            background: `linear-gradient(to bottom, transparent 2%, ${card.accentColor}bb 20%, ${card.accentColor} 45%, ${card.accentColor}ff 50%, ${card.accentColor} 55%, ${card.accentColor}bb 80%, transparent 98%)`,
            opacity: tilt.isHovered ? 1 : 0.55,
            filter: `blur(${tilt.isHovered ? "1px" : "2px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireStripLeft 1.8s ease-in-out infinite",
          }}
        />
        {/* Flickering inner flame */}
        <div
          style={{
            position: "absolute",
            right: "-8px",
            top: "8%",
            bottom: "8%",
            width: "40px",
            background: `linear-gradient(to bottom, transparent, ${card.accentColor}99, ${card.accentColor}ee, ${card.accentColor}99, transparent)`,
            opacity: tilt.isHovered ? 0.9 : 0.4,
            filter: `blur(${tilt.isHovered ? "4px" : "8px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireFlickerInner 1.2s ease-in-out infinite alternate",
          }}
        />
        {/* Outer flame haze */}
        <div
          style={{
            position: "absolute",
            right: "-20px",
            top: "3%",
            bottom: "3%",
            width: "60px",
            background: `linear-gradient(to bottom, transparent 5%, ${card.accentColor}66 30%, ${card.accentColor}88 50%, ${card.accentColor}66 70%, transparent 95%)`,
            opacity: tilt.isHovered ? 0.7 : 0.25,
            filter: `blur(${tilt.isHovered ? "8px" : "14px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireFlickerInner 1.6s ease-in-out 0.2s infinite alternate",
          }}
        />
        {/* Smoke / mist layer */}
        <div
          style={{
            position: "absolute",
            right: "-10px",
            top: "-15%",
            bottom: "-15%",
            width: "140px",
            background: `radial-gradient(ellipse at 70% 50%, ${card.accentColor}${tilt.isHovered ? "55" : "18"}, transparent 55%)`,
            filter: `blur(${tilt.isHovered ? "12px" : "28px"})`,
            transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "smokeDrift 3s ease-in-out infinite",
          }}
        />
        {/* Large flowing embers */}
        {[...Array(10)].map((_, i) => (
          <div
            key={`left-big-${i}`}
            style={{
              position: "absolute",
              right: "-5px",
              width: `${5 + (i % 5) * 3}px`,
              height: `${5 + (i % 5) * 3}px`,
              borderRadius: "50%",
              background: `radial-gradient(circle, #fff 0%, ${card.accentColor} 40%, transparent 70%)`,
              boxShadow: `0 0 ${10 + i * 3}px ${card.accentColor}, 0 0 ${20 + i * 4}px ${card.accentColor}80, 0 0 ${30 + i * 5}px ${card.accentColor}40`,
              opacity: tilt.isHovered ? 1 : 0.35,
              animation: `emberLeft${i % 4} ${2 + i * 0.2}s ease-out ${i * 0.12}s infinite`,
              transition: "opacity 0.5s ease",
            }}
          />
        ))}
        {/* Small spark particles */}
        {[...Array(14)].map((_, i) => (
          <div
            key={`left-spark-${i}`}
            style={{
              position: "absolute",
              right: "0px",
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              background: "#fff",
              boxShadow: `0 0 6px ${card.accentColor}, 0 0 14px ${card.accentColor}`,
              opacity: tilt.isHovered ? 0.9 : 0.2,
              animation: `sparkLeft${i % 3} ${1 + i * 0.12}s linear ${i * 0.08}s infinite`,
              transition: "opacity 0.4s ease",
            }}
          />
        ))}
      </div>

      {/* Right fire column — positioned fully outside the card */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "100%",
          top: "-5%",
          bottom: "-5%",
          width: "200px",
          zIndex: 5,
        }}
      >
        {/* Deep background glow */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "-25%",
            bottom: "-25%",
            width: "180px",
            background: `radial-gradient(ellipse at 10% 50%, ${card.accentColor}${tilt.isHovered ? "70" : "30"}, transparent 65%)`,
            filter: `blur(${tilt.isHovered ? "10px" : "22px"})`,
            transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        />
        {/* Bright core strip */}
        <div
          style={{
            position: "absolute",
            left: "0px",
            top: "5%",
            bottom: "5%",
            width: "24px",
            background: `linear-gradient(to bottom, transparent 2%, ${card.accentColor}bb 20%, ${card.accentColor} 45%, ${card.accentColor}ff 50%, ${card.accentColor} 55%, ${card.accentColor}bb 80%, transparent 98%)`,
            opacity: tilt.isHovered ? 1 : 0.55,
            filter: `blur(${tilt.isHovered ? "1px" : "2px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireStripRight 1.8s ease-in-out 0.4s infinite",
          }}
        />
        {/* Flickering inner flame */}
        <div
          style={{
            position: "absolute",
            left: "-8px",
            top: "8%",
            bottom: "8%",
            width: "40px",
            background: `linear-gradient(to bottom, transparent, ${card.accentColor}99, ${card.accentColor}ee, ${card.accentColor}99, transparent)`,
            opacity: tilt.isHovered ? 0.9 : 0.4,
            filter: `blur(${tilt.isHovered ? "4px" : "8px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireFlickerInner 1.4s ease-in-out 0.3s infinite alternate",
          }}
        />
        {/* Outer flame haze */}
        <div
          style={{
            position: "absolute",
            left: "-20px",
            top: "3%",
            bottom: "3%",
            width: "60px",
            background: `linear-gradient(to bottom, transparent 5%, ${card.accentColor}66 30%, ${card.accentColor}88 50%, ${card.accentColor}66 70%, transparent 95%)`,
            opacity: tilt.isHovered ? 0.7 : 0.25,
            filter: `blur(${tilt.isHovered ? "8px" : "14px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireFlickerInner 1.6s ease-in-out 0.2s infinite alternate",
          }}
        />
        {/* Smoke / mist layer */}
        <div
          style={{
            position: "absolute",
            left: "-10px",
            top: "-15%",
            bottom: "-15%",
            width: "140px",
            background: `radial-gradient(ellipse at 30% 50%, ${card.accentColor}${tilt.isHovered ? "55" : "18"}, transparent 55%)`,
            filter: `blur(${tilt.isHovered ? "12px" : "28px"})`,
            transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "smokeDrift 3.2s ease-in-out 0.5s infinite",
          }}
        />
        {/* Large flowing embers */}
        {[...Array(10)].map((_, i) => (
          <div
            key={`right-big-${i}`}
            style={{
              position: "absolute",
              left: "-5px",
              width: `${5 + (i % 5) * 3}px`,
              height: `${5 + (i % 5) * 3}px`,
              borderRadius: "50%",
              background: `radial-gradient(circle, #fff 0%, ${card.accentColor} 40%, transparent 70%)`,
              boxShadow: `0 0 ${10 + i * 3}px ${card.accentColor}, 0 0 ${20 + i * 4}px ${card.accentColor}80, 0 0 ${30 + i * 5}px ${card.accentColor}40`,
              opacity: tilt.isHovered ? 1 : 0.35,
              animation: `emberRight${i % 4} ${2 + i * 0.2}s ease-out ${i * 0.12 + 0.1}s infinite`,
              transition: "opacity 0.5s ease",
            }}
          />
        ))}
        {/* Small spark particles */}
        {[...Array(14)].map((_, i) => (
          <div
            key={`right-spark-${i}`}
            style={{
              position: "absolute",
              left: "0px",
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              background: "#fff",
              boxShadow: `0 0 6px ${card.accentColor}, 0 0 14px ${card.accentColor}`,
              opacity: tilt.isHovered ? 0.9 : 0.2,
              animation: `sparkRight${i % 3} ${1 + i * 0.12}s linear ${i * 0.08 + 0.05}s infinite`,
              transition: "opacity 0.4s ease",
            }}
          />
        ))}
      </div>

      {/* Top aura — positioned fully above the card */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "100%",
          left: "5%",
          right: "5%",
          height: "100px",
          zIndex: 5,
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "16px",
            background: `linear-gradient(to right, transparent, ${card.accentColor}dd, transparent)`,
            opacity: tilt.isHovered ? 0.9 : 0.4,
            filter: `blur(${tilt.isHovered ? "1px" : "3px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireStripTop 2s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "-20%",
            right: "-20%",
            height: "70px",
            background: `radial-gradient(ellipse at center bottom, ${card.accentColor}${tilt.isHovered ? "60" : "22"}, transparent 60%)`,
            filter: `blur(${tilt.isHovered ? "6px" : "16px"})`,
            transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        />
      </div>

      {/* Bottom aura — positioned fully below the card */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "100%",
          left: "5%",
          right: "5%",
          height: "100px",
          zIndex: 5,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "16px",
            background: `linear-gradient(to right, transparent, ${card.accentColor}dd, transparent)`,
            opacity: tilt.isHovered ? 0.9 : 0.4,
            filter: `blur(${tilt.isHovered ? "1px" : "3px"})`,
            transition: "all 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
            animation: "fireStripBottom 2s ease-in-out 0.6s infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "-20%",
            right: "-20%",
            height: "70px",
            background: `radial-gradient(ellipse at center top, ${card.accentColor}${tilt.isHovered ? "60" : "22"}, transparent 60%)`,
            filter: `blur(${tilt.isHovered ? "6px" : "16px"})`,
            transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        />
      </div>
      </>}
      <style>{`
        @keyframes fireStripLeft {
          0%, 100% { transform: scaleY(1) translateX(0); opacity: 0.8; }
          25% { transform: scaleY(1.03) translateX(-1px); opacity: 1; }
          50% { transform: scaleY(0.97) translateX(1px); opacity: 0.85; }
          75% { transform: scaleY(1.02) translateX(-0.5px); opacity: 0.95; }
        }
        @keyframes fireStripRight {
          0%, 100% { transform: scaleY(1) translateX(0); opacity: 0.8; }
          25% { transform: scaleY(1.02) translateX(1px); opacity: 0.95; }
          50% { transform: scaleY(0.98) translateX(-1px); opacity: 1; }
          75% { transform: scaleY(1.03) translateX(0.5px); opacity: 0.85; }
        }
        @keyframes fireStripTop {
          0%, 100% { transform: scaleX(1) translateY(0); opacity: 0.7; }
          50% { transform: scaleX(1.04) translateY(-1px); opacity: 1; }
        }
        @keyframes fireStripBottom {
          0%, 100% { transform: scaleX(1) translateY(0); opacity: 0.7; }
          50% { transform: scaleX(1.04) translateY(1px); opacity: 1; }
        }
        @keyframes fireFlickerInner {
          0% { transform: scaleY(1) scaleX(1); opacity: 0.6; filter: blur(3px); }
          33% { transform: scaleY(1.08) scaleX(0.95); opacity: 0.9; filter: blur(2px); }
          66% { transform: scaleY(0.94) scaleX(1.03); opacity: 0.7; filter: blur(4px); }
          100% { transform: scaleY(1.04) scaleX(0.98); opacity: 0.85; filter: blur(3px); }
        }
        @keyframes smokeDrift {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-8px) translateX(3px) scale(1.05); opacity: 0.7; }
        }
        @keyframes emberLeft0 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.9; }
          100% { transform: translate(-70px, -180px) scale(0.2); opacity: 0; }
        }
        @keyframes emberLeft1 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.85; }
          100% { transform: translate(-55px, -200px) scale(0.15); opacity: 0; }
        }
        @keyframes emberLeft2 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.95; }
          100% { transform: translate(-80px, -160px) scale(0.25); opacity: 0; }
        }
        @keyframes emberLeft3 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.8; }
          100% { transform: translate(-60px, -190px) scale(0.1); opacity: 0; }
        }
        @keyframes emberRight0 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.9; }
          100% { transform: translate(70px, -180px) scale(0.2); opacity: 0; }
        }
        @keyframes emberRight1 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.85; }
          100% { transform: translate(55px, -200px) scale(0.15); opacity: 0; }
        }
        @keyframes emberRight2 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.95; }
          100% { transform: translate(80px, -160px) scale(0.25); opacity: 0; }
        }
        @keyframes emberRight3 {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 0.8; }
          100% { transform: translate(60px, -190px) scale(0.1); opacity: 0; }
        }
        @keyframes sparkLeft0 {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.8; }
          100% { transform: translate(-45px, -120px); opacity: 0; }
        }
        @keyframes sparkLeft1 {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.7; }
          100% { transform: translate(-35px, -140px); opacity: 0; }
        }
        @keyframes sparkLeft2 {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.9; }
          100% { transform: translate(-50px, -110px); opacity: 0; }
        }
        @keyframes sparkRight0 {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.8; }
          100% { transform: translate(45px, -120px); opacity: 0; }
        }
        @keyframes sparkRight1 {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.7; }
          100% { transform: translate(35px, -140px); opacity: 0; }
        }
        @keyframes sparkRight2 {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.9; }
          100% { transform: translate(50px, -110px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
export default ParallaxCard;
