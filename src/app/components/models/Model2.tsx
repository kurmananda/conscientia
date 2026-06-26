"use client";

import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Model2() {
  const { scene } = useGLTF("/models/rocket_present.glb");
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Slow rotation around its own Y-axis
    groupRef.current.rotation.y += delta * 0.95;
  });

  return (
    <group
      ref={groupRef}
      position={[3, 0, 0]}
      scale={0.0025}
    >
      <primitive object={scene.clone()} />
    </group>
  );
}

useGLTF.preload("/models/rocket_present.glb");