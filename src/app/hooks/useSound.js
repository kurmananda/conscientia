"use client";

import { useCallback, useEffect } from "react";

let ctx: AudioContext | null = null;
const buffers = new Map<string, AudioBuffer>();
const activeSources = new Map<string, AudioBufferSourceNode>();
let unlocking = false;

function unlock() {
  if (unlocking) return;
  unlocking = true;
  const resume = () => {
    if (ctx?.state === "suspended") ctx.resume().catch(() => {});
  };
  resume();
  ["pointerdown", "keydown", "touchstart", "click"].forEach((e) =>
    document.addEventListener(e, resume, { once: true })
  );
}

function getCtx() {
  if (!ctx) {
    ctx = new AudioContext();
    unlock();
  }
  return ctx;
}

export default function useSound(
  src: string,
  volume = 0.3,
  maxDuration?: number,
  single = false,
) {
  const play = useCallback(() => {
    try {
      const c = getCtx();
      if (c.state === "suspended") c.resume();

      const doPlay = (buffer: AudioBuffer) => {
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
