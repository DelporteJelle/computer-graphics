import * as THREE from "https://cdn.skypack.dev/three@0.136";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH } from "../../../config";
import { CONCRETE_METAL, LAVA_TEXTURE, METAL_PLATES } from "../../../textures";

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
export const H_WALL = new THREE.BoxGeometry(ROOM_SIZE, ROOM_HEIGHT+2, WALL_DEPTH);
export const V_WALL = new THREE.BoxGeometry(WALL_DEPTH, ROOM_HEIGHT+2, ROOM_SIZE);
export const ROOM_FLOOR_VISUAL = new THREE.BoxGeometry(
  ROOM_SIZE, 2, ROOM_SIZE,
  5, 5, 5 // Subdivisions
);
export const ROOM_FLOOR_COLLISION = new THREE.BoxGeometry(ROOM_SIZE, 2, ROOM_SIZE);
export const LAVA_FLOOR = new THREE.BoxGeometry(ROOM_SIZE, 1, ROOM_SIZE);

/**
 * =======================
 * TEXTURES
 * =======================
 */
const textureLoader = new THREE.TextureLoader();
const getTexture = (path, { repeatX=1, repeatY=1, encoding=THREE.LinearEncoding } = {}) => {
  const texture = textureLoader.load(path, (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
  });
  texture.encoding = encoding;
  return texture;
};

export const INVISIBLE_MATERIAL = new THREE.MeshBasicMaterial({ visible: false });

// Updated wall material with mappings, these are computationally expensive so I turned them off for now
export const WALL_MATERIAL = new THREE.MeshStandardMaterial({
    map: getTexture(CONCRETE_METAL.baseColor, { encoding: THREE.sRGBEncoding }), // Base color texture
});

export const FLOOR_MATERIAL_VISUAL = new THREE.MeshStandardMaterial({
    color: 0x666666,
    map: getTexture(METAL_PLATES.baseColor, { encoding: THREE.sRGBEncoding }),
    normalMap: getTexture(METAL_PLATES.normalMap),
    normalScale: new THREE.Vector2(1, -1),
    displacementMap: getTexture(METAL_PLATES.displacementMap),
    displacementScale: 0,
    roughnessMap: getTexture(METAL_PLATES.roughnessMap), //I turned roughness off because it has little visual impact
    roughness: 0.5,
    aoMap: getTexture(METAL_PLATES.ambientOcclusionMap), //I turned ao off because it has little visual impact
    aoMapIntensity: 1,
    metalness: 0.5,
    roughness: 0.5,
    // envMapIntensity: 1,
});

export const LAVA_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0x666666,
  map: getTexture(LAVA_TEXTURE.baseColor, { encoding: THREE.sRGBEncoding }),
  normalMap: getTexture(LAVA_TEXTURE.normalMap),
  normalScale: new THREE.Vector2(1, -1),
  displacementMap: getTexture(LAVA_TEXTURE.displacementMap),
  displacementScale: 0.2,
  emissive: 0xff3300,
  emissiveMap: getTexture(LAVA_TEXTURE.emissionMap, { encoding: THREE.sRGBEncoding }),
  emissiveIntensity: 2,
  roughnessMap: getTexture(LAVA_TEXTURE.roughnessMap),
  roughness: 0.5,
});

export const START_MATERIAL = null;
export const END_MATERIAL = null;