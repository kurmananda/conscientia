"use client";

import { createContext, useContext } from "react";

export const SceneActiveContext = createContext(true);

export function useSceneActive() {
  return useContext(SceneActiveContext);
}
