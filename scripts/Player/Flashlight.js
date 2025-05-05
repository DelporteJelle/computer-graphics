//import * as THREE from "https://cdn.skypack.dev/three@0.136";
import * as THREE from "three";
import * as Config from "../../config";

export default class Flashlight {
  constructor(camera) {
    this.camera_ = camera;
    this.light_ = new THREE.SpotLight(
      0xffffc5,               // Color
      2.5,                    // Intensity
      Config.ROOM_SIZE * 5,   // Distance
      Math.PI / 5,            // Angle
      0.5,                    // Penumbra
      0.5                     // Decay
    );

    this.light_.castShadow = true;
    this.light_.shadow.mapSize.width = 1024;
    this.light_.shadow.mapSize.height = 1024;
    this.light_.shadow.radius = 2;
    this.light_.shadow.bias = -0.006;
    
    this.target_ = new THREE.Object3D();
    this.light_.target = this.target_;

    this.enabled = true;
    this.update();
  }

  get light() { return this.light_ }
  get target() { return this.target_ }
  get isOn() { return this.enabled; }

  enableLight() {
    this.light_.visible = true;
    this.enabled = true;
    console.log(`Flashlight enabled`);
  }

  disableLight() {
    this.light_.visible = false;
    this.enabled = false;
    console.log(`Flashlight disabled`);
  }

  update() {
    this.light_.position.copy(this.camera_.position);

    // Update target to look ahead in camera's direction
    const direction = new THREE.Vector3();
    this.camera_.getWorldDirection(direction);
    this.target_.position.copy(this.camera_.position).add(direction);
  }
}