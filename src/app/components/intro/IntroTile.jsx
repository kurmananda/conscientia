"use client";

import React from "react";
import Image from "next/image";
import type { TileConfig } from "./tiles-config";
import { DEPTH_STYLES } from "./tiles-config";

/**
 * IntroTile
 * ─────────────────────────────────────────────────────────────────────────────
 * A single floating gallery tile.
 *
 * Positioning is absolute, relative to the camera wrapper.
 * The `intro-tile` CSS class provides the `translate: var(--px) var(--py)`
 * rule so the parallax rAF loop can offset tiles independently from GSAP's
 * `transform` property (which handles float + appear animations).
 *
 * Depth is encoded visually via filter (blur + brightness) and scale.
 */

interface IntroTileProps {
  tile: TileConfig;
  index: number;
  tileRef: (el: HTMLDivElement | null) => void;
}

export const IntroTile = React.memo(function IntroTile({
  tile,
  tileRef,
}: IntroTileProps) {
  const depth = DEPTH_STYLES[tile.depth];

  // Box shadow scales with depth
  const shadow =
    tile.depth === 0
      ? "0 22px 64px rgba(0,0,0,0.60), 0 4px 18px rgba(0,0,0,0.45)"
      : tile.depth === 1
      ? "0 14px 42px rgba(0,0,0,0.50), 0 2px 10px rgba(0,0,0,0.35)"
      : "0 6px 24px rgba(0,0,0,0.40)";

  return (
    <div
      ref={tileRef}
      className="intro-tile"
      style={{
        // ── Layout ────────────────────────────────────────────────────────
        position:    "absolute",
        left:        `calc(50% + ${tile.x}vw)`,
        top:         `calc(50% + ${tile.y}vh)`,
        transform:   "translate(-50%, -50%)",

        // ── Size ──────────────────────────────────────────────────────────
        width:       `${tile.widthVw}vw`,
        aspectRatio: tile.aspectRatio,

        // ── Depth visuals ─────────────────────────────────────────────────
        // filter is applied as inline style; GSAP may update it on exit.
        filter:      `blur(${depth.blur}px) brightness(${depth.brightness})`,

        // ── Aesthetics ────────────────────────────────────────────────────
        borderRadius:  "3px",
        overflow:      "hidden",
        boxShadow:     shadow,
        willChange:    "transform, opacity, filter",

        // Start invisible – GSAP animates opacity in
        opacity: 0,
      }}
    >
      {/* Inset border – adds edge definition without hard outlines */}
      <div
        aria-hidden="true"
        style={{
          position:      "absolute",
          inset:         0,
          zIndex:        1,
          borderRadius:  "inherit",
          boxShadow:     "inset 0 0 0 1px rgba(255,255,255,0.07)",
          pointerEvents: "none",
        }}
      />

      <Image
        src={tile.src}
        alt={tile.alt}
        fill
        sizes={`${Math.round(tile.widthVw * 2)}vw`}
        style={{ objectFit: "cover" }}
        priority={tile.depth === 0}
        draggable={false}
      />
    </div>
  );
});
