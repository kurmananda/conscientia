"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, AdaptiveDpr, AdaptiveEvents } from "@react-three/drei";
import * as THREE from "three";

export interface WheelItem {
  id: string;
  title: string;
  type: string;
  color: string;
  imageUrl: string;
}

const DEFAULT_COLORS = [
  "#33d6ff", "#a855f7", "#22c55e", "#f97316",
  "#ec4899", "#6366f1", "#0ea5e9", "#06b6d4",
  "#eab308", "#14b8a6", "#f43f5e", "#8b5cf6",
];

const DEFAULT_TITLES = [
  "Rocketry Workshop", "AI & Machine Learning", "Cybersecurity Bootcamp",
  "Robotics & Automation", "Quantum Computing", "Data Science & Analytics",
  "Cloud & DevOps", "Aerospace Engineering", "Blockchain Development",
  "IoT & Edge Computing", "Biotech & Genomics", "AR/VR Development",
];

const DEFAULT_TYPES = [
  "Rocketry", "AI/ML", "Security", "Robotics", "Quantum",
  "Data Science", "Cloud", "Aerospace", "Web3", "IoT", "Biotech", "XR",
];

const DEFAULT_SLUGS = [
  "rocket", "ai-ml", "cybersec", "robotics", "quantum",
  "data-science", "cloud", "aerospace", "blockchain", "iot", "biotech", "xr",
];

const TILE_PATHS = [
  "/tiles/tile-01.jpg",
  "/tiles/tile-02.jpg",
  "/tiles/tile-03.jpg",
  "/tiles/tile-04.jpg",
  "/tiles/tile-05.jpeg",
  "/tiles/tile-06.jpg",
  "/tiles/tile-07.jpg",
  "/tiles/tile-08.jpg",
];

const DEFAULT_IMG_URLS = Array.from({ length: 12 }, (_, i) => TILE_PATHS[i % TILE_PATHS.length]);

const DEFAULT_ITEMS: WheelItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: DEFAULT_SLUGS[i],
  title: DEFAULT_TITLES[i],
  type: DEFAULT_TYPES[i],
  color: DEFAULT_COLORS[i],
  imageUrl: DEFAULT_IMG_URLS[i],
}));

const R = 5.0;
const PW = 1.6;
const PH = 0.95;
const RADIUS = 0.08;
const AUTO_MS = 3500;

function createRoundedRect(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const w2 = w / 2;
  const h2 = h / 2;
  const cr = Math.min(r, w2, h2);
  shape.moveTo(-w2 + cr, h2);
  shape.lineTo(w2 - cr, h2);
  shape.quadraticCurveTo(w2, h2, w2, h2 - cr);
  shape.lineTo(w2, -h2 + cr);
  shape.quadraticCurveTo(w2, -h2, w2 - cr, -h2);
  shape.lineTo(-w2 + cr, -h2);
  shape.quadraticCurveTo(-w2, -h2, -w2, -h2 + cr);
  shape.lineTo(-w2, h2 - cr);
  shape.quadraticCurveTo(-w2, h2, -w2 + cr, h2);
  return shape;
}

function RoundedPlane({ w, h, r, children, position }: { w: number; h: number; r: number; children?: React.ReactNode; position?: [number, number, number] }) {
  const geo = useMemo(() => new THREE.ShapeGeometry(createRoundedRect(w, h, r)), [w, h, r]);
  return <mesh geometry={geo} position={position}>{children}</mesh>;
}

function Panel({
  index,
  texture,
  arc,
}: {
  index: number;
  texture: THREE.Texture | null;
  arc: number;
}) {
  const angle = index * arc;
  const x = Math.sin(angle) * R;
  const z = -Math.cos(angle) * R;

  return (
    <group position={[x, 0, z]}>
      <Billboard>
        <RoundedPlane w={PW} h={PH} r={RADIUS}>
          <meshStandardMaterial
            map={texture}
            metalness={0.05}
            roughness={0.45}
            toneMapped={false}
          />
        </RoundedPlane>
      </Billboard>
    </group>
  );
}

function BackgroundRings({ color }: { color: THREE.Color }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const ringColor = useRef(new THREE.Color(color));
  const targetColor = useRef(new THREE.Color(color));

  useEffect(() => { targetColor.current.copy(color); }, [color]);

  useFrame((_, delta) => {
    ringColor.current.lerp(targetColor.current, delta * 2);
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.15;
      ringRef.current.rotation.z += delta * 0.08;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.x -= delta * 0.1;
      ringRef2.current.rotation.z += delta * 0.12;
    }
  });

  return (
    <group position={[0, 0, -3]}>
      <mesh ref={ringRef}>
        <ringGeometry args={[4.2, 4.8, 80]} />
        <meshBasicMaterial color={ringColor.current} transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ringRef2}>
        <ringGeometry args={[5.5, 6.2, 80]} />
        <meshBasicMaterial color={ringColor.current} transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <ringGeometry args={[3, 3.4, 60]} />
        <meshBasicMaterial color={ringColor.current} transparent opacity={0.03} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function BackgroundParticles({ color }: { color: THREE.Color }) {
  const count = 120;
  const meshRef = useRef<THREE.Points>(null);
  const particleColor = useRef(new THREE.Color(color));
  const targetColor = useRef(new THREE.Color(color));
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 6;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 4;
    }
    return pos;
  }, []);

  useEffect(() => { targetColor.current.copy(color); }, [color]);

  useFrame((_, delta) => {
    particleColor.current.lerp(targetColor.current, delta * 1.5);
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.PointsMaterial;
      mat.color.copy(particleColor.current);
      meshRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color={particleColor.current} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

function WheelScene({
  rotationIndex,
  textures,
  mouse,
  items,
  n,
  arc,
}: {
  rotationIndex: number;
  textures: (THREE.Texture | null)[];
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  items: WheelItem[];
  n: number;
  arc: number;
}) {
  const pivotRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const bgRef = useRef<THREE.Group>(null);
  const spinAngle = useRef(0);
  const { camera } = useThree();
  const activeIndex = ((rotationIndex % n) + n) % n;
  const activeColor = useMemo(() => new THREE.Color(items[activeIndex].color), [activeIndex, items]);
  const currentBgRot = useRef({ x: 0, y: 0 });
  const currentTilt = useRef({ x: 0, z: 0 });

  useEffect(() => {
    camera.position.set(0, 2.5, 6);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame((_, delta) => {
    if (!spinRef.current) return;

    const target = -rotationIndex * arc;
    spinAngle.current += (target - spinAngle.current) * delta * 5;
    spinRef.current.rotation.y = spinAngle.current;

    const tx = mouse.current.y * 0.04;
    const ty = mouse.current.x * 0.06;
    currentBgRot.current.x += (tx - currentBgRot.current.x) * delta * 3;
    currentBgRot.current.y += (ty - currentBgRot.current.y) * delta * 3;
    if (bgRef.current) {
      bgRef.current.rotation.x = currentBgRot.current.x;
      bgRef.current.rotation.y = currentBgRot.current.y;
    }

    const px = mouse.current.y * 0.025;
    const pz = mouse.current.x * 0.035;
    currentTilt.current.x += (px - currentTilt.current.x) * delta * 3;
    currentTilt.current.z += (pz - currentTilt.current.z) * delta * 3;
    if (pivotRef.current) {
      pivotRef.current.rotation.x = -0.40 + currentTilt.current.x;
      pivotRef.current.rotation.z = 0.10 + currentTilt.current.z;
    }
  });

  return (
    <group>
      <group ref={bgRef}>
        <BackgroundRings color={activeColor} />
        <BackgroundParticles color={activeColor} />
        <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3, 7, 64]} />
          <meshBasicMaterial color={activeColor} transparent opacity={0.04} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.5, 5.2, 64]} />
          <meshBasicMaterial color={activeColor} transparent opacity={0.06} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group ref={pivotRef} rotation={[-0.40, 0, 0.10]}>
        <group ref={spinRef}>
          {items.map((item, i) => (
            <Panel
              key={item.id}
              index={i}
              texture={textures[i]}
              arc={arc}
            />
          ))}
        </group>
      </group>
    </group>
  );
}

function TextureLoader({ items, onReady }: { items: WheelItem[]; onReady: (tex: (THREE.Texture | null)[]) => void }) {
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const results: (THREE.Texture | null)[] = [];
    let loaded = 0;
    items.forEach((item, i) => {
      results[i] = null;
      loader.load(
        item.imageUrl,
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.minFilter = THREE.LinearFilter;
          t.magFilter = THREE.LinearFilter;
          results[i] = t;
          loaded++;
          if (loaded === items.length) onReady([...results]);
        },
        undefined,
        () => {
          loaded++;
          if (loaded === items.length) onReady([...results]);
        }
      );
    });
  }, [items, onReady]);
  return null;
}

function GlitchTitle({ text, color, delay }: { text: string; color: string; delay: number }) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    if (delay === 0) return;
    const t = setTimeout(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 180 + Math.random() * 180);
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      data-text={text}
      style={{
        fontFamily: "'Black Mustang', sans-serif",
        fontSize: "clamp(2rem, 5vw, 3.5rem)",
        fontWeight: 400,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#fff",
        textShadow: glitching
          ? `0 0 40px ${color}80, -3px 0 rgba(0,255,255,0.4), 3px 0 rgba(255,0,255,0.4)`
          : `0 0 40px ${color}50`,
        lineHeight: 1,
        marginBottom: "0.5rem",
        position: "relative",
        transition: "text-shadow 0.15s ease",
      }}
      className={glitching ? "glitch-active" : ""}
    >
      {text}
    </div>
  );
}

export default function WorkshopWheel({ items: propItems }: { items?: WheelItem[] }) {
  const items = propItems ?? DEFAULT_ITEMS;
  const n = items.length;
  const arc = (Math.PI * 2) / n;

  const [rotationIndex, setRotationIndex] = useState(0);
  const activeIndex = ((rotationIndex % n) + n) % n;
  const [textures, setTextures] = useState<(THREE.Texture | null)[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const [paused, setPaused] = useState(false);
  const [thumbUrls, setThumbUrls] = useState<string[]>([]);
  const [prevIndex, setPrevIndex] = useState(0);
  const [transitionProgress, setTransitionProgress] = useState(1);
  const [glitchSeed, setGlitchSeed] = useState(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const wheelRef = useRef<HTMLDivElement>(null);

  const activeColor = items[activeIndex].color;
  const dpr = useMemo(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return [0.75, 1.5] as [number, number];
    return [1, 1.5] as [number, number];
  }, []);

  useEffect(() => {
    setThumbUrls(items.map((item) => item.imageUrl));
  }, [items]);

  useEffect(() => {
    if (activeIndex !== prevIndex) {
      setTransitionProgress(0);
      setGlitchSeed(Math.random());
      const timer = setTimeout(() => {
        setPrevIndex(activeIndex);
        setTransitionProgress(1);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeIndex, prevIndex]);

  const goTo = useCallback((i: number) => {
    setRotationIndex(prev => {
      const curMod = ((prev % n) + n) % n;
      let diff = ((i - curMod) + n) % n;
      if (diff > n / 2) diff -= n;
      return prev + diff;
    });
  }, [n]);

  const next = useCallback(() => setRotationIndex(prev => prev + 1), []);
  const prev = useCallback(() => setRotationIndex(prev => prev - 1), []);

  useEffect(() => {
    if (paused || isDragging) return;
    const t = setInterval(next, AUTO_MS);
    return () => clearInterval(t);
  }, [paused, isDragging, next, n]);

  useEffect(() => {
    const hk = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") prev();
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", hk);
    return () => window.removeEventListener("keydown", hk);
  }, [next, prev]);

  useEffect(() => {
    let cd = false;
    const wh = (e: WheelEvent) => {
      if (!wheelRef.current) return;
      const rect = wheelRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      if (cd) return;
      if (Math.abs(e.deltaY) > 30) {
        cd = true;
        if (e.deltaY > 0) next();
        else prev();
        setTimeout(() => { cd = false; }, 600);
      }
    };
    window.addEventListener("wheel", wh, { passive: true });
    return () => window.removeEventListener("wheel", wh);
  }, [next, prev]);

  const hPD = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const hPU = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(false);
      const dy = e.clientY - dragStartY.current;
      if (dy < -60) next();
      else if (dy > 60) prev();
    },
    [next, prev]
  );

  const displayTitle = transitionProgress < 1 ? items[prevIndex].title : items[activeIndex].title;
  const displayType = transitionProgress < 1 ? items[prevIndex].type : items[activeIndex].type;
  const textOpacity = transitionProgress < 1 ? 1 - transitionProgress * 3 : 1;

  return (
    <>
      <style>{`
        @keyframes grain {
          0%, 100% { transform: translate(0, 0) scale(1); }
          10% { transform: translate(-1%, -1%) scale(1.01); }
          20% { transform: translate(1%, 1%) scale(0.99); }
          30% { transform: translate(-2%, 0) scale(1); }
          40% { transform: translate(2%, -1%) scale(1.01); }
          50% { transform: translate(-1%, 1%) scale(0.99); }
          60% { transform: translate(1%, -1%) scale(1); }
          70% { transform: translate(-2%, 1%) scale(1.01); }
          80% { transform: translate(0, -1%) scale(0.99); }
          90% { transform: translate(1%, 0) scale(1); }
        }
        @keyframes glitch-slice {
          0% { clip-path: inset(0); transform: translate(0, 0); }
          10% { clip-path: inset(15% 0 65% 0); transform: translate(-3px, 0); }
          20% { clip-path: inset(45% 0 25% 0); transform: translate(3px, -1px); }
          30% { clip-path: inset(5% 0 75% 0); transform: translate(-2px, 1px); }
          40% { clip-path: inset(55% 0 15% 0); transform: translate(4px, 0); }
          50% { clip-path: inset(25% 0 45% 0); transform: translate(-4px, -1px); }
          60% { clip-path: inset(70% 0 5% 0); transform: translate(2px, 0); }
          70% { clip-path: inset(10% 0 60% 0); transform: translate(-1px, 1px); }
          80% { clip-path: inset(40% 0 30% 0); transform: translate(1px, -1px); }
          90% { clip-path: inset(80% 0 0 0); transform: translate(-3px, 0); }
        }
        @keyframes thumb-glow {
          0%, 100% { box-shadow: 0 0 6px var(--thumb-color), 0 4px 12px rgba(0,0,0,0.4); }
          50% { box-shadow: 0 0 14px var(--thumb-color), 0 6px 20px rgba(0,0,0,0.5); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes float-rev {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(3px); }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 var(--arrow-color); }
          70% { box-shadow: 0 0 0 10px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        @media (max-width: 768px) {
          [data-wheel-container] {
            height: 43vh !important;
          }
        }
        .glitch-active {
          animation: glitch-slice 0.25s ease forwards;
        }
        .grain-overlay {
          pointer-events: none;
          position: fixed;
          inset: 0;
          z-index: 15;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 256px 256px;
          animation: grain 0.5s steps(6) infinite;
          mix-blend-mode: overlay;
        }
      `}</style>

      <div
        ref={wheelRef}
        data-wheel-container="true"
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          background: "#000",
        }}
        onPointerDown={hPD}
        onPointerUp={hPU}
        onPointerCancel={hPU}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouseRef.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse at 50% 30%, ${activeColor}22 0%, transparent 50%),
              radial-gradient(ellipse at 80% 80%, ${activeColor}11 0%, transparent 40%),
              radial-gradient(ellipse at 20% 70%, ${activeColor}0a 0%, transparent 35%)
            `,
            transition: "background 0.8s ease",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.5) 100%)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)",
            pointerEvents: "none",
            zIndex: 3,
          }}
        />

        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          <Canvas
            dpr={dpr}
            camera={{ position: [0, 2.5, 6], fov: 50, near: 0.1, far: 30 }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.0,
              outputColorSpace: THREE.SRGBColorSpace,
              alpha: true,
            }}
            style={{ background: "transparent" }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} />
            <directionalLight position={[-3, 2, -5]} intensity={1.5} color={activeColor} />
            <pointLight position={[0, 3, 2]} intensity={1.2} color={activeColor} />
            <fog attach="fog" args={["#000000", 8, 18]} />
            <AdaptiveDpr pixelated />
            <AdaptiveEvents />
            {textures ? (
              <WheelScene rotationIndex={rotationIndex} textures={textures} mouse={mouseRef} items={items} n={n} arc={arc} />
            ) : (
              <TextureLoader items={items} onReady={setTextures} />
            )}
          </Canvas>
        </div>

        <div
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.5rem",
            zIndex: 10,
            fontFamily: "var(--font-display), sans-serif",
            fontSize: "0.6rem",
            letterSpacing: "0.1em",
            color: `${activeColor}77`,
          }}
        >
          {String(activeIndex + 1).padStart(2, "0")} {String(n).padStart(2, "0")}
        </div>

        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{
            position: "absolute",
            right: "1rem",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            alignItems: "center",
          }}
        >
          {items.map((item, i) => {
            const ia = i === activeIndex;
            const TH = ia ? "44px" : "32px";
            return (
              <button
                key={item.id}
                onClick={() => goTo(i)}
                style={{
                  width: "44px",
                  height: TH,
                  borderRadius: "6px",
                  overflow: "hidden",
                  border: ia ? `2px solid ${item.color}` : "1px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  opacity: ia ? 1 : 0.25,
                  filter: ia ? "none" : "grayscale(0.8)",
                  background: `${item.color}22`,
                  flexShrink: 0,
                  boxShadow: ia
                    ? `0 0 10px ${item.color}66, 0 4px 16px rgba(0,0,0,0.5), inset 0 0 0 1px ${item.color}22`
                    : "0 2px 6px rgba(0,0,0,0.3)",
                  transform: ia ? "perspective(400px) scale(1.05)" : "perspective(400px) scale(1)",
                  "--thumb-color": item.color,
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  if (!ia) {
                    el.style.opacity = "0.7";
                    el.style.filter = "grayscale(0.3)";
                    el.style.transform = "perspective(400px) scale(1.08) translateZ(4px)";
                    el.style.boxShadow = `0 0 8px ${item.color}44, 0 6px 20px rgba(0,0,0,0.4)`;
                    el.style.borderColor = `${item.color}44`;
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  if (!ia) {
                    el.style.opacity = "0.25";
                    el.style.filter = "grayscale(0.8)";
                    el.style.transform = "perspective(400px) scale(1)";
                    el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
                    el.style.borderColor = "transparent";
                  }
                }}
              >
                {thumbUrls[i] && (
                  <img
                    src={thumbUrls[i]}
                    alt={item.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{
            position: "absolute",
            bottom: "7rem",
            right: "1rem",
            transform: "none",
            zIndex: 10,
            display: "flex",
            gap: "14px",
            alignItems: "center",
            "--arrow-color": activeColor,
          } as React.CSSProperties}
        >
          <button
            onClick={prev}
            className="arrow-btn prev-arrow"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: `2px solid ${activeColor}55`,
              background: `rgba(0,0,0,0.5)`,
              color: activeColor,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              opacity: 0.8,
              lineHeight: 1,
              padding: 0,
              boxShadow: `0 0 0 0 ${activeColor}00, 0 4px 20px rgba(0,0,0,0.4)`,
              animation: "float 3s ease-in-out infinite",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.opacity = "1";
              el.style.background = `${activeColor}30`;
              el.style.borderColor = `${activeColor}bb`;
              el.style.transform = "scale(1.15)";
              el.style.boxShadow = `0 0 24px ${activeColor}66, 0 6px 28px rgba(0,0,0,0.5)`;
              el.style.animation = "float 1.5s ease-in-out infinite, pulse-ring 1.8s ease-out infinite";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.opacity = "0.8";
              el.style.background = `rgba(0,0,0,0.5)`;
              el.style.borderColor = `${activeColor}55`;
              el.style.transform = "scale(1)";
              el.style.boxShadow = `0 0 0 0 ${activeColor}00, 0 4px 20px rgba(0,0,0,0.4)`;
              el.style.animation = "float 3s ease-in-out infinite";
            }}
          >
            {"\u25C0"}
          </button>
          <button
            onClick={next}
            className="arrow-btn next-arrow"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: `2px solid ${activeColor}55`,
              background: `rgba(0,0,0,0.5)`,
              color: activeColor,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              opacity: 0.8,
              lineHeight: 1,
              padding: 0,
              boxShadow: `0 0 0 0 ${activeColor}00, 0 4px 20px rgba(0,0,0,0.4)`,
              animation: "float-rev 3s ease-in-out infinite",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.opacity = "1";
              el.style.background = `${activeColor}30`;
              el.style.borderColor = `${activeColor}bb`;
              el.style.transform = "scale(1.15)";
              el.style.boxShadow = `0 0 24px ${activeColor}66, 0 6px 28px rgba(0,0,0,0.5)`;
              el.style.animation = "float-rev 1.5s ease-in-out infinite, pulse-ring 1.8s ease-out infinite";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.opacity = "0.8";
              el.style.background = `rgba(0,0,0,0.5)`;
              el.style.borderColor = `${activeColor}55`;
              el.style.transform = "scale(1)";
              el.style.boxShadow = `0 0 0 0 ${activeColor}00, 0 4px 20px rgba(0,0,0,0.4)`;
              el.style.animation = "float-rev 3s ease-in-out infinite";
            }}
          >
            {"\u25B6"}
          </button>
        </div>

        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{
            position: "absolute",
            top: "50%",
            left: "2.5rem",
            transform: "translateY(-50%)",
            zIndex: 10,
            opacity: textOpacity,
            transition: "opacity 0.3s ease",
          }}
        >
          <GlitchTitle text={displayTitle} color={activeColor} delay={transitionProgress < 1 ? 50 : 0} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <div style={{ width: "28px", height: "2px", background: activeColor, boxShadow: `0 0 8px ${activeColor}` }} />
            <span
              style={{
                fontFamily: "var(--font-display), sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.3em",
                color: "#fff",
                textTransform: "uppercase",
                background: `${activeColor}22`,
                padding: "0.15rem 0.6rem",
                borderRadius: "3px",
                border: `1px solid ${activeColor}44`,
                textShadow: `0 0 12px ${activeColor}80, 0 0 4px ${activeColor}40`,
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            >
              {displayType}
            </span>
          </div>
        </div>



        <div className="grain-overlay" />
      </div>
    </>
  );
}
