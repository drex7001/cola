'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

import type { CameraState } from '@/lib/cameraStates';

export type ResponsiveTier = 'mobile' | 'tablet' | 'desktop';

export type CameraRigHandle = {
  update: (
    state: CameraState,
    delta: number,
    reducedMotion: boolean,
    tier: ResponsiveTier,
  ) => void;
};

const FOV_BY_TIER: Record<ResponsiveTier, number> = {
  mobile: 38,
  tablet: 34,
  desktop: 32,
};

/**
 * Drives the one camera created by R3F's Canvas. Keeping the rig renderless
 * avoids introducing a second temporary camera into the persistent scene.
 */
export const CameraRig = forwardRef<CameraRigHandle>(function CameraRig(_, ref) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const target = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      update(state, delta, reducedMotion, tier) {
        const [px, py, pz] = state.position;
        const [tx, ty, tz] = state.target;
        const response = reducedMotion ? 14 : 5.5;

        desiredTarget.current.set(tx, ty, tz);

        if (!initialized.current) {
          camera.position.set(px, py, pz);
          target.current.copy(desiredTarget.current);
          camera.fov = FOV_BY_TIER[tier];
          camera.updateProjectionMatrix();
          initialized.current = true;
        } else {
          camera.position.x = THREE.MathUtils.damp(camera.position.x, px, response, delta);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, py, response, delta);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, pz, response, delta);
          target.current.x = THREE.MathUtils.damp(target.current.x, tx, response, delta);
          target.current.y = THREE.MathUtils.damp(target.current.y, ty, response, delta);
          target.current.z = THREE.MathUtils.damp(target.current.z, tz, response, delta);

          const nextFov = THREE.MathUtils.damp(
            camera.fov,
            FOV_BY_TIER[tier],
            6,
            delta,
          );
          if (Math.abs(nextFov - camera.fov) > 0.001) {
            camera.fov = nextFov;
            camera.updateProjectionMatrix();
          }
        }

        camera.lookAt(target.current);
      },
    }),
    [camera],
  );

  return null;
});

