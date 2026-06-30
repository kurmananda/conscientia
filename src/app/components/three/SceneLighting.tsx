/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Conscientia — Time Fall  |  Scene Lighting
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Cinematic lighting rig.
 * - Key light: directional, slightly warm, positioned top-left
 * - Fill light: cool, low intensity, opposite side
 * - Rim light: subtle back-light to separate object from background
 * - Ambient: very low to keep the scene dark and premium
 *
 * The lights animate slightly based on scroll progress for added life.
 */

"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SceneLightingProps {
  progressRef: React.MutableRefObject<number>;
}

export default function SceneLighting({ progressRef }: SceneLightingProps) {
  const keyLightRef  = useRef<THREE.DirectionalLight>(null);
  const rimLightRef  = useRef<THREE.DirectionalLight>(null);
  const fillLightRef = useRef<THREE.DirectionalLight>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    // Subtle key-light drift
    if (keyLightRef.current) {
      keyLightRef.current.position.x = 4 + Math.sin(t * 0.2) * 0.8;
      keyLightRef.current.position.y = 5 + Math.cos(t * 0.15) * 0.6;
    }

    // Rim light slowly orbits
    if (rimLightRef.current) {
      rimLightRef.current.position.x = Math.cos(t * 0.1) * 4;
      rimLightRef.current.position.z = Math.sin(t * 0.1) * -4 - 2;
    }
  });

  return (
    <>
      {/* ── Ambient ─────────────────────────────────────────────────────────── */}
      <ambientLight intensity={0.06} color="#ffffff" />

      {/* ── Key Light (warm, directional) ───────────────────────────────────── */}
      <directionalLight
        ref={keyLightRef}
        color="#fff5e8"
        intensity={2.2}
        position={[4, 5, 3]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />

      {/* ── Fill Light (cool, opposite) ─────────────────────────────────────── */}
      <directionalLight
        ref={fillLightRef}
        color="#c8d8ff"
        intensity={0.4}
        position={[-5, -2, 2]}
      />

      {/* ── Rim / Back Light ────────────────────────────────────────────────── */}
      <directionalLight
        ref={rimLightRef}
        color="#ffffff"
        intensity={0.7}
        position={[-3, 2, -5]}
      />

      {/* ── Point light close up (subtle bounce) ───────────────────────────── */}
      <pointLight
        color="#6699ff"
        intensity={0.3}
        distance={8}
        position={[0, -3, 2]}
      />
    </>
  );
}
