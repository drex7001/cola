'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

import type { CameraState } from '@/lib/cameraStates';
import type { ScrollDirection } from '@/lib/sceneStore';
import type { ResponsiveTier } from './CameraRig';

const PARTICLE_COUNT: Record<ResponsiveTier, number> = {
  mobile: 700,
  tablet: 1600,
  desktop: 4000,
};

const VERTEX_SHADER = /* glsl */ `
  attribute float aSeed;

  uniform float uTime;
  uniform float uSpeed;
  uniform float uIntensity;
  uniform float uBurst;
  uniform float uPixelRatio;
  uniform float uPointSize;
  uniform float uTurbulence;

  varying float vSeed;
  varying float vVisibility;
  varying float vDepthFade;

  void main() {
    vec3 transformed = position;
    float activeTime = uTime * uSpeed;
    float rise = activeTime * (0.28 + aSeed * 0.62);
    transformed.y = mod(position.y + rise + 4.6, 9.2) - 4.6;
    transformed.x += sin(activeTime * 0.53 + aSeed * 31.0 + position.y) * uTurbulence;
    transformed.z += cos(activeTime * 0.37 + aSeed * 19.0 + position.x) * uTurbulence * 0.55;

    float burstWave = uBurst * (0.35 + aSeed * 1.8);
    transformed.x += sin(aSeed * 47.0) * burstWave;
    transformed.y += cos(aSeed * 29.0) * burstWave;
    transformed.z += sin(aSeed * 67.0) * burstWave;

    vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    float perspective = 6.0 / max(1.0, -viewPosition.z);
    gl_PointSize = uPointSize * (0.55 + aSeed * 1.35) * uPixelRatio * perspective;

    vSeed = aSeed;
    vVisibility = 1.0 - step(clamp(uIntensity / 1.3, 0.025, 1.0), aSeed);
    vDepthFade = 1.0 - smoothstep(2.0, 14.0, -viewPosition.z);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uSprite;
  uniform float uOpacity;
  uniform float uBurst;

  varying float vSeed;
  varying float vVisibility;
  varying float vDepthFade;

  void main() {
    vec4 sprite = texture2D(uSprite, gl_PointCoord);
    float alpha = sprite.a * uOpacity * vVisibility * vDepthFade;
    if (alpha < 0.015) discard;

    vec3 red = vec3(0.96, 0.018, 0.05);
    vec3 silver = vec3(0.78, 0.86, 0.94);
    vec3 color = mix(red, silver, smoothstep(0.62, 1.0, vSeed));
    color += vec3(0.15, 0.01, 0.01) * uBurst;
    gl_FragColor = vec4(color, alpha);
  }
`;

export type BubbleFieldHandle = {
  update: (
    state: CameraState,
    elapsed: number,
    delta: number,
    burstSignal: number,
    burstDirection: ScrollDirection,
    reducedMotion: boolean,
    distortion?: number,
  ) => void;
};

export type BubbleFieldProps = {
  tier: ResponsiveTier;
  reducedMotion: boolean;
};

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createBubbleSprite() {
  const size = 32;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size - 0.5;
      const ny = (y + 0.5) / size - 0.5;
      const distance = Math.sqrt(nx * nx + ny * ny) * 2;
      const edge = 1 - THREE.MathUtils.smoothstep(distance, 0.82, 1);
      const center = 1 - THREE.MathUtils.smoothstep(distance, 0, 0.78);
      const ring = Math.max(0, edge - center * 0.73);
      const highlight = Math.max(0, 1 - Math.hypot(nx + 0.2, ny + 0.2) * 8);
      const alpha = THREE.MathUtils.clamp(ring * 1.25 + center * 0.2 + highlight * 0.55, 0, 1);
      const offset = (y * size + x) * 4;
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = Math.round(alpha * 255);
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.name = 'procedural-bubble-sprite';
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

export const BubbleField = forwardRef<BubbleFieldHandle, BubbleFieldProps>(
  function BubbleField({ tier, reducedMotion }, ref) {
    const gl = useThree((state) => state.gl);
    const material = useRef<THREE.ShaderMaterial>(null);
    const burstEnergy = useRef(0);
    const seenBurst = useRef(0);
    const resourceOwners = useRef(0);
    const count = reducedMotion ? 140 : PARTICLE_COUNT[tier];

    const { positions, seeds } = useMemo(() => {
      const random = seededRandom(0x5eedc0de + count);
      const nextPositions = new Float32Array(count * 3);
      const nextSeeds = new Float32Array(count);

      for (let index = 0; index < count; index += 1) {
        const stride = index * 3;
        nextPositions[stride] = (random() - 0.5) * 12;
        nextPositions[stride + 1] = (random() - 0.5) * 9.2;
        nextPositions[stride + 2] = random() * 9 - 6;
        nextSeeds[index] = random();
      }

      return { positions: nextPositions, seeds: nextSeeds };
    }, [count]);

    const sprite = useMemo(createBubbleSprite, []);
    const uniforms = useMemo(
      () => ({
        uTime: { value: 0 },
        uSpeed: { value: reducedMotion ? 0 : 0.1 },
        uIntensity: { value: reducedMotion ? 0.16 : 0.05 },
        uBurst: { value: 0 },
        uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.5) },
        uPointSize: { value: tier === 'mobile' ? 8 : 10 },
        uTurbulence: { value: reducedMotion ? 0 : 0.08 },
        uOpacity: { value: reducedMotion ? 0.18 : 0.24 },
        uSprite: { value: sprite },
      }),
      [gl, reducedMotion, sprite, tier],
    );

    // Defer disposal by one microtask so React's development effect replay can
    // retain the same memoized texture safely, while real unmounts still clean up.
    useEffect(() => {
      resourceOwners.current += 1;
      return () => {
        resourceOwners.current -= 1;
        queueMicrotask(() => {
          if (resourceOwners.current === 0) sprite.dispose();
        });
      };
    }, [sprite]);

    useImperativeHandle(ref, () => ({
      update(
        state,
        elapsed,
        delta,
        burstSignal,
        burstDirection,
        prefersReducedMotion,
        distortion = 0,
      ) {
        const currentMaterial = material.current;
        if (!currentMaterial) return;

        if (burstSignal > seenBurst.current) {
          seenBurst.current = burstSignal;
          burstEnergy.current = prefersReducedMotion
            ? 0
            : burstDirection === 'backward'
              ? -1
              : 1;
        }

        burstEnergy.current = THREE.MathUtils.damp(burstEnergy.current, 0, 3.8, delta);
        const targetIntensity = prefersReducedMotion
          ? Math.min(0.16, state.bubbleIntensity)
          : state.bubbleIntensity;
        const targetSpeed = prefersReducedMotion ? 0 : state.bubbleSpeed;
        const targetTurbulence = prefersReducedMotion
          ? 0
          : 0.05 +
            Math.min(0.32, state.bubbleIntensity * 0.18) +
            Math.min(0.16, Math.max(0, distortion));
        const targetOpacity = prefersReducedMotion
          ? 0.16
          : Math.min(0.68, 0.16 + state.bubbleIntensity * 0.38);

        currentMaterial.uniforms.uTime.value = prefersReducedMotion ? 0 : elapsed;
        currentMaterial.uniforms.uIntensity.value = THREE.MathUtils.damp(
          currentMaterial.uniforms.uIntensity.value,
          targetIntensity,
          6,
          delta,
        );
        currentMaterial.uniforms.uSpeed.value = THREE.MathUtils.damp(
          currentMaterial.uniforms.uSpeed.value,
          targetSpeed,
          6,
          delta,
        );
        currentMaterial.uniforms.uTurbulence.value = THREE.MathUtils.damp(
          currentMaterial.uniforms.uTurbulence.value,
          targetTurbulence,
          5,
          delta,
        );
        currentMaterial.uniforms.uOpacity.value = THREE.MathUtils.damp(
          currentMaterial.uniforms.uOpacity.value,
          targetOpacity,
          6,
          delta,
        );
        currentMaterial.uniforms.uBurst.value = burstEnergy.current;
        currentMaterial.uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 1.5);
      },
    }));

    return (
      <points name="single-bubble-field" frustumCulled={false} renderOrder={0}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    );
  },
);
