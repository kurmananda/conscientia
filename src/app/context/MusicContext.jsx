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

    // Pause only when the tab is genuinely hidden (visibilitychange — the
    // one unambiguous "user actually left" signal). There used to also be
    // a window blur/focus pair meant to catch switching to another
    // application, but window blur fires on plenty of same-tab things too
    // (an element inside the page taking focus, certain navigations, etc.)
    // — that false-positive was pausing the music on ordinary in-app
    // navigation, e.g. opening an event's detail page.
    const onVisibility = () => {
      if (document.hidden) {
        audio.pause();
      } else if (!userPausedRef.current) {
        audio.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Belt-and-suspenders: something else on the page (a newly-mounted
    // autoplaying <video> — e.g. FetchIntro's loading background — can
    // make the browser's own media-focus heuristics pause other playing
    // media, independent of any of our own listeners above). Rather than
    // chase every possible external trigger, just treat any pause that
    // wasn't us calling toggle() and isn't a hidden tab as unintended, and
    // resume automatically.
    const onPause = () => {
      if (userPausedRef.current || document.hidden) return;
      audio.play().catch(() => {});
    };
    audio.addEventListener("pause", onPause);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      audio.removeEventListener("pause", onPause);
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
