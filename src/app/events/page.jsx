"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import IntroController from "../components/IntroController";
import { EventsIntro } from "../components/intro";
import WorkshopWheel from "../components/three/WorkshopWheel";
import TimeFallScene from "../components/TimeFallScene";
import useSound from "../hooks/useSound";
import { eventWheelItems } from "./eventsWheelData";

export default function EventsPage() {
  const [eventsRevealed, setEventsRevealed] = useState(false);

  const playGlitch = useSound("/sounds/glitch.wav", 0.2, 0.15);
  const playClick = useSound("/sounds/click.mp3", 0.25, 0.08);

  useEffect(() => {
    const timer = setTimeout(() => setEventsRevealed(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        @keyframes homeBtnSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: -10 }}>
        <TimeFallScene wide />
      </div>

      <IntroController TextIntroComponent={EventsIntro}>

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

        <div
          style={{
            position: "relative",
            zIndex: 5,
            minHeight: "100vh",
            opacity: eventsRevealed ? 1 : 0,
            transform: eventsRevealed ? "translateY(0)" : "translateY(40px)",
            transition: "opacity 0.8s cubic-bezier(0.23, 1, 0.32, 1), transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          <WorkshopWheel items={eventWheelItems} />

          <div
            style={{
              padding: "15vh 5vw 5vh",
              maxWidth: "1200px",
              margin: "0 auto",
              fontFamily: 'var(--font-display), sans-serif',
            }}
          >
            <h1
              style={{
                fontSize: "clamp(2.5rem, 8vw, 5rem)",
                fontWeight: 900,
                letterSpacing: "0.03em",
                color: "#fff",
                marginBottom: "1rem",
                textShadow: "0 0 40px rgba(51,214,255,0.3)",
              }}
            >
              Flagship Events
            </h1>
            <p
              style={{
                fontSize: "1.1rem",
                color: "rgba(255,255,255,0.6)",
                maxWidth: "700px",
                lineHeight: 1.7,
                letterSpacing: "0.02em",
                marginBottom: "4rem",
              }}
            >
              Conscientia brings together the brightest minds across technology, science, and culture.
              From high-stakes coding battles to visionary keynotes — every event is crafted to challenge,
              inspire, and connect.
            </p>
          </div>

          <div
            style={{
              padding: "0 5vw 10vh",
              maxWidth: "1200px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              {
                title: "Code Combat",
                desc: "A high-intensity competitive programming arena where participants solve algorithmic challenges under pressure. Solo or team — survive the leaderboard.",
                accent: "#33d6ff",
              },
              {
                title: "Tech Talk Series",
                desc: "Keynote sessions and panel discussions led by industry pioneers and researchers. Topics span AI, space systems, sustainability, and emerging tech.",
                accent: "#a855f7",
              },
              {
                title: "Hackathon",
                desc: "A marathon build sprint where cross-disciplinary teams prototype real-world solutions. Judged on impact, creativity, and technical execution.",
                accent: "#f59e0b",
              },
              {
                title: "Robo War",
                desc: "Combat robotics arena — custom-built bots face off in elimination rounds. Categories include autonomous, remote-controlled, and mini-sumo.",
                accent: "#ef4444",
              },
              {
                title: "Innovation Expo",
                desc: "Project exhibition where student teams showcase research prototypes, hardware builds, and proof-of-concept demos to a panel of judges and industry visitors.",
                accent: "#10b981",
              },
              {
                title: "Cultural Night",
                desc: "An evening of music, dance, and performances that celebrate the creative spirit of the community. The perfect close to a day of high-energy competition.",
                accent: "#ec4899",
              },
            ].map((event, i) => (
              <div
                key={i}
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(0,0,0,0.4))",
                  borderRadius: "16px",
                  border: `1px solid ${event.accent}22`,
                  padding: "2rem",
                  transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                  cursor: "default",
                  backdropFilter: "blur(12px)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                  e.currentTarget.style.borderColor = `${event.accent}66`;
                  e.currentTarget.style.boxShadow = `0 20px 60px ${event.accent}20, 0 0 30px ${event.accent}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.borderColor = `${event.accent}22`;
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "3px",
                    background: `linear-gradient(90deg, ${event.accent}, transparent)`,
                    marginBottom: "1.2rem",
                    borderRadius: "2px",
                  }}
                />
                <h3
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "0.03em",
                    marginBottom: "0.6rem",
                    fontFamily: 'var(--font-display), sans-serif',
                  }}
                >
                  {event.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "rgba(255,255,255,0.55)",
                    lineHeight: 1.7,
                    letterSpacing: "0.01em",
                  }}
                >
                  {event.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </IntroController>
    </>
  );
}
