"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import IntroController from "../components/IntroController";
import TimeFallScene from "../components/TimeFallScene";
import Experience from "../components/WorkshopExperience";
import HeroGallery from "../components/HeroGallery";
import CategoryBox from "../components/CategoryBox";
import { ParallaxCard } from "../components/parallax";
import { workshopCards } from "./workshopData";

const preCards = workshopCards.filter((c) => c.category === "pre");
const liveCards = workshopCards.filter((c) => c.category === "live");

export default function WorkshopPage() {
  const [showModels, setShowModels] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const pastGallery = window.scrollY > window.innerHeight * 0.8;
      setShowModels(pastGallery);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`@keyframes homeBtnSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <IntroController>
      {/* BACKGROUND */}
      <div style={{ position: "fixed", inset: 0, zIndex: -10 }}>
        <TimeFallScene />
      </div>

      {/* ── Back to Home Button ───────────────────────────────── */}
      <div style={{ position: "fixed", bottom: "1.5rem", left: "1.5rem", zIndex: 50 }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.65rem 1.3rem",
            borderRadius: "40px",
            border: "1px solid rgba(51,214,255,0.25)",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(12px)",
            color: "#33d6ff",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textDecoration: "none",
            transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
            boxShadow: "0 0 20px rgba(51,214,255,0.1), inset 0 0 20px rgba(51,214,255,0.03)",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(51,214,255,0.12)";
            e.currentTarget.style.borderColor = "rgba(51,214,255,0.5)";
            e.currentTarget.style.boxShadow = "0 0 35px rgba(51,214,255,0.25), inset 0 0 30px rgba(51,214,255,0.06)";
            e.currentTarget.style.transform = "translateX(4px)";
            const arrow = e.currentTarget.querySelector("[data-arrow]") as HTMLElement;
            if (arrow) arrow.style.transform = "translateX(-3px)";
            const line = e.currentTarget.querySelector("[data-line]") as HTMLElement;
            if (line) line.style.width = "30px";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.5)";
            e.currentTarget.style.borderColor = "rgba(51,214,255,0.25)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(51,214,255,0.1), inset 0 0 20px rgba(51,214,255,0.03)";
            e.currentTarget.style.transform = "translateX(0)";
            const arrow = e.currentTarget.querySelector("[data-arrow]") as HTMLElement;
            if (arrow) arrow.style.transform = "translateX(0)";
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

      {/* Hero Gallery */}
      <div style={{ position: "relative", zIndex: 5 }}>
        <HeroGallery />
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
          <div style={{ position: "relative", minHeight: "300vh" }}>
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
                  zIndex: 10,
                  pointerEvents: "auto",
                }}
              >
                <ParallaxCard card={card} index={index} />
              </div>
            ))}
          </div>
        </CategoryBox>
      </div>

      {/* ── Live-Conscientia Workshops ────────────────────────── */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <CategoryBox
          title="Live-Conscientia"
          accentColor="#a855f7"
          glowColor="rgba(168,85,247,0.5)"
          style={{ marginTop: "5vh", marginBottom: "10vh" }}
        >
          <div style={{ position: "relative", minHeight: "180vh" }}>
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
                  zIndex: 10,
                  pointerEvents: "auto",
                }}
              >
                <ParallaxCard card={card} index={index + preCards.length} />
              </div>
            ))}
          </div>
        </CategoryBox>
      </div>
    </IntroController>
    </>
  );
}
