/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Conscientia — Time Fall  |  Camera Controller
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Smooth, scroll-driven camera movement between pre-defined waypoints.
 *
 * Features:
 *  - Eased interpolation between waypoints (no linear movement)
 *  - Mouse parallax offset (subtle, elegant)
 *  - Slight Z-roll during transitions for cinematic weight
 *  - FOV breathing on waypoint arrival
 *
 * All updates are direct Three.js mutations inside useFrame — zero re-renders.
 */

"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ENGINE_CONFIG, decodeCameraProgress, decodeScrollProgress } from "../engine/config";

interface CameraControllerProps {
  progressRef: React.MutableRefObject<number>;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function smootherstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * c * (c * (c * 6 - 15) + 10);
}

const CAMERA_LERP     = 0.038;  // How quickly camera chases target position
const FOV_LERP        = 0.025;  // FOV easing (slower = weightier)
const MOUSE_PARALLAX  = 0.22;   // Max mouse offset on camera position
const ROLL_AMOUNT     = 0.015;  // Max roll (radians) during transition

export default function CameraController({
  progressRef,
  mouseRef,
}: CameraControllerProps) {
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;

  const currentFov  = useRef(60);
  const currentRoll = useRef(0);
  const targetPos   = useRef(new THREE.Vector3(0, 0, 6));
  const targetLook  = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const p = progressRef.current;
    const { fromWaypoint, toWaypoint, blend } = decodeCameraProgress(p);
    const { inTransition, localProgress } = decodeScrollProgress(p);

    const waypoints = ENGINE_CONFIG.cameraWaypoints;
    const from = waypoints[fromWaypoint];
    const to   = waypoints[toWaypoint];
    if (!from || !to) return;

    const eb = smootherstep(blend);

    // Target position
    targetPos.current.set(
      lerp(from.position[0], to.position[0], eb),
      lerp(from.position[1], to.position[1], eb),
      lerp(from.position[2], to.position[2], eb),
    );

    // Target look-at
    targetLook.current.set(
      lerp(from.target[0], to.target[0], eb),
      lerp(from.target[1], to.target[1], eb),
      lerp(from.target[2], to.target[2], eb),
    );

    // Mouse parallax
    const mx = mouseRef.current.x * MOUSE_PARALLAX;
    const my = mouseRef.current.y * MOUSE_PARALLAX;

    // Move camera
    cam.position.lerp(
      new THREE.Vector3(
        targetPos.current.x + mx * 0.5,
        targetPos.current.y + my * 0.5,
        targetPos.current.z,
      ),
      CAMERA_LERP,
    );

    // Look-at (add mouse as subtle offset to look-at as well)
    const finalLook = new THREE.Vector3(
      targetLook.current.x + mx * 0.15,
      targetLook.current.y + my * 0.15,
      targetLook.current.z,
    );
    cam.lookAt(finalLook);

    // FOV — slightly wider during transition, narrower at rest
    const targetFov = lerp(from.fov, to.fov, eb);
    currentFov.current = lerp(currentFov.current, targetFov, FOV_LERP);
    cam.fov = currentFov.current;
    cam.updateProjectionMatrix();

    // Subtle roll during transitions
    const targetRoll = inTransition
      ? Math.sin(localProgress * Math.PI) * ROLL_AMOUNT
      : 0;
    currentRoll.current = lerp(currentRoll.current, targetRoll, 0.05);
    cam.rotation.z = currentRoll.current;
  });

  return null;
}
