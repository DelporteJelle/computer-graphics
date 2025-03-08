import * as THREE from "https://cdn.skypack.dev/three@0.136";
import Stats from "three/addons/libs/stats.module.js";
import { Octree } from "three/addons/math/Octree.js";
import { OctreeHelper } from "three/addons/helpers/OctreeHelper.js";
import { Capsule } from "three/addons/math/Capsule.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { SceneBuilder } from "./scripts/SceneBuilder";
import { PlayerController } from "./scripts/PlayerController";
import { DirectionalLightHelper } from "three";

/**
 * The Camera and collision code is based on the threejs example:
 * https://github.com/mrdoob/three.js/blob/master/examples/games_fps.html
 */

const STEPS_PER_FRAME = 5;

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
      this.camera_
    );
    this.sceneBuilder_ = new SceneBuilder(true, this.worldOctree_, this.scene_); //contains helper functions to build the scene. Pass true to enable debugging features
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

    this.sceneBuilder_.create_room(new THREE.Vector3(0, 0, 0));
    this.sceneBuilder_.create_room(new THREE.Vector3(0, 0, 1));
    // const textureLoader = new THREE.TextureLoader();
    // const checkerboardTexture = textureLoader.load(
    //   "/resources/checkerboard.png",
    //   (texture) => {
    //     texture.wrapS = THREE.RepeatWrapping;
    //     texture.wrapT = THREE.RepeatWrapping;
    //     texture.repeat.set(10, 10);
    //   }
    // );

    // const floorGeometry = new THREE.PlaneGeometry(50, 50);
    // const floorMaterial = new THREE.MeshStandardMaterial({
    //   map: checkerboardTexture,
    // });
    // const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    // floor.rotation.x = -Math.PI / 2;
    // floor.receiveShadow = true;
    // this.scene_.add(floor);

    // const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    // const wall1Geometry = new THREE.BoxGeometry(50, 10, 1);
    // const wall1 = new THREE.Mesh(wall1Geometry, wallMaterial);
    // wall1.position.set(0, 5, -25);
    // wall1.castShadow = true;
    // wall1.receiveShadow = true;
    // this.scene_.add(wall1);

    // const wall2Geometry = new THREE.BoxGeometry(50, 10, 1);
    // const wall2 = new THREE.Mesh(wall2Geometry, wallMaterial);
    // wall2.position.set(0, 5, 25);
    // wall2.castShadow = true;
    // wall2.receiveShadow = true;
    // this.scene_.add(wall2);

    // const wall3Geometry = new THREE.BoxGeometry(1, 10, 50);
    // const wall3 = new THREE.Mesh(wall3Geometry, wallMaterial);
    // wall3.position.set(-25, 5, 0);
    // wall3.castShadow = true;
    // wall3.receiveShadow = true;
    // this.scene_.add(wall3);

    // const wall4Geometry = new THREE.BoxGeometry(1, 10, 50);
    // const wall4 = new THREE.Mesh(wall4Geometry, wallMaterial);
    // wall4.position.set(25, 5, 0);
    // wall4.castShadow = true;
    // wall4.receiveShadow = true;
    // this.scene_.add(wall4);

    // const boxGeometry = new THREE.BoxGeometry(5, 3, 5);
    // const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    // const box = new THREE.Mesh(boxGeometry, boxMaterial);
    // box.position.set(0, 0, 0); // Position the box in the middle
    // box.castShadow = true;
    // box.receiveShadow = true;
    // this.scene_.add(box);

    // // Add the floor, walls, and box to the octree for collision detection
    // this.worldOctree_.fromGraphNode(floor);
    // this.worldOctree_.fromGraphNode(wall1);
    // this.worldOctree_.fromGraphNode(wall2);
    // this.worldOctree_.fromGraphNode(wall3);
    // this.worldOctree_.fromGraphNode(wall4);
    // this.worldOctree_.fromGraphNode(box);

    // load_glb_object("zombie.glb", -2, 1.5, -2, this);
    this.sceneBuilder_.load_glb_object(
      "glb/zombie.glb",
      new THREE.Vector3(-2, 1.5, -2),
      true,
      new THREE.Vector3(0, -Math.PI / 4, 0)
    );

    this.sceneBuilder_.load_glb_object(
      "glb/wooden_chest.glb",
      new THREE.Vector3(2, 1.5, -2)
    );

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
    const ambientLight = new THREE.AmbientLight(0xfffffff, 0.2);
    this.scene_.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
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
