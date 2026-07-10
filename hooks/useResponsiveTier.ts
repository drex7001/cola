"use client";

import { useSyncExternalStore } from "react";

import { BREAKPOINTS } from "@/lib/constants";

export type ResponsiveTier = "mobile" | "tablet" | "desktop";

const readResponsiveTier = (): ResponsiveTier => {
  if (window.innerWidth < BREAKPOINTS.tabletMin) return "mobile";
  if (window.innerWidth < BREAKPOINTS.desktopMin) return "tablet";
  return "desktop";
};

const subscribe = (listener: () => void) => {
  const mobile = window.matchMedia(
    `(max-width: ${BREAKPOINTS.mobileMax}px)`,
  );
  const tablet = window.matchMedia(
    `(min-width: ${BREAKPOINTS.tabletMin}px) and (max-width: ${BREAKPOINTS.tabletMax}px)`,
  );

  mobile.addEventListener("change", listener);
  tablet.addEventListener("change", listener);

  return () => {
    mobile.removeEventListener("change", listener);
    tablet.removeEventListener("change", listener);
  };
};

const getServerSnapshot = (): ResponsiveTier => "desktop";

/** SSR gets a deterministic tier; React reconciles to the viewport snapshot. */
export const useResponsiveTier = (): ResponsiveTier =>
  useSyncExternalStore(subscribe, readResponsiveTier, getServerSnapshot);
