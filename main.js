import * as THREE from "https://cdn.skypack.dev/three@0.136";
import Stats from "three/addons/libs/stats.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Octree } from "three/addons/math/Octree.js";
import { OctreeHelper } from "three/addons/helpers/OctreeHelper.js";
import { Capsule } from "three/addons/math/Capsule.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

/**
 * The Camera and collision code is based on the threejs example:
 * https://github.com/mrdoob/three.js/blob/master/examples/games_fps.html
 */

const loader = new GLTFLoader().setPath("/resources/");
const GRAVITY = 30;
const STEPS_PER_FRAME = 5;

export class CollisionExample {
  constructor(target) {
    this.target_ = target || document;
    this.initialize_();
  }

  initialize_() {
    this.initializeVariables_();
    this.initializeRenderer_();
    this.initializeScene_();
    this.initializeLights_();
    this.initializeCamera_();

    document.body.appendChild(this.stats_.domElement);
    //User input is stored in the keyStates so the animate functino can handle the input in next frame.
    document.addEventListener("keydown", (event) => {
      this.keyStates_[event.code] = true;
    });

    document.addEventListener("keyup", (event) => {
      this.keyStates_[event.code] = false;
    });

    document.body.addEventListener("mousedown", () => {
      document.body.requestPointerLock();

      this.mouseTime_ = performance.now();
    });

    document.body.addEventListener("mousemove", (event) => {
      if (document.pointerLockElement === document.body) {
        this.camera_.rotation.y -= event.movementX / 500;
        this.camera_.rotation.x -= event.movementY / 500;
      }
    });

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
    this.scene_ = null;
    this.camera_ = null;

    this.playerCollider_ = new Capsule(
      new THREE.Vector3(0, 1.35, 0), //Start point of collision box
      new THREE.Vector3(0, 2, 0), //End point
      0.35 //Radius
    );
    this.playerVelocity_ = new THREE.Vector3();
    this.playerDirection_ = new THREE.Vector3();
    this.playerOnFloor_ = false;
    this.mouseTime_ = 0;
    this.keyStates_ = {};
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
    this.scene_ = new THREE.Scene();
    this.scene_.background = new THREE.Color(0x88ccee);
    this.scene_.fog = new THREE.Fog(0x88ccee, 0, 50);

    const textureLoader = new THREE.TextureLoader();
    const checkerboardTexture = textureLoader.load(
      "/resources/checkerboard.png",
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);
      }
    );

    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: checkerboardTexture,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene_.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const wall1Geometry = new THREE.BoxGeometry(50, 10, 1);
    const wall1 = new THREE.Mesh(wall1Geometry, wallMaterial);
    wall1.position.set(0, 5, -25);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    this.scene_.add(wall1);

    const wall2Geometry = new THREE.BoxGeometry(50, 10, 1);
    const wall2 = new THREE.Mesh(wall2Geometry, wallMaterial);
    wall2.position.set(0, 5, 25);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    this.scene_.add(wall2);

    const wall3Geometry = new THREE.BoxGeometry(1, 10, 50);
    const wall3 = new THREE.Mesh(wall3Geometry, wallMaterial);
    wall3.position.set(-25, 5, 0);
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    this.scene_.add(wall3);

    const wall4Geometry = new THREE.BoxGeometry(1, 10, 50);
    const wall4 = new THREE.Mesh(wall4Geometry, wallMaterial);
    wall4.position.set(25, 5, 0);
    wall4.castShadow = true;
    wall4.receiveShadow = true;
    this.scene_.add(wall4);

    const boxGeometry = new THREE.BoxGeometry(5, 3, 5);
    const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(0, 0, 0); // Position the box in the middle
    box.castShadow = true;
    box.receiveShadow = true;
    this.scene_.add(box);

    // Add the floor, walls, and box to the octree for collision detection
    this.worldOctree_.fromGraphNode(floor);
    this.worldOctree_.fromGraphNode(wall1);
    this.worldOctree_.fromGraphNode(wall2);
    this.worldOctree_.fromGraphNode(wall3);
    this.worldOctree_.fromGraphNode(wall4);
    this.worldOctree_.fromGraphNode(box);

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
    const fillLight1 = new THREE.HemisphereLight(0x8dc1de, 0x00668d, 1.5);
    fillLight1.position.set(2, 1, 1);
    this.scene_.add(fillLight1);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(-5, 25, -1);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.01;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.radius = 4;
    directionalLight.shadow.bias = -0.00006;
    this.scene_.add(directionalLight);
  }

  initializeCamera_() {
    this.camera_ = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera_.position.set(0, 5, 10);
    this.camera_.rotation.order = "YXZ";

    const aspect = 1920 / 1080;
    //Can be used to add UI elements (such as minimap, crosshair, etc.)
    this.uiCamera_ = new THREE.OrthographicCamera(
      -1,
      1,
      1 * aspect,
      -1 * aspect,
      1,
      1000
    );
    this.uiScene_ = new THREE.Scene();
  }

  /**
   * Checks for intersections between playerCollider and objects in the world
   */
  playerCollisions() {
    const result = this.worldOctree_.capsuleIntersect(this.playerCollider_);

    this.playerOnFloor_ = false;

    if (result) {
      //If the y value of the normal is greater than 0, the player is on the floor
      this.playerOnFloor_ = result.normal.y > 0;

      if (!this.playerOnFloor_) {
        this.playerVelocity_.addScaledVector(
          result.normal,
          -result.normal.dot(this.playerVelocity_)
        );
      } else {
      }

      if (result.depth >= 1e-10) {
        this.playerCollider_.translate(
          result.normal.multiplyScalar(result.depth)
        );
      }
    }
  }

  updatePlayer(deltaTime) {
    let damping = Math.exp(-4 * deltaTime) - 1;

    if (!this.playerOnFloor_) {
      this.playerVelocity_.y -= GRAVITY * deltaTime;

      // small air resistance
      damping *= 0.2;
    }

    this.playerVelocity_.addScaledVector(this.playerVelocity_, damping);

    const deltaPosition = this.playerVelocity_
      .clone()
      .multiplyScalar(deltaTime);
    this.playerCollider_.translate(deltaPosition);

    this.playerCollisions();
    this.camera_.position.copy(this.playerCollider_.end);
  }

  getForwardVector() {
    this.camera_.getWorldDirection(this.playerDirection_);
    this.playerDirection_.y = 0;
    this.playerDirection_.normalize();

    return this.playerDirection_;
  }

  getSideVector() {
    this.camera_.getWorldDirection(this.playerDirection_);
    this.playerDirection_.y = 0;
    this.playerDirection_.normalize();
    this.playerDirection_.cross(this.camera_.up);

    return this.playerDirection_;
  }

  /**
   * Calculates the player's movement based on the user input by mulpilying the velocity vector with the speedDelta.
   *
   * @param {*} deltaTime: time between frames
   */
  controls(deltaTime) {
    //Defines the speed of the player, this is lower when the player is in the air to give the player only a small amount of control in the air.
    const speedDelta = deltaTime * (this.playerOnFloor_ ? 30 : 10);

    if (this.keyStates_["KeyW"]) {
      this.playerVelocity_.add(
        this.getForwardVector().multiplyScalar(speedDelta)
      );
    }

    if (this.keyStates_["KeyS"]) {
      this.playerVelocity_.add(
        this.getForwardVector().multiplyScalar(-speedDelta)
      );
    }

    if (this.keyStates_["KeyA"]) {
      this.playerVelocity_.add(
        this.getSideVector().multiplyScalar(-speedDelta)
      );
    }

    if (this.keyStates_["KeyD"]) {
      this.playerVelocity_.add(this.getSideVector().multiplyScalar(speedDelta));
    }

    if (this.playerOnFloor_) {
      if (this.keyStates_["Space"]) {
        this.playerVelocity_.y = 10;
      }
    }
  }

  teleportPlayerIfOob() {
    if (this.camera_.position.y <= -25) {
      this.playerCollider_.start.set(0, 0.35, 0);
      this.playerCollider_.end.set(0, 1, 0);
      this.playerCollider_.radius = 0.35;
      this.camera_.position.copy(this.playerCollider_.end);
      this.camera_.rotation.set(0, 0, 0);
    }
  }

  onWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();

    this.uiCamera_.left = -this.camera_.aspect;
    this.uiCamera_.right = this.camera_.aspect;
    this.uiCamera_.updateProjectionMatrix();

    this.threejs_.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    //Times between frames
    const deltaTime = Math.min(0.05, this.clock_.getDelta()) / STEPS_PER_FRAME;

    // we look for collisions in substeps to mitigate the risk of
    // an object traversing another too quickly for detection.

    for (let i = 0; i < STEPS_PER_FRAME; i++) {
      this.controls(deltaTime);

      this.updatePlayer(deltaTime);

      this.teleportPlayerIfOob();
    }

    this.renderer_.render(this.uiScene_, this.uiCamera_);
    this.renderer_.render(this.scene_, this.camera_);

    this.stats_.update();
  }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
  _APP = new CollisionExample();
});
