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
    MAZE_DEPTH
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

  createPowerUp() {
    const textureLoader = new THREE.TextureLoader();

    const configureTexture = (path, repeatX = 1, repeatY = 1) => {
      return textureLoader.load(path, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
      });
    };

    const texture = MARBLE_006;

    const baseColor = configureTexture(texture.baseColor);
    const normal = configureTexture(texture.normalMap);
    const roughness = configureTexture(texture.roughnessMap);
    const displacementMap = configureTexture(texture.displacementMap);
    // const metalness = configureTexture(texture.metalness);

    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32); // Radius 1, 32 segments
    const sphereMaterial = new THREE.MeshStandardMaterial({
      map: baseColor,
      normalMap: normal,
      roughnessMap: roughness,
      roughness: 1,
      // displacementMap: displacementMap,
      // displacementScale: 0.05, // Adjust for subtle displacement
      // metalnessMap: metalness,
      emissive: 0xff00ff, // Green emissive color
      emissiveIntensity: 0.2, // Adjust intensity
    });

    // Create the sphere mesh
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0, 1, -3); // Position the sphere above the floor
    sphere.castShadow = true; // Enable shadow casting
    sphere.receiveShadow = false; // Sphere doesn't need to receive shadows
    this.scene_.add(sphere);

    const pointLight = new THREE.PointLight(0xff00ff, 0.5, 5); // Orange light, intensity 1, range 10
    pointLight.position.set(0, 1, -3); // Same position as the sphere
    pointLight.castShadow = true; // Enable shadows for the light
    this.scene_.add(pointLight);

    let time = 0;

    // Add animation to make the ball move up and down and spin
    const animate = () => {
      time += 0.01; // Increment time for smooth animation

      // Make the sphere move up and down
      sphere.position.y = 1 + Math.sin(time * 2) * 0.5; // Oscillate between 0.5 and 1.5

      // Make the sphere spin slowly
      sphere.rotation.y += 0.01; // Rotate around the Y-axis
      sphere.rotation.x += 0.005; // Rotate around the X-axis

      // Ensure the animation loop continues
      requestAnimationFrame(animate);
    };

    // Start the animation
    animate();

    // // Create a reflective floor
    // const floorGeometry = new THREE.PlaneGeometry(10, 10); // Floor size
    // const floorMaterial = new THREE.MeshStandardMaterial({
    //   color: 0x222222,
    //   metalness: 0.8,
    //   roughness: 0.2,
    //   envMapIntensity: 1.0, // Enhance reflections
    // });

    // const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    // floor.rotation.x = -Math.PI / 2; // Rotate to lie flat
    // floor.position.set(0, 0, 0); // Position at ground level
    // floor.receiveShadow = true; // Enable shadow receiving
    // this.scene_.add(floor);
  }
}
