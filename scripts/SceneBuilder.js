/**
 * THREE.js
 */
//import * as THREE from "https://cdn.skypack.dev/three@0.136";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


/**
 * Components
 */
import createCeiling from "./Scene/Ceiling";
import Room from "./Scene/Room";

export default class SceneBuilder {
  constructor(
    debugging = false,
    octree,
    scene,
    MAZE_WIDTH,
    MAZE_DEPTH,
  ) {
    this.debugging_ = debugging;
    this.loader_ = new GLTFLoader().setPath("/resources/");
    this.worldOctree_ = octree;
    this.scene_ = scene;
    this.MAZE_WIDTH = MAZE_WIDTH;
    this.MAZE_DEPTH = MAZE_DEPTH;
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
    path, position, {
      spherical=false,
      rotation=new THREE.Euler(0, 0, 0, 'XYZ'),
      scale=new THREE.Vector3(1, 1, 1),
      shadows=true,
    } = {}
  ) {
    this.loader_.load(path, (gltf) => {
      const group = gltf.scene;
      group.position.copy(position);
      group.rotation.set(rotation.x, rotation.y, rotation.z);
      group.scale.copy(scale);
      this.scene_.add(group);

      const boundingBox = new THREE.Box3().setFromObject(group);
      const size = boundingBox.getSize(new THREE.Vector3());
      const center = boundingBox.getCenter(new THREE.Vector3());

      let boundingMesh;
      if (spherical) {
        const radius = Math.max(size.x, size.y, size.z) / 2;
        boundingMesh = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 10, 10),
          new THREE.MeshBasicMaterial({
            color: 0xff0000,
            visible: this.debugging_,
            wireframe: this.debugging_,
          })
        );
        boundingMesh.scale.set(size.x / 2, size.y / 2, size.z / 2); // Scale to fit the bounding box
      } else {
        const boxMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          visible: this.debugging_,
          wireframe: this.debugging_,
        });
        boundingMesh = new THREE.Mesh(
          new THREE.BoxGeometry(size.x, size.y, size.z),
          boxMaterial
        );
      }
      boundingMesh.position.set(center.x, center.y, center.z);
      this.scene_.add(boundingMesh);

      this.worldOctree_.fromGraphNode(boundingMesh);

      group.traverse((child) => {
        if (child.isMesh && shadows) {
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

  /**
   * Builds maze from grid of generated tiles
   * @param {*} tiles
   */
  buildMaze(tiles) {
    for (let i = 0; i < this.MAZE_WIDTH; i++) {
      for (let j = 0; j < this.MAZE_DEPTH; j++) {
        let tile = tiles[i][j];
        const room = new Room(tile, this);
        room.vMeshes.forEach((mesh) => this.scene_.add(mesh)); // Add to scene
        room.cMeshes.forEach((mesh) => this.worldOctree_.fromGraphNode(mesh)); // Add to octree
        if (room.light) this.scene_.add(room.light);
        if (room.target) this.scene_.add(room.target);
      }
    }
  }

  createCeiling(width, depth, height) {
    const ceiling = createCeiling(width, depth, height);
    this.scene_.add(ceiling.visualCeiling);
    this.worldOctree_.fromGraphNode(ceiling.collisionCeiling)
  }
}
