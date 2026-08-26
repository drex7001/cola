/**
 * A miniature calligraphic pen engine.
 *
 * Script lettering is not drawable with a constant-width canvas stroke: its
 * whole character comes from the swell between hairline upstrokes and heavy
 * downstrokes. So instead of storing letter *outlines*, we store letter
 * *centrelines* and run a virtual broad-nib pen along them, widening the stroke
 * wherever the pen travels along its pressure axis. That is how the original
 * Spencerian hand actually produced the shape, and it means the whole wordmark
 * is a few hundred bytes of control points rather than a font download.
 */

/**
 * A stroke centreline: a starting point followed by cubic Bézier segments,
 * flattened into one array as x0,y0, c1x,c1y,c2x,c2y,x1,y1, c1x,c1y,…
 */
export type Centreline = readonly number[];

export type PenOptions = {
  /** Stroke width at a pure hairline (upstroke), in design units. */
  minWidth: number;
  /** Stroke width at full pressure (downstroke), in design units. */
  maxWidth: number;
  /**
   * Direction of maximum pressure, in a y-down space. The classic Spencerian
   * nib is held so that travelling down and slightly right gives full width.
   */
  pressureAngle?: number;
  /** Higher values keep the swell concentrated in the steepest downstrokes. */
  pressureFalloff?: number;
  /** Fraction of the stroke, at each end, that tapers away to nothing. */
  entryTaper?: number;
  exitTaper?: number;
  /** Multiplier applied to the whole width profile. */
  weight?: number;
};

type SampledPoint = {
  x: number;
  y: number;
  /** Unit tangent. */
  tx: number;
  ty: number;
  /** Normalised distance along the stroke. */
  t: number;
};

const cubicAt = (
  p0: number,
  c1: number,
  c2: number,
  p1: number,
  t: number,
) => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t * p1;
};

const cubicDerivativeAt = (
  p0: number,
  c1: number,
  c2: number,
  p1: number,
  t: number,
) => {
  const u = 1 - t;
  return 3 * u * u * (c1 - p0) + 6 * u * t * (c2 - c1) + 3 * t * t * (p1 - c2);
};

/** Flattens a centreline into evenly-parameterised samples with tangents. */
function sampleCentreline(line: Centreline, perSegment: number): SampledPoint[] {
  const segments = (line.length - 2) / 6;
  const raw: Array<Omit<SampledPoint, 't'>> = [];

  for (let segment = 0; segment < segments; segment += 1) {
    const offset = segment * 6;
    const x0 = line[offset];
    const y0 = line[offset + 1];
    const c1x = line[offset + 2];
    const c1y = line[offset + 3];
    const c2x = line[offset + 4];
    const c2y = line[offset + 5];
    const x1 = line[offset + 6];
    const y1 = line[offset + 7];
    // The final sample of a segment is the first of the next, so it is skipped
    // everywhere except on the last segment.
    const last = segment === segments - 1 ? perSegment : perSegment - 1;

    for (let step = 0; step <= last; step += 1) {
      const t = step / perSegment;
      let dx = cubicDerivativeAt(x0, c1x, c2x, x1, t);
      let dy = cubicDerivativeAt(y0, c1y, c2y, y1, t);
      const length = Math.hypot(dx, dy);
      if (length < 1e-9) {
        dx = 1;
        dy = 0;
      } else {
        dx /= length;
        dy /= length;
      }

      raw.push({
        x: cubicAt(x0, c1x, c2x, x1, t),
        y: cubicAt(y0, c1y, c2y, y1, t),
        tx: dx,
        ty: dy,
      });
    }
  }

  // Re-parameterise by arc length so tapers read evenly regardless of how the
  // Bézier segments were distributed.
  const distances = [0];
  for (let i = 1; i < raw.length; i += 1) {
    distances.push(
      distances[i - 1] + Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y),
    );
  }
  const total = distances[distances.length - 1] || 1;

  return raw.map((point, index) => ({ ...point, t: distances[index] / total }));
}

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/**
 * Width of the stroke at a sample, from how closely the pen's travel direction
 * aligns with its pressure axis, then tapered at both ends into hairlines.
 */
function widthAt(point: SampledPoint, options: Required<PenOptions>) {
  const axisX = Math.cos(options.pressureAngle);
  const axisY = Math.sin(options.pressureAngle);
  const alignment = Math.max(0, point.tx * axisX + point.ty * axisY);
  const pressure = Math.pow(alignment, options.pressureFalloff);

  const taper =
    smoothstep(0, options.entryTaper, point.t) *
    smoothstep(0, options.exitTaper, 1 - point.t);

  return (
    (options.minWidth + (options.maxWidth - options.minWidth) * pressure) *
    taper *
    options.weight
  );
}

const DEFAULTS: Required<Omit<PenOptions, 'minWidth' | 'maxWidth'>> = {
  pressureAngle: Math.PI / 2 - 0.32,
  pressureFalloff: 1.35,
  entryTaper: 0.1,
  exitTaper: 0.12,
  weight: 1,
};

/**
 * Traces one centreline as a closed variable-width outline. Walking the offset
 * points up one side and back down the other produces a single fillable ring,
 * which keeps overlapping strokes from punching holes in each other under the
 * nonzero fill rule.
 */
export function penStroke(
  context: CanvasRenderingContext2D,
  line: Centreline,
  options: PenOptions,
  perSegment = 22,
) {
  const resolved = { ...DEFAULTS, ...options } as Required<PenOptions>;
  const samples = sampleCentreline(line, perSegment);
  if (samples.length < 2) return;

  const left: Array<[number, number]> = [];
  const right: Array<[number, number]> = [];

  for (const sample of samples) {
    const half = widthAt(sample, resolved) / 2;
    // Normal is the tangent turned a quarter turn; offsetting both ways gives
    // the two edges of the nib at this point along the travel.
    const nx = -sample.ty;
    const ny = sample.tx;
    left.push([sample.x + nx * half, sample.y + ny * half]);
    right.push([sample.x - nx * half, sample.y - ny * half]);
  }

  context.beginPath();
  context.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < left.length; i += 1) context.lineTo(left[i][0], left[i][1]);
  for (let i = right.length - 1; i >= 0; i -= 1) {
    context.lineTo(right[i][0], right[i][1]);
  }
  context.closePath();
  context.fill();
}

/** Draws a whole set of centrelines with one pen setting. */
export function penStrokes(
  context: CanvasRenderingContext2D,
  lines: readonly Centreline[],
  options: PenOptions,
  perSegment = 22,
) {
  for (const line of lines) penStroke(context, line, options, perSegment);
}
