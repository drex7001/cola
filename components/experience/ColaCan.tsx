'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

import type { CameraState } from '@/lib/cameraStates';
import type { ResponsiveTier } from './CameraRig';

const CAN_HEIGHT = 3.2;
const CAN_RADIUS = 0.95;
const DROPLET_BASES = [
  [-0.54, 0.92, 0.79],
  [0.48, 0.22, 0.85],
  [-0.22, -0.46, 0.93],
] as const;

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

function drawTrackedText(
  context: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  baselineY: number,
  tracking: number,
) {
  const glyphWidths = [...text].map((glyph) => context.measureText(glyph).width);
  const totalWidth =
    glyphWidths.reduce((total, width) => total + width, 0) + tracking * (text.length - 1);
  let cursor = centerX - totalWidth / 2;

  [...text].forEach((glyph, index) => {
    context.fillText(glyph, cursor, baselineY);
    cursor += glyphWidths[index] + tracking;
  });
}

function createZeroTexture(anisotropy: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 384;
  const context = canvas.getContext('2d');

  if (!context) return null;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.font = '900 152px "Arial Black", "Helvetica Neue", Arial, sans-serif';
  drawTrackedText(context, 'ZERO', canvas.width / 2, canvas.height / 2 + 8, 12);

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = 'procedural-zero-label';
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, anisotropy);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  // CylinderGeometry places its UV seam toward the viewer in the opening
  // pose, so a half-turn centers the wordmark on the visible face.
  texture.offset.x = 0.4;
  texture.needsUpdate = true;
  return texture;
}

export const ColaCan = forwardRef<ColaCanHandle>(function ColaCan(_, ref) {
  const gl = useThree((state) => state.gl);
  const group = useRef<THREE.Group>(null);
  const bandMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const labelMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const droplets = useRef<Array<THREE.Mesh | null>>([]);
  const targetBandColor = useRef(new THREE.Color('#f40009'));
  const zeroTexture = useMemo(
    () => createZeroTexture(gl.capabilities.getMaxAnisotropy()),
    [gl],
  );

  const aluminumMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#c7ccd1',
        metalness: 0.92,
        roughness: 0.24,
      }),
    [],
  );

  const dropletGeometry = useMemo(() => new THREE.SphereGeometry(0.095, 16, 12), []);
  const dropletMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#e8f3ff',
        metalness: 0,
        roughness: 0.08,
        transmission: 0.72,
        thickness: 0.08,
        transparent: true,
        opacity: 0.72,
      }),
    [],
  );

  useEffect(() => () => zeroTexture?.dispose(), [zeroTexture]);

  useEffect(
    () => () => {
      aluminumMaterial.dispose();
      dropletGeometry.dispose();
      dropletMaterial.dispose();
    },
    [aluminumMaterial, dropletGeometry, dropletMaterial],
  );

  useImperativeHandle(ref, () => ({
    update(state, progress, elapsed, delta, bandColor, reducedMotion, tier) {
      if (!group.current) return;

      const [x, y, z] = state.canPosition;
      const [rx, ry, rz] = state.canRotation;
      const response = reducedMotion ? 14 : 6.5;
      const xSpread = X_SPREAD_BY_TIER[tier];
      const tierScale = SCALE_BY_TIER[tier];
      const finalDrift = !reducedMotion && progress > 4.55 ? elapsed * 0.055 : 0;
      const heroBreath = !reducedMotion && progress < 0.7 ? Math.sin(elapsed * 0.48) * 0.018 : 0;

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
      const nextScale = THREE.MathUtils.damp(
        group.current.scale.x,
        desiredScale,
        response,
        delta,
      );
      group.current.scale.setScalar(nextScale);

      if (bandMaterial.current) {
        targetBandColor.current.set(bandColor || '#f40009');
        const bandReveal = reducedMotion
          ? 1
          : THREE.MathUtils.lerp(
              0.22,
              1,
              THREE.MathUtils.smoothstep(progress, 0.08, 0.62),
            );
        targetBandColor.current.multiplyScalar(bandReveal);
        bandMaterial.current.color.lerp(
          targetBandColor.current,
          1 - Math.exp(-delta * (reducedMotion ? 16 : 7)),
        );
        bandMaterial.current.emissive.copy(bandMaterial.current.color).multiplyScalar(0.08);
      }

      if (labelMaterial.current) {
        const labelReveal = reducedMotion
          ? 1
          : THREE.MathUtils.lerp(
              0.16,
              1,
              THREE.MathUtils.smoothstep(progress, 0.12, 0.86),
            );
        labelMaterial.current.opacity = THREE.MathUtils.damp(
          labelMaterial.current.opacity,
          labelReveal,
          7,
          delta,
        );
      }

      const dropletsMove = !reducedMotion && progress > 0.58 && progress < 1.72;
      droplets.current.forEach((droplet, index) => {
        if (!droplet) return;
        const [, baseY] = DROPLET_BASES[index];
        const travel = dropletsMove ? (elapsed * (0.035 + index * 0.009)) % 0.48 : 0;
        droplet.position.y = baseY - travel;
      });
    },
  }));

  return (
    <group ref={group} name="primary-zero-can" rotation-order="YXZ">
      <mesh material={aluminumMaterial} name="aluminum-body">
        <cylinderGeometry args={[CAN_RADIUS, CAN_RADIUS, CAN_HEIGHT, 64, 1, false]} />
      </mesh>

      <mesh name="matte-black-label" renderOrder={1}>
        <cylinderGeometry args={[CAN_RADIUS + 0.006, CAN_RADIUS + 0.006, 2.77, 64, 1, true]} />
        <meshStandardMaterial
          color="#090909"
          metalness={0.68}
          roughness={0.37}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      <mesh name="flavor-band" position={[0, -0.72, 0]} renderOrder={2}>
        <cylinderGeometry args={[CAN_RADIUS + 0.015, CAN_RADIUS + 0.015, 0.34, 64, 1, true]} />
        <meshStandardMaterial
          ref={bandMaterial}
          color="#f40009"
          emissive="#180001"
          emissiveIntensity={0.42}
          metalness={0.52}
          roughness={0.3}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>

      <mesh name="zero-label" position={[0, 0.22, 0]} renderOrder={3}>
        <cylinderGeometry
          args={[CAN_RADIUS + 0.021, CAN_RADIUS + 0.021, 0.82, 64, 1, true]}
        />
        <meshStandardMaterial
          ref={labelMaterial}
          color="#ffffff"
          map={zeroTexture ?? undefined}
          alphaMap={zeroTexture ?? undefined}
          transparent
          alphaTest={0.08}
          depthWrite={false}
          metalness={0.38}
          roughness={0.34}
          polygonOffset
          polygonOffsetFactor={-3}
        />
      </mesh>

      <mesh material={aluminumMaterial} name="top" position={[0, CAN_HEIGHT / 2 + 0.015, 0]}>
        <cylinderGeometry args={[0.88, 0.92, 0.085, 64]} />
      </mesh>
      <mesh material={aluminumMaterial} name="bottom" position={[0, -CAN_HEIGHT / 2 - 0.015, 0]}>
        <cylinderGeometry args={[0.92, 0.87, 0.08, 64]} />
      </mesh>

      <mesh
        material={aluminumMaterial}
        name="top-rim"
        position={[0, CAN_HEIGHT / 2 + 0.065, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.885, 0.052, 10, 64]} />
      </mesh>
      <mesh
        material={aluminumMaterial}
        name="bottom-rim"
        position={[0, -CAN_HEIGHT / 2 - 0.06, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.885, 0.052, 10, 64]} />
      </mesh>

      <mesh
        material={aluminumMaterial}
        name="pull-tab"
        position={[0, CAN_HEIGHT / 2 + 0.115, 0.04]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.62, 1, 1.12]}
      >
        <torusGeometry args={[0.22, 0.055, 10, 32]} />
      </mesh>

      {DROPLET_BASES.map(([x, y, z], index) => (
        <mesh
          key={`${x}-${y}`}
          ref={(node) => {
            droplets.current[index] = node;
          }}
          name={`condensation-droplet-${index + 1}`}
          geometry={dropletGeometry}
          material={dropletMaterial}
          position={[x, y, z]}
          scale={[0.72 + index * 0.13, 1.35 + index * 0.16, 0.48]}
        />
      ))}
    </group>
  );
});
