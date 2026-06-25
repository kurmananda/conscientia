"use client";

/**
 * IntroController
 * ─────────────────────────────────────────────────────────────────────────────
 * Client component that manages whether the intro or the main page is shown.
 *
 * State machine:
 *   "intro"    → CinematicIntro is rendered over the top
 *   "revealed" → CinematicIntro is unmounted, MainPage is visible
 *
 * The transition is seamless: the intro's exit animation fades to black,
 * onComplete fires (setting state to "revealed"), the black overlay disappears
 * as the intro unmounts, and the MainPage is already rendered underneath.
 */

import React, { useState, useCallback, useEffect } from "react";
import { CinematicIntro } from "./intro";

import { ReactNode } from "react";

interface IntroControllerProps {
  children: ReactNode;
}

export default function IntroController({
  children,
}: IntroControllerProps) {
  const [phase, setPhase] = useState<"intro" | "revealed">("intro");

  // Prevent scroll during intro
  useEffect(() => {
    if (phase === "intro") {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [phase]);

  const handleIntroComplete = useCallback(() => {
    setPhase("revealed");
  }, []);

  return (
  <>
    {/* Main page is always mounted so it can load while the intro plays */}
    <div
      style={{
        opacity: phase === "intro" ? 0 : 1,
        transition: "opacity 400ms ease",
      }}
    >
      {children}
    </div>

    {/* Intro sits on top; unmounted once animation completes */}
    {phase === "intro" && (
      <CinematicIntro onComplete={handleIntroComplete} />
    )}
  </>
);
}
