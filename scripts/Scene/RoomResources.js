import * as THREE from "three";
//import * as THREE from "https://cdn.skypack.dev/three@0.136";
import { ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH } from "../../config";
import {
  CONCRETE_METAL,
  DIAMOND_PLATE_005,
  LAVA_TEXTURE,
  METAL_PLATES,
  PAINTED_METAL_016,
} from "../../textures";

/**
 * =======================
 *      ROOM RESOURCES
 * =======================
 * All rooms use the same textures and geometries, reusing them saves memory
 */

// Clock for animations
export const TEXTURE_CLOCK = new THREE.Clock();

/**
 * =======================
 * GEOMETRIES
 * =======================
 */
export const H_WALL = new THREE.BoxGeometry(
  ROOM_SIZE,
  ROOM_HEIGHT + 2,
  WALL_DEPTH
);
export const V_WALL = new THREE.BoxGeometry(
  WALL_DEPTH,
  ROOM_HEIGHT + 2,
  ROOM_SIZE
);

export const ROOM_FLOOR_VISUAL = new THREE.BoxGeometry(
  ROOM_SIZE,
  2,
  ROOM_SIZE
  // 5,
  // 5,
  // 5 // Subdivisions
);
export const ROOM_FLOOR_COLLISION = new THREE.BoxGeometry(
  ROOM_SIZE,
  2,
  ROOM_SIZE
);
export const LAVA_FLOOR = new THREE.BoxGeometry(
  ROOM_SIZE,
  1,
  ROOM_SIZE,
  ROOM_SIZE,
  ROOM_SIZE
);

const platformSize = ROOM_SIZE / 8;
export const ROUND_PLATFORM = new THREE.CylinderGeometry(
  platformSize,
  platformSize * 0.8,
  2,
  32
);

/**
 * =======================
 * TEXTURES
 * =======================
 */
const textureLoader = new THREE.TextureLoader();
const getTexture = (
  path,
  { repeatX = 1, repeatY = 1, encoding = THREE.NoColorSpace } = {}
) => {
  const texture = textureLoader.load(path, (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
  });
  texture.encoding = encoding;
  return texture;
};

export const INVISIBLE_MATERIAL = new THREE.MeshBasicMaterial({
  visible: false,
});

// Updated wall material with mappings, these are computationally expensive so I turned them off for now
export const WALL_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: getTexture(CONCRETE_METAL.baseColor, { encoding: THREE.SRGBColorSpace }), // Base color texture
});

export const FLOOR_MATERIAL_VISUAL = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: getTexture(METAL_PLATES.baseColor, { encoding: THREE.SRGBColorSpace }),
  normalMap: getTexture(METAL_PLATES.normalMap),
  normalScale: new THREE.Vector2(1, -1),
  displacementMap: getTexture(METAL_PLATES.displacementMap),
  displacementScale: 0,
  roughnessMap: getTexture(METAL_PLATES.roughnessMap), //I turned roughness off because it has little visual impact
  roughness: 0.5,
  aoMap: getTexture(METAL_PLATES.ambientOcclusionMap), //I turned ao off because it has little visual impact
  aoMapIntensity: 1,
  metalness: 0.7,
  // envMapIntensity: 1,
});

export const FLOOR_MATERIAL_START = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: getTexture(DIAMOND_PLATE_005.baseColor, { encoding: THREE.SRGBColorSpace }),
  normalMap: getTexture(DIAMOND_PLATE_005.normalMap),
  normalScale: new THREE.Vector2(1, -1),
  // displacementMap: getTexture(DIAMOND_PLATE_005.displacementMap),
  // displacementScale: 0,
  roughnessMap: getTexture(DIAMOND_PLATE_005.roughnessMap), //I turned roughness off because it has little visual impact
  roughness: 0.5,
  aoMap: getTexture(DIAMOND_PLATE_005.ambientOcclusionMap), //I turned ao off because it has little visual impact
  aoMapIntensity: 1,
  metalness: 0.7,
  // envMapIntensity: 1,
});

export const FLOOR_MATERIAL_END = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: getTexture(PAINTED_METAL_016.baseColor, { encoding: THREE.SRGBColorSpace }),
  normalMap: getTexture(PAINTED_METAL_016.normalMap),
  normalScale: new THREE.Vector2(1, -1),
  // displacementMap: getTexture(PAINTED_METAL_016.displacementMap),
  // displacementScale: 0,
  roughnessMap: getTexture(PAINTED_METAL_016.roughnessMap), //I turned roughness off because it has little visual impact
  roughness: 0.5,
  aoMap: getTexture(PAINTED_METAL_016.ambientOcclusionMap), //I turned ao off because it has little visual impact
  aoMapIntensity: 1,
  metalness: 0.7,
  // envMapIntensity: 1,
});

export const LAVA_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x666666,
  map: getTexture(LAVA_TEXTURE.baseColor, { 
    encoding: THREE.SRGBColorSpace 
  }),
  normalMap: getTexture(LAVA_TEXTURE.normalMap),
  normalScale: new THREE.Vector2(1, -1),
  displacementMap: getTexture(LAVA_TEXTURE.displacementMap),
  displacementScale: 0.3,
  emissive: 0xff3300,
  emissiveMap: getTexture(LAVA_TEXTURE.emissionMap, {
    encoding: THREE.SRGBColorSpace,
  }),
  emissiveIntensity: 2,
  roughnessMap: getTexture(LAVA_TEXTURE.roughnessMap),
  roughness: 0.5,
});