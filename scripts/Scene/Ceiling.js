import * as THREE from "https://cdn.skypack.dev/three@0.136";
import * as Config from "../../config";
import { SLATE_FLOOR_TILE, METAL_WALKWAY } from "../../textures";

export default function createCeiling(
  width, 
  depth, 
  height
) {
  const texture = METAL_WALKWAY;
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

  const total_width = width * Config.ROOM_SIZE;
  const total_depth = depth * Config.ROOM_SIZE;
  const position = new THREE.Vector3(
    total_width / 2 - Config.ROOM_SIZE / 2,
    height,
    total_depth / 2 - Config.ROOM_SIZE / 2
  );

  /**
   * SCENE
   */
  const visualCeilingGeometry = new THREE.PlaneGeometry(
    total_width,
    total_depth,
    total_width * 5,
    total_depth * 5
  );
  const sharedCeilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x666666,
    map: getTexture(texture.baseColor, { repeatX: width, repeatY: depth, encoding: THREE.sRGBEncoding }),
    displacementMap: getTexture(texture.displacementMap, { repeatX: width, repeatY: depth }),
    displacementScale: 0.7,
    roughnessMap: getTexture(texture.roughnessMap, { repeatX: width, repeatY: depth }),
    roughness: 0.5,
    aoMap: getTexture(texture.ambientOcclusionMap, { repeatX: width, repeatY: depth }),
    aoMapIntensity: 1,
  });

  const visualCeiling = new THREE.Mesh(
    visualCeilingGeometry,
    sharedCeilingMaterial
  );

  visualCeiling.receiveShadow = true;
  visualCeiling.rotation.x = Math.PI / 2;
  visualCeiling.position.set(position.x, position.y, position.z);

  /**
   * OCTREE
   */
  const collisionCeilingGeometry = new THREE.PlaneGeometry(
    total_width,
    total_depth,
    1,
    1
  );

  const collisionCeilingMaterial = new THREE.MeshBasicMaterial({
    visible: false,
  });

  // Invisible collision plane
  const collisionCeiling = new THREE.Mesh(
    collisionCeilingGeometry,
    collisionCeilingMaterial
  );

  collisionCeiling.rotation.x = -Math.PI / 2;
  collisionCeiling.position.set(position.x, position.y, position.z);

  return {
    visualCeiling: visualCeiling,
    collisionCeiling: collisionCeiling
  };
}
