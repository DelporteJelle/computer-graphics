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
import SceneBuilder from "./scripts/SceneBuilder";
import PlayerController from "./scripts/Player/PlayerController";
import MazeGenerator from "./scripts/MazeGenerator";
import KeyEvents from "./scripts/KeyEvents";
import { ICE_TEXTURE, TILES_CERAMIC_WHITE } from "./textures";

/**
 * Config
 */
import {
  MAZE_WIDTH,
  MAZE_DEPTH,
  MAZE_RATIO,
  ROOM_SIZE,
  ROOM_HEIGHT,
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
    this.playerlight_ = null;
    this.playerTile_ = null; //The tile the player is standing on

    // Maze
    this.sceneBuilder_ = null;
    this.mazeGenerator_ = null;

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

    //Event listener which handles player clicking the minimap and draws shortest path to clicked tile
    this.renderer_.domElement.addEventListener("mousedown", (event) => {
      this.onMinimapClick_(event);
    });
  }

  /**
   * Initializes render
   */
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

  /**
   * Initializes variables like octree and scene
   */
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
    this.mazeGenerator_ = new MazeGenerator(MAZE_WIDTH, MAZE_DEPTH);
  }

  /**
   * Initializes the scene
   * - Builds floor
   * - Builds maze room
   * - Draws maze on minimap
   */
  async initializeScene_() {
    this.scene_.background = new THREE.Color(0x88ccee);

    // Generate maze and create rooms
    this.mazeGenerator_.generateMaze().then(() => {
      this.sceneBuilder_.buildMaze(this.mazeGenerator_.tiles);
    });

    this.sceneBuilder_.createPlane(MAZE_WIDTH, MAZE_DEPTH, 0);

    //Draw the maze in the minimap
    this.minimapScene_ = new THREE.Scene();
    this.minimapScene_.background = null;

    this.mazeGenerator_.drawMaze(this.minimapScene_);

    /**
     * Testing code
     */

    this.sceneBuilder_.createMesh(
      new THREE.BoxGeometry(4, 5, 4),
      new THREE.MeshStandardMaterial({ color: 0x444444 }),
      new THREE.Vector3(-2, 0, -7)
    );
    this.sceneBuilder_.createMesh(
      new THREE.BoxGeometry(5, 3, 5),
      new THREE.MeshStandardMaterial({
        color: 0x999999,
      }),
      new THREE.Vector3(0, 0, 0)
    );
    this.sceneBuilder_.createMesh(
      new THREE.BoxGeometry(4, 8, 4),
      new THREE.MeshStandardMaterial({ color: 0x666666 }),
      new THREE.Vector3(-15, 0, -18)
    );

    // textures

    // Create an OctreeHelper to visualize the octree
    const helper = new OctreeHelper(this.worldOctree_);
    helper.visible = false;
    this.scene_.add(helper);
    /**
     * End Testing code
     */
  }

  /**
   * Initializes player camera, controls and minimap
   */
  initializeCamera_() {
    KeyEvents.clearEventListeners();
    const spawnpoint = new THREE.Vector2(
      this.mazeGenerator_.start_tile.x * ROOM_SIZE,
      this.mazeGenerator_.start_tile.y * ROOM_SIZE
    );

    this.playerController_ = new PlayerController(
      this.worldOctree_,
      this.camera_,
      spawnpoint
    );

    this.camera_.position.set(0, 5, 10);
    this.camera_.rotation.order = "YXZ";

    //Can be used to add UI elements (such as minimap, crosshair, etc.)
    this.minimapCamera = new THREE.OrthographicCamera(
      -MAZE_WIDTH / 2 - 1,
      MAZE_WIDTH / 2,
      MAZE_DEPTH / 2 + 1,
      -MAZE_DEPTH / 2,
      0,
      100
    );

    // Position the camera above the maze, looking straight down
    this.minimapCamera.position.set(MAZE_WIDTH / 2, 10, MAZE_DEPTH / 2);
    this.minimapCamera.lookAt(MAZE_WIDTH / 2, 0, MAZE_DEPTH / 2);
  }

  /**
   * Initalizes ambient light and pointlight following the player
   */
  initializeLights_() {
    // Low ambient lighting
    const ambientLight = new THREE.AmbientLight(0xfffffff, 0.5);
    this.scene_.add(ambientLight);

    this.playerlight_ = new THREE.PointLight(
      0xffffc5,
      2.5, // Intensity
      ROOM_SIZE * 2.5, // Distance
      0.5 // Decay
    );
    // Set position to camera
    this.playerlight_.position.copy(this.camera_.position);

    // Enable shadows
    this.playerlight_.shadow.camera.near = 0.1;
    this.playerlight_.shadow.camera.far = 100;
    this.playerlight_.shadow.mapSize.width = 1024;
    this.playerlight_.shadow.mapSize.height = 1024;
    this.playerlight_.castShadow = true;
    this.playerlight_.shadow.radius = 2; //Blur the shadow to make it softer
    this.playerlight_.shadow.bias = -0.006; //Small bias can help reduce shadow artifacts

    // Add to scene
    this.scene_.add(this.playerlight_);

    // debug
    // const playerlightHelper = new THREE.PointLightHelper(this.playerlight_, 1);
    // this.scene_.add(playerlightHelper);
  }

  /**
   * Handle player location change
   * - Updates player dot on minimap
   * - Updates shortest path
   * TODO: Turn on light in rooms when player enters
   */
  handlePlayerLocationChange_() {
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
    //Get the tile position of the player
    const tileX = Math.floor(normalizedX + 0.5);
    const tileZ = Math.floor(normalizedZ + 0.5);
    if (
      !this.playerTile_ ||
      this.playerTile_.x != tileX ||
      this.playerTile_.y != tileZ
    ) {
      this.playerTile_ = this.mazeGenerator_.tiles[tileX][tileZ];
      this.mazeGenerator_.shortestPath(this.minimapScene_, tileX, tileZ);
    }
    this.playerDot_.position.set(normalizedX, 0.1, normalizedZ);
  }

  /**
   * Updates pointlight position to follow player
   */
  updatePlayerlight() {
    if (this.playerlight_ && this.camera_) {
      this.playerlight_.position.copy(this.camera_.position);
    }
  }

  onWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();
    this.renderer_.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Handles the user clicking on the minimap and calls the shortest path algo using the clicked tile as the destination
   * @param {*} event
   */
  onMinimapClick_(event) {
    const rect = this.renderer_.domElement.getBoundingClientRect();
    const minimapWidth = MINIMAP_SIZE * MAZE_RATIO;
    const minimapHeight = MINIMAP_SIZE;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const normalizedMouse = new THREE.Vector2(
      (mouseX / minimapWidth) * 2 - 1,
      -((mouseY - (rect.height - minimapHeight)) / minimapHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(normalizedMouse, this.minimapCamera);

    const intersects = raycaster.intersectObjects(
      this.minimapScene_.children,
      true
    );
    console.log(intersects);
    if (intersects.length > 0) {
      const intersection = intersects[0];
      if (intersection.object.name != "tile") {
        console.log("Clicked on non-tile object");
        return;
      }
      const x = intersection.object.userData.x;
      const y = intersection.object.userData.y;
      this.mazeGenerator_.shortestPath(
        this.minimapScene_,
        this.playerTile_.x,
        this.playerTile_.y,
        x,
        y
      );
    }
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
      this.handlePlayerLocationChange_();
      this.updatePlayerlight();
      this.playerController_.teleportPlayerIfOob();
      this.accumulator_ -= FIXED_TIMESTEP;
    }

    // Render the main scene
    this.renderer_.setViewport(0, 0, window.innerWidth, window.innerHeight);
    this.renderer_.setScissor(0, 0, window.innerWidth, window.innerHeight);
    this.renderer_.setScissorTest(false);
    this.renderer_.render(this.scene_, this.camera_);

    // Render the minimap
    // this.renderer_.setViewport(
    //   window.innerWidth - MINIMAP_SIZE * MAZE_RATIO,
    //   window.innerHeight - MINIMAP_SIZE,
    //   window.innerWidth,
    //   window.innerHeight
    // );

    this.renderer_.setViewport(0, 0, MINIMAP_SIZE * MAZE_RATIO, MINIMAP_SIZE);
    this.renderer_.setScissor(0, 0, MINIMAP_SIZE * MAZE_RATIO, MINIMAP_SIZE);
    this.renderer_.setScissorTest(true);
    this.renderer_.render(this.minimapScene_, this.minimapCamera);

    //Experiment with adding a 2nd camera to render the minimap
    // const playerPosition = this.camera_.position; // Assuming the player's position is tied to the main camera
    // this.minimapCamera.position.set(playerPosition.x, 100, playerPosition.z); // 50 units above the player
    // this.minimapCamera.lookAt(playerPosition.x, 0, playerPosition.z); // Look straight down at the player

    // this.renderer_.setViewport(0, 0, MINIMAP_SIZE * MAZE_RATIO, MINIMAP_SIZE);
    // this.renderer_.setScissor(0, 0, MINIMAP_SIZE * MAZE_RATIO, MINIMAP_SIZE);
    // this.renderer_.setScissorTest(true);
    // this.renderer_.render(this.scene_, this.minimapCamera);

    this.stats_.update();
  }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
  _APP = new Main();
});
