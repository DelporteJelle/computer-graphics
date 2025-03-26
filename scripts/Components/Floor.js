import * as THREE from "https://cdn.skypack.dev/three@0.136";

import { ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH } from "../../config";
import { TILES_CERAMIC_WHITE } from "../../textures";

export function createMazeFloor(
  scene, octree,  
  { width, depth } 
) {
    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load(
      TILES_CERAMIC_WHITE.baseColor,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(5, 5);
      }
    );

    const normalMap = textureLoader.load(TILES_CERAMIC_WHITE.normalMap);
    const displacementMap = textureLoader.load(TILES_CERAMIC_WHITE.displacementMap);
    const roughnessMap = textureLoader.load(TILES_CERAMIC_WHITE.roughnessMap);

    let total_width = width * ROOM_SIZE;
    let total_depth = depth * ROOM_SIZE;
    let position = new THREE.Vector3(
      total_width / 2 - ROOM_SIZE / 2,
      0,
      total_depth / 2 - ROOM_SIZE / 2
    );

    const floorGeometry = new THREE.PlaneGeometry(total_width, total_depth);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      map: floorTexture,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(1, -1),
      displacementMap: displacementMap,
      displacementScale: 0,
      roughnessMap: roughnessMap,
      roughness: 1,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.set(position.x, position.y, position.z);
    scene.add(floor);

    octree.fromGraphNode(floor);
  }