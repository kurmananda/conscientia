/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Conscientia — Time Fall  |  Engine Config
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Master configuration that drives the entire experience.
 * Adjust camera waypoints, object keyframes, and transition behaviour here.
 * No other file needs to change when you tune the feel of the experience.
 */

import type { EngineConfig } from "./types";

export const ENGINE_CONFIG: EngineConfig = {
  /**
   * Total scrollable height expressed as multiples of the viewport height.
   * 500vh gives us five screens of scroll travel which feels comfortable
   * for three objects with generous overlap zones.
   */
  scrollHeightVh: 750,

  /* ── Object Definitions ──────────────────────────────────────────────────── */
  objects: [
    {
      id: 0,
      label: "Object One",
      idleSpeed: 1.0,
      cameraStage: 0,
      entryFrame: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: 0.6,
        opacity: 0,
      },
      activeFrame: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: 1,
        opacity: 1,
      },
      exitFrame: {
        position: [-3, -1, -2],
        rotation: [0.3, -0.8, 0.1],
        scale: 0.4,
        opacity: 0,
      },
    },
    {
      id: 1,
      label: "Object Two",
      idleSpeed: 0.8,
      cameraStage: 1,
      entryFrame: {
        position: [3, 1, -2],
        rotation: [-0.2, 0.8, 0],
        scale: 0.5,
        opacity: 0,
      },
      activeFrame: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: 1,
        opacity: 1,
      },
      exitFrame: {
        position: [-2, 1, -3],
        rotation: [0.2, -1.2, 0.15],
        scale: 0.35,
        opacity: 0,
      },
    },
    {
      id: 2,
      label: "Object Three",
      idleSpeed: 1.2,
      cameraStage: 2,
      entryFrame: {
        position: [2, -1, -3],
        rotation: [0.2, -0.6, 0],
        scale: 0.4,
        opacity: 0,
      },
      activeFrame: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: 1,
        opacity: 1,
      },
      exitFrame: {
        position: [0, -2, -4],
        rotation: [-0.4, 0, 0.2],
        scale: 0.3,
        opacity: 0,
      },
    },
  ],

  /* ── Camera Waypoints ────────────────────────────────────────────────────── */
  /*
   * The camera travels between these waypoints as the user scrolls.
   * Each waypoint maps to a "stage".  Interpolation is handled by
   * CameraController using GSAP easing so the movement feels weighted.
   *
   * stage 0 → viewing Object 1
   * stage 1 → mid-transition 1→2
   * stage 2 → viewing Object 2
   * stage 3 → mid-transition 2→3
   * stage 4 → viewing Object 3
   */
  cameraWaypoints: [
    { position: [0, 0, 6],    target: [0, 0, 0],  fov: 60 },   // 0
    { position: [1.5, 0.5, 7], target: [0, 0, 0], fov: 62 },   // 1  drift during T1
    { position: [0, 0.3, 5.5], target: [0, 0, 0], fov: 58 },   // 2
    { position: [-1, 0.2, 6.5],target: [0, 0, 0], fov: 63 },   // 3  drift during T2
    { position: [0, -0.2, 5],  target: [0, 0, 0], fov: 56 },   // 4
  ],

  /* ── Transition Configs ──────────────────────────────────────────────────── */
  transitions: [
    { duration: 0.35, ease: "power2.inOut", useParticles: true },  // 1 → 2
    { duration: 0.35, ease: "power2.inOut", useParticles: true },  // 2 → 3
  ],
};

/* ── Helper: scroll progress → active object index + local progress ─────────*/

/**
 * Given a global scroll progress (0→1), returns:
 *   activeIndex      — which object is dominant (0, 1, 2)
 *   transitionProgress — how far through the transition we are (0→1)
 *
 * The layout is:
 *   0.00 → 0.28  Object 0 pure active
 *   0.28 → 0.42  Transition 0→1
 *   0.42 → 0.62  Object 1 pure active
 *   0.62 → 0.76  Transition 1→2
 *   0.76 → 1.00  Object 2 pure active
 */
export function decodeScrollProgress(p: number): {
  activeIndex: number;
  localProgress: number;
  inTransition: boolean;
  transitionFrom: number;
  transitionTo: number;
} {
  const clamp = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v));
  const norm = (v: number, lo: number, hi: number) =>
    clamp((v - lo) / (hi - lo), 0, 1);

  // Segment boundaries
  const B = {
    obj0Start: 0.00,
    t1Start:   0.28,
    t1End:     0.42,
    obj1Start: 0.42,
    t2Start:   0.62,
    t2End:     0.76,
    obj2Start: 0.76,
    obj2End:   1.00,
  };

  if (p < B.t1Start) {
    return { activeIndex: 0, localProgress: norm(p, B.obj0Start, B.t1Start), inTransition: false, transitionFrom: 0, transitionTo: 1 };
  }
  if (p < B.t1End) {
    return { activeIndex: 0, localProgress: norm(p, B.t1Start, B.t1End), inTransition: true, transitionFrom: 0, transitionTo: 1 };
  }
  if (p < B.t2Start) {
    return { activeIndex: 1, localProgress: norm(p, B.obj1Start, B.t2Start), inTransition: false, transitionFrom: 1, transitionTo: 2 };
  }
  if (p < B.t2End) {
    return { activeIndex: 1, localProgress: norm(p, B.t2Start, B.t2End), inTransition: true, transitionFrom: 1, transitionTo: 2 };
  }
  return { activeIndex: 2, localProgress: norm(p, B.obj2Start, B.obj2End), inTransition: false, transitionFrom: 2, transitionTo: 2 };
}

/**
 * Maps global scroll progress to a camera waypoint index + blend factor.
 * 5 waypoints spread evenly across scroll.
 */
export function decodeCameraProgress(p: number): {
  fromWaypoint: number;
  toWaypoint: number;
  blend: number;
} {
  const totalWaypoints = 5;
  const segment = p * (totalWaypoints - 1);
  const fromWaypoint = Math.min(Math.floor(segment), totalWaypoints - 2);
  const blend = segment - fromWaypoint;
  return { fromWaypoint, toWaypoint: fromWaypoint + 1, blend };
}
