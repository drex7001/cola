"use client";

import { useSyncExternalStore } from "react";

import {
  FLAVOR_BAND_COLORS,
  SCENE_PROGRESS_MAX,
  SCENE_PROGRESS_MIN,
} from "@/lib/constants";

export type Flavor = "original" | "cherry" | "vanilla";
export type ScrollDirection = "forward" | "backward";

export type SceneParams = {
  bubbleIntensity: number;
  bubbleSpeed: number;
  lightIntensity: number;
  bloomIntensity: number;
  distortion: number;
  wipeProgress: number;
  cameraWhip: number;
  momentsProgress: number;
};

export type SceneState = SceneParams & {
  /** Chapter coordinate: 0=hero, 1=can, 2=science, 3=sip, 4=moments, 5=CTA. */
  scrollProgress: number;
  selectedFlavor: Flavor;
  flavorPreview: Flavor | null;
  bandColor: string;
  /** Monotonic nonce; incrementing it tells the particle system to emit once. */
  bubbleBurst: number;
  bubbleBurstDirection: ScrollDirection;
};

export const sceneState: SceneState = {
  scrollProgress: SCENE_PROGRESS_MIN,
  selectedFlavor: "original",
  flavorPreview: null,
  bandColor: FLAVOR_BAND_COLORS.original,
  bubbleBurst: 0,
  bubbleBurstDirection: "forward",
  bubbleIntensity: 0.05,
  bubbleSpeed: 0.1,
  lightIntensity: 0.75,
  bloomIntensity: 0,
  distortion: 0,
  wipeProgress: 0,
  cameraWhip: 0,
  momentsProgress: 0,
};

export const setScrollProgress = (progress: number) => {
  if (!Number.isFinite(progress)) return;
  sceneState.scrollProgress = Math.min(
    SCENE_PROGRESS_MAX,
    Math.max(SCENE_PROGRESS_MIN, progress),
  );
};

export const updateSceneParams = (params: Partial<SceneParams>) => {
  for (const key of Object.keys(params) as (keyof SceneParams)[]) {
    const value = params[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      sceneState[key] = value;
    }
  }
};

export const triggerBubbleBurst = (direction: ScrollDirection) => {
  sceneState.bubbleBurst += 1;
  sceneState.bubbleBurstDirection = direction;
};

export type SceneFlavorSnapshot = {
  selectedFlavor: Flavor;
  previewFlavor: Flavor | null;
  activeFlavor: Flavor;
  bandColor: string;
};

const flavorListeners = new Set<() => void>();

const createFlavorSnapshot = (): SceneFlavorSnapshot => {
  const activeFlavor = sceneState.flavorPreview ?? sceneState.selectedFlavor;
  return {
    selectedFlavor: sceneState.selectedFlavor,
    previewFlavor: sceneState.flavorPreview,
    activeFlavor,
    bandColor: sceneState.bandColor,
  };
};

const serverFlavorSnapshot: SceneFlavorSnapshot = {
  selectedFlavor: "original",
  previewFlavor: null,
  activeFlavor: "original",
  bandColor: FLAVOR_BAND_COLORS.original,
};

let flavorSnapshot = createFlavorSnapshot();

const publishFlavor = () => {
  const activeFlavor = sceneState.flavorPreview ?? sceneState.selectedFlavor;
  sceneState.bandColor = FLAVOR_BAND_COLORS[activeFlavor];
  flavorSnapshot = createFlavorSnapshot();
  flavorListeners.forEach((listener) => listener());
};

export const selectFlavor = (flavor: Flavor) => {
  if (sceneState.selectedFlavor === flavor) return;
  sceneState.selectedFlavor = flavor;
  publishFlavor();
};

export const setFlavorPreview = (flavor: Flavor) => {
  if (sceneState.flavorPreview === flavor) return;
  sceneState.flavorPreview = flavor;
  publishFlavor();
};

export const clearFlavorPreview = () => {
  if (sceneState.flavorPreview === null) return;
  sceneState.flavorPreview = null;
  publishFlavor();
};

const subscribeToFlavor = (listener: () => void) => {
  flavorListeners.add(listener);
  return () => flavorListeners.delete(listener);
};

export const useSceneFlavor = () =>
  useSyncExternalStore(
    subscribeToFlavor,
    () => flavorSnapshot,
    () => serverFlavorSnapshot,
  );

