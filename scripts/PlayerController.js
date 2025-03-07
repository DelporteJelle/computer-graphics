import { Capsule } from "three/addons/math/Capsule.js";
import * as THREE from "https://cdn.skypack.dev/three@0.136";

const GRAVITY = 25;
// const GRAVITY = 0;

export class PlayerController {
  constructor(target, octree, camera) {
    this.worldOctree_ = octree;
    this.target_ = target || document;
    this.camera_ = camera;

    this.playerCollider_ = new Capsule(
      new THREE.Vector3(0, 1, 0), //Start point of collision box
      new THREE.Vector3(0, 2, 0), //End point
      0.35 //Radius
    );

    this.playerVelocity_ = new THREE.Vector3();
    this.playerDirection_ = new THREE.Vector3();
    this.playerOnFloor_ = false;
    this.mouseTime_ = 0;
    this.keyStates_ = {};

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
    if (!this.playerOnFloor_) {
      this.playerVelocity_.y -= GRAVITY * deltaTime;
    }

    const damping = this.playerOnFloor_ ? 0.98 : 0.995;
    this.playerVelocity_.multiplyScalar(damping);

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
    const speedDelta = deltaTime * (this.playerOnFloor_ ? 35 : 12);

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
    // // Apply damping to reduce sliding effect
    // const damping = this.playerOnFloor_ ? 0.9 : 0.99; // Stronger damping on the ground
    // this.playerVelocity_.multiplyScalar(damping);

    // // Ensure the player stops completely when no keys are pressed
    // if (
    //   !this.keyStates_["KeyW"] &&
    //   !this.keyStates_["KeyS"] &&
    //   !this.keyStates_["KeyA"] &&
    //   !this.keyStates_["KeyD"]
    // ) {
    //   this.playerVelocity_.x *= damping;
    //   this.playerVelocity_.z *= damping;
    // }
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
}
