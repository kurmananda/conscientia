"use client";

import { useEffect, useRef } from "react";

// Edit these two to swap the background track: `src` must be a direct
// audio file URL (mp3/wav — e.g. your own hosting or a CDN link to a
// track you have the rights to play; a youtube.com/watch URL will NOT
// work here since YouTube doesn't serve raw audio files). `volume` is
// 0–1.
const AMBIENT_TRACK_SRC = "/sounds/ambient.wav";
const AMBIENT_TRACK_VOLUME = 0.4;

// Mounted once in the root layout so it persists across client-side
// navigation (layouts don't remount on route change) — background music
// keeps playing continuously site-wide instead of restarting per page.
export default function SiteAmbientMusic({ src = AMBIENT_TRACK_SRC, volume = AMBIENT_TRACK_VOLUME }) {
  const audioRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;

    const events = ["pointerdown", "keydown", "touchstart"];

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      audio.play().then(() => {
        events.forEach((e) => document.removeEventListener(e, start));
      }).catch(() => { startedRef.current = false; });
      const fadeIn = setInterval(() => {
        if (audio.volume < volume - 0.01) {
          audio.volume = Math.min(volume, audio.volume + 0.006);
        } else {
          audio.volume = volume;
          clearInterval(fadeIn);
        }
      }, 50);
    };

    // Browsers block audio autoplay until a real user gesture — start
    // on the first click/keydown/touch anywhere on the site.
    events.forEach((e) => document.addEventListener(e, start, { passive: true }));

    return () => {
      events.forEach((e) => document.removeEventListener(e, start));
      audio.pause();
      audio.src = "";
    };
  }, [src, volume]);

  return null;
}
