'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';

import type { CameraState } from '@/lib/cameraStates';
import type { ResponsiveTier } from './CameraRig';

export type SceneLightingHandle = {
  update: (
    state: CameraState,
    elapsed: number,
    delta: number,
    reducedMotion: boolean,
  ) => void;
};

export type SceneLightingProps = {
  tier: ResponsiveTier;
};

export const SceneLighting = forwardRef<SceneLightingHandle, SceneLightingProps>(
  function SceneLighting({ tier }, ref) {
    const key = useRef<THREE.SpotLight>(null);
    const redRim = useRef<THREE.PointLight>(null);
    const silverRim = useRef<THREE.PointLight>(null);
    const movingGlint = useRef<THREE.PointLight>(null);

    useImperativeHandle(ref, () => ({
      update(state, elapsed, delta, reducedMotion) {
        const response = reducedMotion ? 14 : 6;
        const intensity = Math.max(0.15, state.lightIntensity);

        if (key.current) {
          key.current.intensity = THREE.MathUtils.damp(
            key.current.intensity,
            6.5 * intensity,
            response,
            delta,
          );
        }
        if (redRim.current) {
          redRim.current.intensity = THREE.MathUtils.damp(
            redRim.current.intensity,
            4.2 * intensity,
            response,
            delta,
          );
        }
        if (silverRim.current) {
          silverRim.current.intensity = THREE.MathUtils.damp(
            silverRim.current.intensity,
            2.8 * intensity,
            response,
            delta,
          );
        }
        if (movingGlint.current) {
          movingGlint.current.intensity = THREE.MathUtils.damp(
            movingGlint.current.intensity,
            3.4 * intensity,
            response,
            delta,
          );

          const phase = reducedMotion ? 0.35 : elapsed * 0.42;
          movingGlint.current.position.set(
            Math.sin(phase) * 3.7,
            1.8 + Math.cos(phase * 0.7),
            2.2 + Math.cos(phase) * 0.8,
          );
        }
      },
    }));

    return (
      <group name="studio-lighting">
        <ambientLight color="#c9d2dc" intensity={tier === 'mobile' ? 0.08 : 0.1} />
        <spotLight
          ref={key}
          name="soft-front-key"
          color="#fff8ee"
          position={[2.8, 4.5, 5.8]}
          angle={0.48}
          penumbra={0.9}
          intensity={14}
          distance={18}
          decay={2}
        />
        <pointLight
          ref={redRim}
          name="red-side-rim"
          color="#f40009"
          position={[-4.2, 0.5, 1.2]}
          intensity={10}
          distance={11}
          decay={2}
        />

        {tier !== 'mobile' ? (
          <pointLight
            ref={silverRim}
            name="cool-silver-rim"
            color="#b9d9ff"
            position={[3.6, 1.6, -2.7]}
            intensity={6}
            distance={12}
            decay={2}
          />
        ) : null}

        {tier === 'desktop' ? (
          <pointLight
            ref={movingGlint}
            name="moving-specular-light"
            color="#ffffff"
            position={[0, 2.5, 3]}
            intensity={5}
            distance={7}
            decay={2}
          />
        ) : null}
      </group>
    );
  },
);

