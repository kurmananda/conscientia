"use client";

/**
 * useIntroAnimation
 * ─────────────────────────────────────────────────────────────────────────────
 * Central GSAP animation hook that orchestrates the full intro timeline.
 *
 * Animation phases:
 *   1. Black screen → Logo fades in (scale + opacity)
 *   2. Logo holds, then fades out
 *   3. Tiles stagger in (opacity + scale + translateY + rotation)
 *   4. Ambient float starts per-tile (infinite yoyo tweens)
 *   5. Camera drift starts (very slow, infinite yoyo)
 *   6. Mouse parallax running in rAF loop (separate from GSAP transforms)
 *   7. Exit: hero tile → fullscreen → blackout → onComplete
 */

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { TILES, DEPTH_STYLES } from "./tiles-config";

// ─── Timing (seconds) ────────────────────────────────────────────────────────
const T = {
  logoFadeIn: 1.4,
  logoHold: 1.2,
  logoFadeOut: 0.9,
  firstTileDelay: 0.15,   // after logo is gone
  tileAppear: 0.6,         // per-tile appear duration
  galleryHold: 0.5,        // gallery visible before exit
  exitOthers: 0.8,         // non-hero fade/blur out
  exitHero: 1.0,           // hero expansion
  exitBlackout: 0.4,      // final fade to black
} as const;

// Ambient float amplitudes per depth
const AMP = {
  0: { y: 14, x: 5,  r: 1.2 },
  1: { y: 10, x: 4,  r: 0.9 },
  2: { y: 7,  x: 3,  r: 0.6 },
} as const;

// Parallax travel (px) at depth 0 – deeper tiles move proportionally less
const PARALLAX_MAX = 28;

export interface IntroRefs {
  overlayRef:  React.RefObject<HTMLDivElement | null>;
  logoRef:     React.RefObject<HTMLDivElement | null>;
  galleryRef:  React.RefObject<HTMLDivElement | null>;
  tilesRef:    React.RefObject<(HTMLDivElement | null)[]>;
  cameraRef:   React.RefObject<HTMLDivElement | null>;
}

export function useIntroAnimation({
  onComplete,
  refs,
}: {
  onComplete: () => void;
  refs: IntroRefs;
}) {
  const { overlayRef, logoRef, galleryRef, tilesRef, cameraRef } = refs;

  // --- Internal refs (never cause re-renders) --------------------------------
  const gsapCtx       = useRef<gsap.Context | null>(null);
  const floatTweens   = useRef<gsap.core.Tween[]>([]);
  const cameraTween   = useRef<gsap.core.Tween | null>(null);
  const rafId         = useRef<number>(0);
  const exitStarted   = useRef(false);

  // Smooth mouse position (-1 … +1 from center)
  const targetMouse   = useRef({ x: 0, y: 0 });
  const smoothMouse   = useRef({ x: 0, y: 0 });

  // ── Mouse listener ────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e: MouseEvent) => {
    targetMouse.current.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    targetMouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, []);

  // ── Parallax rAF loop ─────────────────────────────────────────────────────
  // We write to a GSAP-controlled transform via gsap.set() which is safe
  // because we use a dedicated wrapper div per tile (the parallax div) that
  // GSAP does NOT touch during the float tweens. The tile's inner wrapper is
  // what GSAP animates; the outer div carries the parallax offset.
  // In this implementation, tiles are positioned absolutely by CSS and GSAP
  // animates their transform. We use a second, lighter approach: we offset
  // the whole cameraRef slightly based on mouse position, layered on top of
  // the camera drift. This avoids per-tile DOM writes in the hot loop.
  const startParallaxLoop = useCallback(() => {
    const tiles = tilesRef.current;

    const loop = () => {
      // Lerp smooth mouse toward target
      const lx = smoothMouse.current.x;
      const ly = smoothMouse.current.y;
      const tx = targetMouse.current.x;
      const ty = targetMouse.current.y;

      smoothMouse.current.x = lx + (tx - lx) * 0.05;
      smoothMouse.current.y = ly + (ty - ly) * 0.05;

      // Apply per-tile parallax
      if (tiles) {
        tiles.forEach((el, i) => {
          if (!el) return;
          const tile = TILES[i];
          if (!tile) return;
          const factor = DEPTH_STYLES[tile.depth].parallaxFactor;
          const px = smoothMouse.current.x * PARALLAX_MAX * factor;
          const py = smoothMouse.current.y * PARALLAX_MAX * factor * 0.6;
          // gsap.quickSetter is the fastest way to set transform without
          // triggering layout. We create these once.
          el.style.setProperty("--px", `${px.toFixed(2)}px`);
          el.style.setProperty("--py", `${py.toFixed(2)}px`);
        });
      }

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);
  }, [tilesRef]);

  // ── Ambient float (single tile) ───────────────────────────────────────────
  const startFloat = useCallback(
    (el: HTMLDivElement, depth: 0 | 1 | 2) => {
      const amp = AMP[depth];
      const dur = 5.5 + Math.random() * 4;
      const sign = () => (Math.random() > 0.5 ? 1 : -1);

      const t = gsap.to(el, {
        y:        `+=${amp.y * sign()}`,
        x:        `+=${amp.x * sign()}`,
        rotation: `+=${amp.r * sign()}`,
        duration: dur,
        delay:    Math.random() * 1.5,
        ease:     "sine.inOut",
        repeat:   -1,
        yoyo:     true,
      });
      floatTweens.current.push(t);
    },
    []
  );

  // ── Camera drift ──────────────────────────────────────────────────────────
  const startCameraDrift = useCallback((camera: HTMLDivElement) => {
    cameraTween.current = gsap.to(camera, {
      xPercent: 1.5,
      yPercent: 1.2,
      duration: 24,
      ease:     "sine.inOut",
      repeat:   -1,
      yoyo:     true,
    });
  }, []);

  // ── Exit transition ───────────────────────────────────────────────────────
  const runExit = useCallback(() => {
    if (exitStarted.current) return;
    exitStarted.current = true;

    // Kill motion
    cancelAnimationFrame(rafId.current);
    floatTweens.current.forEach((t) => t.kill());
    cameraTween.current?.kill();

    const tiles   = tilesRef.current;
    const overlay = overlayRef.current;
    if (!tiles || !overlay) return;

    const heroIndex = TILES.findIndex((t) => t.isHero);
    const heroEl    = heroIndex >= 0 ? tiles[heroIndex] : tiles[0];
    const others    = tiles.filter((el, i) => el && i !== heroIndex) as HTMLDivElement[];

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(overlay, {
          opacity:  1,
          duration: T.exitBlackout,
          ease:     "power2.inOut",
          onComplete,
        });
      },
    });

    // Non-hero tiles fade + blur out
    tl.to(
      others,
      {
        opacity:  0,
        scale:    0.93,
        filter:   "blur(10px) brightness(0.5)",
        duration: T.exitOthers,
        ease:     "power2.inOut",
        stagger:  0.025,
      },
      0
    );

    // Hero tile expands to fullscreen
    if (heroEl) {
      tl.to(
        heroEl,
        {
          // Position & size override
          width:    "100vw",
          height:   "100vh",
          left:     "50%",
          top:      "50%",
          xPercent: -50,
          yPercent: -50,
          rotation: 0,
          scale:    1,
          filter:   "blur(0px) brightness(1)",
          borderRadius: 0,
          duration: T.exitHero,
          ease:     "expo.inOut",
        },
        0
      );
    }
  }, [tilesRef, overlayRef, onComplete]);

  // ── Main orchestration ────────────────────────────────────────────────────
  useEffect(() => {
    const logo    = logoRef.current;
    const overlay = overlayRef.current;
    const gallery = galleryRef.current;
    const camera  = cameraRef.current;
    const tiles   = tilesRef.current;

    if (!logo || !overlay || !gallery || !camera) return;

    gsapCtx.current = gsap.context(() => {
      // Initial states
      gsap.set(overlay,  { opacity: 1 });
      gsap.set(logo,     { opacity: 0, scale: 0.9 });
      gsap.set(gallery,  { opacity: 1 });

      // Hide all tiles until their staggered reveal
      if (tiles) {
        tiles.forEach((el, i) => {
          if (!el) return;
          gsap.set(el, {
            opacity:  0,
            scale:    0.85,
            y:        40,
            rotation: TILES[i]?.rotation ?? 0,
          });
        });
      }

      // ── Phase 1: Logo reveal ──────────────────────────────────────────────
      const master = gsap.timeline();

      master
        // Fade out the black overlay as logo fades in
        .to(overlay, {
          opacity:  0,
          duration: T.logoFadeIn * 0.85,
          ease:     "power2.out",
        }, 0)
        // Logo appears
        .to(logo, {
          opacity:  1,
          scale:    1,
          duration: T.logoFadeIn,
          ease:     "power3.out",
        }, 0)
        // Hold
        .to({}, { duration: T.logoHold })
        // Logo fades away
        .to(logo, {
          opacity:  0,
          scale:    1.05,
          duration: T.logoFadeOut,
          ease:     "power2.inOut",
        })

        // ── Phase 2 & 3: Tile reveals + ambient float ───────────────────────
        .call(() => {
          // Start camera drift
          startCameraDrift(camera);

          if (!tiles) return;

          tiles.forEach((el, i) => {
            if (!el) return;
            const tile = TILES[i];
            if (!tile) return;

            const appearDelay = tile.delay / 1000 + T.firstTileDelay;

            gsap.to(el, {
              opacity:  1,
              scale:    DEPTH_STYLES[tile.depth].scale,
              y:        0,
              duration: T.tileAppear,
              delay:    appearDelay,
              ease:     "expo.out",
              onComplete: () => {
                // Ambient float begins once tile has settled
                startFloat(el, tile.depth);
              },
            });
          });

          // Schedule exit after the last tile is fully revealed + hold time
          const lastDelay =
            Math.max(...TILES.map((t) => t.delay)) / 1000 +
            T.firstTileDelay +
            T.tileAppear;

          gsap.delayedCall(lastDelay + T.galleryHold, runExit);
        });
    });

    // Start mouse tracking + parallax loop
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    startParallaxLoop();

    return () => {
      gsapCtx.current?.revert();
      floatTweens.current.forEach((t) => t.kill());
      cameraTween.current?.kill();
      cancelAnimationFrame(rafId.current);
      window.removeEventListener("mousemove", onMouseMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty – runs once on mount
}
