/**
 * THREE.hs
 */
//import * as THREE from "https://cdn.skypack.dev/three@0.136";
import * as THREE from "three";
import { Capsule } from "three/addons/math/Capsule.js";
import KeyEvents from "../KeyEvents";
import getGameState from "../GameState";

/**
 * Config
 */
import * as Config from "../../config";

export default class PlayerController {
  constructor(
    octree,
    camera,
    spawnpoint,
    flashlight,
  ) {
    this.worldOctree_ = octree;
    this.camera_ = camera;
    this.flashlight_ = flashlight;
    this.isPointerLocked = false;
    this.gameState_ = getGameState();
    this.hasDoubleJump = true;
    this.jump_bonus = 0;
    this.speed_bonus = 0;

    this.playerCollider_ = new Capsule(
      new THREE.Vector3(spawnpoint.x, 1, spawnpoint.y), //Start point of collision box
      new THREE.Vector3(spawnpoint.x, 2, spawnpoint.y), //End point
      0.35 //Radius
    );

    this.playerVelocity_ = new THREE.Vector3();
    this.playerDirection_ = new THREE.Vector3();
    this.playerOnFloor_ = false;

    KeyEvents.addEventListener(document, "mousemove", this.onMouseMove_);
    KeyEvents.addEventListener(
      document,
      "pointerlockchange",
      this.onPointerLockChange_
    );
    KeyEvents.addEventListener(document.body, "mousedown", () => {
      if (!this.isPointerLocked) document.body.requestPointerLock();
    });
  }

  onPointerLockChange_ = () => {
    if (document.pointerLockElement) {
      this.isPointerLocked = true;
      return;
    }
    this.isPointerLocked = false;
  };

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
  };

  /**
   * Checks for intersections between playerCollider and objects in the world
   */
  playerCollisions() {
    const result = this.worldOctree_.capsuleIntersect(this.playerCollider_);


    this.playerOnFloor_ = false;

    if (result) {
      this.playerOnFloor_ = result.normal.y > 0;
      if (!this.playerOnFloor_) {
        this.playerVelocity_.addScaledVector(
          result.normal,
          -result.normal.dot(this.playerVelocity_)
        );
      }

      if (result.depth >= 1e-10) {
        this.playerCollider_.translate(
          result.normal.multiplyScalar(result.depth)
        );
      }
    }
  }

  /**
   * Checks if the player is near a sphere and grants a powerup if so
   * @param {*} playerPosition
   */
  checkPlayerProximity(playerPosition) {
    // Create a copy of the powerup locations to avoid modifying the array while iterating

    this.gameState_.powerupLocations.forEach((sphere) => {
      const distance = playerPosition.distanceTo(sphere);

      if (distance < 0.7) {
        console.log("Powerup collected!");

        if (Math.random() < 0.5) {
          this.jump_bonus += 0.5;
          this.gameState_.showMessage("Jump increased!");
        } else {
          this.speed_bonus += 0.5;
          this.gameState_.showMessage("Speed increased!");
        }

        // remove collected powerup
        this.gameState_.removePowerup(sphere);
      }
    });
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
    if (horizontalSpeed > Config.MAX_SPEED + this.speed_bonus) {
      const scale = (Config.MAX_SPEED + this.speed_bonus) / horizontalSpeed;
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
    // Teleport player if Out Of Bounds
    this.teleportIfOOB();
    // Check player proximity for powerups
    this.checkPlayerProximity(this.playerCollider_.end);
    // Move camera
    this.camera_.position.copy(this.playerCollider_.end);
    // Update flashlight position
    if (this.flashlight_) this.flashlight_.update()
  }

  setFlashlight(flashlight) {
    this.flashlight_ = flashlight;
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
    const forwardsMovement =
      KeyEvents.getKeyDown(Config.KEY_FORWARD) -
      KeyEvents.getKeyDown(Config.KEY_BACKWARD);
    const sideMovement =
      KeyEvents.getKeyDown(Config.KEY_RIGHT) -
      KeyEvents.getKeyDown(Config.KEY_LEFT);

    // Apply movement
    this.playerVelocity_.add(
      this.getForwardVector().multiplyScalar(speedDelta * forwardsMovement)
    );
    this.playerVelocity_.add(
      this.getSideVector().multiplyScalar(speedDelta * sideMovement)
    );

    if (KeyEvents.getKeyDown(Config.KEY_JUMP)) {
      const currentTime = performance.now(); // Get the current time in milliseconds
      if (
        !this.lastJumpTime ||
        currentTime - this.lastJumpTime > Config.JUMP_COOLDOWN
      ) {
        if (this.playerOnFloor_) {
          this.playerVelocity_.y = Config.JUMP_FORCE + this.jump_bonus;
          this.hasDoubleJump = true;
          this.lastJumpTime = currentTime;
        } else if (this.hasDoubleJump) {
          this.playerVelocity_.y = Math.max(
            this.playerVelocity_.y + Config.JUMP_FORCE + this.jump_bonus,
            Config.JUMP_FORCE + this.jump_bonus
          );
          this.hasDoubleJump = false;
          this.lastJumpTime = currentTime;
        }
      }
    }

    if (KeyEvents.getKeyPressed(Config.KEY_TOGGLE_FLASHLIGHT)) {
      if (this.flashlight_.isOn) {
        this.flashlight_.disableLight();
        return;
      }
      this.flashlight_.enableLight();
    }

    if (KeyEvents.getKeyPressed(Config.KEY_RESET)) {
      this.gameState_.reset();
    }
  }

  teleportIfOOB() {
    if (this.camera_.position.y <= -2) {
      this.teleportPlayer(this.gameState_.spawnpoint)
      this.camera_.rotation.set(0, 0, 0);
    }
  }

  /**
   * Teleport the player to a specific location in the maze.
   * @param {Vector2} location
   */
  teleportPlayer(location) {
    this.playerCollider_ = new Capsule(
      new THREE.Vector3(location.x, 1, location.y), //Start point of collision box
      new THREE.Vector3(location.x, 2, location.y), //End point
      0.35 //Radius
    );
  }
}
