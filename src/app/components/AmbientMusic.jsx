"use client";

import { useEffect, useRef } from "react";

interface AmbientMusicProps {
  src: string;
  volume?: number;
  start?: boolean;
}

export default function AmbientMusic({ src, volume = 0.25, start = false }: AmbientMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!start) return;

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;
    audio.play().catch(() => {});

    // fade in
    const fadeIn = setInterval(() => {
      if (audio.volume < volume - 0.01) {
        audio.volume = Math.min(volume, audio.volume + 0.008);
      } else {
        audio.volume = volume;
        clearInterval(fadeIn);
      }
    }, 50);

    return () => {
      clearInterval(fadeIn);
      const fadeOut = setInterval(() => {
        if (audio.volume > 0.01) {
          audio.volume *= 0.85;
        } else {
          clearInterval(fadeOut);
          audio.pause();
          audio.src = "";
        }
      }, 30);
    };
  }, [src, volume, start]);

  return null;
}
