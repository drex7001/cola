export const BRAND_COLORS = {
  background: "#050505",
  surface: "#0d0d0d",
  red: "#f40009",
  redHot: "#ff2d3b",
  white: "#ffffff",
  silver: "#c7ccd1",
} as const;

export const FLAVOR_BAND_COLORS = {
  original: BRAND_COLORS.red,
  cherry: "#a5093f",
  vanilla: "#e4bd72",
} as const;

export const BREAKPOINTS = {
  mobileMax: 767,
  tabletMin: 768,
  tabletMax: 1023,
  desktopMin: 1024,
} as const;

export const MEDIA_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.mobileMax}px)`,
  tablet: `(min-width: ${BREAKPOINTS.tabletMin}px) and (max-width: ${BREAKPOINTS.tabletMax}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktopMin}px)`,
  reducedMotion: "(prefers-reduced-motion: reduce)",
  fullMotion: "(prefers-reduced-motion: no-preference)",
  finePointer: "(hover: hover) and (pointer: fine)",
} as const;

export const SECTION_IDS = [
  "hero",
  "can",
  "science",
  "sip",
  "moments",
  "get-zero",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/**
 * The shared scene timeline uses a chapter coordinate rather than raw page
 * percentage: 0 is the hero, 1 is the can chapter, and 5 is the CTA.
 */
export const SCENE_PROGRESS_MIN = 0;
export const SCENE_PROGRESS_MAX = SECTION_IDS.length - 1;

export const PARTICLE_COUNTS = {
  desktop: 4000,
  tablet: 1600,
  mobile: 700,
  reducedMotion: 150,
} as const;

export const DEVICE_PIXEL_RATIO_CAPS = {
  desktop: 1.5,
  tablet: 1.25,
  mobile: 1,
} as const;

export const MAGNETIC_POINTER = {
  radius: 80,
  maxOffset: 12,
  labelStrength: 0.45,
} as const;

