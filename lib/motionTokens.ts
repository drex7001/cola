export const MOTION_EASE = {
  standard: "power4.out",
  settle: "power2.out",
  inOut: "power2.inOut",
  accent: "back.out(1.8)",
  linear: "none",
} as const;

export const MOTION_DURATION = {
  reveal: 0.8,
  fast: 0.3,
  hover: 0.35,
  settle: 0.55,
  long: 1.2,
} as const;

export const MOTION_STAGGER = {
  text: 0.06,
  cards: 0.09,
} as const;

export const MOTION_SCRUB = {
  responsive: 0.65,
  standard: 0.9,
  cinematic: 1.2,
} as const;

export const MOTION_TOKENS = {
  ease: MOTION_EASE,
  duration: MOTION_DURATION,
  stagger: MOTION_STAGGER,
  scrub: MOTION_SCRUB,
} as const;

