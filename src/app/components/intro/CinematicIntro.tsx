"use client";

/**
 * CinematicIntro
 * ─────────────────────────────────────────────────────────────────────────────
 * Top-level intro wrapper. Renders over the full viewport until the animation
 * completes, then calls `onComplete` which unmounts this component.
 *
 * Composition:
 *   CinematicIntro
 *     ├─ Black overlay      (fades in/out to mask transitions)
 *     ├─ IntroLogo          (Phase 1 wordmark)
 *     ├─ IntroGallery       (Phase 2+ floating tile gallery)
 *     └─ GrainOverlay       (always-on subtle noise texture)
 */

import React, { useRef } from "react";
import { IntroLogo }    from "./IntroLogo";
import { IntroGallery } from "./IntroGallery";
import { GrainOverlay } from "./GrainOverlay";
import { useIntroAnimation, type IntroRefs } from "./use-intro-animation";
import { TILES } from "./tiles-config";

interface CinematicIntroProps {
  /** Called after the exit animation completes. Use to unmount the intro. */
  onComplete: () => void;
}

export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  // ── DOM refs (passed to animation hook) ───────────────────────────────────
  const overlayRef = useRef<HTMLDivElement>(null);
  const logoRef    = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const cameraRef  = useRef<HTMLDivElement>(null);
  // Array of tile element refs – pre-allocated to TILES.length
  const tilesRef   = useRef<(HTMLDivElement | null)[]>(
    Array(TILES.length).fill(null)
  );

  const animationRefs: IntroRefs = {
    overlayRef,
    logoRef,
    galleryRef,
    tilesRef,
    cameraRef,
  };

  // Kick off the full animation timeline
  useIntroAnimation({ onComplete, refs: animationRefs });

  return (
    <div
      role="presentation"
      aria-hidden="true"
      style={{
        position:   "fixed",
        inset:      0,
        zIndex:     9999,
        overflow:   "hidden",
        // Deep, warm near-black background with a subtle radial gradient
        background: "#000000",
      }}
    >
      {/* ── Black overlay (controls fades between phases) ─────────────────── */}
      <div
        ref={overlayRef}
        style={{
          position:   "absolute",
          inset:      0,
          zIndex:     20,
          background: "#000",
          pointerEvents: "none",
        }}
      />

      {/* ── Phase 1: Centered logo ─────────────────────────────────────────── */}
      <IntroLogo logoRef={logoRef} />

      {/* ── Phase 2+: Floating gallery ─────────────────────────────────────── */}
      <IntroGallery
        galleryRef={galleryRef}
        cameraRef={cameraRef}
        tilesRef={tilesRef}
      />

      {/* ── Always-on grain texture ─────────────────────────────────────────── */}
      <GrainOverlay />
    </div>
  );
}
