"use client";

import { useRef, useCallback, useEffect } from "react";

/**
 * useSound — lightweight Web Audio API hook.
 * Preloads the audio file and returns a `play` function.
 * Volume is clamped 0–1.
 *
 * When `single` is true, only one instance of this sound plays at a time
 * (previous playback is stopped before starting a new one).
 */

// Shared AudioContext + decoded buffers (across all useSound instances)
let sharedCtx: AudioContext | null = null;
const decodedBuffers = new Map<string, AudioBuffer>();
const activeSources = new Map<string, AudioBufferSourceNode>();

function getCtx() {
  if (!sharedCtx) {
    sharedCtx = new AudioContext();
    // Auto-resume on first user interaction
    const resume = () => {
      if (sharedCtx?.state === "suspended") sharedCtx.resume();
      window.removeEventListener("click", resume);
      window.removeEventListener("touchstart", resume);
      window.removeEventListener("keydown", resume);
    };
    window.addEventListener("click", resume, { once: true });
    window.addEventListener("touchstart", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
  }
  return sharedCtx;
}

export default function useSound(
  src: string,
  volume = 0.3,
  maxDuration?: number,
  single = false,
) {
  // Preload audio on mount
  useEffect(() => {
    const ctx = getCtx();
    if (!decodedBuffers.has(src)) {
      fetch(src)
        .then((r) => r.arrayBuffer())
        .then((buf) => ctx.decodeAudioData(buf))
        .then((decoded) => {
          decodedBuffers.set(src, decoded);
        })
        .catch(() => {});
    }
  }, [src]);

  const play = useCallback(() => {
    try {
      const ctx = getCtx();
      if (ctx.state === "suspended") ctx.resume();

      const playBuffer = (buffer: AudioBuffer) => {
        if (single) {
          const prev = activeSources.get(src);
          if (prev) {
            try { prev.stop(); } catch {}
            activeSources.delete(src);
          }
        }

        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buffer;
        gain.gain.value = Math.max(0, Math.min(1, volume));
        source.connect(gain).connect(ctx.destination);
        source.start(0, 0, maxDuration);

        if (single) {
          activeSources.set(src, source);
          source.onended = () => {
            if (activeSources.get(src) === source) activeSources.delete(src);
          };
        }
      };

      const cached = decodedBuffers.get(src);
      if (cached) {
        playBuffer(cached);
      } else {
        fetch(src)
          .then((r) => r.arrayBuffer())
          .then((buf) => ctx.decodeAudioData(buf))
          .then((decoded) => {
            decodedBuffers.set(src, decoded);
            playBuffer(decoded);
          })
          .catch(() => {});
      }
    } catch {
      // Silently fail — sounds are decorative
    }
  }, [src, volume, maxDuration, single]);

  return play;
}
