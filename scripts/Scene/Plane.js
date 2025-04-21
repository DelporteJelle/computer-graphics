import * as THREE from "https://cdn.skypack.dev/three@0.136";

import { ROOM_SIZE } from "../../config";
import { SLATE_FLOOR_TILE, STONE_PATH } from "../../textures";
import { ao } from "three/examples/jsm/tsl/display/GTAONode.js";

/**
 * Creates a plane with given params
 * @param {*} scene_
 * @param {*} octree_
 * @param { object } params
 */
export function createPlane(scene_, octree_, { width, depth, height }) {
  const textureLoader = new THREE.TextureLoader();

  const planeTexture = textureLoader.load(STONE_PATH.baseColor, (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 5);
  });
  const normalMap = textureLoader.load(STONE_PATH.normalMap, (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 5);
  });
  const displacementMap = textureLoader.load(
    STONE_PATH.displacementMap,
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5);
    }
  );
  const roughnessMap = textureLoader.load(
    STONE_PATH.roughnessMap,
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5);
    }
  );
  const ambientOcclusionMap = textureLoader.load(
    STONE_PATH.ambienOcclusionMap,
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5);
    }
  );

  let total_width = width * ROOM_SIZE;
  let total_depth = depth * ROOM_SIZE;
  let position = new THREE.Vector3(
    total_width / 2 - ROOM_SIZE / 2,
    height,
    total_depth / 2 - ROOM_SIZE / 2
  );

  const visualPlaneGeometry = new THREE.PlaneGeometry(
    total_width,
    total_depth,
    total_width * 5, //Subdivisions to make displacement map work
    total_depth * 5
  );
  const visualPlaneMaterial = new THREE.MeshStandardMaterial({
    color: 0x666666,
    map: planeTexture,
    normalMap: normalMap,
    normalScale: new THREE.Vector2(1, -1),
    displacementMap: displacementMap,
    displacementScale: 0.2,
    roughnessMap: roughnessMap,
    roughness: 0.5,
    aoMap: ambientOcclusionMap,
    aoMapIntensity: 1,
  });
  const visualPlane = new THREE.Mesh(visualPlaneGeometry, visualPlaneMaterial);
  visualPlane.rotation.x = -Math.PI / 2;
  visualPlane.receiveShadow = true;
  visualPlane.position.set(position.x, position.y, position.z);

  // Add visual plane to the scene (not the octree)
  scene_.add(visualPlane);

  // Add to octree
  const collisionPlaneGeometry = new THREE.PlaneGeometry(
    total_width,
    total_depth,
    1, // No subdivisions
    1
  );
  const collisionPlaneMaterial = new THREE.MeshBasicMaterial({
    visible: false,
  }); // Invisible collision plane
  const collisionPlane = new THREE.Mesh(
    collisionPlaneGeometry,
    collisionPlaneMaterial
  );
  collisionPlane.rotation.x = -Math.PI / 2;
  collisionPlane.position.set(position.x, position.y, position.z);

  // Add collision plane to the octree
  octree_.fromGraphNode(collisionPlane);
}
