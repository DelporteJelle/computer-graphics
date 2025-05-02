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
import { color, emissive, roughness } from "three/tsl";

/**
 * Config
 */
import {
  WALL_DEPTH,
  STEPS_PER_FRAME,
  ROOM_SIZE,
  ROOM_HEIGHT,
  GRAVITY,
  JUMP_FORCE,
  MAX_SPEED,
  CAMERA_ANGLE_CAP,
} from "../config";

/**
 * Textures
 */
import {
  MARBLE_006,
  METAL_012,
  METAL_030,
  METAL_PLATES_GLOSSY,
  ONYX_013,
} from "../textures";

/**
 * Components
 */
import { createRoom } from "./Scene/Room";
import { createPlane } from "./Scene/Plane";
import createCeiling from "./Scene/Ceiling";
import Room from "./Scene/Room2";

export default class SceneBuilder {
  constructor(
    debugging = false,
    octree,
    scene,
    ROOM_SIZE,
    ROOM_HEIGHT,
    MAZE_WIDTH,
    MAZE_DEPTH,
    powerupLocations
  ) {
    this.ROOM_HEIGHT = ROOM_HEIGHT;
    this.ROOM_SIZE = ROOM_SIZE;
    this.WALL_DEPTH = WALL_DEPTH;
    this.debugging_ = debugging;
    this.loader_ = new GLTFLoader().setPath("/resources/");
    this.worldOctree_ = octree;
    this.scene_ = scene;
    this.MAZE_WIDTH = MAZE_WIDTH;
    this.MAZE_DEPTH = MAZE_DEPTH;
    this.powerupLocations_ = powerupLocations;
    this.powerupTextures_ = this.loadPowerupTextures();
    this.sharedPowerupMaterial_ = this.createSharedPowerupMaterial();
  }

  loadPowerupTextures() {
    const textureLoader = new THREE.TextureLoader();

    const configureTexture = (path, repeatX = 1, repeatY = 1) => {
      return textureLoader.load(path, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
      });
    };

    const texture = MARBLE_006;

    return {
      baseColor: configureTexture(texture.baseColor),
      normal: configureTexture(texture.normalMap),
      roughness: configureTexture(texture.roughnessMap),
      displacement: configureTexture(texture.displacementMap),
    };
  }

  createSharedPowerupMaterial() {
    const textureLoader = new THREE.TextureLoader();

    const configureTexture = (path) => {
      const texture = textureLoader.load(path);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    };

    const baseColor = configureTexture(MARBLE_006.baseColor);
    const normalMap = configureTexture(MARBLE_006.normalMap);
    const roughnessMap = configureTexture(MARBLE_006.roughnessMap);

    return new THREE.MeshStandardMaterial({
      map: baseColor,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
      roughness: 1,
      emissive: 0xff00ff,
      emissiveIntensity: 0.2,
    });
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

  /**
   * Builds maze from grid of generated tiles
   * @param {*} tiles
   */
  buildMaze(tiles) {
    for (let i = 0; i < this.MAZE_WIDTH; i++) {
      for (let j = 0; j < this.MAZE_DEPTH; j++) {
        let tile = tiles[i][j];
        // createRoom(this.scene_, this.worldOctree_, new THREE.Vector3(i, 0, j), {
        //   N: tile.N,
        //   E: i == this.MAZE_WIDTH - 1 ? true : false, //Only place East wall if it's the last tile in the row
        //   S: j == this.MAZE_DEPTH - 1 ? true : false, //Only place South wall if it's the last tile in the column
        //   W: tile.W,
        //   start: tile.start,
        //   end: tile.end,
        // });
        const room = new Room(tile);
        if (tile.hasPowerup) {
          this.createPowerUp(tile.x * ROOM_SIZE, 2, tile.y * ROOM_SIZE);
        }
        room.vMeshes.forEach((mesh) => this.scene_.add(mesh)); // Add to scene
        room.cMeshes.forEach((mesh) => this.worldOctree_.fromGraphNode(mesh)); // Add to octree)
      }
    }
  }

  createPlane(width, depth, height) {
    createPlane(this.scene_, this.worldOctree_, {
      width,
      depth,
      height,
    });
  }

  createCeiling(width, depth, height) {
    createCeiling(this.scene_, this.worldOctree_, {
      width,
      depth,
      height,
    });
  }

  /**
   * Spawns a powerup at the given position
   * @param {Vector3} pos
   * @param {string} type // Type of powerup (e.g., "speed", "jump", "time")
   */
  createPowerUp(x, y, z) {
    this.powerupLocations_.push(new THREE.Vector3(x, y, z));

    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32); // Radius 1, 32 segments

    const sphere = new THREE.Mesh(sphereGeometry, this.sharedPowerupMaterial_);
    sphere.position.set(x, y, z);
    sphere.castShadow = true;
    sphere.receiveShadow = false;
    this.scene_.add(sphere);

    const pointLight = new THREE.PointLight(0xff00ff, 0.5, 5);
    pointLight.position.set(x, y, z);
    pointLight.castShadow = false; // Disable shadows to reduce texture unit usage
    this.scene_.add(pointLight);

    let time = 0;

    // Adds an animation to make the ball move up and down and spin
    const animate = () => {
      time += 0.01;

      sphere.position.y = 1 + Math.sin(time * 2) * 0.5;
      sphere.rotation.y += 0.01;
      sphere.rotation.x += 0.005;

      requestAnimationFrame(animate);
    };

    animate();
  }
}
