import * as THREE from "three";
//import * as THREE from "https://cdn.skypack.dev/three@0.136";
import { MARBLE_006 } from "../../textures";

export const POWERUP_GEOMETRY = new THREE.SphereGeometry(0.75, 32, 32);

const textureLoader = new THREE.TextureLoader();
const getTexture = (path, { repeatX=1, repeatY=1, encoding=THREE.NoColorSpace } = {}) => {
  const texture = textureLoader.load(path, (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
  });
  texture.encoding = encoding;
  return texture;
};

export const POWERUP_MATERIAL = new THREE.MeshStandardMaterial({
  map: getTexture(MARBLE_006.baseColor, { encoding: THREE.SRGBColorSpace }),
  normalMap: getTexture(MARBLE_006.normalMap),
  roughnessMap: getTexture(MARBLE_006.roughnessMap),
  roughness: 1,
  emissive: 0xff00ff,
  emissiveIntensity: 0.2,
});
