"use client";

import React from "react";

/**
 * IntroLogo
 * ─────────────────────────────────────────────────────────────────────────────
 * Plays the animated logo video during the intro.
 * Keep the outer wrapper exactly as it is because GSAP animates it.
 */

interface IntroLogoProps {
  logoRef: React.RefObject<HTMLDivElement | null>;
}

export function IntroLogo({ logoRef }: IntroLogoProps) {
  return (
    <div
      ref={logoRef}
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      

      {/* Animated Logo Video */}
      <div className="relative flex items-center justify-center select-none">
        <video
          autoPlay
          muted
          playsInline
          preload="auto"
          className="w-[220px] md:w-[320px] lg:w-[380px] h-auto object-contain"
        >
          {/* Preferred format */}
          <source src="/intro.webm" type="video/webm" />

          {/* Fallback */}
          <source src="/intro.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}