import { useRef, useState, useCallback, useEffect } from "react";
import useIsTouch from "./useIsTouch";

// Beyond this distance (px) from the card's center, tilt fades to ~0 instead
// of snapping — the previous implementation only tracked mouse position
// while it was literally inside the card's own box, so crossing the edge
// jumped straight from "flat" to "near max tilt" with no transition.
const MAX_DISTANCE = 320;

// Everything here used to go through React state (setTilt on every
// mousemove frame), which meant every currently-visible card re-rendered —
// recomputing several gradient-string style objects — up to 60 times a
// second. With several cards on screen at once that's the actual lag: the
// main thread gets so busy the whole page (scroll, the custom cursor, other
// input) stutters. The continuous tilt/shadow values are now written
// straight to the DOM node via the ref, bypassing React entirely; only
// `isHovered` — which flips rarely, just on enter/exit — stays as state,
// since it drives a couple of separate low-frequency UI bits.
export function useParallaxTilt(maxTilt = 18, enabled = true) {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const animFrameRef = useRef(null);
  const rectRef = useRef(null);
  const wasFlatRef = useRef(true);
  const isTouch = useIsTouch();

  useEffect(() => {
    // No pointer to tilt toward on touch devices, and no point tracking
    // mousemove for a card that's scrolled off-screen — skip attaching
    // listeners entirely rather than paying for N idle window listeners
    // (one per card) on a long listing page.
    if (isTouch || !enabled) return;

    const el = ref.current;
    if (!el) return;

    const updateRect = () => {
      rectRef.current = el.getBoundingClientRect();
    };
    updateRect();

    // Rect only changes on layout/scroll/resize, not on every mousemove —
    // caching it avoids a forced synchronous reflow read per frame per card.
    const ro = new ResizeObserver(updateRect);
    ro.observe(el);
    window.addEventListener("scroll", updateRect, { passive: true, capture: true });
    window.addEventListener("resize", updateRect, { passive: true });

    const handleWindowMove = (e) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      animFrameRef.current = requestAnimationFrame(() => {
        const rect = rectRef.current;
        if (!rect) return;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Far outside the falloff radius and already at rest: skip all
        // work entirely so off-screen/unrelated cards don't do anything
        // on every mousemove.
        if (distance > MAX_DISTANCE && wasFlatRef.current) return;

        const falloff = Math.max(0, 1 - distance / MAX_DISTANCE);

        const xPct = Math.max(-0.5, Math.min(0.5, dx / rect.width));
        const yPct = Math.max(-0.5, Math.min(0.5, dy / rect.height));

        const isInside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        wasFlatRef.current = falloff === 0 && !isInside;

        const rotateX = -yPct * maxTilt * 2 * falloff;
        const rotateY = xPct * maxTilt * 2 * falloff;
        const scale = isInside ? 1.04 : 1;

        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;

        setIsHovered((prev) => (prev === isInside ? prev : isInside));
      });
    };

    window.addEventListener("mousemove", handleWindowMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleWindowMove);
      window.removeEventListener("scroll", updateRect, { capture: true });
      window.removeEventListener("resize", updateRect);
      ro.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (el) el.style.transform = "";
    };
  }, [maxTilt, isTouch, enabled]);

  // No-ops kept so existing onMouseEnter/onMouseMove/onMouseLeave wiring
  // (e.g. triggering a hover sound) doesn't need to change.
  const handleMouseMove = useCallback(() => {}, []);
  const handleMouseEnter = useCallback(() => {}, []);
  const handleMouseLeave = useCallback(() => {}, []);

  return { ref, isHovered, handleMouseMove, handleMouseLeave, handleMouseEnter };
}
