//Inspiration: https://github.com/simondevyoutube?tab=repositories
import * as THREE from "https://cdn.skypack.dev/three@0.136";
import { FirstPersonCamera } from "./scripts/FirstPersonCamera.js";
import { FirstPersonControls } from "https://cdn.skypack.dev/three@0.136/examples/jsm/controls/FirstPersonControls.js";

class Setup {
  constructor() {
    this.initialize_();
  }

  initialize_() {
    this.initializeRenderer_();
    this.initializeLights_();
    this.initializeScene_();
    this.initializeFirstPersonCamera();
    // this.initializeStaticCamera(); //Only for testing purposes
    this.previousRAF_ = null;
    this.raf_();
    this.onWindowResize_();
  }

  //Initilizes the FirstPersonCamera class and the FirstPersonControls class
  initializeFirstPersonCamera() {
    this.controls_ = new FirstPersonControls(
      this.camera_,
      this.threejs_.domElement
    );
    this.controls_.lookSpeed = 0.8;
    this.controls_.movementSpeed = 5;

    // this.fpsCamera_ = new FirstPersonCamera(this.camera_, true); //Use this for AZERTY keyboard
    this.fpsCamera_ = new FirstPersonCamera(this.camera_);
  }

  //Temp camera for testing purposes
  initializeStaticCamera() {
    const camera = new THREE.PerspectiveCamera(75, 1920 / 1080, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);
    this.camera_ = camera;
  }

  //Initializes the renderer and the camera
  initializeRenderer_() {
    this.threejs_ = new THREE.WebGLRenderer({
      antialias: false,
    });
    this.threejs_.shadowMap.enabled = true; //Enable shadow mapping
    this.threejs_.shadowMap.type = THREE.PCFSoftShadowMap;
    this.threejs_.setPixelRatio(window.devicePixelRatio); //Set resolution of rendered output to match the screen resolution
    this.threejs_.setSize(window.innerWidth, window.innerHeight);
    this.threejs_.physicallyCorrectLights = true; //Simulates real-world light behavior
    // this.threejs_.outputEncoding = THREE.sRGBEncoding; //Results in a more bright scene (too bright)

    document.body.appendChild(this.threejs_.domElement);

    window.addEventListener(
      "resize",
      () => {
        this.onWindowResize_();
      },
      false
    );

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    //The main camera for the scene, the FirstPersonCamera ands first person behavior to this camera
    this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);

    this.scene_ = new THREE.Scene();

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

  //Initializes the scene with the objects and materials
  initializeScene_() {
    const loader = new THREE.CubeTextureLoader();

    const mapLoader = new THREE.TextureLoader();
    const maxAnisotropy = this.threejs_.capabilities.getMaxAnisotropy();
    const checkerboard = mapLoader.load("resources/checkerboard.png");
    checkerboard.anisotropy = maxAnisotropy;
    checkerboard.wrapS = THREE.RepeatWrapping;
    checkerboard.wrapT = THREE.RepeatWrapping;
    checkerboard.repeat.set(32, 32);
    checkerboard.encoding = THREE.sRGBEncoding;

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100, 10, 10),
      new THREE.MeshStandardMaterial({ map: checkerboard })
    );
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this.scene_.add(plane);

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(4, 4, 4),
      this.loadMaterial_("vintage-tile1_", 0.2)
    );
    box.position.set(10, 2, 0);
    box.castShadow = true;
    box.receiveShadow = true;
    this.scene_.add(box);

    const concreteMaterial = this.loadMaterial_("concrete3-", 4);

    const wall1 = new THREE.Mesh(
      new THREE.BoxGeometry(100, 100, 4),
      concreteMaterial
    );
    wall1.position.set(0, -40, -50);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    this.scene_.add(wall1);

    const wall2 = new THREE.Mesh(
      new THREE.BoxGeometry(100, 100, 4),
      concreteMaterial
    );
    wall2.position.set(0, -40, 50);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    this.scene_.add(wall2);

    const wall3 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 100, 100),
      concreteMaterial
    );
    wall3.position.set(50, -40, 0);
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    this.scene_.add(wall3);

    const wall4 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 100, 100),
      concreteMaterial
    );
    wall4.position.set(-50, -40, 0);
    wall4.castShadow = true;
    wall4.receiveShadow = true;
    this.scene_.add(wall4);
  }

  //Initializes the lights in the scene
  initializeLights_() {
    const distance = 100.0;
    const angle = Math.PI / 4.0;
    const penumbra = 0.5;
    const decay = 1.0;

    let light = new THREE.SpotLight(
      0xffffff,
      200.0,
      distance,
      angle,
      penumbra,
      decay
    );
    light.castShadow = true;

    light.position.set(25, 25, 25);
    light.lookAt(0, 0, 0);

    let ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene_.add(ambientLight);
    this.scene_.add(light);

    //Hemisphere light, can be used to simulate the sky
    // const upColour = 0xffff80;
    // const downColour = 0x808080;
    // light = new THREE.HemisphereLight(upColour, downColour, 0.5);
    // light.color.setHSL(0.6, 1, 0.6);
    // light.groundColor.setHSL(0.095, 1, 0.75);
    // light.position.set(0, 4, 0);
    // this.scene_.add(light);
  }

  //Load material helper function
  loadMaterial_(name, tiling) {
    const mapLoader = new THREE.TextureLoader();
    const maxAnisotropy = this.threejs_.capabilities.getMaxAnisotropy();

    const metalMap = mapLoader.load(
      "resources/freepbr/" + name + "metallic.png"
    );
    metalMap.anisotropy = maxAnisotropy;
    metalMap.wrapS = THREE.RepeatWrapping;
    metalMap.wrapT = THREE.RepeatWrapping;
    metalMap.repeat.set(tiling, tiling);

    const albedo = mapLoader.load("resources/freepbr/" + name + "albedo.png");
    albedo.anisotropy = maxAnisotropy;
    albedo.wrapS = THREE.RepeatWrapping;
    albedo.wrapT = THREE.RepeatWrapping;
    albedo.repeat.set(tiling, tiling);
    albedo.encoding = THREE.sRGBEncoding;

    const normalMap = mapLoader.load(
      "resources/freepbr/" + name + "normal.png"
    );
    normalMap.anisotropy = maxAnisotropy;
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(tiling, tiling);

    const roughnessMap = mapLoader.load(
      "resources/freepbr/" + name + "roughness.png"
    );
    roughnessMap.anisotropy = maxAnisotropy;
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(tiling, tiling);

    const material = new THREE.MeshStandardMaterial({
      metalnessMap: metalMap,
      map: albedo,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
    });

    return material;
  }

  //Resize the window
  onWindowResize_() {
    this.camera_.aspect = window.innerWidth / window.innerHeight;
    this.camera_.updateProjectionMatrix();

    this.uiCamera_.left = -this.camera_.aspect;
    this.uiCamera_.right = this.camera_.aspect;
    this.uiCamera_.updateProjectionMatrix();

    this.threejs_.setSize(window.innerWidth, window.innerHeight);
  }

  raf_() {
    requestAnimationFrame((t) => {
      if (this.previousRAF_ === null) {
        this.previousRAF_ = t;
      }

      this.step_(t - this.previousRAF_);
      this.threejs_.autoClear = true;
      this.threejs_.render(this.scene_, this.camera_);
      this.threejs_.autoClear = false;
      this.threejs_.render(this.uiScene_, this.uiCamera_);
      this.previousRAF_ = t;
      this.raf_();
    });
  }

  step_(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;

    if (this.fpsCamera_) {
      //If statement for if wer are testing with the static camera
      this.fpsCamera_.update(timeElapsedS);
    }
  }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
  _APP = new Setup();
});
