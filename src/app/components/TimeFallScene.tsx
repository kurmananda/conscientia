import { useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import ParticleField from './ParticleField';
import TimeStreaks from './TimeStreaks';
import CameraRig from './CameraRig';

export default function TimeFallScene() {
  const mouse = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: '#000000',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <Canvas camera={{ position: [0, 0, 18], fov: 60 }}>
    <CameraRig mouse={mouse} />
    <ParticleField count={20000} mouse={mouse} />
</Canvas>
    </div>
  );
}
