import { useRef, useCallback, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import ParticleField from './ParticleField';
import TimeStreaks from './TimeStreaks';
import CameraRig from './CameraRig';

export default function TimeFallScene({ wide }: { wide?: boolean }) {
  const mouse = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dpr = useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return [0.5, 1] as [number, number];
    return [1, 1.5] as [number, number];
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -((e.clientY / window.innerHeight) * 2 - 1);
    mouse.current = { x, y };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const x = (touch.clientX / window.innerWidth) * 2 - 1;
      const y = -((touch.clientY / window.innerHeight) * 2 - 1);
      mouse.current = { x, y };
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleMouseMove, handleTouchMove]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: wide ? '-5vw' : 0,
        width: wide ? '110vw' : '100vw',
        height: '100vh',
        background: '#000000',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      <Canvas dpr={dpr} camera={{ position: [0, 0, 1], fov: 60 }}>
    <CameraRig mouse={mouse} />
    <ParticleField count={20000} mouse={mouse} />
</Canvas>
    </div>
  );
}
