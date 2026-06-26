"use client";

import { useMouseInteraction } from "./engine/useMouseInteraction";
import { useScrollEngine } from "./engine/useScrollEngine";
import { ENGINE_CONFIG } from "./engine/config";

import Scene from "./three/Scene";

export default function WorkshopExperience() {
  const {
    progressRef,
  } = useScrollEngine(ENGINE_CONFIG.scrollHeightVh);

  const { smoothRef: mouseRef } = useMouseInteraction();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      <Scene
        progressRef={progressRef}
        mouseRef={mouseRef}
      />
    </div>
  );
}