import * as THREE from "https://cdn.skypack.dev/three@0.136";
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';

import { ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH } from "../../config";

/**
 * Creates a room
 * @param {*} scene 
 * @param {*} octree 
 * @param {*} position 
 * @param {*} object containing booleans 
 */
export function createRoom(
  scene, octree, 
  position, 
  { N, E, S, W, start, end, lighting },
  // { ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH }
) {
    // Calculate Offset
    const offset = new THREE.Vector3(ROOM_SIZE, 0, ROOM_SIZE);
    position.multiply(offset);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    
    const createMesh = (geometry, position, material) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position); // Use copy, not set
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh); // Add to scene
      octree.fromGraphNode(mesh); // Add to octree
    };
  
    // Walls
    if (N) createMesh(
      new THREE.BoxGeometry(ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH), 
      new THREE.Vector3(position.x, ROOM_HEIGHT / 2, position.z - ROOM_SIZE / 2),
      wallMaterial
    );
    if (S) createMesh(
      new THREE.BoxGeometry(ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH), 
      new THREE.Vector3(position.x, ROOM_HEIGHT / 2, position.z + ROOM_SIZE / 2),
      wallMaterial
    );
    if (W) createMesh(
      new THREE.BoxGeometry(WALL_DEPTH, ROOM_HEIGHT, ROOM_SIZE), 
      new THREE.Vector3(position.x - ROOM_SIZE / 2, ROOM_HEIGHT / 2, position.z),
      wallMaterial
    );
    if (E) createMesh(
      new THREE.BoxGeometry(WALL_DEPTH, ROOM_HEIGHT, ROOM_SIZE), 
      new THREE.Vector3(position.x + ROOM_SIZE / 2, ROOM_HEIGHT / 2, position.z),
      wallMaterial
    );

    if (lighting) {
      const pointLight = new THREE.PointLight(
        0xffa500,       // color
        1.5,            // intensity
        ROOM_SIZE * 2   // distance
      );

      // Settings
      pointLight.position.set(position.x, ROOM_HEIGHT, position.z );
      pointLight.shadow.camera.near = 0.1;
      pointLight.shadow.camera.far = 100;
      pointLight.shadow.mapSize.width = 1024;
      pointLight.shadow.mapSize.height = 1024;
      pointLight.castShadow = true;
      pointLight.shadow.radius = 2; //Blur the shadow to make it softer
      pointLight.shadow.bias = -0.006; //Small bias can help reduce shadow artifacts

      scene.add(pointLight);

      const pointLightHelper = new THREE.PointLightHelper(pointLight, 1);
      scene.add(pointLightHelper);
    }
  
    // Debugging
    if (start || end) {
      const color = start ? 0x00ff00 : 0xff0000;
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(ROOM_SIZE, 0.01, ROOM_SIZE), 
        new THREE.MeshStandardMaterial({ color })
      );
      floor.position.copy(position);
      scene.add(floor);
    }
  
}