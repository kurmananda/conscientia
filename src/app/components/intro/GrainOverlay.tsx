"use client";

import React from "react";

/**
 * GrainOverlay
 * ─────────────────────────────────────────────────────────────────────────────
 * A very subtle film-grain / noise texture rendered via an inline SVG filter.
 * Using SVG feTurbulence is GPU-friendly, avoids loading an extra asset, and
 * allows the grain to animate gently without any JavaScript.
 *
 * The grain is nearly imperceptible – it adds tactile richness to the near-
 * black background without adding visual noise.
 */
export function GrainOverlay() {
  return (
    <>
      {/* SVG filter definition – hidden, used by reference */}
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
        }}
      >
        <defs>
          <filter id="grain-filter" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.72"
              numOctaves="4"
              stitchTiles="stitch"
              result="noiseOut"
            />
            <feColorMatrix
              type="saturate"
              values="0"
              in="noiseOut"
              result="grayNoise"
            />
            <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" />
          </filter>
        </defs>
      </svg>

      {/* Grain layer */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 40,
          pointerEvents: "none",
          opacity: 0.038,
          filter: "url(#grain-filter)",
          background: "white",
          mixBlendMode: "overlay",
        }}
      />
    </>
  );
}
