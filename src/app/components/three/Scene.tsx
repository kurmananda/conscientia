/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Conscientia — Time Fall  |  Main 3D Scene
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Root Three.js scene — mounts all sub-systems:
 *   - AtmosphereBackground  (stars + dark sky sphere)
 *   - SceneLighting         (cinematic key/fill/rim)
 *   - CameraController      (scroll-driven camera)
 *   - ObjectController      (scroll-driven object transforms + mouse tilt)
 *   - TransitionParticles   (burst/implode during transitions)
 *   - Model1, Model2, Model3 (placeholder objects — swap these)
 */

"use client";

import { useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  AdaptiveDpr,
  AdaptiveEvents,
  Preload,
} from "@react-three/drei";
import * as THREE from "three";
import SceneLighting from "./SceneLighting";
import CameraController from "./CameraController";
import ObjectController from "./ObjectController";
import TransitionParticles from "./TransitionParticles";
import Model1 from "../models/Model1";
import Model2 from "../models/Model2";
import Model3 from "../models/Model3";

/* ─── Props ────────────────────────────────────────────────────────────────── */
interface SceneProps {
  progressRef: React.MutableRefObject<number>;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
}

/* ─── Inner scene ──────────────────────────────────────────────────────────── */
function SceneInner({ progressRef, mouseRef }: SceneProps) {
  const objectRefs = useRef<(THREE.Group | null)[]>([null, null, null]);

  const setRef = (i: number) => (el: THREE.Group | null) => {
    objectRefs.current[i] = el;
  };

  return (
    <>
      {/* Environment map — dark, subtle reflections */}
      <Environment preset="night" />

      {/* Scene atmosphere (stars + dark sky) */}
      


      {/* Cinematic lighting rig */}
      <SceneLighting progressRef={progressRef} />

      {/* ── The three objects ────────────────────────────────────────────── */}
      {/*
       * The outer <group> is driven by ObjectController (position/scale/opacity).
       * Each Model component drives its own inner idle animation.
       * To swap: replace Model1/Model2/Model3 with your own component.
       */}
      <group ref={setRef(0)}>
        <Model1 />
      </group>

      <group ref={setRef(1)}>
        <Model2 />
      </group>

      <group ref={setRef(2)}>
        <Model3 />
      </group>

      {/* ── Controllers (invisible, run every frame) ─────────────────────── */}
      <CameraController progressRef={progressRef} mouseRef={mouseRef} />
      <ObjectController
        progressRef={progressRef}
        mouseRef={mouseRef}
        objectRefs={objectRefs}
      />

      {/* ── Particle transitions ─────────────────────────────────────────── */}
      <TransitionParticles progressRef={progressRef} />

      {/* Performance */}
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
      <Preload all />
    </>
  );
}

/* ─── Canvas (exported) ────────────────────────────────────────────────────── */
export default function Scene({ progressRef, mouseRef }: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 60, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <SceneInner progressRef={progressRef} mouseRef={mouseRef} />
      </Suspense>
    </Canvas>
  );
}
