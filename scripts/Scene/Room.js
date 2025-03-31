import * as THREE from "https://cdn.skypack.dev/three@0.136";
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';

import { ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH } from "../../config";
import { QUAKE } from "../../textures";

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
  { N, E, S, W, start, end },
  // { ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH }
) {
    // Calculate Offset
    const offset = new THREE.Vector3(ROOM_SIZE, 0, ROOM_SIZE);
    position.multiply(offset);

    const textureLoader = new THREE.TextureLoader();
  
    const wallTexture = textureLoader.load(
      QUAKE.wallTiles,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3, 3);
      }
    );
    
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        map: wallTexture,
        normalScale: new THREE.Vector2(1, -1),
        roughness: 1,
      }); 

    // const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    
    const createMesh = (geometry, position, material) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position); // Use copy, not set
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene_.add(mesh); // Add to scene
      octree_.fromGraphNode(mesh); // Add to octree
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

/**
 * Orignal function from scenebuilder, can be deleted later
 */
// create_room(position, N, E, S, W, start = false, end = false, tile) {
//   // Floor
//   const textureLoader = new THREE.TextureLoader();
//   const floorTexture = textureLoader.load(
//     TILES_CERAMIC_WHITE.baseColor,
//     (texture) => {
//       texture.wrapS = THREE.RepeatWrapping;
//       texture.wrapT = THREE.RepeatWrapping;
//       texture.repeat.set(5, 5);
//     }
//   );

//   const normalMap = textureLoader.load(TILES_CERAMIC_WHITE.normalMap);
//   const displacementMap = textureLoader.load(
//     TILES_CERAMIC_WHITE.displacementMap
//   );
//   const roughnessMap = textureLoader.load(TILES_CERAMIC_WHITE.roughnessMap);

//   const offset = new THREE.Vector3(this.ROOM_SIZE, 0, this.ROOM_SIZE);
//   position.multiply(offset);

//   // const ceilingGeometry = new THREE.PlaneGeometry(
//   //   this.ROOM_SIZE,
//   //   this.ROOM_SIZE
//   // );
//   // const ceilingMaterial = new THREE.MeshStandardMaterial({
//   //   color: 0x222222,
//   //   side: THREE.BackSide,
//   // });
//   // const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
//   // ceiling.rotation.x = -Math.PI / 2;
//   // ceiling.receiveShadow = true;
//   // ceiling.position.set(position.x, position.y + this.ROOM_HEIGHT, position.z);
//   // this.scene_.add(ceiling);
//   // this.worldOctree_.fromGraphNode(ceiling);

//   // const wallMaterial = new THREE.MeshStandardMaterial({
//   //   color: 0xffffff,
//   //   map: floorTexture,
//   //   normalMap: normalMap,
//   //   normalScale: new THREE.Vector2(1, -1),
//   //   displacementMap: displacementMap,
//   //   displacementScale: 0,
//   //   roughnessMap: roughnessMap,
//   //   roughness: 1,
//   // });

//   // Walls
//   const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
//   if (N) {
//     this.createMesh(
//       new THREE.BoxGeometry(
//         this.ROOM_SIZE,
//         this.ROOM_HEIGHT,
//         this.WALL_DEPTH
//       ),
//       wallMaterial,
//       new THREE.Vector3(
//         position.x,
//         this.ROOM_HEIGHT / 2,
//         position.z - this.ROOM_SIZE / 2
//       )
//     );
//   }
//   if (S) {
//     this.createMesh(
//       new THREE.BoxGeometry(
//         this.ROOM_SIZE,
//         this.ROOM_HEIGHT,
//         this.WALL_DEPTH
//       ),
//       wallMaterial,
//       new THREE.Vector3(
//         position.x,
//         this.ROOM_HEIGHT / 2,
//         position.z + this.ROOM_SIZE / 2
//       )
//     );
//   }
//   if (W) {
//     this.createMesh(
//       new THREE.BoxGeometry(
//         this.WALL_DEPTH,
//         this.ROOM_HEIGHT,
//         this.ROOM_SIZE
//       ),
//       wallMaterial,
//       new THREE.Vector3(
//         position.x - this.ROOM_SIZE / 2,
//         this.ROOM_HEIGHT / 2,
//         position.z
//       )
//     );
//   }
//   if (E) {
//     this.createMesh(
//       new THREE.BoxGeometry(
//         this.WALL_DEPTH,
//         this.ROOM_HEIGHT,
//         this.ROOM_SIZE
//       ),
//       wallMaterial,
//       new THREE.Vector3(
//         position.x + this.ROOM_SIZE / 2,
//         this.ROOM_HEIGHT / 2,
//         position.z
//       )
//     );
//   }

//   //Meshes for debugging purposes
//   if (start) {
//     this.createMesh(
//       new THREE.BoxGeometry(this.ROOM_SIZE, 0.01, this.ROOM_SIZE),
//       new THREE.MeshStandardMaterial({
//         color: 0x00ff00,
//       }),
//       new THREE.Vector3(position.x, 0, position.z)
//     );
//   }
//   if (end) {
//     this.createMesh(
//       new THREE.BoxGeometry(this.ROOM_SIZE, 0.01, this.ROOM_SIZE),
//       new THREE.MeshStandardMaterial({
//         color: 0xff0000,
//       }),
//       new THREE.Vector3(position.x, 0, position.z)
//     );
//   }
//   // if (tile.has_shortcut) {
//   //   this.createMesh(
//   //     new THREE.BoxGeometry(this.ROOM_SIZE, 0.01, this.ROOM_SIZE),
//   //     new THREE.MeshStandardMaterial({
//   //       color: 0x0000ff,
//   //     }),
//   //     new THREE.Vector3(position.x, 0, position.z)
//   //   );
//   // }
//   // this.createMesh(
//   //   new THREE.SphereGeometry(0.1, 10, 10),
//   //   new THREE.MeshStandardMaterial({
//   //     color: new THREE.Color().lerpColors(
//   //       new THREE.Color(0x0000ff), // Blue for close distances
//   //       new THREE.Color(0xff0000), // Red for far distances
//   //       tile.hall_id / 15 // Normalize distance
//   //     ),
//   //   }),
//   //   new THREE.Vector3(position.x, 0, position.z)
//   // );
// }