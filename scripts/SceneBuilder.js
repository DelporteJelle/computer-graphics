/**
 * THREE.js
 */
import {
  BackSide,
  Box3,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
} from "three";
import * as THREE from "https://cdn.skypack.dev/three@0.136";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { color, roughness } from "three/tsl";

/**
 * Config
 */
import { WALL_DEPTH,
  STEPS_PER_FRAME, MAZE_WIDTH, MAZE_DEPTH,
  ROOM_SIZE, ROOM_HEIGHT, GRAVITY,
  JUMP_FORCE, MAX_SPEED, CAMERA_ANGLE_CAP
 } from "../config";

/**
 * Textures
 */
import { ICE_TEXTURE, TILES_CERAMIC_WHITE } from "../textures";

/**
 * Components
 */
import { createRoom } from "./Scene/Room";
import { createPlane } from "./Scene/Plane";

export class SceneBuilder {
  constructor(debugging = false, octree, scene, ROOM_SIZE, ROOM_HEIGHT) {
    this.ROOM_HEIGHT = ROOM_HEIGHT;
    this.ROOM_SIZE = ROOM_SIZE;
    this.WALL_DEPTH = WALL_DEPTH;
    this.debugging_ = debugging;
    this.loader_ = new GLTFLoader().setPath("/resources/");
    this.worldOctree_ = octree;
    this.scene_ = scene;
  }

  /**
   * @TODO the bounding box is still far of the actual shape of the object in some cases (for example when object is rotated)
   *
   * Adds object to the scene and adds it to the octree
   * To reduce lagg we use the bounding box for collisions
   * Adds a wireframe to represent the collision box for debugging when debugging is enabled
   *
   * @param {*} path
   * @param {THREE.Vector3} position
   * @param {boolean} spherical //To set the bounding box to a sphere if this is closer to the actural shape
   * @param {THREE.Vector3} rotation
   */
  load_glb_object(
    path,
    position,
    spherical = false,
    rotation = new THREE.Vector3(0, 0, 0)
  ) {
    this.loader_.load(path, (gltf) => {
      const object = gltf.scene;
      this.scene_.add(object);
      object.position.set(position.x, position.y, position.z);
      object.rotation.set(rotation.x, rotation.y, rotation.z);

      const boundingBox = new Box3().setFromObject(object);
      const size = boundingBox.getSize(new THREE.Vector3());
      const center = boundingBox.getCenter(new THREE.Vector3());

      let boundingMesh;
      if (spherical) {
        const radius = Math.max(size.x, size.y, size.z) / 2;
        boundingMesh = new Mesh(
          new SphereGeometry(radius, 10, 10),
          new MeshBasicMaterial({
            color: 0xff0000,
            visible: this.debugging_,
            wireframe: this.debugging_,
          })
        );
        boundingMesh.scale.set(size.x / 2, size.y / 2, size.z / 2); // Scale to fit the bounding box
      } else {
        const boxMaterial = new MeshBasicMaterial({
          color: 0xff0000,
          visible: this.debugging_,
          wireframe: this.debugging_,
        });
        boundingMesh = new Mesh(
          new BoxGeometry(size.x, size.y, size.z),
          boxMaterial
        );
      }
      boundingMesh.position.set(center.x, center.y, center.z);
      this.scene_.add(boundingMesh);

      this.worldOctree_.fromGraphNode(boundingMesh);

      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });
  }

  /**
   * creates a mesh with given geometry, material and position
   * @param {*} geometry 
   * @param {*} material 
   * @param {*} position 
   */
  createMesh(geometry, material, position) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene_.add(mesh);
    this.worldOctree_.fromGraphNode(mesh);
  }

  buildMaze(tiles) {
    for (let i = 0; i < MAZE_WIDTH; i++) {
      for (let j = 0; j < MAZE_DEPTH; j++) {
        let tile = tiles[i][j];
        createRoom(
          this.scene_,
          this.worldOctree_,
          new THREE.Vector3(i, 0, j),
          { 
            N: tile.N, 
            E: i == MAZE_WIDTH - 1 ? true : false, //Only place East wall if it's the last tile in the row
            S: j == MAZE_DEPTH - 1 ? true : false, //Only place South wall if it's the last tile in the column
            W: tile.W,
            start: tile.start,
            end: tile.end
          }
        );
      }
    }
  }


  createPlane(width, depth, height) {
    createPlane(
      this.scene_,
      this.worldOctree_,
      {
        width,
        depth,
        height
      }
    )
  }
}
