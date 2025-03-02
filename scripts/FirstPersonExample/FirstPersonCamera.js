import { InputController } from "./InputController.js";
import * as THREE from "https://cdn.skypack.dev/three@0.136";

/**
 * Credit: https://github.com/simondevyoutube/ThreeJS_Tutorial_FirstPersonCamera
 * The FirstPersonCamera code is based on the code from the above link.
 *
 * FirstPersonCamera class handles the first person camera movement to simulate a first person view.
 */

function clamp(x, a, b) {
  return Math.min(Math.max(x, a), b);
}

export class FirstPersonCamera {
  constructor(camera, azerty = false) {
    if (azerty) {
      this.KEYS = {
        w: 90,
        a: 81,
        s: 83,
        d: 68,
      };
    } else {
      this.KEYS = {
        w: 87,
        a: 65,
        s: 83,
        d: 68,
      };
    }

    this.camera_ = camera;
    this.input_ = new InputController();
    this.rotation_ = new THREE.Quaternion();
    this.translation_ = new THREE.Vector3(0, 2, 0);
    this.phi_ = 0;
    this.phiSpeed_ = 8;
    this.theta_ = 0;
    this.thetaSpeed_ = 5;
  }

  update(timeElapsedS) {
    this.updateRotation_(timeElapsedS);
    this.updateCamera_(timeElapsedS);
    this.updateTranslation_(timeElapsedS);
    this.input_.update(timeElapsedS);
  }

  updateCamera_(_) {
    this.camera_.quaternion.copy(this.rotation_);
    this.camera_.position.copy(this.translation_);

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.rotation_);

    const dir = forward.clone();

    forward.multiplyScalar(100);
    forward.add(this.translation_);
  }

  //Moves the camera based on the keyboard input from the user
  updateTranslation_(timeElapsedS) {
    const forwardVelocity =
      (this.input_.key(this.KEYS.w) ? 1 : 0) +
      (this.input_.key(this.KEYS.s) ? -1 : 0);
    const strafeVelocity =
      (this.input_.key(this.KEYS.a) ? 1 : 0) +
      (this.input_.key(this.KEYS.d) ? -1 : 0);

    const qx = new THREE.Quaternion();
    qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(qx);
    forward.multiplyScalar(forwardVelocity * timeElapsedS * 10);

    const left = new THREE.Vector3(-1, 0, 0);
    left.applyQuaternion(qx);
    left.multiplyScalar(strafeVelocity * timeElapsedS * 10);

    this.translation_.add(forward);
    this.translation_.add(left);
  }

  //Takes how much the mouse has moved and converts it to rotation
  updateRotation_(timeElapsedS) {
    const xh = this.input_.current_.mouseXDelta / window.innerWidth;
    const yh = this.input_.current_.mouseYDelta / window.innerHeight;

    this.phi_ += -xh * this.phiSpeed_;
    this.theta_ = clamp(
      this.theta_ + -yh * this.thetaSpeed_,
      -Math.PI / 3,
      Math.PI / 3
    );

    const qx = new THREE.Quaternion();
    qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);
    const qz = new THREE.Quaternion();
    qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta_);

    const q = new THREE.Quaternion();
    q.multiply(qx);
    q.multiply(qz);

    this.rotation_.copy(q);
  }
}
