/**
 * Cross-section of a standard 330 ml two-piece drawn-and-ironed aluminium can,
 * authored in real millimetres and revolved at runtime.
 *
 * A beverage can is a surface of revolution, which is the one case where a
 * generated profile beats a downloaded mesh outright: the silhouette is exact,
 * the normals are analytically smooth, the tessellation can be tuned per device
 * and the whole thing costs zero bytes of network transfer.
 *
 * Real reference dimensions (330 ml / 12 oz, 202 end):
 *   overall height 114.9 mm · body diameter 66 mm · seam diameter 57.6 mm
 *   base standing-ring diameter 54.8 mm · wall thickness ~0.1 mm
 */

export type ProfilePoint = {
  /** Distance from the axis of revolution, in millimetres. */
  r: number;
  /** Height above the standing ring's contact plane, in millimetres. */
  y: number;
};

export const CAN_MM = {
  /** Radius of the straight printed body. */
  bodyRadius: 33,
  /** Height of the seam crest above the base contact plane. */
  overallHeight: 114.9,
  /**
   * Vertical span of the printed decoration. The artwork is applied to the
   * straight cylinder *before* the top is necked in, so it wraps the shoulder
   * as well and compresses there — which the UV mapping reproduces.
   */
  printBottom: 9,
  printTop: 108.5,
} as const;

/** Metres-per-millimetre so the finished can matches the authored scene scale. */
export const CAN_UNIT_SCALE = 0.92 / CAN_MM.bodyRadius;

/**
 * Bottom-to-top silhouette. Ordering matters: the lathe builder walks these in
 * sequence, and the material groups below index into the same array.
 */
export const CAN_PROFILE: readonly ProfilePoint[] = [
  // ── Concave base dome, walked from the centre outwards and downwards ──
  { r: 0.0, y: 9.6 },
  { r: 4.5, y: 9.5 },
  { r: 9.0, y: 9.0 },
  { r: 13.5, y: 8.1 },
  { r: 17.5, y: 6.8 },
  { r: 21.0, y: 5.0 },
  { r: 23.8, y: 3.0 },
  { r: 25.8, y: 1.2 },
  { r: 26.9, y: 0.25 },
  // Standing ring: the narrow annulus the can actually rests on.
  { r: 27.4, y: 0.0 },
  { r: 28.2, y: 0.3 },
  { r: 29.3, y: 1.3 },
  { r: 30.6, y: 3.0 },
  { r: 31.8, y: 5.2 },
  { r: 32.6, y: 7.4 },
  { r: 32.95, y: 9.0 },

  // ── Straight body. Real cans carry a ~0.1 mm barrel from internal pressure ──
  { r: 33.0, y: 14.0 },
  { r: 33.08, y: 30.0 },
  { r: 33.1, y: 50.0 },
  { r: 33.08, y: 70.0 },
  { r: 33.0, y: 85.0 },
  { r: 32.94, y: 92.0 },

  // ── Necked-in shoulder. Formed in many small die steps, hence the soft S ──
  { r: 32.7, y: 95.5 },
  { r: 32.1, y: 98.4 },
  { r: 31.1, y: 101.0 },
  { r: 29.9, y: 103.2 },
  { r: 28.7, y: 105.1 },
  { r: 27.7, y: 106.8 },
  { r: 27.1, y: 108.5 },

  // ── Double seam: the rolled fold that locks the end onto the body ──
  { r: 27.5, y: 109.6 },
  { r: 28.3, y: 110.5 },
  { r: 28.8, y: 111.7 },
  { r: 28.85, y: 113.0 },
  { r: 28.4, y: 114.1 },
  { r: 27.5, y: 114.8 },
  { r: 26.4, y: 114.9 },

  // ── Countersink groove, then back up onto the lid panel ──
  { r: 25.3, y: 114.1 },
  { r: 24.4, y: 112.8 },
  { r: 24.1, y: 111.6 },
  { r: 23.4, y: 112.2 },
  { r: 22.7, y: 113.0 },
  { r: 21.6, y: 113.35 },
  { r: 17.0, y: 113.5 },
  { r: 10.0, y: 113.6 },
  { r: 4.0, y: 113.62 },
  { r: 0.0, y: 113.62 },
];

/**
 * Which material each profile *segment* belongs to. Indices are into
 * CAN_PROFILE; the run [from, to) covers segments starting at those points.
 * Kept contiguous so the geometry needs only three draw groups.
 */
export const CAN_MATERIAL_RUNS = [
  /** Bare aluminium base dome and standing ring. */
  { material: 1, from: 0, to: 15 },
  /** Printed body and shoulder — everything the artwork wraps. */
  { material: 0, from: 15, to: 28 },
  /** Bare aluminium double seam. */
  { material: 1, from: 28, to: 35 },
  /** Countersink and lid panel, mapped top-down for the score line and rivet. */
  { material: 2, from: 35, to: CAN_PROFILE.length - 1 },
] as const;

/** Radius the lid UV disc is normalised against, so 0..1 covers the panel. */
export const LID_UV_RADIUS = 28.9;
