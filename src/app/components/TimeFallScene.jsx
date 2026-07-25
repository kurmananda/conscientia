import { useRef, useCallback, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import ParticleField from './ParticleField';
import CameraRig from './CameraRig';

export default function TimeFallScene({ wide, enabled = true }) {
  const mouse = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const dpr = useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return [0.5, 1];
    return [1, 1.5];
  }, []);

  const handleMouseMove = useCallback((e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -((e.clientY / window.innerHeight) * 2 - 1);
    mouse.current = { x, y };
  }, []);

  const handleTouchMove = useCallback((e) => {
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

  if (!enabled) {
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
      />
    );
  }

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
      <Canvas
        camera={{ position: [0, 0, 1], fov: 60 }}
        dpr={dpr}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <CameraRig mouse={mouse} />
        <ParticleField count={20000} mouse={mouse} />
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
      </Canvas>
    </div>
  );
}
