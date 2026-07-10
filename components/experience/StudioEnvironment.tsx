'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** A local studio IBL generated once per WebGL context; no HDR download. */
export function StudioEnvironment() {
  const getThree = useThree((state) => state.get);

  useEffect(() => {
    // The environment is an imperative renderer resource. Reading the current
    // R3F state inside the effect keeps the mutation out of React render state.
    const { gl, scene } = getThree();
    const previousEnvironment = scene.environment;
    const previousEnvironmentIntensity = scene.environmentIntensity;
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(gl);
    const renderTarget = generator.fromScene(room, 0.035, 0.1, 50);

    scene.environment = renderTarget.texture;
    scene.environmentIntensity = 0.72;

    return () => {
      if (scene.environment === renderTarget.texture) {
        scene.environment = previousEnvironment;
        scene.environmentIntensity = previousEnvironmentIntensity;
      }
      room.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => material.dispose());
        } else {
          mesh.material?.dispose();
        }
      });
      renderTarget.dispose();
      generator.dispose();
    };
  }, [getThree]);

  return null;
}
