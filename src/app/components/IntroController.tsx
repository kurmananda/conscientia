"use client";

/**
 * IntroController
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the intro sequence: Logo → Text Animation → Workshop Page
 *
 * State machine:
 *   "logo"    → CinematicIntro (logo video) plays
 *   "text"    → WorkshopIntro (cinematic text) plays
 *   "revealed" → Workshop page is visible
 */

import React, { useState, useCallback, useEffect } from "react";
import { CinematicIntro } from "./intro";
import WorkshopIntro from "./intro/WorkshopIntro";

import { ReactNode } from "react";

interface IntroControllerProps {
  children: ReactNode;
}

export default function IntroController({
  children,
}: IntroControllerProps) {
  const [phase, setPhase] = useState<"logo" | "text" | "revealed">("logo");

  // Prevent scroll during intro
  useEffect(() => {
    if (phase !== "revealed") {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [phase]);

  const handleLogoComplete = useCallback(() => {
    setPhase("text");
  }, []);

  const handleTextComplete = useCallback(() => {
    setPhase("revealed");
  }, []);

  return (
  <>
    {/* Main page is always mounted so it can load while the intro plays */}
    <div
      style={{
        opacity: phase === "revealed" ? 1 : 0,
        transition: "opacity 0.4s ease-out",
      }}
    >
      {children}
    </div>

    {/* Phase 1: Logo video */}
    {phase === "logo" && (
      <CinematicIntro onComplete={handleLogoComplete} />
    )}

    {/* Phase 2: Cinematic text animation */}
    {phase === "text" && (
      <WorkshopIntro onComplete={handleTextComplete} />
    )}
  </>
);
}
