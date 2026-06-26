"use client";

import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Model3() {
  const { scene } = useGLTF("/models/rocket_future.glb");
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Slow rotation around its own Y-axis
    groupRef.current.rotation.y += delta * 0.95;
  });

  return (
    <group
      ref={groupRef}
      position={[-3, -1, 0]}
      scale={0.95}
    >
      <primitive object={scene.clone()} />
    </group>
  );
}

useGLTF.preload("/models/rocket_future.glb");