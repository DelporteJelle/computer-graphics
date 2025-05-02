import * as THREE from "https://cdn.skypack.dev/three@0.136";
import { MARBLE_006 } from "../../textures";

export const POWERUP_GEOMETRY = new THREE.SphereGeometry(1, 32, 32);

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

export const POWERUP_MATERIAL = new THREE.MeshStandardMaterial({
  map: getTexture(MARBLE_006.baseColor, { encoding: THREE.sRGBEncoding }),
  normalMap: getTexture(MARBLE_006.normalMap),
  roughnessMap: getTexture(MARBLE_006.roughnessMap),
  roughness: 1,
  emissive: 0xff00ff,
  emissiveIntensity: 0.2,
});;

export const POWERUP_LIGHT = new THREE.PointLight(0xff00ff, 0.5, 5);
