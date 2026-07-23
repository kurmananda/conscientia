import { useRef, useState, useCallback } from "react";

export interface TiltState {
  rotateX: number;
  rotateY: number;
  glareX: number;
  glareY: number;
  glareOpacity: number;
  shadowX: number;
  shadowY: number;
  isHovered: boolean;
  scale: number;
}

const defaultState: TiltState = {
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

export function useParallaxTilt(maxTilt = 18) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<TiltState>(defaultState);
  const animFrameRef = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      animFrameRef.current = requestAnimationFrame(() => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / rect.width - 0.5; // -0.5 to 0.5
        const yPct = mouseY / rect.height - 0.5; // -0.5 to 0.5

        const rotateY = xPct * maxTilt * 2;
        const rotateX = -yPct * maxTilt * 2;

        const shadowX = xPct * 40;
        const shadowY = yPct * 40;

        const glareX = (mouseX / rect.width) * 100;
        const glareY = (mouseY / rect.height) * 100;

        const distFromCenter = Math.sqrt(xPct * xPct + yPct * yPct);
        const glareOpacity = Math.min(distFromCenter * 1.2, 0.6);

        setTilt({
          rotateX,
          rotateY,
          glareX,
          glareY,
          glareOpacity,
          shadowX,
          shadowY,
          isHovered: true,
          scale: 1.04,
        });
      });
    },
    [maxTilt]
  );

  const handleMouseEnter = useCallback(() => {
    setTilt((prev) => ({ ...prev, isHovered: true, scale: 1.04 }));
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setTilt(defaultState);
  }, []);

  return { ref, tilt, handleMouseMove, handleMouseLeave, handleMouseEnter };
}
