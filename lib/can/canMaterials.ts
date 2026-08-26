import * as THREE from 'three';

import type { CanTextures } from './canTextures';

/**
 * Uniform handles kept alive after compilation so the flavour tint can be
 * animated per frame without triggering a shader recompile.
 */
export type TintUniforms = {
  colour: { value: THREE.Color };
  amount: { value: number };
};

export type CanMaterials = {
  /** Draw-group order must match CAN_MATERIAL_RUNS: print, metal, lid. */
  slots: [THREE.Material, THREE.Material, THREE.Material];
  body: THREE.MeshPhysicalMaterial;
  metal: THREE.MeshPhysicalMaterial;
  lid: THREE.MeshPhysicalMaterial;
  tab: THREE.MeshPhysicalMaterial;
  droplet: THREE.MeshPhysicalMaterial;
  tint: TintUniforms;
  dispose: () => void;
};

/**
 * Recolours just the ribbon, using the mask channel baked alongside the label.
 *
 * Doing this in the shader rather than by regenerating the label canvas is what
 * makes flavour switching instant: swapping a uniform costs nothing, whereas
 * repainting a 2048px texture would drop frames every time the pointer moved
 * across the selector.
 */
function installTintHook(
  material: THREE.MeshPhysicalMaterial,
  mask: THREE.Texture,
): TintUniforms {
  const tint: TintUniforms = {
    colour: { value: new THREE.Color('#f40009') },
    amount: { value: 1 },
  };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTintMask = { value: mask };
    shader.uniforms.uTintColour = tint.colour;
    shader.uniforms.uTintAmount = tint.amount;

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D uTintMask;
        uniform vec3 uTintColour;
        uniform float uTintAmount;`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float tintMask = texture2D( uTintMask, vMapUv ).r;
        // Preserving the ribbon's own luminance keeps the condensation
        // highlights sitting on top of it through the recolour.
        float tintLuma = dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
        vec3 tinted = uTintColour * ( 0.45 + tintLuma * 1.8 );
        diffuseColor.rgb = mix( diffuseColor.rgb, tinted, tintMask * uTintAmount );`,
      );
  };

  // Without this the renderer would reuse a cached program from an untinted
  // material with the same signature.
  material.customProgramCacheKey = () => 'cola-can-tint';

  return tint;
}

/**
 * Builds every material the can wears.
 *
 * The two that matter are anisotropy on the bare aluminium — a can's walls are
 * drawn and ironed, so its highlight smears along the tooling direction rather
 * than forming the round hotspot an isotropic metal gives — and clearcoat on
 * the print, which is the overprint varnish every real can is finished with and
 * the reason ink on a can looks wet rather than papery.
 */
export function createCanMaterials(textures: CanTextures): CanMaterials {
  const body = new THREE.MeshPhysicalMaterial({
    map: textures.label,
    roughnessMap: textures.labelRoughness,
    normalMap: textures.labelNormal,
    normalScale: new THREE.Vector2(0.42, 0.42),
    metalness: 0.06,
    roughness: 1,
    clearcoat: 0.45,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.55,
    name: 'can-print',
  });
  const tint = installTintHook(body, textures.tintMask);

  const metal = new THREE.MeshPhysicalMaterial({
    color: '#a8aeb6',
    roughnessMap: textures.metalRoughness,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    metalness: 1,
    roughness: 1,
    anisotropy: 0.55,
    // The tooling marks run along the profile, which is V here, so the
    // anisotropy axis is rotated a quarter turn off the default U tangent.
    anisotropyRotation: Math.PI / 2,
    envMapIntensity: 0.42,
    name: 'can-aluminium',
  });

  const lid = new THREE.MeshPhysicalMaterial({
    map: textures.lidMap,
    roughnessMap: textures.lidRoughness,
    normalMap: textures.lidNormal,
    normalScale: new THREE.Vector2(0.7, 0.7),
    metalness: 1,
    roughness: 1,
    anisotropy: 0.4,
    envMapIntensity: 0.4,
    name: 'can-lid',
  });

  const tab = new THREE.MeshPhysicalMaterial({
    color: '#c4c9d0',
    metalness: 1,
    roughness: 0.33,
    anisotropy: 0.35,
    envMapIntensity: 0.62,
    name: 'can-tab',
  });

  // Running drips read as clear water through a bright envmap reflection and a
  // low roughness — far cheaper than the transmission pass real refraction
  // would force on every frame of the whole scene.
  const droplet = new THREE.MeshPhysicalMaterial({
    color: '#dfeaf5',
    metalness: 0,
    roughness: 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 2.1,
    transparent: true,
    opacity: 0.42,
    name: 'can-drip',
  });

  const all = [body, metal, lid, tab, droplet];

  return {
    slots: [body, metal, lid],
    body,
    metal,
    lid,
    tab,
    droplet,
    tint,
    dispose: () => all.forEach((material) => material.dispose()),
  };
}
