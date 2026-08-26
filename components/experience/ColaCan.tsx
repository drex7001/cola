'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

import type { CameraState } from '@/lib/cameraStates';
import {
  buildCanGeometry,
  buildPullTabGeometry,
  LID_PANEL_Y,
  RADIAL_SEGMENTS,
} from '@/lib/can/canGeometry';
import { createCanMaterials } from '@/lib/can/canMaterials';
import { createCanTextures } from '@/lib/can/canTextures';
import type { ResponsiveTier } from './CameraRig';

const SCALE_BY_TIER: Record<ResponsiveTier, number> = {
  mobile: 0.82,
  tablet: 0.92,
  desktop: 1,
};

const X_SPREAD_BY_TIER: Record<ResponsiveTier, number> = {
  mobile: 0.52,
  tablet: 0.78,
  desktop: 1,
};

/**
 * A handful of beads large enough to break surface tension and run. The static
 * condensation lives in the normal map; these are only the ones that move.
 */
const DRIPS = [
  { angle: -0.42, y: 0.86, size: 0.05, speed: 0.055 },
  { angle: 0.34, y: 0.32, size: 0.042, speed: 0.043 },
  { angle: -0.12, y: -0.24, size: 0.058, speed: 0.062 },
  { angle: 0.66, y: 1.12, size: 0.038, speed: 0.037 },
] as const;

/** Body radius in scene units, so drips can be parked on the surface. */
const SURFACE_RADIUS = 0.905;

export type ColaCanHandle = {
  update: (
    state: CameraState,
    progress: number,
    elapsed: number,
    delta: number,
    bandColor: string,
    reducedMotion: boolean,
    tier: ResponsiveTier,
  ) => void;
};

export type ColaCanProps = {
  tier: ResponsiveTier;
};

export const ColaCan = forwardRef<ColaCanHandle, ColaCanProps>(function ColaCan(
  { tier },
  ref,
) {
  const gl = useThree((state) => state.gl);
  const group = useRef<THREE.Group>(null);
  const drips = useRef<Array<THREE.Mesh | null>>([]);
  const targetTint = useRef(new THREE.Color('#f40009'));
  const reveal = useRef(new THREE.Color());

  // Geometry, textures and materials are all derived from the tier, so a
  // breakpoint change rebuilds exactly one memo chain and nothing else.
  const segments = RADIAL_SEGMENTS[tier];
  const geometry = useMemo(() => buildCanGeometry(segments), [segments]);
  const tabGeometry = useMemo(() => buildPullTabGeometry(), []);
  const dripGeometry = useMemo(() => new THREE.SphereGeometry(1, 12, 10), []);

  const textures = useMemo(
    () => createCanTextures(tier, gl.capabilities.getMaxAnisotropy()),
    [tier, gl],
  );
  const materials = useMemo(() => createCanMaterials(textures), [textures]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => tabGeometry.dispose(), [tabGeometry]);
  useEffect(() => () => dripGeometry.dispose(), [dripGeometry]);
  useEffect(() => () => textures.dispose(), [textures]);
  useEffect(() => () => materials.dispose(), [materials]);

  useImperativeHandle(ref, () => ({
    update(state, progress, elapsed, delta, bandColor, reducedMotion, tier) {
      if (!group.current) return;

      const [x, y, z] = state.canPosition;
      const [rx, ry, rz] = state.canRotation;
      const response = reducedMotion ? 14 : 6.5;
      const xSpread = X_SPREAD_BY_TIER[tier];
      const tierScale = SCALE_BY_TIER[tier];
      const finalDrift = !reducedMotion && progress > 4.55 ? elapsed * 0.055 : 0;
      const heroBreath =
        !reducedMotion && progress < 0.7 ? Math.sin(elapsed * 0.48) * 0.018 : 0;

      group.current.position.x = THREE.MathUtils.damp(
        group.current.position.x,
        x * xSpread,
        response,
        delta,
      );
      group.current.position.y = THREE.MathUtils.damp(
        group.current.position.y,
        y + heroBreath,
        response,
        delta,
      );
      group.current.position.z = THREE.MathUtils.damp(
        group.current.position.z,
        z,
        response,
        delta,
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        rx,
        response,
        delta,
      );
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        ry + finalDrift,
        response,
        delta,
      );
      group.current.rotation.z = THREE.MathUtils.damp(
        group.current.rotation.z,
        rz,
        response,
        delta,
      );

      const desiredScale = state.canScale * tierScale;
      group.current.scale.setScalar(
        THREE.MathUtils.damp(group.current.scale.x, desiredScale, response, delta),
      );

      // The pack emerges out of the void rather than cutting in: multiplying the
      // base colour dims the printed artwork towards black without needing a
      // second material or a transparency pass.
      const emergence = reducedMotion
        ? 1
        : THREE.MathUtils.lerp(
            0.3,
            1,
            THREE.MathUtils.smoothstep(progress, 0.04, 0.62),
          );
      reveal.current.setScalar(emergence);
      const settle = 1 - Math.exp(-delta * (reducedMotion ? 16 : 7));
      materials.body.color.lerp(reveal.current, settle);
      materials.lid.color.lerp(reveal.current, settle);
      materials.metal.color.lerp(
        reveal.current.clone().multiply(new THREE.Color('#cbd0d7')),
        settle,
      );

      targetTint.current.set(bandColor || '#f40009');
      materials.tint.colour.value.lerp(targetTint.current, settle);

      // Drips only run while the can is being inspected up close.
      const running = !reducedMotion && progress > 0.58 && progress < 2.4;
      drips.current.forEach((drip, index) => {
        if (!drip) return;
        const spec = DRIPS[index];
        const travel = running ? (elapsed * spec.speed) % 0.62 : 0;
        drip.position.y = spec.y - travel;
        // A bead stretches as it accelerates down the wall.
        drip.scale.set(spec.size * 0.82, spec.size * (1.5 + travel * 1.6), spec.size * 0.6);
      });
    },
  }));

  return (
    <group ref={group} name="primary-cola-can" rotation-order="YXZ">
      <mesh geometry={geometry} material={materials.slots} name="can-shell" />

      <mesh
        geometry={tabGeometry}
        material={materials.tab}
        name="stay-on-tab"
        position={[0, LID_PANEL_Y + 0.004, 0]}
      />

      {DRIPS.map((drip, index) => (
        <mesh
          key={drip.angle}
          ref={(node) => {
            drips.current[index] = node;
          }}
          name={`running-drip-${index + 1}`}
          geometry={dripGeometry}
          material={materials.droplet}
          position={[
            Math.sin(drip.angle) * SURFACE_RADIUS,
            drip.y,
            Math.cos(drip.angle) * SURFACE_RADIUS,
          ]}
          rotation={[0, drip.angle, 0]}
          scale={[drip.size * 0.82, drip.size * 1.5, drip.size * 0.6]}
        />
      ))}
    </group>
  );
});
