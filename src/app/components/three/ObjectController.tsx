/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Conscientia — Time Fall  |  Object Controller
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Drives each object's position / scale / opacity based on the current
 * scroll progress.  Also blends in a mouse-driven tilt on the active object.
 *
 * Design decisions:
 *  - All work happens inside useFrame → zero React re-renders
 *  - Material base-opacity is captured once via WeakMap → no shader recompile
 *  - Rotation on the wrapper group is additive (idle anim lives in child group)
 *  - Tilt lerp factor is deliberately low (premium inertia feel)
 */

"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ENGINE_CONFIG, decodeScrollProgress } from "../engine/config";
import type { ObjectKeyframe } from "../engine/types";

interface ObjectControllerProps {
  progressRef: React.MutableRefObject<number>;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
  objectRefs: React.MutableRefObject<(THREE.Group | null)[]>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function lerpFrame(a: ObjectKeyframe, b: ObjectKeyframe, t: number): ObjectKeyframe {
  const s = smoothstep(t);
  return {
    position: [
      lerp(a.position[0], b.position[0], s),
      lerp(a.position[1], b.position[1], s),
      lerp(a.position[2], b.position[2], s),
    ],
    rotation: [
      lerp(a.rotation[0], b.rotation[0], s),
      lerp(a.rotation[1], b.rotation[1], s),
      lerp(a.rotation[2], b.rotation[2], s),
    ],
    scale:   lerp(a.scale,   b.scale,   s),
    opacity: lerp(a.opacity, b.opacity, s),
  };
}

/**
 * Stores each material's original opacity once so we can multiply group
 * opacity against it without clamping the material's own intentional value.
 */
const baseOpacityMap = new WeakMap<THREE.Material, number>();

function applyGroupOpacity(group: THREE.Group, groupOpacity: number) {
  const clamped = Math.max(0, Math.min(1, groupOpacity));

  group.traverse((child) => {
    if (
      !(child instanceof THREE.Mesh) &&
      !(child instanceof THREE.Points) &&
      !(child instanceof THREE.Line)
    ) {
      return;
    }

    const mats = Array.isArray(child.material)
      ? child.material
      : [child.material];

    for (const mat of mats) {
      const m = mat as THREE.Material & { opacity?: number };
      if (!("opacity" in m) || m.opacity === undefined) continue;

      // Capture base opacity once
      if (!baseOpacityMap.has(m)) {
        baseOpacityMap.set(m, m.opacity);
      }
      const base = baseOpacityMap.get(m)!;

      m.transparent = true;
      m.opacity = base * clamped;
    }
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────
/** How quickly the smoothed frame chases the target (0 = instant, 1 = never) */
const FRAME_SMOOTH = 0.10;
/** Mouse tilt magnitude in radians */
const MOUSE_TILT   = 0.18;
/** Tilt lerp — very slow for heavy, premium feel */
const TILT_LERP    = 0.042;

export default function ObjectController({
  progressRef,
  mouseRef,
  objectRefs,
}: ObjectControllerProps) {
  const tilt = useRef({ x: 0, y: 0 });

  const smoothedFrames = useRef<ObjectKeyframe[]>(
    ENGINE_CONFIG.objects.map((o) => ({ ...o.entryFrame }))
  );

  useFrame(() => {
    const p = progressRef.current;
    const {
      activeIndex,
      localProgress,
      inTransition,
      transitionFrom,
      transitionTo,
    } = decodeScrollProgress(p);

    const objects = ENGINE_CONFIG.objects;

    /* ── Compute + smooth target frame for each object ───────────────────── */
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (!obj) continue;

      let target: ObjectKeyframe;

      if (!inTransition) {
        if (i === activeIndex)    target = obj.activeFrame;
        else if (i < activeIndex) target = obj.exitFrame;
        else                       target = obj.entryFrame;
      } else {
        const t = localProgress;
        if (i === transitionFrom)       target = lerpFrame(obj.activeFrame, obj.exitFrame, t);
        else if (i === transitionTo)    target = lerpFrame(obj.entryFrame,  obj.activeFrame, t);
        else if (i < transitionFrom)    target = obj.exitFrame;
        else                            target = obj.entryFrame;
      }

      // Smooth toward target
      const prev = smoothedFrames.current[i]!;
      const L = FRAME_SMOOTH;
      smoothedFrames.current[i] = {
        position: [
          lerp(prev.position[0], target.position[0], L),
          lerp(prev.position[1], target.position[1], L),
          lerp(prev.position[2], target.position[2], L),
        ],
        rotation: [
          lerp(prev.rotation[0], target.rotation[0], L),
          lerp(prev.rotation[1], target.rotation[1], L),
          lerp(prev.rotation[2], target.rotation[2], L),
        ],
        scale:   lerp(prev.scale,   target.scale,   L),
        opacity: lerp(prev.opacity, target.opacity, L),
      };

      const group = objectRefs.current[i];
      if (!group) continue;

      const f = smoothedFrames.current[i]!;
      group.position.set(f.position[0], f.position[1], f.position[2]);
      group.scale.setScalar(Math.max(0.001, f.scale));
      applyGroupOpacity(group, f.opacity);
    }

    // No mouse tilt.
// Rotation is handled inside each Model component.
  });

  return null;
}
