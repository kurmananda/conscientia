import React, { useEffect, useRef, useState } from "react";
import { useParallaxTilt } from "../../hooks/useParallaxTilt";

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
      }}
    >
      {/* Main Card */}
      <div
        ref={ref}
        onMouseEnter={handleMouseEnter}
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
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${card.accentColor}88 0%, transparent 50%, ${card.accentColor}44 100%)`,
            padding: "1.5px",
          }}
        >
          <div className="h-full w-full rounded-2xl bg-transparent" />
        </div>

        {/* Inner border line */}
        <div
          className="absolute inset-[1.5px] rounded-2xl"
          style={{
            border: `1px solid ${card.accentColor}55`,
          }}
        />

        {/* Card Content - Landscape Layout */}
        <div className="relative z-10 flex flex-row p-3">
          {/* Left Side - Image */}
          <div style={layer2Style} className="relative mr-3 flex-shrink-0 overflow-hidden rounded-xl">
            <div className="relative h-[200px] w-[160px] overflow-hidden rounded-xl">
              <img
                src={card.image}
                alt={card.title}
                className="h-full w-full object-cover"
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
                    }}
                  >
                    {card.type}
                  </div>
                  <h3
                    className="text-base font-black uppercase leading-tight tracking-tight text-white"
                    style={{ textShadow: `0 0 20px ${card.accentColor}` }}
                  >
                    {card.title}
                  </h3>
                  <p className="mt-0.5 text-[10px] text-white/50">{card.subtitle}</p>
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
              <p className="text-[11px] leading-relaxed text-white/60">{card.description}</p>
            </div>

            {/* Tags */}
            <div style={layer1Style} className="mb-2 flex flex-wrap gap-1">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                  style={{
                    background: `${card.accentColor}18`,
                    color: `${card.accentColor}cc`,
                    border: `1px solid ${card.accentColor}33`,
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
                }}
              >
                {card.price}
              </span>
            </div>

            {/* Buttons */}
            <div style={layer1Style} className="flex gap-2">
              <a
                href={`/workshop/${card.id}`}
                className="flex-1 rounded-lg py-1.5 text-center text-[11px] font-bold uppercase tracking-wider transition-all duration-200"
                style={{
                  background: `${card.accentColor}22`,
                  color: card.accentColor,
                  border: `1px solid ${card.accentColor}55`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = card.accentColor;
                  e.currentTarget.style.color = "#000";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${card.accentColor}22`;
                  e.currentTarget.style.color = card.accentColor;
                }}
              >
                View
              </a>
              <button
                className="flex-1 rounded-lg py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200"
                style={{
                  background: card.accentColor,
                  color: "#000",
                  boxShadow: `0 0 20px ${card.glowColor}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 30px ${card.glowColor}, 0 0 50px ${card.glowColor}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 20px ${card.glowColor}`;
                }}
              >
                Register
              </button>
            </div>

            {/* Footer */}
            <div style={layer1Style} className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-white/30">#{String(index + 1).padStart(3, "0")}</span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-1 w-1 rounded-full"
                    style={{
                      background: i < 4 ? card.accentColor : "rgba(255,255,255,0.15)",
                      boxShadow: i < 4 ? `0 0 4px ${card.accentColor}` : "none",
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-white/30">LVL 99</span>
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
    </div>
  );
};
export default ParallaxCard;
