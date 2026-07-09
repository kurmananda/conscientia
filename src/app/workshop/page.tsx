"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import IntroController from "../components/IntroController";
import TimeFallScene from "../components/TimeFallScene";
import Experience from "../components/WorkshopExperience";
import WorkshopWheel from "../components/three/WorkshopWheel";
import CategoryBox from "../components/CategoryBox";
import { ParallaxCard } from "../components/parallax";
import { workshopCards } from "./workshopData";
import useSound from "../hooks/useSound";

const preCards = workshopCards.filter((c) => c.category === "pre");
const liveCards = workshopCards.filter((c) => c.category === "live");

export default function WorkshopPage() {
  const [showModels, setShowModels] = useState(false);
  const [galleryRevealed, setGalleryRevealed] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const playGlitch = useSound("/sounds/glitch.wav", 0.2, 0.15);
  const playClick = useSound("/sounds/click.mp3", 0.25, 0.08);

  useEffect(() => {
    const handleScroll = () => {
      const pastGallery = window.scrollY > window.innerHeight * 0.8;
      setShowModels(pastGallery);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Trigger cinematic gallery reveal after intro
  useEffect(() => {
    const timer = setTimeout(() => setGalleryRevealed(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        @keyframes homeBtnSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* BACKGROUND — outside IntroController to match detail page */}
      <div style={{ position: "fixed", inset: 0, zIndex: -10 }}>
        <TimeFallScene />
      </div>

      <IntroController ambientMusicSrc="/sounds/ambient.mp3">

      {/* ── Back to Home Button ───────────────────────────────── */}
      <div style={{ position: "fixed", bottom: "1.5rem", left: "1.5rem", zIndex: 50, perspective: "600px" }}>
        <Link
          href="/"
          onClick={() => playClick()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.7rem 1.5rem",
            borderRadius: "40px",
            border: "1.5px solid rgba(51,214,255,0.35)",
            background: "linear-gradient(135deg, rgba(51,214,255,0.15), rgba(0,0,0,0.6))",
            backdropFilter: "blur(16px)",
            color: "#33d6ff",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textDecoration: "none",
            transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
            boxShadow: "0 4px 25px rgba(51,214,255,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
            position: "relative",
            overflow: "hidden",
            transformStyle: "preserve-3d",
            fontStyle: "italic",
            fontFamily: 'var(--font-display), sans-serif',
          }}
          onMouseEnter={(e) => {
            playGlitch();
            e.currentTarget.style.transform = "translateZ(20px) scale(1.06) translateX(-6px)";
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(51,214,255,0.35), rgba(51,214,255,0.1))";
            e.currentTarget.style.borderColor = "rgba(51,214,255,0.7)";
            e.currentTarget.style.boxShadow = "0 12px 45px rgba(51,214,255,0.4), 0 0 50px rgba(51,214,255,0.2), inset 0 1px 0 rgba(255,255,255,0.15)";
            const arrow = e.currentTarget.querySelector("[data-arrow]") as HTMLElement;
            if (arrow) arrow.style.transform = "translateX(-4px) scale(1.15)";
            const line = e.currentTarget.querySelector("[data-line]") as HTMLElement;
            if (line) line.style.width = "35px";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateZ(0) scale(1) translateX(0)";
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(51,214,255,0.15), rgba(0,0,0,0.6))";
            e.currentTarget.style.borderColor = "rgba(51,214,255,0.35)";
            e.currentTarget.style.boxShadow = "0 4px 25px rgba(51,214,255,0.15), inset 0 1px 0 rgba(255,255,255,0.05)";
            const arrow = e.currentTarget.querySelector("[data-arrow]") as HTMLElement;
            if (arrow) arrow.style.transform = "translateX(0) scale(1)";
            const line = e.currentTarget.querySelector("[data-line]") as HTMLElement;
            if (line) line.style.width = "0px";
          }}
        >
          {/* Animated border glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "40px",
              padding: "1px",
              background: "conic-gradient(from 0deg, rgba(51,214,255,0.4), transparent 30%, rgba(51,214,255,0.2), transparent 70%, rgba(51,214,255,0.4))",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              animation: "homeBtnSpin 4s linear infinite",
              opacity: 0.6,
              pointerEvents: "none",
            }}
          />

          <span
            data-arrow
            style={{
              fontSize: "0.85rem",
              transition: "transform 0.3s ease",
              display: "inline-block",
            }}
          >
            &larr;
          </span>

          <span style={{ position: "relative" }}>
            Home
            <span
              data-line
              style={{
                position: "absolute",
                bottom: "-3px",
                left: 0,
                height: "1px",
                width: "0px",
                background: "linear-gradient(90deg, #33d6ff, transparent)",
                transition: "width 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                pointerEvents: "none",
              }}
            />
          </span>
        </Link>
      </div>

      {/* 3D Workshop Wheel — Cinematic 3D Gallery */}
      <div
        ref={galleryRef}
        style={{
          position: "relative",
          zIndex: 5,
          opacity: galleryRevealed ? 1 : 0,
          transform: galleryRevealed
            ? "translateY(0)"
            : "translateY(40px)",
          transition: "opacity 0.8s cubic-bezier(0.23, 1, 0.32, 1), transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <WorkshopWheel />
      </div>

      {/* 3D Models — fixed overlay */}
      <div style={{ opacity: showModels ? 1 : 0, transition: "opacity 0.6s ease" }}>
        <Experience />
      </div>

      {/* ── Pre-Conscientia Workshops ─────────────────────────── */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <CategoryBox
          title="Pre-Conscientia"
          accentColor="#33d6ff"
          glowColor="rgba(51,214,255,0.5)"
          style={{ marginTop: "5vh" }}
        >
          <div style={{ position: "relative", minHeight: "300vh" }} />
        </CategoryBox>
      </div>

      {/* ── Live-Conscientia Workshops ────────────────────────── */}
      <div style={{ position: "relative", zIndex: 10, marginBottom: "10vh" }}>
        <CategoryBox
          title="Live-Conscientia"
          accentColor="#a855f7"
          glowColor="rgba(168,85,247,0.5)"
          style={{ marginTop: "5vh" }}
        >
          <div style={{ position: "relative", minHeight: "180vh" }} />
        </CategoryBox>
      </div>

      {/* ── All Cards — topmost layer ─────────────────────────── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, pointerEvents: "none" }}>
        {preCards.map((card, index) => (
          <div
            key={card.id}
            style={{
              position: "absolute",
              top: card.layout?.top || "0",
              left: card.layout?.left,
              right: card.layout?.right,
              bottom: card.layout?.bottom,
              width: card.layout?.width,
              pointerEvents: "auto",
            }}
          >
            <ParallaxCard card={card} index={index} />
          </div>
        ))}
        {liveCards.map((card, index) => (
          <div
            key={card.id}
            style={{
              position: "absolute",
              top: card.layout?.top || "0",
              left: card.layout?.left,
              right: card.layout?.right,
              bottom: card.layout?.bottom,
              width: card.layout?.width,
              pointerEvents: "auto",
            }}
          >
            <ParallaxCard card={card} index={index + preCards.length} />
          </div>
        ))}
      </div>
    </IntroController>
    </>
  );
}
