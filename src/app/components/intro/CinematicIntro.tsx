"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface CinematicIntroProps {
  onComplete: () => void;
}

export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const logo = logoRef.current;
    if (!overlay || !logo) return;

    gsap.set(overlay, { opacity: 1 });
    gsap.set(logo, { opacity: 0, scale: 0.9 });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(overlay, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.inOut",
          onComplete,
        });
      },
    });

    tl.to(overlay, { opacity: 0, duration: 1.2, ease: "power2.out" }, 0)
      .to(logo, { opacity: 1, scale: 1, duration: 1.4, ease: "power3.out" }, 0)
      .to({}, { duration: 1.5 })
      .to(logo, { opacity: 0, scale: 1.05, duration: 0.9, ease: "power2.inOut" });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        overflow: "hidden",
        background: "#000",
      }}
    >
      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 20,
          background: "#000",
          pointerEvents: "none",
        }}
      />

      <div
        ref={logoRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <video
          autoPlay
          muted
          playsInline
          preload="auto"
          style={{ width: "min(380px, 60vw)", height: "auto", objectFit: "contain" }}
        >
          <source src="/intro.webm" type="video/webm" />
          <source src="/intro.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
