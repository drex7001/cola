"use client";

import { useSyncExternalStore } from "react";

import { MEDIA_QUERIES } from "@/lib/constants";

const subscribe = (listener: () => void) => {
  const mediaQuery = window.matchMedia(MEDIA_QUERIES.reducedMotion);
  mediaQuery.addEventListener("change", listener);
  return () => mediaQuery.removeEventListener("change", listener);
};

const getSnapshot = () =>
  window.matchMedia(MEDIA_QUERIES.reducedMotion).matches;

const getServerSnapshot = () => false;

/**
 * Uses the media query itself as an external store. This keeps every consumer
 * in sync without a mount-time state update and gives SSR a stable snapshot.
 */
export const useReducedMotion = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
