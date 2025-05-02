import * as THREE from "https://cdn.skypack.dev/three@0.136";
import { RectAreaLightHelper } from "three/addons/helpers/RectAreaLightHelper.js";
import getGameState from "../GameState";
import { ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH } from "../../config";
import { QUAKE, SLATE_FLOOR_TILE } from "../../textures";

import { ANIMATIONS_ENABLED } from "../../config";
import * as RR from "./Rooms/RoomResources";
import * as PU from "./Powerup";

export default class Room {
  constructor(tile, sceneBuilder) {
    this.position = new THREE.Vector3(tile.x, 0, tile.y);
    this.tile = tile;
    this.sceneBuilder_ = sceneBuilder;
    this.gameState_ = getGameState();

    this.visualMeshes_ = []
    this.collisionMeshes_ = [];

    this.light = null;
    this.lightEnabled = false;
    
    if (this.tile.start || this.tile.end) {
      this.hasLantern = this.hasParkour = false;
    } else {
      this.hasLantern = Math.random() <= 0.10;  // 10%
      this.hasParkour = !this.hasLantern && Math.random() <= 0.225; // 25% 
    }

    this.initialize();
  }

  get vMeshes() {
    return this.visualMeshes_;
  }
  get cMeshes() {
    return this.collisionMeshes_;
  }

  initialize() {
    const offset = new THREE.Vector3(ROOM_SIZE, 0, ROOM_SIZE);
    this.position = this.position.multiply(offset);

    this.buildWalls();
    this.buildFloor();
    if (this.hasLantern)
      this.buildLight();
    if (this.hasParkour) {}
    if (this.tile.hasPowerup)
      this.setPowerUp(new THREE.Vector3(
        this.position.x,
        2, 
        this.position.y,
      ));
      
  }

  /**
   * BUILDER METHODS
   */
  buildWalls() {
    [this.tile.N, this.tile.E, this.tile.S, this.tile.W].forEach(
      (wall, index) => {
        if (wall) {
          const mesh = new THREE.Mesh(
            index % 2 === 0 ? RR.H_WALL : RR.V_WALL,
            RR.WALL_MATERIAL
          );
          mesh.position.copy(this.getWallPosition_(index)); // Use copy, not set
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          this.visualMeshes_.push(mesh);
          this.collisionMeshes_.push(mesh);
        }
      }
    );
  }

  buildLight() {
    this.light = new THREE.SpotLight(this.tile.start ? 0xe5f6df : 0xff0000);
    this.light.position.set(this.position.x, ROOM_HEIGHT, this.position.z);
    this.light = new THREE.SpotLight(
      this.tile.start ? 0xe5f6df : 0xff0000
    );
    this.light.position.set(
      this.position.x,
      ROOM_HEIGHT -3,
      this.position.z
    );

    this.light.castShadow = true;
    this.light.shadow.mapSize.width = 1024;
    this.light.shadow.mapSize.height = 1024;
    this.light.shadow.camera.near = 500;
    this.light.shadow.camera.far = 4000;
    this.light.shadow.camera.fov = 30;

    this.light.visible = true;
    this.lightEnabled = false;

    this.target_ = new THREE.Object3D();
    this.light.target = this.target_;
    this.light.target.position.set(
      this.position.x,
      this.position.y - 10, // move it down along Y axis
      this.position.z
    );
    
    this.visualMeshes_.push(this.light)
    this.visualMeshes_.push(this.light.target)

    this.sceneBuilder_.load_glb_object(
      'glb/fixated_construction_spotlight.glb',
      this.getLampPosition_()
    )
  }

  buildFloor() {
    const floorPosition = new THREE.Vector3(
      this.position.x,
      -1,
      this.position.z
    );

    if (this.tile.start || this.tile.end) {
      const color = this.tile.start ? 0x00ff00 : 0xff0000;
      const floor = new THREE.Mesh(
        RR.ROOM_FLOOR_VISUAL,
        new THREE.MeshStandardMaterial({ color })
      );

      floor.position.copy(floorPosition);
      this.visualMeshes_.push(floor);
      this.collisionMeshes_.push(floor);
      return;
    }

    if (this.hasParkour) {
      const visualFloor = new THREE.Mesh(RR.LAVA_FLOOR, RR.LAVA_MATERIAL);
      visualFloor.receiveShadow = true;
      visualFloor.position.copy(floorPosition);
      this.visualMeshes_.push(visualFloor);

      const collisionFloor = new THREE.Mesh(
        RR.LAVA_FLOOR,
        RR.INVISIBLE_MATERIAL
      );
      collisionFloor.position.copy(floorPosition);
      this.collisionMeshes_.push(collisionFloor);

      if (ANIMATIONS_ENABLED) {
        const clock = RR.TEXTURE_CLOCK;
        const animate = () => {
          const delta = clock.getDelta();
          const texture = visualFloor.material.map;
          texture.offset.x += delta * 0.03;
          texture.offset.y += delta * 0.03;
    
          requestAnimationFrame(animate);
        };
        animate();
      } return;
    }

    // Visual
    const visualFloor = new THREE.Mesh(
      RR.ROOM_FLOOR_VISUAL,
      RR.FLOOR_MATERIAL_VISUAL
    );
    visualFloor.receiveShadow = true;
    visualFloor.position.copy(floorPosition);
    this.visualMeshes_.push(visualFloor);

    // Collision
    const collisionFloor = new THREE.Mesh(
      RR.ROOM_FLOOR_COLLISION,
      RR.INVISIBLE_MATERIAL
    );
    collisionFloor.position.copy(floorPosition);
    this.collisionMeshes_.push(collisionFloor);
  }

  /**
   * Spawns a powerup at the given position
   * @param {Vector3} pos
   * @param {string} type // Type of powerup (e.g., "speed", "jump", "time")
   */
  setPowerUp(position) {
    this.gameState_.addPowerup(position);
    const sphere = new THREE.Mesh(
      PU.POWERUP_GEOMETRY,
      PU.POWERUP_MATERIAL
    );

    sphere.position.copy(position);
    sphere.castShadow = true;
    sphere.receiveShadow = false;
    this.visualMeshes_.push(sphere);

    const pointLight = PU.POWERUP_LIGHT
    pointLight.position.copy(position);
    pointLight.castShadow = false; // Disable shadows to reduce texture unit usage
    const target = new THREE.Object3D();
    pointLight.target = target;
    pointLight.target.position.copy(position);

    this.visualMeshes_.push(pointLight);
    this.visualMeshes_.push(target);
    

    if (ANIMATIONS_ENABLED) {
      let time = 0
      // Adds an animation to make the ball move up and down and spin
      const animate = () => {
        sphere.position.y = 1 + Math.sin(time * 2) * 0.4;
        sphere.rotation.y += 0.01;
        sphere.rotation.x += 0.005;
        time += 0.01
        requestAnimationFrame(animate);
      };
      animate();
    }
  }

  /**
   * HELPER METHODS
   */
  getWallPosition_(index) {
    switch (index) {
      case 0: // N
        return new THREE.Vector3(
          this.position.x,
          ROOM_HEIGHT / 2,
          this.position.z - ROOM_SIZE / 2
        );
      case 1: // E
        return new THREE.Vector3(
          this.position.x + ROOM_SIZE / 2,
          ROOM_HEIGHT / 2,
          this.position.z
        );
      case 2: // S
        return new THREE.Vector3(
          this.position.x,
          ROOM_HEIGHT / 2,
          this.position.z + ROOM_SIZE / 2
        );
      case 3: // W
        return new THREE.Vector3(
          this.position.x - ROOM_SIZE / 2,
          ROOM_HEIGHT / 2,
          this.position.z
        );
      default:
        return new THREE.Vector3(0, 0, 0);
    }
  }

  getLampPosition_() {
    // NE corner
    // if (this.tile.N && this.tile.E)
    //   return new THREE.Vector3(
    //     this.position.x * 1.1,
    //     0, 
    //     this.position.z * 1.1
    //   );

    // // SE corner
    // if (this.tile.E && this.tile.S)
    //   return null;

    // // SW corner
    // if (this.tile.S && this.tile.W)
    //   return null

    // // NW corner
    // if (this.tile.W && this.tile.N)
    //   return null

    // default: center
    return new THREE.Vector3(
      this.position.x + ROOM_SIZE / 2,
      0,
      this.position.z + ROOM_SIZE / 2
    )
  }
}