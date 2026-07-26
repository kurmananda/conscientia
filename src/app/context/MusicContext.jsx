"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const TRACK_SRC = "/sounds/tansyn.mp3";
const TRACK_VOLUME = 0.1;

const MusicContext = createContext({
  playing: false,
  muted: true,
  toggle: () => {},
});

export const useMusic = () => useContext(MusicContext);

// Mounted once in the root layout so it persists across client-side
// navigation (layouts don't remount on route change) — background music
// keeps playing continuously site-wide instead of restarting per page.
//
// Single control path only: the track auto-starts muted on mount (browsers
// always allow silent autoplay), so it's genuinely playing — not paused —
// the instant it loads, and the vinyl-disc toggle is the ONE place that
// unmutes/pauses/resumes it. There used to be a second path (a document-
// wide "first click anywhere" listener) racing against the disc's own
// click handler — that's what caused needing two clicks (mute, then
// unmute) to actually hear anything. Removed.
export function MusicProvider({ children }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const audioRef = useRef(null);
  const userPausedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(TRACK_SRC);
    audio.loop = true;
    audio.volume = TRACK_VOLUME;
    audio.muted = true;
    audioRef.current = audio;

    // Starts muted by default — the vinyl-disc toggle is what unmutes it.
    audio.play().then(() => setPlaying(true)).catch(() => {});

    // Pause whenever the page isn't the thing in front of the user — either
    // another tab (visibilitychange) or another application entirely
    // (window blur, which visibilitychange alone doesn't reliably catch:
    // switching to another app while the browser window stays technically
    // "visible" on screen doesn't always flip document.hidden). Resume on
    // whichever fires back to front, unless the user had explicitly paused.
    const onHide = () => audio.pause();
    const onShow = () => {
      if (!userPausedRef.current && !document.hidden && document.hasFocus()) {
        audio.play().catch(() => {});
      }
    };
    const onVisibility = () => (document.hidden ? onHide() : onShow());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onHide);
    window.addEventListener("focus", onShow);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onHide);
      window.removeEventListener("focus", onShow);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Ground truth from the element itself, not React state — avoids any
    // stale-closure edge cases.
    if (audio.paused) {
      userPausedRef.current = false;
      audio.muted = false;
      audio.volume = TRACK_VOLUME;
      audio.play().then(() => setPlaying(true)).catch(() => {});
      setMuted(false);
    } else if (audio.muted) {
      audio.muted = false;
      audio.volume = TRACK_VOLUME;
      setPlaying(true);
      setMuted(false);
    } else {
      userPausedRef.current = true;
      audio.pause();
      setPlaying(false);
    }
  };

  return <MusicContext.Provider value={{ playing, muted, toggle }}>{children}</MusicContext.Provider>;
}
