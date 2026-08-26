import * as THREE from 'three';

import {
  CAN_MATERIAL_RUNS,
  CAN_MM,
  CAN_PROFILE,
  CAN_UNIT_SCALE,
  LID_UV_RADIUS,
  type ProfilePoint,
} from './canProfile';

/**
 * Radial tessellation per device tier. A can's silhouette is its whole read, so
 * this is the one budget worth spending: even the desktop value lands around
 * 12k triangles, which is cheaper than a single blade of foliage grass.
 */
export const RADIAL_SEGMENTS = {
  mobile: 72,
  tablet: 96,
  desktop: 144,
} as const;

export type CanTier = keyof typeof RADIAL_SEGMENTS;

const PRINT_SPAN = CAN_MM.printTop - CAN_MM.printBottom;

/** Material slot a profile segment belongs to, resolved from the run table. */
function materialForSegment(segment: number) {
  for (const run of CAN_MATERIAL_RUNS) {
    if (segment >= run.from && segment < run.to) return run.material;
  }
  return 1;
}

/**
 * 2D outward normal at each profile point, from angle-weighted averaging of the
 * adjacent segment normals. Rotating the tangent by -90° keeps the normal
 * pointing away from the enclosed volume for the whole bottom-to-top walk.
 */
function profileNormals(profile: readonly ProfilePoint[]) {
  const normals: Array<[number, number]> = [];

  for (let i = 0; i < profile.length; i += 1) {
    let nx = 0;
    let ny = 0;

    for (const [a, b] of [
      [i - 1, i],
      [i, i + 1],
    ]) {
      if (a < 0 || b >= profile.length) continue;
      const dr = profile[b].r - profile[a].r;
      const dy = profile[b].y - profile[a].y;
      const length = Math.hypot(dr, dy);
      if (length < 1e-6) continue;
      // Weighting by segment length biases the average towards the longer,
      // flatter neighbour, which keeps straight runs from bending near corners.
      nx += (dy / length) * length;
      ny += (-dr / length) * length;
    }

    const length = Math.hypot(nx, ny) || 1;
    normals.push([nx / length, ny / length]);
  }

  return normals;
}

/**
 * Cumulative arc length along the profile, used as the V coordinate on the bare
 * metal so the rolled-aluminium streaks keep a constant density whether they
 * run up the seam or across the base dome.
 */
function profileArcLengths(profile: readonly ProfilePoint[]) {
  const lengths = [0];
  for (let i = 1; i < profile.length; i += 1) {
    lengths.push(
      lengths[i - 1] +
        Math.hypot(profile[i].r - profile[i - 1].r, profile[i].y - profile[i - 1].y),
    );
  }
  return lengths;
}

/**
 * Revolves CAN_PROFILE into an indexed BufferGeometry with three draw groups.
 *
 * UVs differ per region on purpose:
 *  · printed body  — U is the wrap angle, V is *height*, because the artwork is
 *    applied to the straight cylinder before the shoulder is necked in. Mapping
 *    by height rather than arc length reproduces the way real print compresses
 *    into the neck instead of stretching over it.
 *  · bare metal    — U is the wrap angle, V is arc length, giving the ironing
 *    streaks an even density across changing radii.
 *  · lid panel     — a top-down disc, so the score line, rivet and embossing can
 *    be authored as a plan view of the end.
 */
export function buildCanGeometry(radialSegments: number) {
  const profile = CAN_PROFILE;
  const rows = profile.length;
  const columns = radialSegments + 1; // duplicated seam column for a clean wrap
  const normals2D = profileNormals(profile);
  const arcLengths = profileArcLengths(profile);
  const totalArc = arcLengths[rows - 1] || 1;

  const vertexCount = rows * columns;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);

  for (let row = 0; row < rows; row += 1) {
    const { r, y } = profile[row];
    const [nr, ny] = normals2D[row];
    // Centre the can on the origin so the authored camera choreography, which
    // was written against a can pivoting at its middle, still lines up.
    const scaledY = (y - CAN_MM.overallHeight / 2) * CAN_UNIT_SCALE;
    const scaledR = r * CAN_UNIT_SCALE;
    const printV = (y - CAN_MM.printBottom) / PRINT_SPAN;
    const metalV = arcLengths[row] / totalArc;
    const lidRadius = r / LID_UV_RADIUS;

    for (let column = 0; column < columns; column += 1) {
      const u = column / radialSegments;
      // Rotating the wrap by half a turn puts the texture's U seam on the back
      // of the can, so the front artwork is never split and the join hides
      // behind the nutrition panel.
      const theta = (u + 0.5) * Math.PI * 2;
      const sin = Math.sin(theta);
      const cos = Math.cos(theta);
      const vertex = row * columns + column;

      positions[vertex * 3] = scaledR * sin;
      positions[vertex * 3 + 1] = scaledY;
      positions[vertex * 3 + 2] = scaledR * cos;

      normals[vertex * 3] = nr * sin;
      normals[vertex * 3 + 1] = ny;
      normals[vertex * 3 + 2] = nr * cos;

      const material = materialForSegment(Math.min(row, rows - 2));
      if (material === 0) {
        uvs[vertex * 2] = u;
        uvs[vertex * 2 + 1] = printV;
      } else if (material === 2) {
        uvs[vertex * 2] = 0.5 + lidRadius * sin * 0.5;
        uvs[vertex * 2 + 1] = 0.5 + lidRadius * cos * 0.5;
      } else {
        uvs[vertex * 2] = u;
        uvs[vertex * 2 + 1] = metalV;
      }
    }
  }

  const indices: number[] = [];
  const groups: Array<{ start: number; count: number; material: number }> = [];

  for (const run of CAN_MATERIAL_RUNS) {
    const start = indices.length;

    for (let row = run.from; row < run.to; row += 1) {
      for (let column = 0; column < radialSegments; column += 1) {
        const a = row * columns + column;
        const b = a + 1;
        const c = a + columns;
        const d = c + 1;
        // Wound counter-clockwise as seen from outside the can, so the default
        // front-side culling keeps the shell visible rather than inside-out.
        // Degenerate quads collapse at the base-dome and lid-panel poles.
        if (profile[row].r > 1e-5) indices.push(a, b, c);
        if (profile[row + 1].r > 1e-5) indices.push(b, d, c);
      }
    }

    groups.push({ start, count: indices.length - start, material: run.material });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  groups.forEach(({ start, count, material }) =>
    geometry.addGroup(start, count, material),
  );
  // Anisotropic shading needs a tangent frame; without one Three falls back to
  // screen-space derivatives and the brushed highlight swims as the can turns.
  geometry.computeTangents();
  geometry.computeBoundingSphere();
  geometry.name = 'cola-can-lathe';

  return geometry;
}

/**
 * The stay-on-tab: a flat pressed lever riveted to the lid panel. Built as an
 * extruded outline rather than a torus so the finger ring reads as stamped
 * sheet metal instead of a doughnut.
 */
export function buildPullTabGeometry() {
  const mm = CAN_UNIT_SCALE;

  // Two clean concentric ellipses trianglulate reliably; the hand-drawn Bezier
  // outline this replaced had its top edge grazing the finger hole, which left
  // ShapeUtils unable to triangulate it at all.
  const outline = new THREE.Shape();
  outline.absellipse(0, 6, 8.8, 12.4, 0, Math.PI * 2, false, 0);

  // The finger hole is what makes the tab legible in silhouette.
  const hole = new THREE.Path();
  hole.absellipse(0, 9.4, 4.9, 6.9, 0, Math.PI * 2, true, 0);
  outline.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth: 0.6,
    bevelEnabled: true,
    bevelSize: 0.32,
    bevelThickness: 0.24,
    bevelSegments: 2,
    curveSegments: 20,
  });

  geometry.scale(mm, mm, mm);
  // Lays the pressed lever flat on the lid, nose pointing towards the front.
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  geometry.name = 'cola-can-tab';

  return geometry;
}

/** Height of the lid panel in scene units, for parenting the tab. */
export const LID_PANEL_Y =
  (113.62 - CAN_MM.overallHeight / 2) * CAN_UNIT_SCALE;
