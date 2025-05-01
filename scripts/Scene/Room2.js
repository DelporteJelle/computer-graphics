import * as THREE from "https://cdn.skypack.dev/three@0.136";
import { RectAreaLightHelper } from "three/addons/helpers/RectAreaLightHelper.js";

import { ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH } from "../../config";
import { QUAKE, SLATE_FLOOR_TILE } from "../../textures";
import * as RR from "./Rooms/RoomResources";


export default class Room {
  constructor(tile) {
    this.position = new THREE.Vector3(tile.x, 0, tile.y);
    this.tile = tile;
    this.visualMeshes_ = []
    this.collisionMeshes_ = [];

    this.light = null;
    this.lightEnabled = false;
    
    this.hasParkour = Math.random() < 0.25;

    this.initialize();
  }

  get vMeshes() { return this.visualMeshes_; }
  get cMeshes() { return this.collisionMeshes_; }

  initialize() {
    const offset = new THREE.Vector3(ROOM_SIZE, 0, ROOM_SIZE);
    this.position = this.position.multiply(offset);

    this.buildWalls();
    this.buildLight();
    this.buildFloor();
  }

  /**
   * BUILDER METHODS
   */
  buildWalls() {
    [this.tile.N, this.tile.E, this.tile.S, this.tile.W].forEach((wall, index) => {
      if (wall) {
        const mesh = new THREE.Mesh(
          index%2 === 0 ? RR.H_WALL : RR.V_WALL, 
          RR.WALL_MATERIAL
        );
        mesh.position.copy(
          this.getWallPosition_(index)
        ); // Use copy, not set
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        this.visualMeshes_.push(mesh);
        this.collisionMeshes_.push(mesh)
      }
    });
  }

  buildLight() {
    this.light = new THREE.SpotLight(
      this.tile.start ? 0xe5f6df : 0xff0000
    );
    this.light.position.set(
      this.position.x,
      ROOM_HEIGHT,
      this.position.z
    );

    this.light.castShadow = true;

    this.light.shadow.mapSize.width = 1024;
    this.light.shadow.mapSize.height = 1024;

    this.light.shadow.camera.near = 500;
    this.light.shadow.camera.far = 4000;
    this.light.shadow.camera.fov = 30;

    this.light.visible = false;
    this.lightEnabled = false;

    this.target_ = new THREE.Object3D();
    this.light.target = this.target_;
    this.visualMeshes_.push(this.light)
  }

  buildFloor() {
    const floorPosition = new THREE.Vector3(
      this.position.x,
      -1,
      this.position.z,  
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
      const visualFloor = new THREE.Mesh(
        RR.LAVA_FLOOR,
        RR.LAVA_MATERIAL
      );
      visualFloor.receiveShadow = true;
      visualFloor.position.copy(floorPosition);
      this.visualMeshes_.push(visualFloor);

      const collisionFloor = new THREE.Mesh(
        RR.LAVA_FLOOR,
        RR.INVISIBLE_MATERIAL
      )
      collisionFloor.position.copy(floorPosition);
      this.collisionMeshes_.push(collisionFloor);
      return;
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
    )
    collisionFloor.position.copy(floorPosition);
    this.collisionMeshes_.push(collisionFloor);
  }

  /**
   * HELPER METHODS
   */
  getWallPosition_(direction) {
    switch (direction) {
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
}