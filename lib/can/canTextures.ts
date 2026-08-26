import * as THREE from 'three';

import { drawWordmark, WORDMARK_BOX } from './wordmark';
import type { CanTier } from './canGeometry';

/**
 * Every map the can wears is drawn at runtime on a 2D canvas rather than
 * downloaded. For a printed cylinder that is a straight win: the artwork stays
 * vector-sharp at any resolution, the whole texture set costs zero network
 * bytes and no decode stall, and the resolution can be dialled per device tier
 * instead of shipping one compromise atlas to every phone.
 */

export type TextureTierConfig = {
  labelWidth: number;
  labelHeight: number;
  /** Condensation beads stamped across the body. */
  droplets: number;
  detail: number;
};

/**
 * Only the colour map needs the full resolution — it is the one carrying the
 * wordmark's hairlines and the legal small print. Condensation is all soft
 * blobs, so its normal and roughness maps run at half width for a quarter of
 * the memory with no visible difference, and the ribbon tint mask is a single
 * smooth shape that survives being tiny.
 */
const DETAIL_DIVISOR = 2;
const MASK_WIDTH = 256;

const TIER_CONFIG: Record<CanTier, TextureTierConfig> = {
  mobile: { labelWidth: 1024, labelHeight: 512, droplets: 1500, detail: 256 },
  tablet: { labelWidth: 1536, labelHeight: 768, droplets: 2600, detail: 384 },
  desktop: { labelWidth: 2048, labelHeight: 1024, droplets: 4200, detail: 512 },
};

/** Coca-Cola Zero Sugar livery: black ground, red script, silver furniture. */
const PALETTE = {
  ground: '#08080a',
  groundLift: '#17171b',
  red: '#f40009',
  redDeep: '#b00006',
  white: '#f6f6f4',
  silver: '#b9bec6',
} as const;

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) throw new Error('2D canvas context unavailable');
  return { canvas, context };
}

function toTexture(
  canvas: HTMLCanvasElement,
  {
    srgb = false,
    anisotropy = 1,
    repeat,
  }: { srgb?: boolean; anisotropy?: number; repeat?: [number, number] } = {},
) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  if (repeat) {
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
  }
  // Colour maps carry sRGB-encoded artwork; roughness, normal and mask data are
  // raw numbers and must stay linear or the lighting response goes wrong.
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = anisotropy;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// ── Condensation ─────────────────────────────────────────────────────────────

/**
 * One droplet, pre-rendered once into three small sprites and then stamped
 * thousands of times.
 *
 * Building the normal map by stamping pre-baked sprites rather than running a
 * Sobel pass over the finished height field turns an O(pixels) JavaScript loop
 * into an O(droplets) sequence of GPU-accelerated blits — a couple of
 * milliseconds instead of a couple of hundred.
 */
function createDropletSprites(size: number) {
  const normal = createCanvas(size, size);
  const image = normal.context.createImageData(size, size);
  const half = size / 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x + 0.5 - half) / half;
      const dy = (y + 0.5 - half) / half;
      const distance = Math.hypot(dx, dy);
      const offset = (y * size + x) * 4;

      if (distance >= 1) {
        image.data[offset] = 128;
        image.data[offset + 1] = 128;
        image.data[offset + 2] = 255;
        image.data[offset + 3] = 0;
        continue;
      }

      // A bead of water is a spherical cap, so its surface normal tips away
      // from vertical in proportion to how far out from the centre we are.
      const nz = Math.sqrt(Math.max(0, 1 - distance * distance));
      const slope = 0.72;
      image.data[offset] = Math.round((dx * slope * 0.5 + 0.5) * 255);
      image.data[offset + 1] = Math.round((-dy * slope * 0.5 + 0.5) * 255);
      image.data[offset + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      // Feathering the last few percent stops a hard ring at the contact edge.
      image.data[offset + 3] = Math.round(255 * Math.min(1, (1 - distance) * 6));
    }
  }
  normal.context.putImageData(image, 0, 0);

  // Water is far smoother than the printed varnish under it, so each bead
  // punches a dark (low-roughness) disc into the roughness map.
  const rough = createCanvas(size, size);
  const roughFill = rough.context.createRadialGradient(
    half,
    half,
    0,
    half,
    half,
    half,
  );
  roughFill.addColorStop(0, 'rgba(0,0,0,0.78)');
  roughFill.addColorStop(0.62, 'rgba(0,0,0,0.5)');
  roughFill.addColorStop(1, 'rgba(0,0,0,0)');
  rough.context.fillStyle = roughFill;
  rough.context.fillRect(0, 0, size, size);

  // In the colour map a bead only lifts the ground very slightly and catches a
  // bright pinpoint high on its shoulder.
  const tint = createCanvas(size, size);
  const tintFill = tint.context.createRadialGradient(
    half * 0.72,
    half * 0.66,
    0,
    half,
    half,
    half,
  );
  tintFill.addColorStop(0, 'rgba(255,255,255,0.16)');
  tintFill.addColorStop(0.34, 'rgba(210,225,240,0.05)');
  tintFill.addColorStop(1, 'rgba(120,140,160,0)');
  tint.context.fillStyle = tintFill;
  tint.context.beginPath();
  tint.context.arc(half, half, half, 0, Math.PI * 2);
  tint.context.fill();

  return { normal: normal.canvas, rough: rough.canvas, tint: tint.canvas };
}

/** Placement in normalised label space, so one plan serves every map size. */
type DropletPlacement = {
  x: number;
  y: number;
  radius: number;
  stretch: number;
};

/** Deterministic RNG so the bead pattern is stable across reloads and tiers. */
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * Scatters bead positions across the label. Real condensation is not uniform:
 * it grades from a fine mist to occasional fat beads that have merged and begun
 * to run, so sizes follow a strong power-law bias towards the small end.
 */
function planDroplets(count: number, seed = 20260826): DropletPlacement[] {
  const random = makeRandom(seed);
  const placements: DropletPlacement[] = [];

  for (let i = 0; i < count; i += 1) {
    const bias = Math.pow(random(), 3.4);
    placements.push({
      x: random(),
      // Beads gather more thickly down the lower two-thirds of a chilled can.
      y: Math.pow(random(), 0.82),
      radius: (1.1 + bias * 7.5) / 2048,
      // The heaviest beads sag under their own weight before they run.
      stretch: 1 + bias * random() * 0.85,
    });
  }

  return placements;
}

function stampDroplets(
  context: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  placements: readonly DropletPlacement[],
  width: number,
  height: number,
) {
  for (const placement of placements) {
    const radius = placement.radius * width;
    const x = placement.x * width;
    const y = placement.y * height;
    const w = radius * 2;
    const h = radius * 2 * placement.stretch;
    context.drawImage(sprite, x - radius, y - h / 2, w, h);
    // Beads near either edge are redrawn on the far side so the wrap is seamless.
    if (x < radius) context.drawImage(sprite, x + width - radius, y - h / 2, w, h);
    else if (x > width - radius) {
      context.drawImage(sprite, x - width - radius, y - h / 2, w, h);
    }
  }
}

// ── Label artwork ────────────────────────────────────────────────────────────

/**
 * The dynamic ribbon, drawn as a full-width wave so it wraps the can without a
 * join. One complete period across the texture is what makes the two ends meet.
 */
function ribbonPath(width: number, height: number, phase: number) {
  const path = new Path2D();
  const steps = 96;
  const centre = height * 0.815;
  const amplitude = height * 0.055;
  const thickness = height * 0.034;

  const edge = (i: number, side: number) => {
    const t = i / steps;
    const wave = Math.sin(t * Math.PI * 2 + phase);
    // Tapering the band where it climbs gives the ribbon its calligraphic swell.
    const swell = 0.55 + 0.45 * Math.cos(t * Math.PI * 2 + phase);
    return {
      x: t * width,
      y: centre + wave * amplitude + side * thickness * swell * 0.5,
    };
  };

  const start = edge(0, -1);
  path.moveTo(start.x, start.y);
  for (let i = 1; i <= steps; i += 1) {
    const point = edge(i, -1);
    path.lineTo(point.x, point.y);
  }
  for (let i = steps; i >= 0; i -= 1) {
    const point = edge(i, 1);
    path.lineTo(point.x, point.y);
  }
  path.closePath();
  return path;
}

function drawTrackedText(
  context: CanvasRenderingContext2D,
  text: string,
  centreX: number,
  y: number,
  tracking: number,
) {
  const glyphs = [...text];
  const widths = glyphs.map((glyph) => context.measureText(glyph).width);
  const total =
    widths.reduce((sum, value) => sum + value, 0) + tracking * (glyphs.length - 1);
  let cursor = centreX - total / 2;

  glyphs.forEach((glyph, index) => {
    context.fillText(glyph, cursor, y);
    cursor += widths[index] + tracking;
  });
}

/** The nutrition block and barcode that sit on the back of every real can. */
function drawBackPanel(
  context: CanvasRenderingContext2D,
  x: number,
  width: number,
  height: number,
) {
  const scale = width / 2048;
  context.save();
  context.translate(x, height * 0.3);

  context.fillStyle = 'rgba(246,246,244,0.9)';
  context.font = `700 ${22 * scale}px Arial, sans-serif`;
  context.textAlign = 'left';
  context.fillText('NUTRITION INFORMATION', 0, 0);

  context.font = `400 ${18 * scale}px Arial, sans-serif`;
  const rows = [
    ['Energy', '0.8 kJ / 0.2 kcal'],
    ['Fat', '0 g'],
    ['of which saturates', '0 g'],
    ['Carbohydrate', '0 g'],
    ['of which sugars', '0 g'],
    ['Protein', '0 g'],
    ['Salt', '0.01 g'],
  ];
  rows.forEach(([label, value], index) => {
    const y = (30 + index * 26) * scale;
    context.fillStyle = 'rgba(246,246,244,0.72)';
    context.fillText(label, 0, y);
    context.textAlign = 'right';
    context.fillText(value, 300 * scale, y);
    context.textAlign = 'left';
  });

  // Barcode: pure decoration, but its rhythm is what the eye recognises.
  const random = makeRandom(9182736);
  let barX = 0;
  const barTop = 250 * scale;
  context.fillStyle = 'rgba(246,246,244,0.85)';
  while (barX < 280 * scale) {
    const barWidth = (1 + Math.floor(random() * 3)) * scale * 1.6;
    if (random() > 0.38) context.fillRect(barX, barTop, barWidth, 66 * scale);
    barX += barWidth + (1 + Math.floor(random() * 2)) * scale * 1.6;
  }

  context.font = `400 ${15 * scale}px Arial, sans-serif`;
  context.fillStyle = 'rgba(246,246,244,0.6)';
  context.fillText('5 449000 000996', 0, 336 * scale);
  context.restore();
}

/** Ingredients and the recycling mark, opposite the nutrition block. */
function drawLegalPanel(
  context: CanvasRenderingContext2D,
  x: number,
  width: number,
  height: number,
) {
  const scale = width / 2048;
  context.save();
  context.translate(x, height * 0.3);
  context.textAlign = 'left';

  context.fillStyle = 'rgba(246,246,244,0.9)';
  context.font = `700 ${22 * scale}px Arial, sans-serif`;
  context.fillText('INGREDIENTS', 0, 0);

  context.fillStyle = 'rgba(246,246,244,0.62)';
  context.font = `400 ${17 * scale}px Arial, sans-serif`;
  [
    'Carbonated water, colour (caramel E150d),',
    'acids (phosphoric acid, citric acid),',
    'sweeteners (aspartame, acesulfame K),',
    'natural flavourings including caffeine.',
    'Contains a source of phenylalanine.',
  ].forEach((line, index) => context.fillText(line, 0, (30 + index * 24) * scale));

  // Mobius recycling triangle.
  context.strokeStyle = 'rgba(246,246,244,0.72)';
  context.lineWidth = 4 * scale;
  context.beginPath();
  const size = 46 * scale;
  const top = 190 * scale;
  context.moveTo(size * 0.5, top);
  context.lineTo(size * 1.4, top + size * 1.5);
  context.lineTo(-size * 0.4, top + size * 1.5);
  context.closePath();
  context.stroke();

  context.font = `600 ${18 * scale}px Arial, sans-serif`;
  context.fillStyle = 'rgba(246,246,244,0.66)';
  context.fillText('PLEASE RECYCLE', size * 2, top + size * 1.1);
  context.restore();
}

/**
 * Paints the colour map, and alongside it the flavour tint mask that marks
 * which pixels the ribbon owns.
 */
function drawLabel(
  context: CanvasRenderingContext2D,
  mask: CanvasRenderingContext2D,
  width: number,
  height: number,
  maskWidth: number,
  maskHeight: number,
) {
  const scale = width / 2048;
  const front = width * 0.5;

  // ── Ground ──
  const ground = context.createLinearGradient(0, 0, 0, height);
  ground.addColorStop(0, PALETTE.groundLift);
  ground.addColorStop(0.22, PALETTE.ground);
  ground.addColorStop(0.82, PALETTE.ground);
  ground.addColorStop(1, '#101014');
  context.fillStyle = ground;
  context.fillRect(0, 0, width, height);

  mask.fillStyle = '#000000';
  mask.fillRect(0, 0, maskWidth, maskHeight);

  // A wide, soft sheen sweeping the front face keeps the black from reading as
  // a flat fill once it is wrapped and lit.
  const sheen = context.createLinearGradient(front - width * 0.3, 0, front + width * 0.3, 0);
  sheen.addColorStop(0, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0.045)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = sheen;
  context.fillRect(0, 0, width, height);

  // ── Dynamic ribbon ──
  context.save();
  context.fillStyle = PALETTE.red;
  const ribbon = ribbonPath(width, height, Math.PI * 0.5);
  context.fill(ribbon);
  // A thinner silver wave shadowing the red one adds the second, subordinate
  // ribbon that runs beneath it on the real pack.
  context.globalAlpha = 0.62;
  context.strokeStyle = PALETTE.white;
  context.lineWidth = Math.max(1, height * 0.006);
  context.save();
  context.translate(0, -height * 0.032);
  context.stroke(ribbonPath(width, height, Math.PI * 0.5));
  context.restore();
  context.restore();

  // The mask is drawn at its own resolution rather than scaled down afterwards,
  // so the ribbon edge stays clean instead of picking up resampling fringes.
  mask.fillStyle = '#ffffff';
  mask.fill(ribbonPath(maskWidth, maskHeight, Math.PI * 0.5));

  // ── Wordmark ──
  const markWidth = width * 0.335;
  const markScale = markWidth / WORDMARK_BOX.width;
  context.save();
  context.translate(front - markWidth / 2, height * 0.185);
  context.scale(markScale, markScale);
  drawWordmark(context, { color: PALETTE.red });
  context.restore();

  // ── zero sugar ──
  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.fillStyle = PALETTE.white;
  context.font = `700 ${52 * scale}px "Helvetica Neue", Arial, sans-serif`;
  context.fillText('zero sugar', front, height * 0.575);

  context.fillStyle = 'rgba(246,246,244,0.62)';
  context.font = `600 ${19 * scale}px Arial, sans-serif`;
  drawTrackedText(context, 'REAL TASTE', front, height * 0.63, 7 * scale);
  context.restore();

  // ── Side and back furniture ──
  context.save();
  context.textAlign = 'center';
  context.fillStyle = 'rgba(246,246,244,0.5)';
  context.font = `600 ${24 * scale}px Arial, sans-serif`;
  for (const centre of [front - width * 0.25, front + width * 0.25]) {
    drawTrackedText(context, '330 ml e', centre, height * 0.945, 6 * scale);
  }
  context.restore();

  drawBackPanel(context, width * 0.05, width, height);
  drawLegalPanel(context, width * 0.79, width, height);

  // ── Print grain ──
  // Rotogravure ink is never perfectly even; a whisper of vertical streaking
  // stops the flat areas looking like a screen-printed vector.
  const grain = makeRandom(5150);
  context.save();
  context.globalAlpha = 0.022;
  context.fillStyle = '#ffffff';
  for (let i = 0; i < 900; i += 1) {
    const x = grain() * width;
    const w = (0.4 + grain() * 1.6) * scale * 1.6;
    const y = grain() * height;
    const h = (10 + grain() * 90) * scale;
    context.fillRect(x, y, w, h);
  }
  context.restore();
}

// ── Bare aluminium ───────────────────────────────────────────────────────────

/**
 * Drawn-and-ironed can walls carry fine vertical tooling marks. Reproducing
 * them as a normal/roughness pair is what turns the metal from CG chrome into
 * something that looks stamped.
 */
function drawMetalMaps(size: number) {
  const normal = createCanvas(size, size);
  const rough = createCanvas(size, size);
  const random = makeRandom(778291);

  normal.context.fillStyle = 'rgb(128,128,255)';
  normal.context.fillRect(0, 0, size, size);
  rough.context.fillStyle = 'rgb(92,92,92)';
  rough.context.fillRect(0, 0, size, size);

  for (let i = 0; i < size * 2.2; i += 1) {
    const x = random() * size;
    const width = 0.5 + random() * 2.4;
    const strength = random();
    // Only the X channel is perturbed: the streaks must run along the profile,
    // never across it, or the metal reads as brushed in the wrong direction.
    normal.context.fillStyle = `rgba(${128 + Math.round((strength - 0.5) * 46)},128,255,0.55)`;
    normal.context.fillRect(x, 0, width, size);
    const tone = 74 + Math.round(strength * 46);
    rough.context.fillStyle = `rgba(${tone},${tone},${tone},0.5)`;
    rough.context.fillRect(x, 0, width, size);
  }

  // Grading roughness along V dulls the base dome, which is spun rather than
  // polished on a real can and should never mirror the room like the seam does.
  const grade = rough.context.createLinearGradient(0, 0, 0, size);
  grade.addColorStop(0, 'rgba(150,150,150,0.55)');
  grade.addColorStop(0.28, 'rgba(150,150,150,0)');
  grade.addColorStop(1, 'rgba(150,150,150,0)');
  rough.context.fillStyle = grade;
  rough.context.fillRect(0, 0, size, size);

  return { normal: normal.canvas, rough: rough.canvas };
}

/**
 * The lid, drawn in plan: the rivet, the pressed score line that opens, and the
 * concentric tooling rings, all of which catch light at grazing angles.
 */
function drawLidMaps(size: number) {
  const colour = createCanvas(size, size);
  const normal = createCanvas(size, size);
  const rough = createCanvas(size, size);
  const half = size / 2;
  const c = colour.context;
  const n = normal.context;
  const r = rough.context;

  c.fillStyle = '#b7bcc3';
  c.fillRect(0, 0, size, size);
  n.fillStyle = 'rgb(128,128,255)';
  n.fillRect(0, 0, size, size);
  r.fillStyle = 'rgb(84,84,84)';
  r.fillRect(0, 0, size, size);

  // Concentric tooling rings.
  n.strokeStyle = 'rgba(150,128,255,0.5)';
  for (let i = 0; i < 26; i += 1) {
    const radius = half * (0.1 + (i / 26) * 0.86);
    n.lineWidth = 0.8;
    n.beginPath();
    n.arc(half, half, radius, 0, Math.PI * 2);
    n.stroke();
  }

  // The score line: a teardrop pressed into the panel that tears when opened.
  const score = new Path2D();
  score.ellipse(half, half * 0.6, half * 0.3, half * 0.21, 0, 0, Math.PI * 2);
  n.strokeStyle = 'rgb(128,96,240)';
  n.lineWidth = size * 0.012;
  n.stroke(score);
  c.strokeStyle = 'rgba(120,126,134,0.75)';
  c.lineWidth = size * 0.01;
  c.stroke(score);
  r.strokeStyle = 'rgb(104,104,104)';
  r.lineWidth = size * 0.014;
  r.stroke(score);

  // Rivet holding the tab down.
  const rivet = n.createRadialGradient(half, half * 1.08, 0, half, half * 1.08, size * 0.05);
  rivet.addColorStop(0, 'rgb(128,128,255)');
  rivet.addColorStop(0.7, 'rgb(178,88,220)');
  rivet.addColorStop(1, 'rgb(128,128,255)');
  n.fillStyle = rivet;
  n.beginPath();
  n.arc(half, half * 1.08, size * 0.05, 0, Math.PI * 2);
  n.fill();

  return { colour: colour.canvas, normal: normal.canvas, rough: rough.canvas };
}

// ── Public API ───────────────────────────────────────────────────────────────

export type CanTextures = {
  label: THREE.Texture;
  labelRoughness: THREE.Texture;
  labelNormal: THREE.Texture;
  tintMask: THREE.Texture;
  metalNormal: THREE.Texture;
  metalRoughness: THREE.Texture;
  lidMap: THREE.Texture;
  lidNormal: THREE.Texture;
  lidRoughness: THREE.Texture;
  dispose: () => void;
};

/**
 * Builds the whole texture set. Runs once per tier during the existing loading
 * state; on a desktop budget this is a few milliseconds of canvas work and no
 * network at all.
 */
export function createCanTextures(tier: CanTier, maxAnisotropy: number): CanTextures {
  const config = TIER_CONFIG[tier];
  const { labelWidth: width, labelHeight: height, detail } = config;
  const anisotropy = Math.min(8, maxAnisotropy);

  const detailWidth = Math.round(width / DETAIL_DIVISOR);
  const detailHeight = Math.round(height / DETAIL_DIVISOR);
  const maskWidth = Math.min(MASK_WIDTH, width);
  const maskHeight = Math.round(maskWidth * (height / width));

  const colour = createCanvas(width, height);
  const roughness = createCanvas(detailWidth, detailHeight);
  const normalMap = createCanvas(detailWidth, detailHeight);
  const mask = createCanvas(maskWidth, maskHeight);

  drawLabel(colour.context, mask.context, width, height, maskWidth, maskHeight);

  // Roughness baseline: printed ink under an overprint varnish is satin, and
  // the ribbon's spot colour is laid down glossier than the black ground.
  roughness.context.fillStyle = 'rgb(88,88,88)';
  roughness.context.fillRect(0, 0, detailWidth, detailHeight);
  roughness.context.globalAlpha = 0.55;
  roughness.context.fillStyle = 'rgb(66,66,66)';
  roughness.context.fill(ribbonPath(detailWidth, detailHeight, Math.PI * 0.5));
  roughness.context.globalAlpha = 1;

  normalMap.context.fillStyle = 'rgb(128,128,255)';
  normalMap.context.fillRect(0, 0, detailWidth, detailHeight);

  const sprites = createDropletSprites(64);
  const placements = planDroplets(config.droplets);
  stampDroplets(normalMap.context, sprites.normal, placements, detailWidth, detailHeight);
  stampDroplets(roughness.context, sprites.rough, placements, detailWidth, detailHeight);
  colour.context.save();
  colour.context.globalCompositeOperation = 'lighter';
  colour.context.globalAlpha = 0.55;
  stampDroplets(colour.context, sprites.tint, placements, width, height);
  colour.context.restore();

  const metal = drawMetalMaps(detail);
  const lid = drawLidMaps(detail);

  const textures: Omit<CanTextures, 'dispose'> = {
    label: toTexture(colour.canvas, { srgb: true, anisotropy }),
    labelRoughness: toTexture(roughness.canvas, { anisotropy }),
    labelNormal: toTexture(normalMap.canvas, { anisotropy }),
    tintMask: toTexture(mask.canvas, { anisotropy: 1 }),
    metalNormal: toTexture(metal.normal, { anisotropy, repeat: [1, 3] }),
    metalRoughness: toTexture(metal.rough, { anisotropy, repeat: [1, 3] }),
    lidMap: toTexture(lid.colour, { srgb: true, anisotropy }),
    lidNormal: toTexture(lid.normal, { anisotropy }),
    lidRoughness: toTexture(lid.rough, { anisotropy }),
  };

  return {
    ...textures,
    dispose: () => Object.values(textures).forEach((texture) => texture.dispose()),
  };
}
