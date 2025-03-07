import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  Box3,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
} from "three";
import * as THREE from "https://cdn.skypack.dev/three@0.136";

const ROOM_SIZE = 30;
const ROOM_HEIGHT = 10;

export class SceneBuilder {
  constructor(debugging = false, octree, scene) {
    this.debugging_ = debugging;
    this.loader_ = new GLTFLoader().setPath("/resources/");
    this.worldOctree_ = octree;
    this.scene_ = scene;
  }

  /**
   * @TODO the bounding box is still far of the actual shape of the object in some cases (for example when object is rotated)
   *
   * Adds object to the scene and adds it to the octree
   * To reduce lagg we use the bounding box for collisions
   * Adds a wireframe to represent the collision box for debugging when debugging is enabled
   *
   * @param {*} path
   * @param {THREE.Vector3} position
   * @param {boolean} spherical //To set the bounding box to a sphere if this is closer to the actural shape
   * @param {THREE.Vector3} rotation
   */
  load_glb_object(
    path,
    position,
    spherical = false,
    rotation = new THREE.Vector3(0, 0, 0)
  ) {
    this.loader_.load(path, (gltf) => {
      const object = gltf.scene;
      this.scene_.add(object);
      object.position.set(position.x, position.y, position.z);
      object.rotation.set(rotation.x, rotation.y, rotation.z);

      const boundingBox = new Box3().setFromObject(object);
      const size = boundingBox.getSize(new THREE.Vector3());
      const center = boundingBox.getCenter(new THREE.Vector3());

      let boundingMesh;
      if (spherical) {
        const radius = Math.max(size.x, size.y, size.z) / 2;
        boundingMesh = new Mesh(
          new SphereGeometry(radius, 10, 10),
          new MeshBasicMaterial({
            color: 0xff0000,
            visible: this.debugging_,
            wireframe: this.debugging_,
          })
        );
        boundingMesh.scale.set(size.x / 2, size.y / 2, size.z / 2); // Scale to fit the bounding box
      } else {
        const boxMaterial = new MeshBasicMaterial({
          color: 0xff0000,
          visible: this.debugging_,
          wireframe: this.debugging_,
        });
        boundingMesh = new Mesh(
          new BoxGeometry(size.x, size.y, size.z),
          boxMaterial
        );
      }
      boundingMesh.position.set(center.x, center.y, center.z);
      this.scene_.add(boundingMesh);

      this.worldOctree_.fromGraphNode(boundingMesh);

      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });
  }

  /**
   * Creates a basic room
   *
   * @param {THREE.Vector3} position //This is the position relative to the grid so (0, 0, 0) is center, (1, 0, 0) is right, etc.
   */
  create_room(position) {
    const textureLoader = new THREE.TextureLoader();
    const checkerboardTexture = textureLoader.load(
      "/resources/checkerboard.png",
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);
      }
    );

    const offest = new THREE.Vector3(ROOM_SIZE, 0, ROOM_SIZE);
    position.multiply(offest);

    const floorGeometry = new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE);
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: checkerboardTexture,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.set(position.x, position.y, position.z);
    this.scene_.add(floor);

    const ceilingGeometry = new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      map: checkerboardTexture,
      side: THREE.BackSide,
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = -Math.PI / 2;
    ceiling.receiveShadow = true;
    ceiling.position.set(position.x, position.y + ROOM_HEIGHT, position.z);
    this.scene_.add(ceiling);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const wall1Geometry = new THREE.BoxGeometry(ROOM_SIZE, ROOM_HEIGHT, 1);
    const wall1 = new THREE.Mesh(wall1Geometry, wallMaterial);
    wall1.position.set(position.x, ROOM_HEIGHT / 2, position.z - ROOM_SIZE / 2);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    this.scene_.add(wall1);

    const wall2Geometry = new THREE.BoxGeometry(ROOM_SIZE, ROOM_HEIGHT, 1);
    const wall2 = new THREE.Mesh(wall2Geometry, wallMaterial);
    wall2.position.set(position.x, ROOM_HEIGHT / 2, position.z + ROOM_SIZE / 2);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    this.scene_.add(wall2);

    const wall3Geometry = new THREE.BoxGeometry(1, ROOM_HEIGHT, ROOM_SIZE);
    const wall3 = new THREE.Mesh(wall3Geometry, wallMaterial);
    wall3.position.set(position.x - ROOM_SIZE / 2, ROOM_HEIGHT / 2, position.z);
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    this.scene_.add(wall3);

    const wall4Geometry = new THREE.BoxGeometry(1, ROOM_HEIGHT, ROOM_SIZE);
    const wall4 = new THREE.Mesh(wall4Geometry, wallMaterial);
    wall4.position.set(position.x + ROOM_SIZE / 2, ROOM_HEIGHT / 2, position.z);
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
    this.worldOctree_.fromGraphNode(ceiling);
    this.worldOctree_.fromGraphNode(wall1);
    this.worldOctree_.fromGraphNode(wall2);
    this.worldOctree_.fromGraphNode(wall3);
    this.worldOctree_.fromGraphNode(wall4);
    this.worldOctree_.fromGraphNode(box);
  }
}
