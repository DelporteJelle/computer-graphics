/**
 * THREE.js
 */
import * as THREE from "https://cdn.skypack.dev/three@0.136";
import Stats from "three/addons/libs/stats.module.js";
import { Octree } from "three/addons/math/Octree.js";
import { OctreeHelper } from "three/addons/helpers/OctreeHelper.js";
import { Capsule } from "three/addons/math/Capsule.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

/**
 * Scripts
 */
import { SceneBuilder } from "./scripts/SceneBuilder";
import { PlayerController } from "./scripts/PlayerController";
import { DirectionalLightHelper } from "three";
import { MazeGenerator } from "./scripts/MazeGenerator";
import { MazeGeneratorVariant } from "./scripts/MazeGeneratorVariant";
import { ICE_TEXTURE, TILES_CERAMIC_WHITE } from "./textures";

/**
 * Config
 */
import {
  STEPS_PER_FRAME,
  MAZE_WIDTH, MAZE_DEPTH, MAZE_RATIO,
  ROOM_SIZE, ROOM_HEIGHT,
  GRAVITY, JUMP_FORCE, MAX_SPEED,
  CAMERA_ANGLE_CAP,
  MINIMAP_SIZE,
} from "./config";

/**
 * The Camera and collision code is based on the threejs example:
 * https://github.com/mrdoob/three.js/blob/master/examples/games_fps.html
 */

export class Main {
  constructor(target) {
    this.target_ = target || document;

    // World
    this.stats_ = null;
    this.clock_ = null;
    this.worldOctree_ = null;
    this.scene_ = null;
    this.camera_ = null;

    // Player
    this.playerCollider_ = null;
    this.playerVelocity_ = null;
    this.playerDirection_ = null;
    this.playerOnFloor_ = null;
    this.mouseTime_ = null;
    this.keyStates_ = null;

    // Maze
    this.sceneBuilder_ = null;
    this.mazeGenerator_ = null;
    this.mazeGeneratorVariant_ = null;

    this.initialize_();
  }

  initialize_() {
    //Order is important, Keep this order of initialization
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

    //contains helper functions to build the scene. Pass true to enable debugging features
    this.sceneBuilder_ = new SceneBuilder(
      true,
      this.worldOctree_,
      this.scene_,
      ROOM_SIZE,
      ROOM_HEIGHT
    );
    //this.mazeGenerator_ = new MazeGenerator(MAZE_WIDTH, MAZE_DEPTH);

    //Generates a maze with 10x10 tile
    this.mazeGeneratorVariant_ = new MazeGeneratorVariant(
      MAZE_WIDTH,
      MAZE_DEPTH
    );
  }

  initializeScene_() {
    this.scene_.background = new THREE.Color(0x88ccee);

    // Generate maze and create rooms
    this.mazeGeneratorVariant_.generateMaze().then(() => {
      this.sceneBuilder_.buildMaze(this.mazeGeneratorVariant_.tiles);
    });

    this.sceneBuilder_.createPlane(MAZE_WIDTH, MAZE_DEPTH, 0);

    //Draw the maze in the minimap
    this.minimapScene_ = new THREE.Scene();
    this.mazeGeneratorVariant_.drawMaze(this.minimapScene_);
    /**
     * Testing code
     */
    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load(
      ICE_TEXTURE.baseColor,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(5, 5);
      }
    );
    const normalMap = textureLoader.load(ICE_TEXTURE.normalMap);
    const displacementMap = textureLoader.load(ICE_TEXTURE.displacementMap);
    const roughnessMap = textureLoader.load(ICE_TEXTURE.roughnessMap);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      map: floorTexture,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(1, -1),
      displacementMap: displacementMap,
      displacementScale: 0,
      roughnessMap: roughnessMap,
      roughness: 1,
    });

    this.sceneBuilder_.createMesh(
      new THREE.BoxGeometry(5, 3, 5),
      floorMaterial,
      new THREE.Vector3(0, 0, 0)
    );
    this.sceneBuilder_.createMesh(
      new THREE.BoxGeometry(4, 5, 4),
      new THREE.MeshStandardMaterial({ color: 0x444444 }),
      new THREE.Vector3(-2, 0, -7)
    );
    this.sceneBuilder_.createMesh(
      new THREE.BoxGeometry(4, 8, 4),
      new THREE.MeshStandardMaterial({ color: 0x666666 }),
      new THREE.Vector3(-15, 0, -18)
    );
    this.worldOctree_.fromGraphNode(this.scene_);

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
    /**
     * End Testing code
     */

    // Add a GUI control to toggle the visibility of the OctreeHelper
    const gui = new GUI({ width: 200 });
    gui.add({ debug: false }, "debug").onChange(function (value) {
      helper.visible = value;
    });
  }

  initializeLights_() {
    // const fog = new THREE.Fog(0x000000, 2 * ROOM_SIZE, 5 * ROOM_SIZE);
    // this.scene_.add(fog);
    
    const ambientLight = new THREE.AmbientLight(0xfffffff, 0.2);
    this.scene_.add(ambientLight);

    // const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    // 

    // this.scene_.add(pointLight);
    // const pointLightHelper = new THREE.PointLightHelper(pointLight, 1);
    // this.scene_.add(pointLightHelper);
  }

  initializeCamera_() {
    this.playerController_ = new PlayerController(
      this.target_,
      this.worldOctree_,
      this.camera_,
      GRAVITY,
      JUMP_FORCE,
      MAX_SPEED,
      CAMERA_ANGLE_CAP,
      new THREE.Vector2(
        this.mazeGeneratorVariant_.start_tile.x * ROOM_SIZE,
        this.mazeGeneratorVariant_.start_tile.y * ROOM_SIZE
      )
    );

    this.camera_.position.set(0, 5, 10);
    this.camera_.rotation.order = "YXZ";

    //Can be used to add UI elements (such as minimap, crosshair, etc.)
    this.minimapCamera = new THREE.OrthographicCamera(
      -MAZE_WIDTH / 2 - 1,
      MAZE_WIDTH / 2 + 1,
      MAZE_DEPTH / 2 + 1,
      -MAZE_DEPTH / 2 - 1,
      0.1,
      100
    );

    // Position the camera above the maze, looking straight down
    this.minimapCamera.position.set(MAZE_WIDTH / 2, 10, MAZE_DEPTH / 2);
    this.minimapCamera.lookAt(MAZE_WIDTH / 2, 0, MAZE_DEPTH / 2);
  }

  onWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();

    this.renderer_.setSize(window.innerWidth, window.innerHeight);
  }

  updateMinimap_() {
    if (!this.playerDot_) {
      const geometry = new THREE.CircleGeometry(0.2, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      this.playerDot_ = new THREE.Mesh(geometry, material);
      this.playerDot_.rotation.x = -Math.PI / 2;
      this.minimapScene_.add(this.playerDot_);
    }

    const playerPosition = this.camera_.position;
    const normalizedX = playerPosition.x / ROOM_SIZE;
    const normalizedZ = playerPosition.z / ROOM_SIZE;

    this.playerDot_.position.set(normalizedX, 0.1, normalizedZ);
  }

  animate() {
    const FIXED_TIMESTEP = 1 / 120; // Fixed timestep of 60 FPS so physics are not tied to framerate
    const MAX_TIMESTEP = 0.1; // Maximum timestep to avoid spiral of death

    let deltaTime = this.clock_.getDelta();
    deltaTime = Math.min(deltaTime, MAX_TIMESTEP);

    this.accumulator_ = (this.accumulator_ || 0) + deltaTime;

    while (this.accumulator_ >= FIXED_TIMESTEP) {
      this.playerController_.controls(FIXED_TIMESTEP);
      this.playerController_.updatePlayer(FIXED_TIMESTEP);
      this.updateMinimap_();
      this.playerController_.teleportPlayerIfOob();
      this.accumulator_ -= FIXED_TIMESTEP;
    }

    // Render the main scene
    this.renderer_.setViewport(0, 0, window.innerWidth, window.innerHeight);
    this.renderer_.setScissor(0, 0, window.innerWidth, window.innerHeight);
    this.renderer_.setScissorTest(false);
    this.renderer_.render(this.scene_, this.camera_);

    // Render the minimap
    this.renderer_.setViewport(0, 0, MINIMAP_SIZE * MAZE_RATIO, MINIMAP_SIZE);
    this.renderer_.setScissor(0, 0, MINIMAP_SIZE * MAZE_RATIO, MINIMAP_SIZE);
    this.renderer_.setScissorTest(true);
    this.renderer_.render(this.minimapScene_, this.minimapCamera);

    this.stats_.update();
  }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
  _APP = new Main();
});
