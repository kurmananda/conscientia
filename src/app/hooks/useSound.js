"use client";

import { useCallback, useEffect } from "react";

let ctx = null;
const buffers = new Map();
const activeSources = new Map();

function ensureCtx() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

// Browsers only allow an AudioContext to resume from within a trusted
// user-activation gesture (click/keydown/pointerdown/touchstart) — NOT
// hover (mouseenter). Several sounds here play on hover, so we warm up
// (create + resume) the shared context on the very first real gesture,
// independent of whether a sound was actually requested. Without this,
// a hover-triggered play() before any click permanently leaves the
// context suspended and silent.
if (typeof document !== "undefined") {
  const warmUp = () => ensureCtx();
  ["pointerdown", "keydown", "touchstart", "mousedown"].forEach((e) =>
    document.addEventListener(e, warmUp, { once: true, passive: true })
  );
}

function getCtx() {
  return ensureCtx();
}

export default function useSound(
  src,
  volume = 0.3,
  maxDuration,
  single = false,
) {
  const play = useCallback(() => {
    try {
      const c = getCtx();
      if (c.state === "suspended") c.resume();

      const doPlay = (buffer) => {
        if (single) {
          const prev = activeSources.get(src);
          if (prev) { try { prev.stop(); } catch {} activeSources.delete(src); }
        }
        const source = c.createBufferSource();
        const gain = c.createGain();
        source.buffer = buffer;
        gain.gain.value = Math.max(0, Math.min(1, volume));
        source.connect(gain).connect(c.destination);
        source.start(0, 0, maxDuration);
        if (single) {
          activeSources.set(src, source);
          source.onended = () => {
            if (activeSources.get(src) === source) activeSources.delete(src);
          };
        }
      };

      const cached = buffers.get(src);
      if (cached) {
        doPlay(cached);
      } else {
        fetch(src)
          .then((r) => r.arrayBuffer())
          .then((buf) => c.decodeAudioData(buf))
          .then((decoded) => { buffers.set(src, decoded); doPlay(decoded); })
          .catch(() => {});
      }
    } catch {}
  }, [src, volume, maxDuration, single]);

  return play;
}
