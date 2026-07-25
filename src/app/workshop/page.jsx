"use client";

import Link from "next/link";
import IntroController from "../components/IntroController";
import ParallaxCard from "../components/parallax/ParallaxCard";
import { workshopCards } from "./workshopData";
import { groupBySection } from "../lib/groupBySection";
import useSound from "../hooks/useSound";

const sections = groupBySection(workshopCards);

function CardWrapper({ card, index }) {
  return <ParallaxCard card={card} index={index} basePath="/workshop" width="100%" />;
}

function SectionHeading({ title, accentColor, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
      <div
        style={{
          width: "40px",
          height: "2px",
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          boxShadow: `0 0 12px ${accentColor}80`,
        }}
      />
      <h2
        style={{
          fontFamily: 'var(--font-display), sans-serif',
          fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
          fontWeight: 700,
          color: accentColor,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          margin: 0,
          textShadow: `0 0 30px ${accentColor}40`,
        }}
      >
        {title}
      </h2>
      {count != null && (
        <span
          style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: `${accentColor}99`,
            border: `1px solid ${accentColor}33`,
            borderRadius: "999px",
            padding: "0.2rem 0.7rem",
          }}
        >
          {count}
        </span>
      )}
      <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, ${accentColor}22, transparent)` }} />
    </div>
  );
}

export default function WorkshopPage() {
  const playGlitch = useSound("/sounds/glitch.wav", 0.2, 0.15);
  const playClick = useSound("/sounds/click.wav", 0.25, 0.08);

  return (
    <>
      <style>{`
        @keyframes homeBtnSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-4%, 3%) scale(1.08); }
        }
        .card-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem 3rem;
          justify-items: stretch;
        }
        @media (min-width: 640px) {
          .card-grid {
            gap: 3rem 3rem;
          }
        }
        @media (min-width: 900px) {
          .card-grid {
            grid-template-columns: 1fr 1fr;
            gap: 4rem 3rem;
          }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -10,
          background:
            "radial-gradient(ellipse at 20% 0%, rgba(51,214,255,0.10) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(168,85,247,0.08) 0%, transparent 55%), #030304",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "-5%",
            width: "40vw",
            height: "40vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(51,214,255,0.12) 0%, transparent 70%)",
            filter: "blur(40px)",
            animation: "orbFloat 18s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-15%",
            right: "-10%",
            width: "45vw",
            height: "45vw",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)",
            filter: "blur(40px)",
            animation: "orbFloat 22s ease-in-out infinite reverse",
          }}
        />
      </div>

      <IntroController>
        <div style={{ overflowX: "hidden", width: "100%" }}>

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
                e.currentTarget.style.borderColor = "rgba(51,214,255,0.7)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateZ(0) scale(1) translateX(0)";
                e.currentTarget.style.borderColor = "rgba(51,214,255,0.35)";
              }}
            >
              <span style={{ fontSize: "0.85rem" }}>&larr;</span>
              <span>Home</span>
            </Link>
          </div>

          {/* ── Header ─────────────────────────────────────────────── */}
          <div
            style={{
              padding: "12vh 5vw 4vh",
              maxWidth: "1300px",
              margin: "0 auto",
              fontFamily: 'var(--font-display), sans-serif',
            }}
          >
            <div
              style={{
                display: "inline-block",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "#33d6ff",
                marginBottom: "1rem",
              }}
            >
              Conscientia · {workshopCards.length} Sessions
            </div>
            <h1
              style={{
                fontSize: "clamp(2.5rem, 8vw, 5rem)",
                fontWeight: 900,
                letterSpacing: "0.03em",
                background: "linear-gradient(135deg, #fff 40%, #33d6ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "1rem",
                textShadow: "0 0 60px rgba(51,214,255,0.25)",
              }}
            >
              Workshops
            </h1>
            <p
              style={{
                fontSize: "1.1rem",
                color: "rgba(255,255,255,0.6)",
                maxWidth: "700px",
                lineHeight: 1.7,
                letterSpacing: "0.02em",
              }}
            >
              Hands-on sessions led by experts — from rocketry to quantum computing. Build real
              skills, work on real projects, and walk away with a certificate.
            </p>
          </div>

          {/* ── Sections — one per unique `section` value in workshopData.js ── */}
          {sections.map(({ section, color, cards }, sIndex) => (
            <div
              key={section}
              style={{
                maxWidth: "1300px",
                margin: "0 auto",
                padding: sIndex === 0 ? "2vh 5vw" : "6vh 5vw",
                paddingBottom: sIndex === sections.length - 1 ? "10vh" : undefined,
              }}
            >
              <SectionHeading title={section} accentColor={color} count={cards.length} />
              <div className="card-grid">
                {cards.map((card, index) => (
                  <CardWrapper key={card.id} card={card} index={index} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </IntroController>
    </>
  );
}
