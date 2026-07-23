import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraRigProps {
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}

export default function CameraRig({ mouse }: CameraRigProps) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));
  const currentPos = useRef(new THREE.Vector3(0, 0, 18));

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Very slow auto drift
    const driftX = Math.sin(t * 0.04) * 0.4;
    const driftY = Math.cos(t * 0.03) * 0.25;
    const driftZ = 18 + Math.sin(t * 0.02) * 0.5;

    // Target position
    target.current.set(
      driftX + mouse.current.x * 0.3,
      driftY + mouse.current.y * 0.2,
      driftZ
    );

    // Extremely smooth lerp — camera barely moves
    currentPos.current.lerp(target.current, delta * 0.4);
    camera.position.copy(currentPos.current);
    camera.lookAt(0, 0, 0);
  });

  return null;
}
