"use client";

import { useEffect, useState } from "react";
import LoadingState from "./LoadingState";

/** Fetch-driven loading overlay: blurred intro video backdrop + spinner.
 * Shown only while `loading` is true (real data fetch), fades out once done. */
export default function FetchIntro({ loading, label = "Loading", accentColor = "#33d6ff" }) {
  const [mounted, setMounted] = useState(loading);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => setMounted(false), 400);
    return () => clearTimeout(t);
  }, [loading]);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        opacity: loading ? 1 : 0,
        transition: "opacity 0.4s ease-out",
        pointerEvents: loading ? "auto" : "none",
        overflow: "hidden",
        background: "#030304",
      }}
    >
      <video
        className="fetch-intro-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/intro.webm" type="video/webm" />
        <source src="/intro.mp4" type="video/mp4" />
      </video>
      <div style={{ position: "absolute", inset: 0, background: "rgba(3,3,4,0.45)" }} />
      <LoadingState label={label} accentColor={accentColor} />

      <style>{`
        .fetch-intro-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: blur(8px) brightness(0.55);
          transform: scale(1.05);
        }
        @media (max-width: 640px) {
          .fetch-intro-video {
            object-fit: contain;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
