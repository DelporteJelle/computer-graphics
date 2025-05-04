import * as Config from "../config";

class GameState {
  constructor(resetCallback) {
    this.resetCallback = resetCallback;
    this.powerupLocations_ = [];
    this.remainingTime_ = Config.TIMER;
    this.spawnpoint_ = null;

    this.initializeTimer_();
  }

  get powerupLocations() { return this.powerupLocations_; }
  get spawnpoint() { return this.spawnpoint_; }

  initializeTimer_() {
    const timer = document.createElement("div");
    timer.id = "timer";

    // Style
    timer.style.position = "absolute";
    timer.style.top = "10px";
    timer.style.right = "10px";
    timer.style.color = "white";
    timer.style.fontSize = "24px";
    timer.style.fontFamily = "Arial, sans-serif";
    timer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    timer.style.padding = "10px";
    timer.style.borderRadius = "5px";
    timer.textContent = "60s";

    document.body.appendChild(timer);

    const timerElement = document.getElementById("timer");
    timerElement.textContent = `${this.remainingTime_}s`;

    const countdownInterval = setInterval(() => {
      this.remainingTime_--;

      if (this.remainingTime_ <= 0) {
        clearInterval(countdownInterval);
        timerElement.textContent = "Time's Up!";
        this.gameOver_();
      } else {
        timerElement.textContent = `${this.remainingTime_}s`;
      }
    }, 1000); // Update every second
  }

  reset() {
    // Reset powerup locations
    this.powerupLocations_ = [];
    this.resetCallback();

    // Reset the timer
    this.remainingTime_ += Config.TIMER; 
    this.showMessage("Increasing maze size, + " + Config.TIMER + "s");
  }

  /**
   * Add a powerup location
   * @param {THREE.Vector3} position 
   */
  addPowerup(position) {
    this.powerupLocations_.push(position);
  }

  removePowerup(oldPosition) {
    this.powerupLocations_ = this.powerupLocations_.filter(
      (position) => position !== oldPosition
    );
  }

  setSpawnpoint(vector) {
    this.spawnpoint_ = vector;
  }


  /**
   * HELPER METHODS
   */
  showMessage(message) {
    const text = document.createElement("div");
    text.id = "game-over-text";
    text.style.position = "absolute";
    text.style.top = "50%";
    text.style.left = "50%";
    text.style.transform = "translate(-50%, -50%)";
    text.style.color = "white";
    text.style.fontSize = "48px";
    text.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    text.style.padding = "20px";
    text.style.borderRadius = "10px";
    text.textContent = message;
    document.body.appendChild(text);

    setTimeout(() => {
      text.remove();
    }, 3000); // Remove the message after 3 seconds
  }

  gameOver_() { this.showMessage("Game Over!"); }
}

let instance = null;
export default function getGameState(resetCallback=null) {
  if (!instance) 
    instance = new GameState(resetCallback);
  return instance;
}