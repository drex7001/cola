'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { EffectComposer } from '@react-three/postprocessing';
import { useFrame, useThree } from '@react-three/fiber';
import { BloomEffect } from 'postprocessing';
import * as THREE from 'three';

import {
  createCameraState,
  getCameraStateAtProgress,
} from '@/lib/cameraStates';
import { sceneState } from '@/lib/sceneStore';
import { BubbleField, type BubbleFieldHandle } from './BubbleField';
import { CameraRig, type CameraRigHandle, type ResponsiveTier } from './CameraRig';
import { ColaCan, type ColaCanHandle } from './ColaCan';
import {
  SceneLighting,
  type SceneLightingHandle,
} from './SceneLighting';
import { StudioEnvironment } from './StudioEnvironment';

export type ExperienceSceneProps = {
  tier: ResponsiveTier;
  reducedMotion: boolean;
  onContextLost: () => void;
  onContextRestored: () => void;
  onReady: () => void;
};

const clampDelta = (delta: number) => Math.min(delta, 1 / 20);
const clampProgress = (progress: number) => Math.min(5, Math.max(0, progress));
const SPIN_ROTATION_BY_TIER: Record<ResponsiveTier, number> = {
  mobile: 0.28,
  tablet: 0.5,
  desktop: 1,
};

/** Attaches native WebGL lifecycle listeners to the renderer-owned canvas. */
function WebGLContextGuard({
  onContextLost,
  onContextRestored,
}: Pick<ExperienceSceneProps, 'onContextLost' | 'onContextRestored'>) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (event: Event) => {
      // Preventing the default allows the browser to attempt context recovery.
      event.preventDefault();
      onContextLost();
    };
    const handleContextRestored = () => onContextRestored();

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost, false);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored, false);
    };
  }, [gl, onContextLost, onContextRestored]);

  return null;
}

/**
 * Owns the only high-frequency loop in the scene. Scroll-driven values remain
 * mutable in sceneState, while the camera, product, particles and lights are
 * updated through stable imperative handles without React rerenders.
 */
export function ExperienceScene({
  tier,
  reducedMotion,
  onContextLost,
  onContextRestored,
  onReady,
}: ExperienceSceneProps) {
  const getThree = useThree((state) => state.get);
  const cameraRig = useRef<CameraRigHandle>(null);
  const can = useRef<ColaCanHandle>(null);
  const bubbles = useRef<BubbleFieldHandle>(null);
  const lighting = useRef<SceneLightingHandle>(null);
  const bloom = useRef<BloomEffect>(null);
  const bloomEffect = useMemo(
    () =>
      new BloomEffect({
        intensity: 0,
        luminanceThreshold: 0.78,
        luminanceSmoothing: 0.18,
        mipmapBlur: true,
        radius: 0.55,
        levels: tier === 'desktop' ? 6 : 4,
      }),
    [tier],
  );
  const sampledState = useRef(createCameraState());
  const didSignalReady = useRef(false);
  const fog = useRef(new THREE.FogExp2('#060304', 0.045));

  // Bloom is only meaningful during the First Sip payoff, so the composer (and
  // its per-frame full-screen passes) is mounted just for that chapter window
  // instead of running for the entire experience.
  const [bloomMounted, setBloomMounted] = useState(false);
  const bloomWindowRef = useRef(false);

  useEffect(() => {
    const { scene } = getThree();
    const previousFog = scene.fog;
    const sceneFog = fog.current;
    scene.fog = sceneFog;

    return () => {
      if (scene.fog === sceneFog) scene.fog = previousFog;
    };
  }, [getThree]);

  useEffect(() => () => bloomEffect.dispose(), [bloomEffect]);

  const postProcessingEnabled = tier !== 'mobile' && !reducedMotion;

  useFrame(({ clock, gl }, frameDelta) => {
    const delta = clampDelta(frameDelta);
    const elapsed = clock.elapsedTime;
    const rawProgress = clampProgress(sceneState.scrollProgress);
    const progress = reducedMotion ? Math.round(rawProgress) : rawProgress;
    const state = getCameraStateAtProgress(progress, sampledState.current);

    // Keep the authored desktop inspection while reducing angular travel on
    // smaller screens. The can catches up while it is hidden inside the
    // abstract science transition, preventing a visible rotation jump.
    if (!reducedMotion && tier !== 'desktop' && progress < 2.65) {
      const heroRotation = -0.2;
      const tierRotation =
        heroRotation +
        (state.canRotation[1] - heroRotation) * SPIN_ROTATION_BY_TIER[tier];
      const catchup = THREE.MathUtils.smoothstep(progress, 2, 2.65);
      state.canRotation[1] = THREE.MathUtils.lerp(
        tierRotation,
        state.canRotation[1],
        catchup,
      );
    }

    if (!reducedMotion) {
      const whipAmount = Math.max(0, sceneState.cameraWhip);
      const tierWhip = tier === 'desktop' ? 0.72 : 0.38;
      state.position[0] += whipAmount * tierWhip;
      state.position[1] += whipAmount * 0.12;
      state.target[0] -= whipAmount * tierWhip * 0.36;

      // The desktop/tablet lifestyle rail reuses this same primary can rather
      // than mounting a card-specific product duplicate.
      if (tier !== 'mobile' && progress >= 3.85 && progress < 4.9) {
        const railProgress = THREE.MathUtils.clamp(sceneState.momentsProgress, 0, 1);
        state.canPosition[0] = THREE.MathUtils.lerp(-2.15, 2.15, railProgress);
        state.canRotation[1] += railProgress * 0.42;
      }
    }

    cameraRig.current?.update(state, delta, reducedMotion, tier);
    can.current?.update(
      state,
      progress,
      elapsed,
      delta,
      sceneState.bandColor,
      reducedMotion,
      tier,
    );
    bubbles.current?.update(
      state,
      elapsed,
      delta,
      sceneState.bubbleBurst,
      sceneState.bubbleBurstDirection,
      reducedMotion,
      sceneState.distortion,
    );
    lighting.current?.update(state, elapsed, delta, reducedMotion);

    const targetFogDensity = reducedMotion
      ? 0.04
      : 0.038 + state.bubbleIntensity * 0.012 + sceneState.distortion * 0.04;
    fog.current.density = THREE.MathUtils.damp(
      fog.current.density,
      targetFogDensity,
      5,
      delta,
    );

    if (bloom.current) {
      // Only the authored store value creates the short First Sip payoff;
      // interpolated camera-state bloom would remain visible for too long.
      const authoredBloom = Math.max(0, sceneState.bloomIntensity);
      const tierBloom = tier === 'tablet' ? authoredBloom * 0.55 : authoredBloom;
      bloom.current.intensity = THREE.MathUtils.damp(
        bloom.current.intensity,
        tierBloom,
        10,
        delta,
      );
    }

    const targetExposure = reducedMotion
      ? 0.92
      : 0.9 + Math.min(0.16, sceneState.wipeProgress * 0.16);
    gl.toneMappingExposure = THREE.MathUtils.damp(
      gl.toneMappingExposure,
      targetExposure,
      7,
      delta,
    );

    if (postProcessingEnabled) {
      // Enter the window slightly before the sip chapter and leave just after so
      // the composer is present whenever the authored bloom value ramps.
      const wantBloom = progress > 2.55 && progress < 3.75;
      if (wantBloom !== bloomWindowRef.current) {
        bloomWindowRef.current = wantBloom;
        setBloomMounted(wantBloom);
      }
    }

    if (!didSignalReady.current) {
      didSignalReady.current = true;
      onReady();
    }
  });

  return (
    <>
      <WebGLContextGuard
        onContextLost={onContextLost}
        onContextRestored={onContextRestored}
      />
      <StudioEnvironment tier={tier} />
      <CameraRig ref={cameraRig} />
      <SceneLighting ref={lighting} tier={tier} />
      <BubbleField ref={bubbles} tier={tier} reducedMotion={reducedMotion} />
      <ColaCan ref={can} tier={tier} />

      {postProcessingEnabled && bloomMounted ? (
        <EffectComposer
          multisampling={tier === 'desktop' ? 2 : 0}
          resolutionScale={tier === 'tablet' ? 0.65 : 1}
          enableNormalPass={false}
        >
          <primitive
            ref={bloom}
            object={bloomEffect}
            dispose={null}
          />
        </EffectComposer>
      ) : null}
    </>
  );
}
