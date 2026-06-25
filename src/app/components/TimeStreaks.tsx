import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const STREAK_COUNT = 24;

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

export default function TimeStreaks() {
  const linesRef = useRef<THREE.LineSegments>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const { positions, phases, speeds, brightnesses } = useMemo(() => {
    const positions: number[] = [];
    const phases: number[] = [];
    const speeds: number[] = [];
    const brightnesses: number[] = [];

    for (let i = 0; i < STREAK_COUNT; i++) {
      const r1 = seededRandom(i * 7.1);
      const r2 = seededRandom(i * 13.3);
      const r3 = seededRandom(i * 19.7);
      const r4 = seededRandom(i * 29.1);
      const r5 = seededRandom(i * 37.9);

      // Random direction
      const phi = Math.acos(2 * r1 - 1);
      const theta = r2 * Math.PI * 2;
      const radius = 4.0 + r3 * 10.0;

      const cx = radius * Math.sin(phi) * Math.cos(theta);
      const cy = radius * Math.sin(phi) * Math.sin(theta);
      const cz = radius * Math.cos(phi);

      const length = 0.3 + r4 * 1.5;
      const dx = (seededRandom(i * 53.7) - 0.5) * length;
      const dy = (seededRandom(i * 61.3) - 0.5) * length;
      const dz = (seededRandom(i * 71.9) - 0.5) * length;

      positions.push(cx - dx, cy - dy, cz - dz);
      positions.push(cx + dx, cy + dy, cz + dz);

      phases.push(r5 * Math.PI * 2, r5 * Math.PI * 2);
      speeds.push(0.2 + r4 * 0.6, 0.2 + r4 * 0.6);
      brightnesses.push(r3, r3);
    }

    return { positions, phases, speeds, brightnesses };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed', new THREE.Float32BufferAttribute(speeds, 1));
    geo.setAttribute('aBrightness', new THREE.Float32BufferAttribute(brightnesses, 1));
    return geo;
  }, [positions, phases, speeds, brightnesses]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 0 },
  }), []);

  const vertexShader = `
    attribute float aPhase;
    attribute float aSpeed;
    attribute float aBrightness;
    uniform float uTime;
    varying float vAlpha;
    void main() {
      float cycle = mod(uTime * aSpeed * 0.3 + aPhase, 6.2831);
      float flash = pow(max(0.0, sin(cycle)), 12.0);
      vAlpha = flash * aBrightness;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    varying float vAlpha;
    void main() {
      vec3 color = mix(vec3(0.0, 0.898, 1.0), vec3(1.0), vAlpha * 0.5);
      gl_FragColor = vec4(color, vAlpha * 0.4);
    }
  `;

  useFrame((state) => {
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}
