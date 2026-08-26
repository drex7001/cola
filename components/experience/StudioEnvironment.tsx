'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

import type { ResponsiveTier } from './CameraRig';

/**
 * A packshot lighting rig, pre-filtered once into an environment map.
 *
 * This is the single biggest difference between a can that looks rendered and
 * one that looks photographed. Point and spot lights put round hotspots on a
 * cylinder, which reads instantly as CG. Real product photography surrounds the
 * subject with tall, narrow softboxes whose reflections smear into the vertical
 * highlight bands running down every can in a catalogue — so the rig below is
 * literally a set of emissive panels arranged the way a studio would place them.
 *
 * Built by hand rather than with drei's <Environment>: that component captures
 * a plain cube render target, whereas PMREMGenerator produces a properly
 * pre-filtered radiance mip chain, which is what makes a rough surface and a
 * polished one reflect the same room convincingly.
 */

/** Cube face size the rig is captured at, before pre-filtering. */
const RESOLUTION: Record<ResponsiveTier, number> = {
  mobile: 128,
  tablet: 192,
  desktop: 256,
};

type Panel = {
  name: string;
  position: [number, number, number];
  /** Width and height of the emissive panel, in scene units. */
  size: [number, number];
  color: string;
  /** Radiance multiplier; values above one are why the target is half-float. */
  intensity: number;
  circular?: boolean;
};

const PANELS: readonly Panel[] = [
  // Twin vertical keys: the pair of long specular bands down the body edges.
  {
    name: 'key-left',
    position: [-3.4, 0.4, 1.6],
    size: [2.6, 11],
    color: '#fff6ea',
    intensity: 5.4,
  },
  {
    name: 'key-right',
    position: [3.5, 0.2, 1.2],
    size: [2.2, 11],
    color: '#eef4ff',
    intensity: 3.6,
  },
  // Overhead box. Deliberately large and pulled back, because a lid is a
  // polished disc facing straight up: whatever fills its up-and-back reflection
  // cone is what it looks like, and that has to be white, not the brand rake.
  {
    name: 'top-box',
    position: [0, 5.4, -1.4],
    size: [12, 11],
    color: '#ffffff',
    intensity: 3.0,
  },
  // Weak front fill: it lifts the printed artwork out of shadow, nothing more.
  {
    name: 'front-fill',
    position: [0.4, -0.6, 6.5],
    size: [9, 6],
    color: '#dfe6f2',
    intensity: 0.4,
  },
  // Brand accent raking in from behind, tying the pack to the page's red.
  {
    name: 'red-rake',
    position: [-3.6, -1.9, -2.6],
    size: [2.0, 5.2],
    color: '#ff1220',
    intensity: 1.9,
  },
  // Cool back rim that separates the silhouette from the page.
  {
    name: 'back-rim',
    position: [1.8, 1.4, -4.2],
    size: [3.6, 8],
    color: '#9dc0ff',
    intensity: 2.1,
  },
  // A small hard source for the pinpoint glints on the seam and tab.
  {
    name: 'glint',
    position: [1.4, 3.6, 3.4],
    size: [0.9, 0.9],
    color: '#ffffff',
    intensity: 8,
    circular: true,
  },
];

function buildStudioScene() {
  const scene = new THREE.Scene();
  const disposables: Array<{ dispose: () => void }> = [];

  // The surround has to be darker than the keys or a black can cannot stay
  // black: every surface would pick up a uniform grey wash.
  const roomGeometry = new THREE.BoxGeometry(60, 60, 60);
  const roomMaterial = new THREE.MeshBasicMaterial({
    color: '#040405',
    side: THREE.BackSide,
  });
  scene.add(new THREE.Mesh(roomGeometry, roomMaterial));
  disposables.push(roomGeometry, roomMaterial);

  for (const panel of PANELS) {
    const geometry = panel.circular
      ? new THREE.CircleGeometry(panel.size[0] / 2, 24)
      : new THREE.PlaneGeometry(panel.size[0], panel.size[1]);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(panel.color).multiplyScalar(panel.intensity),
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = panel.name;
    mesh.position.set(...panel.position);
    // Aiming every panel at the subject is exactly how the shot would be set.
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    disposables.push(geometry, material);
  }

  return {
    scene,
    dispose: () => disposables.forEach((item) => item.dispose()),
  };
}

export type StudioEnvironmentProps = {
  tier: ResponsiveTier;
};

export function StudioEnvironment({ tier }: StudioEnvironmentProps) {
  const getThree = useThree((state) => state.get);

  useEffect(() => {
    // The environment is an imperative renderer resource, so the current R3F
    // state is read inside the effect rather than subscribed to in render.
    const { gl, scene } = getThree();
    const previousEnvironment = scene.environment;
    const previousIntensity = scene.environmentIntensity;

    const studio = buildStudioScene();
    const generator = new THREE.PMREMGenerator(gl);
      // A small sigma keeps the softbox edges crisp enough to read as panels in
    // the polished metal while still blurring cleanly at high roughness.
    const target = generator.fromScene(studio.scene, 0.02, 0.1, 100, {
      size: RESOLUTION[tier],
    });

    scene.environment = target.texture;
    scene.environmentIntensity = 1;

    return () => {
      if (scene.environment === target.texture) {
        scene.environment = previousEnvironment;
        scene.environmentIntensity = previousIntensity;
      }
      target.dispose();
      generator.dispose();
      studio.dispose();
    };
  }, [getThree, tier]);

  return null;
}
