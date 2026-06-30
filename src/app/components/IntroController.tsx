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

import React, { useState, useCallback, useEffect, useRef } from "react";
import { CinematicIntro } from "./intro";
import WorkshopIntro from "./intro/WorkshopIntro";
import AmbientMusic from "./AmbientMusic";

import { ReactNode } from "react";

interface IntroControllerProps {
  children: ReactNode;
  ambientMusicSrc?: string;
}

export default function IntroController({
  children,
  ambientMusicSrc,
}: IntroControllerProps) {
  const [phase, setPhase] = useState<"logo" | "text" | "revealed">("logo");
  const risersRef = useRef<HTMLAudioElement | null>(null);

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

  const handleLogoEnd = useCallback(() => {
    // Start risers as soon as the logo fades out
    const audio = new Audio("/sounds/risers.mp3");
    audio.loop = true;
    audio.volume = 0;
    risersRef.current = audio;
    audio.play().catch(() => {});
    const fadeIn = setInterval(() => {
      if (audio.volume < 0.69) {
        audio.volume = Math.min(0.7, audio.volume + 0.02);
      } else {
        clearInterval(fadeIn);
      }
    }, 30);
  }, []);

  const handleLogoComplete = useCallback(() => {
    setPhase("text");
  }, []);

  // Fade out risers on unmount
  useEffect(() => {
    return () => {
      if (risersRef.current) {
        const fadeOut = setInterval(() => {
          if (risersRef.current && risersRef.current.volume > 0.01) {
            risersRef.current.volume *= 0.8;
          } else {
            clearInterval(fadeOut);
            risersRef.current?.pause();
          }
        }, 30);
      }
    };
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
      <CinematicIntro onComplete={handleLogoComplete} onLogoEnd={handleLogoEnd} />
    )}

    {/* Phase 2: Cinematic text animation */}
    {phase === "text" && (
      <WorkshopIntro risersRef={risersRef} onComplete={handleTextComplete} />
    )}

    {/* Ambient background music — starts when page is revealed */}
    {ambientMusicSrc && (
      <AmbientMusic src={ambientMusicSrc} volume={0.2} start={phase === "revealed"} />
    )}
  </>
);
}
