"use client";

import React, { useRef } from "react";
import { IntroTile } from "./IntroTile";
import { TILES } from "./tiles-config";

/**
 * IntroGallery
 * ─────────────────────────────────────────────────────────────────────────────
 * The floating gallery stage.
 *
 * Hierarchy:
 *   galleryRef  – full-viewport container (opacity can be used as master fade)
 *     cameraRef – "camera" layer that drifts slowly (camera motion illusion)
 *       tiles   – each absolute-positioned IntroTile
 */

interface IntroGalleryProps {
  galleryRef: React.RefObject<HTMLDivElement | null>;
  cameraRef: React.RefObject<HTMLDivElement | null>;
  tilesRef: React.RefObject<(HTMLDivElement | null)[]>;
}

export function IntroGallery({ galleryRef, cameraRef, tilesRef }: IntroGalleryProps) {
  // Stable callback refs array – initialised once
  const stableRefs = useRef<((el: HTMLDivElement | null) => void)[]>(
    TILES.map((_, i) => (el: HTMLDivElement | null) => {
      tilesRef.current[i] = el;
    })
  );

  return (
    <div
      ref={galleryRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        overflow: "hidden",
      }}
    >
      {/* Camera drift wrapper */}
      <div
        ref={cameraRef}
        style={{
          position: "absolute",
          // Slightly oversized so drift doesn't expose edges
          inset: "-4%",
          width: "108%",
          height: "108%",
          willChange: "transform",
        }}
      >
        {TILES.map((tile, i) => (
          <IntroTile
            key={i}
            tile={tile}
            index={i}
            tileRef={stableRefs.current[i]}
          />
        ))}
      </div>
    </div>
  );
}
