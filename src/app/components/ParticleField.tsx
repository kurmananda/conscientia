import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Seeded pseudo-random
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

function buildFormations(count: number) {
  const positions: number[] = [];
  const sizes: number[] = [];
  const brightnesses: number[] = [];
  const formations: number[] = [];
  const phases: number[] = [];
  const layers: number[] = [];
  const speeds: number[] = [];
  const origPositions: number[] = [];

  const FORMATIONS = [
    { type: 'torus',   share: 0.18 },
    { type: 'spiral',  share: 0.16 },
    { type: 'ribbon',  share: 0.12 },
    { type: 'sphere',  share: 0.14 },
    { type: 'vortex',  share: 0.12 },
    { type: 'stream',  share: 0.14 },
    { type: 'ambient', share: 0.14 },
  ];

  let idx = 0;
  for (let fi = 0; fi < FORMATIONS.length; fi++) {
    const f = FORMATIONS[fi];
    const fCount = Math.floor(count * f.share);
    for (let i = 0; i < fCount; i++) {
      const s = idx++;
      const r1 = seededRandom(s * 7.3  + fi * 1000);
      const r2 = seededRandom(s * 13.7 + fi * 2000);
      const r3 = seededRandom(s * 19.1 + fi * 3000);
      const r4 = seededRandom(s * 23.9 + fi * 4000);

      let x = 0, y = 0, z = 0;

      switch (f.type) {
        case 'torus': {
          const numRings = 5;
          const ringIdx = Math.floor(r4 * numRings);
          const majorR = 4.0 + ringIdx * 2.5 + r3 * 1.5;
          const minorR = 0.3 + r1 * 0.8;
          const theta = r1 * Math.PI * 2;
          const phi   = r2 * Math.PI * 2;
          const tiltY = (ringIdx * 0.3) - 0.5;
          x = (majorR + minorR * Math.cos(phi)) * Math.cos(theta) * 1.1;
          y = (majorR + minorR * Math.cos(phi)) * Math.sin(theta) * 0.5 + tiltY;
          z = minorR * Math.sin(phi) + (ringIdx * 0.4 - 1.0) * 0.5;
          break;
        }
        case 'spiral': {
          const numArms = 3;
          const arm = Math.floor(r4 * numArms);
          const t = r1;
          const radius = 1.5 + t * 10.0;
          const angle = t * Math.PI * 6 + (arm * Math.PI * 2) / numArms;
          const spread = 0.4 + r2 * 0.6;
          x = Math.cos(angle) * radius + (r2 - 0.5) * spread;
          y = (r3 - 0.5) * 2.0 + t * 0.8;
          z = Math.sin(angle) * radius + (r3 - 0.5) * spread;
          break;
        }
        case 'ribbon': {
          const numRibbons = 4;
          const rb = Math.floor(r4 * numRibbons);
          const tRib = r1 * 2 - 1;
          const ribbonWidth = 0.15;
          const curve = Math.sin(tRib * Math.PI * 1.5 + rb * 1.4) * 3.0;
          const angle = (rb / numRibbons) * Math.PI * 2;
          x = tRib * 12.0 * Math.cos(angle) + curve * Math.sin(angle) + (r2 - 0.5) * ribbonWidth;
          y = tRib * 4.0 + Math.cos(tRib * Math.PI * 2) * 1.5 + (r3 - 0.5) * ribbonWidth;
          z = tRib * 12.0 * Math.sin(angle) - curve * Math.cos(angle) + (r3 - 0.5) * ribbonWidth;
          break;
        }
        case 'sphere': {
          const numClouds = 4;
          const ci = Math.floor(r4 * numClouds);
          const centers = [[6, 2, -5], [-7, -3, 4], [3, 6, 8], [-4, 5, -7]];
          const [cx, cy, cz] = centers[ci];
          const phi2 = Math.acos(2 * r1 - 1);
          const theta2 = r2 * Math.PI * 2;
          const rad = 1.5 + r3 * 2.5;
          x = cx + rad * Math.sin(phi2) * Math.cos(theta2);
          y = cy + rad * Math.sin(phi2) * Math.sin(theta2);
          z = cz + rad * Math.cos(phi2);
          break;
        }
        case 'vortex': {
          const tVort = r1;
          const radius = 0.2 + tVort * 8.0;
          const angle = tVort * Math.PI * 12;
          const height = (r2 - 0.5) * (1.0 - tVort) * 6.0;
          const spread = (1.0 - tVort) * 0.3;
          x = Math.cos(angle) * radius + (r3 - 0.5) * spread;
          y = height;
          z = Math.sin(angle) * radius + (r2 - 0.5) * spread;
          break;
        }
        case 'stream': {
          const numStreams = 6;
          const st = Math.floor(r4 * numStreams);
          const tStr = r1 * 2 - 1;
          const streamAngle = (st / numStreams) * Math.PI * 2;
          const width = 0.2 + r2 * 0.5;
          x = tStr * 15.0 * Math.cos(streamAngle) + (r2 - 0.5) * width;
          y = tStr * 4.0 + Math.sin(tStr * Math.PI * 2.5) * 2.0 + (r3 - 0.5) * width;
          z = tStr * 15.0 * Math.sin(streamAngle) + (r3 - 0.5) * width;
          break;
        }
        default: {
          const phi3 = Math.acos(2 * r1 - 1);
          const theta3 = r2 * Math.PI * 2;
          const rad = 5.0 + r3 * 15.0;
          x = rad * Math.sin(phi3) * Math.cos(theta3);
          y = rad * Math.sin(phi3) * Math.sin(theta3);
          z = rad * Math.cos(phi3);
        }
      }

      positions.push(x, y, z);
      origPositions.push(x, y, z);

      const layerVal = seededRandom(s * 31.7 + fi * 500);
      layers.push(layerVal);
      sizes.push(0.3 + seededRandom(s * 41.3) * 0.9);
      brightnesses.push(Math.pow(seededRandom(s * 53.1), 2.0) * 0.85 + 0.08);
      formations.push(fi);
      phases.push(seededRandom(s * 67.9) * Math.PI * 2);
      speeds.push(0.3 + seededRandom(s * 79.3) * 0.7);
    }
  }

  // Fill remainder with ambient
  while (positions.length / 3 < count) {
    const s = idx++;
    const r1 = seededRandom(s * 7.3);
    const r2 = seededRandom(s * 13.7);
    const r3 = seededRandom(s * 19.1);
    const phi = Math.acos(2 * r1 - 1);
    const theta = r2 * Math.PI * 2;
    const rad = 5.0 + r3 * 15.0;
    const x = rad * Math.sin(phi) * Math.cos(theta);
    const y = rad * Math.sin(phi) * Math.sin(theta);
    const z = rad * Math.cos(phi);
    positions.push(x, y, z);
    origPositions.push(x, y, z);
    layers.push(seededRandom(s * 31.7));
    sizes.push(0.3 + seededRandom(s * 41.3) * 0.9);
    brightnesses.push(Math.pow(seededRandom(s * 53.1), 2.0) * 0.85 + 0.08);
    formations.push(6);
    phases.push(seededRandom(s * 67.9) * Math.PI * 2);
    speeds.push(0.3 + seededRandom(s * 79.3) * 0.7);
  }

  return { positions, origPositions, sizes, brightnesses, formations, phases, layers, speeds };
}

// ─── Shaders ────────────────────────────────────────────────────────────────

const vertexShader = /* glsl */`
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2  uMouse;
  uniform float uDeformation;

  attribute float aSize;
  attribute float aBrightness;
  attribute float aPhase;
  attribute float aLayer;
  attribute vec3  aOriginalPosition;
  attribute float aSpeed;

  varying float vBrightness;
  varying float vDist;

  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n = i.x + i.y * 57.0 + i.z * 113.0;
    return mix(
      mix(mix(hash(n),hash(n+1.0),f.x), mix(hash(n+57.0),hash(n+58.0),f.x), f.y),
      mix(mix(hash(n+113.0),hash(n+114.0),f.x), mix(hash(n+170.0),hash(n+171.0),f.x), f.y),
      f.z
    );
  }

  void main() {
    vec3 pos = aOriginalPosition;

    // Perlin-style procedural drift
    float t = uTime * 0.08 * aSpeed;
    float ns = 0.35;
    float nx = noise3(vec3(pos.x * ns + t,           pos.y * ns * 0.7, pos.z * ns + aPhase));
    float ny = noise3(vec3(pos.y * ns + t * 0.8+3.7, pos.z * ns,       pos.x * ns + aPhase + 1.3));
    float nz = noise3(vec3(pos.z * ns + t * 0.6+7.1, pos.x * ns,       pos.y * ns + aPhase + 2.7));
    float drift = 0.8 + aLayer * 0.4;
    pos.x += (nx - 0.5) * drift;
    pos.y += (ny - 0.5) * drift;
    pos.z += (nz - 0.5) * drift;

    // Time Flow currents
    float fa = hash(aPhase * 3.17) * 6.2831;
    float fs = 0.015 * aSpeed;
    float ft = uTime * fs + aPhase * 10.0;
    pos.x += sin(ft + fa)          * 1.2;
    pos.y += cos(ft * 0.7 + fa * 1.3) * 0.9;
    pos.z += sin(ft * 0.5 + aPhase)   * 0.6;

    // Mouse gravitational deformation
    vec2 mWorld = uMouse * 8.0;
    float dm = length(pos.xy - mWorld);
    float df = pow(max(0.0, 1.0 - dm / 6.0), 2.0) * uDeformation;
    vec2 toM = normalize(mWorld - pos.xy + vec2(0.001));
    pos.xy += toM * df * 1.5 * (aLayer + 0.5);

    // Parallax by layer
    pos.x += uMouse.x * (aLayer + 0.5) * 0.3;
    pos.y += uMouse.y * (aLayer + 0.5) * 0.18;

    // Breathing
    float breathe = sin(uTime * 0.15 + aPhase * 6.28) * 0.02 + 1.0;
    pos *= breathe;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vDist = -mv.z;

    // Twinkle
    float twinkle = sin(uTime * 1.5 + aPhase * 13.7) * 0.25 + 0.75;
    vBrightness = aBrightness * twinkle;

    // Point size — tiny, depth-aware
    float layerScale = 0.4 + aLayer * 0.6;
    gl_PointSize = aSize * uPixelRatio * layerScale * (280.0 / -mv.z);
    gl_PointSize = clamp(gl_PointSize, 0.4, 3.5);

    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */`
  uniform float uTime;

  varying float vBrightness;
  varying float vDist;

  void main() {
    vec2  uv   = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;

    float alpha = pow(1.0 - smoothstep(0.2, 0.5, dist), 1.6);
    float core  = 1.0 - smoothstep(0.0, 0.18, dist);
    float bloom = 1.0 - smoothstep(0.0, 0.45, dist);

    vec3 cyanDeep = vec3(0.0,   0.898, 1.0);
    vec3 cyanSoft = vec3(0.424, 0.984, 1.0);
    vec3 white    = vec3(1.0,   1.0,   1.0);

    vec3 color = mix(cyanDeep, cyanSoft, vBrightness);
    color = mix(color, white, core * vBrightness * 0.7);

    float depthFade = clamp(1.0 - (vDist - 5.0) / 40.0, 0.3, 1.0);
    float finalA = alpha * vBrightness * depthFade * (0.55 + bloom * 0.45);

    gl_FragColor = vec4(color, clamp(finalA, 0.0, 1.0));
  }
`;

// ─── Component ──────────────────────────────────────────────────────────────

interface ParticleFieldProps {
  count?: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}

export default function ParticleField({ count = 20000, mouse }: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  useThree();

  const particleCount = useMemo(() => {
    const isMobile = window.innerWidth < 768;
    const isLowEnd = typeof navigator.hardwareConcurrency !== 'undefined' && navigator.hardwareConcurrency <= 4;
    if (isMobile) return Math.min(count, 8000);
    if (isLowEnd) return Math.min(count, 14000);
    return count;
  }, [count]);

  const data = useMemo(() => buildFormations(particleCount), [particleCount]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',          new THREE.Float32BufferAttribute(data.positions,     3));
    geo.setAttribute('aOriginalPosition', new THREE.Float32BufferAttribute(data.origPositions, 3));
    geo.setAttribute('aSize',             new THREE.Float32BufferAttribute(data.sizes,         1));
    geo.setAttribute('aBrightness',       new THREE.Float32BufferAttribute(data.brightnesses,  1));
    geo.setAttribute('aFormation',        new THREE.Float32BufferAttribute(data.formations,    1));
    geo.setAttribute('aPhase',            new THREE.Float32BufferAttribute(data.phases,        1));
    geo.setAttribute('aLayer',            new THREE.Float32BufferAttribute(data.layers,        1));
    geo.setAttribute('aSpeed',            new THREE.Float32BufferAttribute(data.speeds,        1));
    return geo;
  }, [data]);

  const uniforms = useMemo(() => ({
    uTime:          { value: 0 },
    uPixelRatio:    { value: Math.min(window.devicePixelRatio, 2) },
    uMouse:         { value: new THREE.Vector2(0, 0) },
    uMouseStrength: { value: 0 },
    uDeformation:   { value: 0 },
  }), []);

  // Smooth mouse state
  const smoothMouse    = useRef(new THREE.Vector2(0, 0));
  const targetMouse    = useRef(new THREE.Vector2(0, 0));
  const mouseVelocity  = useRef(new THREE.Vector2(0, 0));
  const mouseStrength  = useRef(0);
  const deformation    = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    materialRef.current.uniforms.uTime.value = t;

    // Smooth mouse with inertia
    targetMouse.current.set(mouse.current.x, mouse.current.y);
    const lerpSpeed = Math.min(delta * 3.5, 1.0);
    mouseVelocity.current.set(
      (targetMouse.current.x - smoothMouse.current.x) * lerpSpeed,
      (targetMouse.current.y - smoothMouse.current.y) * lerpSpeed
    );
    smoothMouse.current.add(mouseVelocity.current);

    const speed = mouseVelocity.current.length();
    mouseStrength.current += (Math.min(speed * 12.0, 1.0) - mouseStrength.current) * delta * 5.0;
    deformation.current   += (Math.min(speed * 18.0, 1.0) - deformation.current)   * delta * 3.5;

    materialRef.current.uniforms.uMouse.value.copy(smoothMouse.current);
    materialRef.current.uniforms.uMouseStrength.value = mouseStrength.current;
    materialRef.current.uniforms.uDeformation.value   = deformation.current;

    // Whole-scene rotation — inertial, follows mouse
    if (pointsRef.current) {
      const targetRotX = smoothMouse.current.y * 0.35;
      const targetRotY = smoothMouse.current.x * 0.45;
      pointsRef.current.rotation.x += (targetRotX - pointsRef.current.rotation.x) * delta * 1.8;
      pointsRef.current.rotation.y += (targetRotY - pointsRef.current.rotation.y) * delta * 1.8;

      // Slow autonomous rotation
      pointsRef.current.rotation.y += delta * 0.004;
      pointsRef.current.rotation.x += Math.sin(t * 0.05) * delta * 0.003;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
