import { penStrokes, type Centreline } from './script';

/**
 * The wordmark centrelines, authored in a 1220 × 400 design space with Y running
 * downwards. Baseline sits at 270 and the x-height ceiling at 175, giving the
 * proportions of the original Spencerian hand: tall narrow capitals whose swash
 * tails run right underneath the lowercase that follows them.
 */
export const WORDMARK_BOX = { width: 1220, height: 400 } as const;

const BASELINE = 270;
/** Forward lean of the hand, in radians. */
const SLANT = 0.125;
const XHEIGHT = 175;

/** Shifts a centreline so one authored capital can serve for both words. */
const shift = (line: Centreline, dx: number, dy = 0): Centreline =>
  line.map((value, index) => (index % 2 === 0 ? value + dx : value + dy));

// ── Capital C ────────────────────────────────────────────────────────────────
// Three strokes: the hairline swash looping in over the top, the weighted bowl,
// and the long tail sweeping right beneath the following letters.

const CAP_C_SWASH: Centreline = [
  266, 60,
  218, 24, 150, 10, 98, 20,
  56, 28, 32, 54, 42, 78,
  50, 96, 78, 94, 94, 76,
];

const CAP_C_BOWL: Centreline = [
  190, 92,
  152, 58, 96, 54, 60, 80,
  24, 106, 12, 156, 18, 198,
  24, 242, 56, 274, 104, 280,
  140, 284, 172, 270, 196, 246,
];

const CAP_C_TAIL: Centreline = [
  196, 246,
  226, 222, 246, 256, 264, 296,
  288, 344, 360, 362, 436, 350,
  486, 342, 516, 320, 534, 290,
];

const CAPITAL_STROKES: readonly Centreline[] = [CAP_C_BOWL, CAP_C_TAIL];
const SWASH_STROKES: readonly Centreline[] = [CAP_C_SWASH];

/** Horizontal distance between the two capitals. */
const SECOND_WORD = 512;

// ── Lowercase ────────────────────────────────────────────────────────────────
// Every letter sits explicitly in the 175 – 270 x-height band. Script letters
// close at the bottom-left and exit from the right, so each shape ends with a
// short connector that carries the eye into the next glyph.

/** o — closed oval with a rising exit. */
const makeO = (cx: number): Centreline[] => [
  [
    cx - 39, 234,
    cx - 44, 198, cx - 19, 177, cx + 8, 179,
    cx + 34, 181, cx + 44, 210, cx + 39, 238,
    cx + 34, 263, cx + 6, 274, cx - 18, 266,
    cx - 32, 260, cx - 39, 247, cx - 39, 234,
  ],
  [cx + 40, 222, cx + 50, 243, cx + 61, 253, cx + 74, 261],
];

/** c — the same bowl left open on the right, with a small top hook. */
const makeC = (cx: number): Centreline[] => [
  [
    cx + 31, 193,
    cx + 17, 175, cx - 18, 175, cx - 34, 199,
    cx - 48, 222, cx - 41, 254, cx - 16, 266,
    cx + 4, 276, cx + 24, 267, cx + 34, 249,
  ],
  [cx + 20, 186, cx + 30, 178, cx + 42, 182, cx + 50, 194],
];

/** a — a closed bowl hanging from a straight right-hand stem. */
const makeA = (cx: number): Centreline[] => [
  [
    cx + 26, 193,
    cx + 8, 175, cx - 23, 180, cx - 36, 204,
    cx - 49, 231, cx - 39, 262, cx - 12, 269,
    cx + 8, 274, cx + 23, 262, cx + 27, 242,
  ],
  [
    cx + 24, 187,
    cx + 27, 217, cx + 28, 243, cx + 28, 263,
  ],
  [cx + 28, 263, cx + 33, 276, cx + 47, 278, cx + 60, 267],
];

/** l — a looped ascender that crosses itself and falls back to the baseline. */
const makeL = (x: number): Centreline[] => [
  [
    x - 8, 260,
    x + 1, 210, x + 11, 146, x + 19, 102,
    x + 26, 72, x - 8, 74, x - 11, 118,
    x - 14, 164, x + 2, 216, x + 11, 256,
  ],
  [x + 11, 256, x + 18, 274, x + 32, 276, x + 44, 264],
];

/**
 * The hyphen is not a dash but a short swash wave, which is what keeps the two
 * halves of the mark reading as one continuous piece of handwriting.
 */
const HYPHEN: Centreline = [
  492, 216,
  509, 199, 524, 229, 541, 211,
];

const LOWERCASE_STROKES: readonly Centreline[] = [
  ...makeO(272),
  ...makeC(352),
  ...makeA(430),
  ...makeO(272 + SECOND_WORD),
  ...makeL(350 + SECOND_WORD),
  ...makeA(420 + SECOND_WORD),
];

export type WordmarkOptions = {
  /** Fill colour for the lettering. */
  color: string;
  /** Overall stroke weight multiplier. */
  weight?: number;
};

/**
 * Paints the wordmark into the current transform of a 2D context; the caller
 * translates and scales the 1220 × 400 design box into place.
 *
 * Three passes rather than one, because a real nib does not hold a single
 * weight across a whole word: the capitals carry the mass, the lowercase runs
 * lighter, and the swashes stay close to a hairline throughout.
 */
export function drawWordmark(
  context: CanvasRenderingContext2D,
  { color, weight = 1 }: WordmarkOptions,
) {
  context.save();
  context.fillStyle = color;
  // Spencerian is written at a consistent forward slant; shearing about the
  // baseline leans the whole mark without disturbing where it sits.
  context.transform(1, 0, -Math.tan(SLANT), 1, BASELINE * Math.tan(SLANT), 0);

  const shared = {
    pressureAngle: Math.PI / 2 - 0.34,
    pressureFalloff: 1.45,
    weight,
  };

  for (const dx of [0, SECOND_WORD]) {
    penStrokes(context, CAPITAL_STROKES.map((line) => shift(line, dx)), {
      ...shared,
      minWidth: 4.5,
      maxWidth: 27,
      entryTaper: 0.08,
      exitTaper: 0.13,
    });
    penStrokes(context, SWASH_STROKES.map((line) => shift(line, dx)), {
      ...shared,
      minWidth: 3.5,
      maxWidth: 13,
      entryTaper: 0.16,
      exitTaper: 0.2,
    });
  }

  penStrokes(context, LOWERCASE_STROKES, {
    ...shared,
    minWidth: 3.2,
    maxWidth: 15,
    entryTaper: 0.12,
    exitTaper: 0.14,
  });

  penStrokes(context, [HYPHEN], {
    ...shared,
    minWidth: 3.5,
    maxWidth: 14,
    entryTaper: 0.22,
    exitTaper: 0.22,
  });

  context.restore();
}

export { BASELINE as WORDMARK_BASELINE, XHEIGHT as WORDMARK_XHEIGHT };
