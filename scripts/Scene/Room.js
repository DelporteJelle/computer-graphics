import * as THREE from "three";
//import * as THREE from "https://cdn.skypack.dev/three@0.136";
import getGameState from "../GameState";
import { ROOM_SIZE, ROOM_HEIGHT, ROOM_LIGHTS_ENABLED, MAX_LIGHTS } from "../../config";

import { ANIMATIONS_ENABLED } from "../../config";
import * as RR from "./RoomResources";
import * as PU from "./Powerup";
import loadStartEndPreset from "./RoomTypes/StartEnd";
import loadParkourPreset1 from "./RoomTypes/ParkourPreset1";

export default class Room {
  constructor(tile, sceneBuilder) {
    this.position = new THREE.Vector3(tile.x, 0, tile.y);
    this.tile = tile;
    this.sceneBuilder_ = sceneBuilder;
    this.gameState_ = getGameState();

    this.visualMeshes_ = [];
    this.collisionMeshes_ = [];

    this.light_ = null;
    this.target_ = null;

    if (this.tile.start || this.tile.end) {
      this.hasPowerup = false;
      this.hasLantern = false;
      this.hasParkour = false;
    } else {
      this.hasPowerup = this.tile.hasPowerup;
      this.hasLantern = !this.hasPowerup && Math.random() <= 0.120; // 10%
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

  get light() {
    return this.light_;
  }

  get target() {
    return this.target_;
  }

  initialize() {
    const offset = new THREE.Vector3(ROOM_SIZE, 0, ROOM_SIZE);
    this.position = this.position.multiply(offset);

    this.buildWalls();
    this.buildFloor();
    this.buildObjects();
    this.buildLight();
    if (this.hasPowerup)
      this.setPowerUp(new THREE.Vector3(
        this.position.x,
        2, 
        this.position.z,
      ));
      
  }

  /**
   * =======================
   * BUILDER METHODS
   * =======================
   */

  /**
   * Builds walls (North, East, Sout, West)
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

  /**
   * Builds light source (only if this.hasLantern)
   */
  buildLight() {
    if (this.tile.start || this.tile.end) {
      this.light_ = new THREE.SpotLight(
        0xffffc5,
        20,
        ROOM_HEIGHT * 2,
        Math.PI / 5,
        0.8,
        1
      );
      // Spotlight
      this.light_.position.set(
        this.position.x,
        ROOM_HEIGHT - 1,
        this.position.z
      );

      this.light_.castShadow = true;
      this.light_.shadow.mapSize.width = 256;
      this.light_.shadow.mapSize.height = 256;
      this.light_.shadow.radius = 2;
      this.light_.shadow.bias = -0.006;

      // Target
      this.target_ = new THREE.Object3D();
      this.target_.position.set(this.position.x, 0, this.position.z);
      this.light_.target = this.target_;

      // debugging
      // const helper = new THREE.SpotLightHelper(this.light_);
      // this.visualMeshes_.push(helper)
      return;
    }

    if (
      this.gameState_.lightingEnabled &&
      this.gameState_.lightCount < MAX_LIGHTS && 
      this.hasLantern
    ) {
      this.gameState_.addLight();
      this.light_ = new THREE.PointLight(0xffffff, 3, ROOM_SIZE * 2, 1);
      this.light_.position.copy(this.getLampPosition_());
      this.light_.castShadow = true;
      // Low shadow mapSize to reduce lag
      this.light_.shadow.mapSize.width = 128;
      this.light_.shadow.mapSize.height = 128;
      this.light_.shadow.radius = 2;
      this.light_.shadow.bias = -0.006;
      this.light_.visible = true;

      // Load lamp model
      this.sceneBuilder_.load_glb_object(
        "glb/tripod_light_model_1.glb",
        this.getLampPosition_(),
        {
          scale: new THREE.Vector3(3, 3, 3),
          shadows: false,
        }
      );
      return;
    }
  }

  /**
   * Build floor base on room type
   */
  buildFloor() {
    const floorPosition = new THREE.Vector3(
      this.position.x,
      -1,
      this.position.z
    );

    // START / END
    if (this.tile.start || this.tile.end) {
      const floor = new THREE.Mesh(
        RR.ROOM_FLOOR_VISUAL,
        this.tile.start ? RR.FLOOR_MATERIAL_START : RR.FLOOR_MATERIAL_END
      );
      floor.receiveShadow = true;

      floor.position.copy(floorPosition);
      this.visualMeshes_.push(floor);
      this.collisionMeshes_.push(floor);
      return;
    }

    // PARKOUR
    if (this.hasParkour) {
      const visualFloor = new THREE.Mesh(RR.LAVA_FLOOR, RR.LAVA_MATERIAL);
      visualFloor.receiveShadow = true;
      visualFloor.position.copy(floorPosition);
      this.visualMeshes_.push(visualFloor);

      // const collisionFloor = new THREE.Mesh(
      //   RR.LAVA_FLOOR,
      //   RR.INVISIBLE_MATERIAL
      // );
      // collisionFloor.position.copy(floorPosition);
      // this.collisionMeshes_.push(collisionFloor);

      if (ANIMATIONS_ENABLED) {
        const clock = RR.TEXTURE_CLOCK;
        const animate = () => {
          const delta = clock.getDelta();
          const offset = delta * 0.02;

          const baseTexture = visualFloor.material.map;
          if (baseTexture) {
            baseTexture.offset.x += offset;
            baseTexture.offset.y += offset;
          }

          const displacementMap = visualFloor.material.displacementMap;
          if (displacementMap) {
            displacementMap.offset.x += offset;
            displacementMap.offset.y += offset;
          }
        
          const normalMap = visualFloor.material.normalMap;
          if (normalMap) {
            normalMap.offset.x += offset;
            normalMap.offset.y += offset;
          }
  
          const roughnessMap = visualFloor.material.roughnessMap;
          if (roughnessMap) {
            roughnessMap.offset.x += offset;
            roughnessMap.offset.y += offset;
          }

          const emissionMap = visualFloor.material.emissiveMap;
          if (emissionMap) {
            emissionMap.offset.x += offset;
            emissionMap.offset.y += offset;
          }
        

          requestAnimationFrame(animate);
        };
        animate();
      }
      return;
    }

    // DEFAULT
    const visualFloor = new THREE.Mesh(
      RR.ROOM_FLOOR_VISUAL,
      RR.FLOOR_MATERIAL_VISUAL
    );
    visualFloor.receiveShadow = true;
    visualFloor.position.copy(floorPosition);
    this.visualMeshes_.push(visualFloor);

    const collisionFloor = new THREE.Mesh(
      RR.ROOM_FLOOR_COLLISION,
      RR.INVISIBLE_MATERIAL
    );
    collisionFloor.position.copy(floorPosition);
    this.collisionMeshes_.push(collisionFloor);
  }

  /**
   * Adds object to room if necessary
   */
  buildObjects() {
    if (this.tile.end) {
      loadStartEndPreset(this.sceneBuilder_, this.position, [
        this.tile.N,
        this.tile.E,
        this.tile.S,
        this.tile.W,
      ]);
      return;
    }
    if (this.hasParkour) {
      const meshes = loadParkourPreset1(this.position);
      this.visualMeshes_.push(...meshes.visual);
      this.collisionMeshes_.push(...meshes.collision);
    }
  }

  /**
   * Spawns a powerup at the given position
   * @param {Vector3} pos
   */
  setPowerUp(position) {
    this.gameState_.addPowerup(position);
    const sphere = new THREE.Mesh(PU.POWERUP_GEOMETRY, PU.POWERUP_MATERIAL);

    sphere.position.copy(position);
    sphere.castShadow = true;
    sphere.receiveShadow = false;
    this.visualMeshes_.push(sphere);

    const pointLight = new THREE.PointLight(0xff00ff, 0.5, 5);
    pointLight.position.copy(position);
    pointLight.castShadow = false; // Disable shadows to reduce texture unit usage
    const target = new THREE.Object3D();
    pointLight.target = target;
    pointLight.target.position.copy(position);

    this.visualMeshes_.push(pointLight);
    this.visualMeshes_.push(target);

    if (ANIMATIONS_ENABLED) {
      let time = 0;
      // Adds an animation to make the ball move up and down and spin
      const animate = () => {
        sphere.position.y = 1 + Math.sin(time * 2) * 0.2;
        sphere.rotation.y += 0.01;
        sphere.rotation.x += 0.005;
        time += 0.01;
        requestAnimationFrame(animate);
      };
      animate();
    }
  }

  /**
   * =======================
   * HELPER METHODS
   * =======================
   */

  /**
   * Gets wall position
   * @param {*} index
   * @returns Vector with wall position
   */
  getWallPosition_(index) {
    const offset = ROOM_SIZE / 2;
    const height = ROOM_HEIGHT / 2;
    switch (index) {
      case 0: // N
        return new THREE.Vector3(
          this.position.x,
          height,
          this.position.z - offset
        );
      case 1: // E
        return new THREE.Vector3(
          this.position.x + offset,
          height,
          this.position.z
        );
      case 2: // S
        return new THREE.Vector3(
          this.position.x,
          height,
          this.position.z + offset
        );
      case 3: // W
        return new THREE.Vector3(
          this.position.x - offset,
          height,
          this.position.z
        );
      default:
        return new THREE.Vector3(0, 0, 0);
    }
  }

  /**
   * Gets the position of the lamp based on walls
   * @returns Object wih Position & Rotation
   */
  getLampPosition_() {
    // NE corner
    const offset = (ROOM_SIZE / 2) * 0.8;
    if (this.tile.N && this.tile.E)
      return new THREE.Vector3(
        this.position.x + offset,
        0,
        this.position.z - offset
      );

    // SE corner
    if (this.tile.E && this.tile.S)
      return new THREE.Vector3(
        this.position.x + offset,
        0,
        this.position.z + offset
      );

    // SW corner
    if (this.tile.S && this.tile.W)
      return new THREE.Vector3(
        this.position.x - offset,
        0,
        this.position.z + offset
      );

    // NW corner
    if (this.tile.W && this.tile.N)
      return new THREE.Vector3(
        this.position.x - offset,
        0,
        this.position.z - offset
      );

    // default: center
    return new THREE.Vector3(this.position.x, 0, this.position.z);
  }
}
