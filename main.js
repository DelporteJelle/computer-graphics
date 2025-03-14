import * as THREE from "https://cdn.skypack.dev/three@0.136";
import Stats from "three/addons/libs/stats.module.js";
import { Octree } from "three/addons/math/Octree.js";
import { OctreeHelper } from "three/addons/helpers/OctreeHelper.js";
import { Capsule } from "three/addons/math/Capsule.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { SceneBuilder } from "./scripts/SceneBuilder";
import { PlayerController } from "./scripts/PlayerController";
import { DirectionalLightHelper } from "three";
import { MazeGenerator } from "./scripts/MazeGenerator";
import { MazeGeneratorVariant } from "./scripts/MazeGeneratorVariant";

/**
 * The Camera and collision code is based on the threejs example:
 * https://github.com/mrdoob/three.js/blob/master/examples/games_fps.html
 */

const STEPS_PER_FRAME = 5;
const MAZE_WIDTH = 15;
const MAZE_DEPTH = 10;
const ROOM_SIZE = 20;
const ROOM_HEIGHT = 10;

const GRAVITY = 20;
const JUMP_HEIGHT = 14;
const MAX_SPEED = 8;

const CAMERA_ANGLE_CAP = Math.PI / 2.3;

export class Main {
  constructor(target) {
    this.target_ = target || document;

    this.stats_ = null;
    this.clock_ = null;
    this.worldOctree_ = null;
    this.scene_ = null;
    this.camera_ = null;

    this.playerCollider_ = null;
    this.playerVelocity_ = null;
    this.playerDirection_ = null;
    this.playerOnFloor_ = null;
    this.mouseTime_ = null;
    this.keyStates_ = null;

    this.sceneBuilder_ = null;
    this.mazeGenerator_ = null;
    this.mazeGeneratorVariant_ = null;

    this.initialize_();
  }

  initialize_() {
    this.initializeVariables_();
    this.initializeRenderer_();
    this.initializeScene_();
    this.initializeLights_();
    this.initializeCamera_();

    document.body.appendChild(this.stats_.domElement);

    window.addEventListener(
      "resize",
      () => {
        this.onWindowResize_();
      },
      false
    );
  }

  initializeRenderer_() {
    this.renderer_ = new THREE.WebGLRenderer({ antialias: true });
    this.renderer_.setPixelRatio(window.devicePixelRatio);
    this.renderer_.setSize(window.innerWidth, window.innerHeight);
    this.renderer_.setAnimationLoop(() => this.animate());
    this.renderer_.shadowMap.enabled = true;
    this.renderer_.shadowMap.type = THREE.VSMShadowMap;
    this.renderer_.toneMapping = THREE.ACESFilmicToneMapping;
    document.body.appendChild(this.renderer_.domElement);
  }

  initializeVariables_() {
    this.stats_ = new Stats();
    this.clock_ = new THREE.Clock();
    this.worldOctree_ = new Octree();
    this.scene_ = new THREE.Scene();
    this.camera_ = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.playerController_ = new PlayerController(
      this.target_,
      this.worldOctree_,
      this.camera_,
      GRAVITY,
      JUMP_HEIGHT,
      MAX_SPEED,
      CAMERA_ANGLE_CAP
    );
    this.sceneBuilder_ = new SceneBuilder(
      true,
      this.worldOctree_,
      this.scene_,
      ROOM_SIZE,
      ROOM_HEIGHT
    ); //contains helper functions to build the scene. Pass true to enable debugging features
    this.mazeGenerator_ = new MazeGenerator(MAZE_WIDTH, MAZE_DEPTH); //Generates a maze with 10x10 tiles
    this.mazeGeneratorVariant_ = new MazeGeneratorVariant(
      MAZE_WIDTH,
      MAZE_DEPTH
    ); //Generates a maze with 10x10 tiles
  }

  // Example using the GLTFLoader to load a GLTF file
  // initializeScene_() {
  //   this.scene_ = new THREE.Scene();
  //   this.scene_.background = new THREE.Color(0x88ccee);
  //   this.scene_.fog = new THREE.Fog(0x88ccee, 0, 50);

  //   loader.load("collision-world.glb", (gltf) => {
  //     console.log("GLTF loaded:", gltf); // Log the loaded GLTF

  //     this.scene_.add(gltf.scene);

  //     this.worldOctree_.fromGraphNode(gltf.scene);

  //     gltf.scene.traverse((child) => {
  //       if (child.isMesh) {
  //         child.castShadow = true;
  //         child.receiveShadow = true;

  //         if (child.material.map) {
  //           child.material.map.anisotropy = 4;
  //         }
  //       }
  //     });
  //   });
  // }
  initializeScene_() {
    this.scene_.background = new THREE.Color(0x88ccee);

    this.mazeGeneratorVariant_.generateMaze().then(() => {
      for (let i = 0; i < MAZE_WIDTH; i++) {
        for (let j = 0; j < MAZE_DEPTH; j++) {
          let tile = this.mazeGeneratorVariant_.tiles[i][j];
          this.sceneBuilder_.create_room(
            new THREE.Vector3(i, 0, j),
            tile.N,
            i == MAZE_WIDTH - 1 ? true : false, //Only place East wall if it's the last tile in the row
            j == MAZE_DEPTH - 1 ? true : false, //Only place South wall if it's the last tile in the column
            tile.W,
            tile.start,
            tile.end,
            tile
          );
        }
      }
    });

    this.sceneBuilder_.createMazeFloor(MAZE_WIDTH, MAZE_DEPTH);

    // this.sceneBuilder_  .createMesh(
    //   new THREE.BoxGeometry(5, 3, 5),
    //   new THREE.MeshStandardMaterial({ color: 0xff0000 }),
    //   new THREE.Vector3(0, 0, 0)
    // );
    // this.sceneBuilder_  .createMesh(
    //   new THREE.BoxGeometry(4, 5, 4),
    //   new THREE.MeshStandardMaterial({ color: 0x444444 }),
    //   new THREE.Vector3(-2, 0, -7)
    // );
    // this.sceneBuilder_  .createMesh(
    //   new THREE.BoxGeometry(4, 8, 4),
    //   new THREE.MeshStandardMaterial({ color: 0x666666 }),
    //   new THREE.Vector3(-15, 0, -18)
    // );

    // this.sceneBuilder_.load_glb_object(
    //   "glb/zombie.glb",
    //   new THREE.Vector3(-2, 1.5, -2),
    //   true,
    //   new THREE.Vector3(0, -Math.PI / 4, 0)
    // );

    // this.sceneBuilder_.load_glb_object(
    //   "glb/wooden_chest.glb",
    //   new THREE.Vector3(2, 1.5, -2)
    // );

    // Create an OctreeHelper to visualize the octree
    const helper = new OctreeHelper(this.worldOctree_);
    helper.visible = false;
    this.scene_.add(helper);

    // Add a GUI control to toggle the visibility of the OctreeHelper
    const gui = new GUI({ width: 200 });
    gui.add({ debug: false }, "debug").onChange(function (value) {
      helper.visible = value;
    });
  }

  initializeLights_() {
    const ambientLight = new THREE.AmbientLight(0xfffffff, 0.5);
    this.scene_.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 100;
    pointLight.shadow.mapSize.width = 1024;
    pointLight.shadow.mapSize.height = 1024;
    pointLight.position.set(-5, 13, -1);
    pointLight.castShadow = true;
    pointLight.shadow.radius = 2; //Blur the shadow to make it softer
    pointLight.shadow.bias = -0.006; //Small bias can help reduce shadow artifacts

    this.scene_.add(pointLight);
    const pointLightHelper = new THREE.PointLightHelper(pointLight, 1);
    this.scene_.add(pointLightHelper);
  }

  initializeCamera_() {
    this.camera_.position.set(0, 5, 10);
    this.camera_.rotation.order = "YXZ";

    const aspect = 1920 / 1080;
    //Can be used to add UI elements (such as minimap, crosshair, etc.)
    this.uiCamera_ = new THREE.PerspectiveCamera(
      -1,
      1,
      1 * aspect,
      -1 * aspect,
      1,
      1000
    );
    this.uiScene_ = new THREE.Scene();
  }

  onWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();

    this.uiCamera_.left = -this.camera_.aspect;
    this.uiCamera_.right = this.camera_.aspect;
    this.uiCamera_.updateProjectionMatrix();

    this.renderer_.setSize(window.innerWidth, window.innerHeight);
  }

  // animate() {
  //   //Times between frames
  //   const deltaTime = Math.min(0.05, this.clock_.getDelta()) / STEPS_PER_FRAME;

  //   // we look for collisions in substeps to mitigate the risk of
  //   // an object traversing another too quickly for detection.

  //   for (let i = 0; i < STEPS_PER_FRAME; i++) {
  //     this.playerController_.controls(deltaTime);

  //     this.playerController_.updatePlayer(deltaTime);

  //     this.playerController_.teleportPlayerIfOob();
  //   }

  //   this.renderer_.render(this.uiScene_, this.uiCamera_);
  //   this.renderer_.render(this.scene_, this.camera_);

  //   this.stats_.update();
  // }
  animate() {
    const FIXED_TIMESTEP = 1 / 120; // Fixed timestep of 60 FPS so physics are not tied to framerate
    const MAX_TIMESTEP = 0.1; // Maximum timestep to avoid spiral of death

    let deltaTime = this.clock_.getDelta();
    deltaTime = Math.min(deltaTime, MAX_TIMESTEP);

    this.accumulator_ = (this.accumulator_ || 0) + deltaTime;

    while (this.accumulator_ >= FIXED_TIMESTEP) {
      this.playerController_.controls(FIXED_TIMESTEP);
      this.playerController_.updatePlayer(FIXED_TIMESTEP);
      this.playerController_.teleportPlayerIfOob();
      this.accumulator_ -= FIXED_TIMESTEP;
    }

    this.renderer_.render(this.uiScene_, this.uiCamera_);
    this.renderer_.render(this.scene_, this.camera_);

    this.stats_.update();
  }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
  _APP = new Main();
});
