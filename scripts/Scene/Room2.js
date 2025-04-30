import * as THREE from "https://cdn.skypack.dev/three@0.136";
import { RectAreaLightHelper } from "three/addons/helpers/RectAreaLightHelper.js";

import { ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH } from "../../config";
import { QUAKE, SLATE_FLOOR_TILE } from "../../textures";


export default class Room {
  constructor(tile) {
    this.position = null;
    this.tile = tile;
    this.meshes = [];

    this.light = null;
    this.lightEnabled = false;

    this.initialize();
  }

  initialize() {
    this.position = new THREE.Vector3(
      this.tile.x * ROOM_SIZE, 
      0, 
      this.tile.y * ROOM_HEIGHT
    )

    

  }

  createMaterial

  buildWalls() {
    [this.tile.N, this.tile.E, this.tile.S, this.tile.W].forEach((wall) => {
      
    })
  if (N)
    createMesh(
      new THREE.BoxGeometry(ROOM_SIZE, ROOM_HEIGHT, WALL_DEPTH, 10, 10, 10),
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
  }

  toggleLight() {
    if (this.lightEnabled) {
      this.light.visible = false;
      this.lightEnabled = false;
      return;
    }

    this.light.visible = true;
    this.lightEnabled = true;
  }


}