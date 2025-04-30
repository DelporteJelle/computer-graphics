// Based off https://github.com/mohsenheydari/three-fps/blob/master/src/Input.js

/**
 * Class that handles Inputs
 * (Makes it easier to add controls)
 */
class KeyEvents {
  constructor() {
    this.keyStates_ = {};
    this.keyPressed_ = {};
    this.initialize();
    }

    /**
     * Template method to add an event listener
     * @param {*} element 
     * @param {*} key 
     * @param {*} callback 
     */
    addEventListener(element, key, callback){
        element.addEventListener(key, callback);
        this.events.push({element, key, callback});
    }

    initialize() {
    this.events = [];
    this.addEventListener(document, 'keydown', this.onKeyDown_);
    this.addEventListener(document, 'keyup', this.onKeyUp_);
    }

    onKeyDown_ = (event) => {
        this.keyStates_[event.code] = true;
    }

    onKeyUp_ = (event) => {
        this.keyStates_[event.code] = false;
        this.keyPressed_[event.code] = true;
    }

    getKeyDown(code) {
        return this.keyStates_[code] === undefined ? false : this.keyStates_[code];
    }

    getKeyPressed(code) {
        if (this.keyPressed_[code]) {
            this.keyPressed_[code] = false;
            return true;
        }
        return false;
    }

    clearEventListeners() {
        this.events.forEach((event) => {
            event.element.removeEventListener(event.type, event.callback);
        });

        this.initialize();
    }
}

const keyEventsInstance = new KeyEvents();
export default keyEventsInstance;