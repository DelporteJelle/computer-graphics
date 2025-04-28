/**
 * THREE.hs
 */
import * as THREE from "https://cdn.skypack.dev/three@0.136";
import { Capsule } from "three/addons/math/Capsule.js";
import KeyEvents from "../KeyEvents"

/**
 * Config
 */
import * as Config from "../../config";

export default class PlayerController {
  constructor(
    octree,
    camera,
    spawnpoint
  ) {
    this.worldOctree_ = octree;
    this.camera_ = camera;
    this.isPointerLocked = false;
    this.hasDoubleJump = true;

    this.playerCollider_ = new Capsule(
      new THREE.Vector3(spawnpoint.x, 1, spawnpoint.y), //Start point of collision box
      new THREE.Vector3(spawnpoint.x, 2, spawnpoint.y), //End point
      0.35 //Radius
    );

    this.playerVelocity_ = new THREE.Vector3();
    this.playerDirection_ = new THREE.Vector3();
    this.playerOnFloor_ = false;

    KeyEvents.addEventListener(document, 'mousemove', this.onMouseMove_);
    KeyEvents.addEventListener(document, 'pointerlockchange', this.onPointerLockChange_);
    KeyEvents.addEventListener(document.body, 'mousedown', () => { 
      if (!this.isPointerLocked)
        document.body.requestPointerLock();
    });

  }

  onPointerLockChange_ = () => {
    if (document.pointerLockElement) {
      this.isPointerLocked = true;
      return;
    }
    this.isPointerLocked = false;
  }

  /**
   * Changes camera direction based on mouse movement
   * @param {*} event 
   * @returns 
   */
  onMouseMove_ = (event) => {
    if (!this.isPointerLocked) return;

    this.camera_.rotation.y -= event.movementX * Config.SENSITIVITY;
    this.camera_.rotation.x -= event.movementY * Config.SENSITIVITY;
    this.camera_.rotation.x = Math.max(
      -Config.CAMERA_ANGLE_CAP,
      Math.min(Config.CAMERA_ANGLE_CAP, this.camera_.rotation.x)
    );
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
      this.playerVelocity_.y -= Config.GRAVITY * deltaTime; // Apply gravity to the y velocity
    }

    // Apply damping only to the horizontal components (x and z)
    const damping = this.playerOnFloor_ ? 0.92 : 0.998;
    this.playerVelocity_.x *= damping;
    this.playerVelocity_.z *= damping;

    // Cap the player speed to a maximum of MAX_SPEED for horizontal movement
    const horizontalSpeed = Math.sqrt(
      this.playerVelocity_.x ** 2 + this.playerVelocity_.z ** 2
    );
    if (horizontalSpeed > Config.MAX_SPEED) {
      const scale = Config.MAX_SPEED / horizontalSpeed;
      this.playerVelocity_.x *= scale;
      this.playerVelocity_.z *= scale;
    }

    // Calculate the delta position based on the velocity
    const deltaPosition = this.playerVelocity_
      .clone()
      .multiplyScalar(deltaTime);
    this.playerCollider_.translate(deltaPosition);

    // Handle collisions and update the camera position
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
    // Defines the speed of the player, this is lower when the player is in the air to give the player only a small amount of control in the air.
    const speedDelta = deltaTime * (this.playerOnFloor_ ? 100 : 50);
    // Determine movement
    const forwardsMovement = KeyEvents.getKeyDown(Config.KEY_FORWARD) - KeyEvents.getKeyDown(Config.KEY_BACKWARD);
    const sideMovement = KeyEvents.getKeyDown(Config.KEY_RIGHT) - KeyEvents.getKeyDown(Config.KEY_LEFT);

    // Apply movement
    this.playerVelocity_.add(this.getForwardVector().multiplyScalar(speedDelta * forwardsMovement));
    this.playerVelocity_.add(this.getSideVector().multiplyScalar(speedDelta * sideMovement));

    if (KeyEvents.getKeyDown(Config.KEY_JUMP)) {
      const currentTime = performance.now(); // Get the current time in milliseconds
      if (
        !this.lastJumpTime ||
        currentTime - this.lastJumpTime > Config.JUMP_COOLDOWN
      ) {
        if (this.playerOnFloor_) {
          this.playerVelocity_.y = Config.JUMP_FORCE;
          this.hasDoubleJump = true;
          this.lastJumpTime = currentTime;
        } else if (this.hasDoubleJump) {
          this.playerVelocity_.y = Math.max(
            this.playerVelocity_.y + Config.JUMP_FORCE,
            Config.JUMP_FORCE
          );
          this.hasDoubleJump = false;
          this.lastJumpTime = currentTime;
        }
      }
    }

    // if (this.playerOnFloor_) {
    //   if (this.keyStates_["Space"]) {
    //     this.playerVelocity_.y = this.JUMP_FORCE;
    //   }
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
