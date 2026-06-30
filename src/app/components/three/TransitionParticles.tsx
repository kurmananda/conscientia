/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Conscientia — Time Fall  |  Transition Particles
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Reads scroll progress every frame and animates two particle clouds:
 *   - "out" cloud: explodes away from the departing object
 *   - "in"  cloud: implodes toward the arriving object
 *
 * Both clouds are always mounted; opacity is driven to zero when inactive.
 */

"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { decodeScrollProgress } from "../engine/config";

// Per-object colour palette
const OBJECT_COLORS: Record<number, string> = {
  0: "#6baed6",
  1: "#cc88ff",
  2: "#ffd700",
};

const PARTICLE_COUNT = 250;
const SPREAD = 3.2;

interface ParticleCloudProps {
  mode: "out" | "in";
  progressRef: React.MutableRefObject<number>;
}

function ParticleCloud({ mode, progressRef }: ParticleCloudProps) {
  const meshRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const smoothProgress = useRef(0);
  const smoothColor = useRef(new THREE.Color(OBJECT_COLORS[0]));

  // Static spawn positions & velocities — generated once
  const { origins, velocities, phases } = useMemo(() => {
    const origins    = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const phases     = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 0.15 + Math.random() * 0.85;

      const ox = r * Math.sin(phi) * Math.cos(theta);
      const oy = r * Math.sin(phi) * Math.sin(theta);
      const oz = r * Math.cos(phi);

      origins[i * 3]     = ox;
      origins[i * 3 + 1] = oy;
      origins[i * 3 + 2] = oz;

      const vs = SPREAD * (0.4 + Math.random() * 0.6);
      velocities[i * 3]     = ox * vs;
      velocities[i * 3 + 1] = oy * vs + (Math.random() - 0.5) * 0.4;
      velocities[i * 3 + 2] = oz * vs;

      phases[i] = Math.random() * Math.PI * 2;
    }

    return { origins, velocities, phases };
  }, []);

  // Geometry — positions updated per frame
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(origins.slice(), 3));
    return geo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    const decoded = decodeScrollProgress(progressRef.current);
    const { inTransition, localProgress, transitionFrom, transitionTo } = decoded;

    // Target progress for this cloud
    const rawTarget = inTransition ? localProgress : 0;
    smoothProgress.current += (rawTarget - smoothProgress.current) * 0.06;

    // Target colour
    const srcIdx = mode === "out" ? transitionFrom : transitionTo;
    const srcColor = OBJECT_COLORS[srcIdx] ?? "#ffffff";
    smoothColor.current.lerp(new THREE.Color(srcColor), 0.05);

    const sp = smoothProgress.current;
    const points = meshRef.current;
    if (!points) return;

    // Update positions
    const posAttr = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ph   = phases[i]!;
      // For "out" cloud: particles fly away as progress increases
      // For "in"  cloud: particles converge as progress increases
      const dir  = mode === "out" ? sp : 1 - sp;
      const ease = 1 - Math.pow(1 - Math.max(0, Math.min(1, dir)), 3);

      const ox = origins[i * 3]!;
      const oy = origins[i * 3 + 1]!;
      const oz = origins[i * 3 + 2]!;
      const vx = velocities[i * 3]!;
      const vy = velocities[i * 3 + 1]!;
      const vz = velocities[i * 3 + 2]!;

      const wobble = Math.sin(t * 1.8 + ph) * 0.04;
      posAttr.setXYZ(
        i,
        ox + vx * ease + wobble,
        oy + vy * ease + Math.sin(t * 1.3 + ph) * 0.05,
        oz + vz * ease + wobble * 0.6,
      );
    }
    posAttr.needsUpdate = true;

    // Opacity envelope — sine arch over transition
    const mat = points.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, Math.sin(sp * Math.PI) * 0.75);
    mat.color.copy(smoothColor.current);
  });

  return (
    <points ref={meshRef} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.03}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors={false}
        color={OBJECT_COLORS[0]}
      />
    </points>
  );
}

/* ─── Public component ─────────────────────────────────────────────────────── */

interface TransitionParticlesProps {
  progressRef: React.MutableRefObject<number>;
}

export default function TransitionParticles({ progressRef }: TransitionParticlesProps) {
  return (
    <>
      <ParticleCloud mode="out" progressRef={progressRef} />
      <ParticleCloud mode="in"  progressRef={progressRef} />
    </>
  );
}
