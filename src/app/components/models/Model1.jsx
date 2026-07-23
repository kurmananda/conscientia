"use client";

import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneActive } from "../SceneActiveContext";

export default function Model1() {
  const { scene } = useGLTF("/models/rocket_past.glb");
  const groupRef = useRef<THREE.Group>(null);
  const active = useSceneActive();

  useFrame((_, delta) => {
    if (!active) return;
    if (!groupRef.current) return;

    groupRef.current.rotation.y += delta * 0.95;
  });

  return (
    <group
      ref={groupRef}
      position={[-3, -0.5, 0]}
      scale={1.1}
    >
      <primitive object={scene.clone()} />
    </group>
  );
}

useGLTF.preload("/models/rocket_past.glb");
