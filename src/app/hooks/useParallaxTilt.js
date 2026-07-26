import { useRef, useState, useCallback, useEffect } from "react";
import useIsTouch from "./useIsTouch";

const defaultState = {
  rotateX: 0,
  rotateY: 0,
  glareX: 50,
  glareY: 50,
  glareOpacity: 0,
  shadowX: 0,
  shadowY: 0,
  isHovered: false,
  scale: 1,
};

// Beyond this distance (px) from the card's center, tilt fades to ~0 instead
// of snapping — the previous implementation only tracked mouse position
// while it was literally inside the card's own box, so crossing the edge
// jumped straight from "flat" to "near max tilt" with no transition.
const MAX_DISTANCE = 320;

export function useParallaxTilt(maxTilt = 18, enabled = true) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState(defaultState);
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

        // Far outside the falloff radius and already at rest: skip the
        // state update entirely so off-screen/unrelated cards don't
        // re-render on every mousemove.
        if (distance > MAX_DISTANCE && wasFlatRef.current) return;

        const falloff = Math.max(0, 1 - distance / MAX_DISTANCE);

        const xPct = Math.max(-0.5, Math.min(0.5, dx / rect.width));
        const yPct = Math.max(-0.5, Math.min(0.5, dy / rect.height));

        const isInside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const glareX = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));
        const glareY = Math.max(0, Math.min(100, (mouseY / rect.height) * 100));
        const distFromCenter = Math.sqrt(xPct * xPct + yPct * yPct);
        const glareOpacity = isInside ? Math.min(distFromCenter * 1.2, 0.6) : 0;

        wasFlatRef.current = falloff === 0 && !isInside;

        setTilt({
          rotateX: -yPct * maxTilt * 2 * falloff,
          rotateY: xPct * maxTilt * 2 * falloff,
          glareX,
          glareY,
          glareOpacity,
          shadowX: xPct * 40 * falloff,
          shadowY: yPct * 40 * falloff,
          isHovered: isInside,
          scale: isInside ? 1.04 : 1,
        });
      });
    };

    window.addEventListener("mousemove", handleWindowMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleWindowMove);
      window.removeEventListener("scroll", updateRect, { capture: true });
      window.removeEventListener("resize", updateRect);
      ro.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [maxTilt, isTouch, enabled]);

  // No-ops kept so existing onMouseEnter/onMouseMove/onMouseLeave wiring
  // (e.g. triggering a hover sound) doesn't need to change.
  const handleMouseMove = useCallback(() => {}, []);
  const handleMouseEnter = useCallback(() => {}, []);
  const handleMouseLeave = useCallback(() => {}, []);

  return { ref, tilt, handleMouseMove, handleMouseLeave, handleMouseEnter };
}
