"use client";

import { useScrollEngine } from "./engine/useScrollEngine";
import { ENGINE_CONFIG } from "./engine/config";

import Scene from "./three/Scene";

export default function WorkshopExperience({ active }: { active?: boolean }) {
  const {
    progressRef,
    mouseSmoothRef,
  } = useScrollEngine(ENGINE_CONFIG.scrollHeightVh);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      <Scene
        progressRef={progressRef}
        mouseRef={mouseSmoothRef}
        active={active}
      />
    </div>
  );
}
