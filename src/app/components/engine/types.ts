/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Conscientia — Time Fall  |  Transition Engine Types
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Central type definitions for the entire scroll-transition engine.
 * All components import from here so the contract is always explicit.
 */

import type * as THREE from "three";

/* ─── Scroll State ─────────────────────────────────────────────────────────── */

export interface ScrollState {
  /** Raw scroll progress 0→1 across the entire page */
  progress: number;
  /** Scroll velocity (pixels/frame, normalised) */
  velocity: number;
  /** Which object is currently the "primary" (0, 1, 2) */
  activeIndex: number;
  /** Sub-progress within the current transition (0→1) */
  transitionProgress: number;
}

/* ─── Camera State ─────────────────────────────────────────────────────────── */

export interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

/* ─── Object Keyframe ──────────────────────────────────────────────────────── */

export interface ObjectKeyframe {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  opacity: number;
}

/* ─── Scene Object Config ──────────────────────────────────────────────────── */

export interface SceneObjectConfig {
  id: number;
  label: string;
  /** Idle animation speed multiplier */
  idleSpeed: number;
  /** Which "stage" of the camera path this object owns */
  cameraStage: number;
  /** Entry keyframe */
  entryFrame: ObjectKeyframe;
  /** Active keyframe (fully visible, centred) */
  activeFrame: ObjectKeyframe;
  /** Exit keyframe */
  exitFrame: ObjectKeyframe;
}

/* ─── Camera Waypoint ──────────────────────────────────────────────────────── */

export interface CameraWaypoint {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

/* ─── Transition Config ────────────────────────────────────────────────────── */

export interface TransitionConfig {
  /** Duration expressed as fraction of total scroll (0→1) */
  duration: number;
  /** Easing function label for GSAP  */
  ease: string;
  /** Whether particles are used during this transition */
  useParticles: boolean;
}

/* ─── Engine Config (top-level) ────────────────────────────────────────────── */

export interface EngineConfig {
  /** Total scrollable height in viewport-heights */
  scrollHeightVh: number;
  objects: SceneObjectConfig[];
  cameraWaypoints: CameraWaypoint[];
  transitions: TransitionConfig[];
}
