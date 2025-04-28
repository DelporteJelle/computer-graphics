import * as THREE from "https://cdn.skypack.dev/three@0.136";
import { RectAreaLightHelper } from "three/addons/helpers/RectAreaLightHelper.js";

import { ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH } from "../../config";
import {
  QUAKE,
  SLATE_FLOOR_TILE,
  TILES_CERAMIC_WHITE,
  STONE_WALL,
  STYLIZED_STONE_WALL,
} from "../../textures";
import { color } from "three/tsl";

/**
 * Creates a room
 * @param {*} scene_
 * @param {*} octree_
 * @param {*} position
 * @param {*} object containing booleans
 */
export function createRoom(
  scene_,
  octree_,
  position,
  { N, E, S, W, start, end }
) {
  // { ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH }
  // Calculate Offset
  const offset = new THREE.Vector3(ROOM_SIZE, 0, ROOM_SIZE);
  position.multiply(offset);

  const textureLoader = new THREE.TextureLoader();
  const texture = STONE_WALL;
  // const wallTexture = textureLoader.load(QUAKE.wallTiles, (texture) => {
  //   texture.wrapS = THREE.RepeatWrapping;
  //   texture.wrapT = THREE.RepeatWrapping;
  //   texture.repeat.set(3, 3);
  // });

  const normal = textureLoader.load(texture.normalMap, (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
  });
  const displacement = textureLoader.load(
    texture.displacementMap,
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
    }
  );
  const roughness = textureLoader.load(texture.roughnessMap, (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
  });
  const baseColor = textureLoader.load(texture.baseColor, (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
  });

  // Updated wall material with mappings, these are computationally expensive so I turned them off for now
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    map: baseColor, // Base color texture
    // normalMap: normal, // Normal map for surface details
    // displacementMap: displacement, // Displacement map for parallax effect
    // displacementScale: 0.1, // Adjust the scale of the displacement effect
    // roughnessMap: roughness, // Roughness map for surface reflectivity
    // roughness: 1, // Base roughness value
    // metalness: 0, // Non-metallic surface
  });

  const createMesh = (geometry, position, material) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position); // Use copy, not set
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene_.add(mesh); // Add to scene
    octree_.fromGraphNode(mesh); // Add to octree
  };

  // Walls
  if (N)
    createMesh(
      new THREE.BoxGeometry(ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH),
      new THREE.Vector3(
        position.x,
        ROOM_HEIGHT / 2,
        position.z - ROOM_SIZE / 2
      ),
      wallMaterial
    );
  if (S)
    createMesh(
      new THREE.BoxGeometry(ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH),
      new THREE.Vector3(
        position.x,
        ROOM_HEIGHT / 2,
        position.z + ROOM_SIZE / 2
      ),
      wallMaterial
    );
  if (W)
    createMesh(
      new THREE.BoxGeometry(WALL_DEPTH, ROOM_HEIGHT, ROOM_SIZE),
      new THREE.Vector3(
        position.x - ROOM_SIZE / 2,
        ROOM_HEIGHT / 2,
        position.z
      ),
      wallMaterial
    );
  if (E)
    createMesh(
      new THREE.BoxGeometry(WALL_DEPTH, ROOM_HEIGHT, ROOM_SIZE),
      new THREE.Vector3(
        position.x + ROOM_SIZE / 2,
        ROOM_HEIGHT / 2,
        position.z
      ),
      wallMaterial
    );

  // if (start || end) {
  //   const spotLight = new THREE.SpotLight(
  //     start ? 0xe5f6df : 0xff0000
  //    );
  //   spotLight.position.set(
  //     position.x,
  //     ROOM_HEIGHT,
  //     position.z
  //   );

  //   spotLight.castShadow = true;

  //   spotLight.shadow.mapSize.width = 1024;
  //   spotLight.shadow.mapSize.height = 1024;

  //   spotLight.shadow.camera.near = 500;
  //   spotLight.shadow.camera.far = 4000;
  //   spotLight.shadow.camera.fov = 30;

  //   scene_.add(spotLight)
  // }

  // Debugging
  if (start || end) {
    const color = start ? 0x00ff00 : 0xff0000;
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_SIZE, 0.01, ROOM_SIZE),
      new THREE.MeshStandardMaterial({ color })
    );
    floor.position.copy(position);
    scene_.add(floor);
  }
}
