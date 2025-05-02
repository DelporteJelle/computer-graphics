/**
 * THREE.js
 */
import * as THREE from "https://cdn.skypack.dev/three@0.136";
import Stats from "three/addons/libs/stats.module.js";
import { Octree } from "three/addons/math/Octree.js";
import { OctreeHelper } from "three/addons/helpers/OctreeHelper.js";
import { Capsule } from "three/addons/math/Capsule.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { Vector2 } from "three/webgpu";

/**
 * Scripts
 */
import SceneBuilder from "./scripts/SceneBuilder";
import PlayerController from "./scripts/Player/PlayerController";
import MazeGenerator from "./scripts/MazeGenerator";
import KeyEvents from "./scripts/KeyEvents";
import getGameState from "./scripts/GameState";
import { ICE_TEXTURE, TILES_CERAMIC_WHITE } from "./textures";

/**
 * Config
 */
import {
  ROOM_SIZE,
  ROOM_HEIGHT,
  MINIMAP_SIZE,
  TIMER,
  STARTER_MAZE_DEPTH,
  STARTER_MAZE_WIDTH,
} from "./config";

import Flashlight from "./scripts/Player/Flashlight";

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
    this.MAZE_WIDTH = STARTER_MAZE_WIDTH; // Width of the maze in tiles
    this.MAZE_DEPTH = STARTER_MAZE_DEPTH; // Depth of the maze in tiles
    this.gameState_ = getGameState(this.resetGame_);
    this.remainingTime_ = TIMER; // Timer for the game
    this.powerupLocations = []; //Powerup locations

    this.initialize_();
  }

  initialize_() {
    //Order is important, Keep this order of initialization
    this.initializeVariables_(); //Initializes basic static variables
    this.initializeRenderer_(); //Initializes the renderer
    this.initializeScene_(); //Generates the maze and builds the scene
    this.initializeLights_(); //Initializes the lights
    this.initializeCamera_(); //Initializes playerController and camera
    this.initializeMinimap_(); //Initializes the minimap
    //this.initializeTimer_(); //Initializes the timer

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

    // window.addEventListener("keydown", (event) => {
    //   if (event.key === "p") {
    //     this.resetGame_();
    //   }
    // });
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
      100
    );
  }

  /**
   * Initializes the scene
   * - Builds floor
   * - Builds maze room
   * - Draws maze on minimap
   */
  initializeScene_() {
    this.mazeGenerator_ = new MazeGenerator(this.MAZE_WIDTH, this.MAZE_DEPTH);
    //contains helper functions to build the scene. Pass true to enable debugging features
    this.sceneBuilder_ = new SceneBuilder(
      true,
      this.worldOctree_,
      this.scene_,
      this.MAZE_WIDTH,
      this.MAZE_DEPTH,
    );
    this.scene_.background = new THREE.Color(0x88ccee);

    // Generate maze and create rooms
    this.mazeGenerator_.generateMaze().then(() => {
      this.sceneBuilder_.buildMaze(this.mazeGenerator_.tiles);
    });

    //this.sceneBuilder_.createPlane(this.MAZE_WIDTH, this.MAZE_DEPTH, 0);
    this.sceneBuilder_.createCeiling(
      this.MAZE_WIDTH, this.MAZE_DEPTH, ROOM_HEIGHT
    );

    //Draw the maze in the minimap
    this.playerDot_ = null;
    this.minimapScene_ = new THREE.Scene();
    this.minimapScene_.background = null;
    this.mazeGenerator_.drawMaze(this.minimapScene_);
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
      spawnpoint,
      this.playerlight_,
    );

    this.camera_.position.set(0, 5, 10);
    this.camera_.rotation.order = "YXZ";
  }

  initializeMinimap_() {
    //Can be used to add UI elements (such as minimap, crosshair, etc.)
    this.minimapCamera = new THREE.OrthographicCamera(
      -this.MAZE_WIDTH / 2 - 1,
      this.MAZE_WIDTH / 2,
      this.MAZE_DEPTH / 2 + 1,
      -this.MAZE_DEPTH / 2,
      0,
      100
    );

    // Position the camera above the maze, looking straight down
    this.minimapCamera.position.set(
      this.MAZE_WIDTH / 2,
      10,
      this.MAZE_DEPTH / 2
    );
    this.minimapCamera.lookAt(this.MAZE_WIDTH / 2, 0, this.MAZE_DEPTH / 2);
  }

  /**
   * Initalizes ambient light and pointlight following the player
   */
  initializeLights_() {
    // Low ambient lighting
    const ambientLight = new THREE.AmbientLight(0xfffffff, 0.5);
    this.scene_.add(ambientLight);

    // Flashlight
    this.playerlight_ = new Flashlight(this.camera_);
    this.scene_.add(this.playerlight_.light);
    this.scene_.add(this.playerlight_.target);

    // debug
    // const playerlightHelper = new THREE.PointLightHelper(this.playerlight_, 1);
    // this.scene_.add(playerlightHelper);
  }

  /**
   * Handle player location change
   * - Updates player dot on minimap
   * - Updates shortest path
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
    this.playerDot_.position.set(normalizedX, 0.1, normalizedZ);

    //Check if the player is in a different tile than before
    if (
      !this.playerTile_ ||
      this.playerTile_.x != tileX ||
      this.playerTile_.y != tileZ
    ) {
      this.playerTile_ = this.mazeGenerator_.tiles[tileX][tileZ];
      this.mazeGenerator_.shortestPath(this.minimapScene_, tileX, tileZ);

      //Reset the maze if the player is on the end tile
      if (this.playerTile_.end) {
        this.gameState_.reset();
      }
    }
  }

  /**
   * Updates pointlight position to follow player
   */
  updatePlayerlight() {
    if (this.playerlight_ && this.camera_) {
      this.playerlight_.update();
    }
  }

  onWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();
    this.renderer_.setSize(window.innerWidth, window.innerHeight);
  }

  resetGame_ = () => {
    this.MAZE_DEPTH += 1;
    this.MAZE_WIDTH += 1;
    this.scene_.clear();
    this.worldOctree_.clear();

    this.initializeScene_();
    this.initializeLights_();
    this.initializeMinimap_();
    this.gameState_.setSpawnpoint(new Vector2(
      this.mazeGenerator_.start_tile.x * ROOM_SIZE,
      this.mazeGenerator_.start_tile.y * ROOM_SIZE
    ));
    this.playerController_.teleportPlayer(
      this.gameState_.spawnpoint
    );
  }

  /**
   * Handles the user clicking on the minimap and calls the shortest path algo using the clicked tile as the destination
   * @param {*} event
   */
  onMinimapClick_(event) {
    const rect = this.renderer_.domElement.getBoundingClientRect();
    const minimapWidth = MINIMAP_SIZE * (this.MAZE_WIDTH / this.MAZE_DEPTH);
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
    if (intersects.length > 0) {
      const intersection = intersects[0];
      if (intersection.object.name != "tile") {
        console.log("Clicked on non-tile object");
        return;
      }
      const x = intersection.object.userData.x;
      const y = intersection.object.userData.y;

      this.mazeGenerator_.changeDestinationTile(x, y);

      this.mazeGenerator_.shortestPath(
        this.minimapScene_,
        this.playerTile_.x,
        this.playerTile_.y
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

    this.renderer_.setViewport(
      0,
      0,
      MINIMAP_SIZE * (this.MAZE_WIDTH / this.MAZE_DEPTH),
      MINIMAP_SIZE
    );
    this.renderer_.setScissor(
      0,
      0,
      MINIMAP_SIZE * (this.MAZE_WIDTH / this.MAZE_DEPTH),
      MINIMAP_SIZE
    );
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
