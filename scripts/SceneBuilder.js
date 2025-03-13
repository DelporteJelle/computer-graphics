import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  Box3,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
} from "three";
import * as THREE from "https://cdn.skypack.dev/three@0.136";
import { color, roughness } from "three/tsl";

export class SceneBuilder {
  constructor(debugging = false, octree, scene, ROOM_SIZE, ROOM_HEIGHT) {
    this.ROOM_HEIGHT = ROOM_HEIGHT;
    this.ROOM_SIZE = ROOM_SIZE;
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
  create_room(position, N, E, S, W, start = false, end = false) {
    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load(
      "/resources/textures/TilesCeramicWhite/2K/TilesCeramicWhite_BaseColor.jpg",
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(5, 5);
      }
    );

    const normalMap = textureLoader.load(
      "/resources/textures/TilesCeramicWhite/2K/TilesCeramicWhite_Normal.png"
    );
    const displacementMap = textureLoader.load(
      "/resources/textures/TilesCeramicWhite/2K/TilesCeramicWhite_Displacement.png"
    );
    const roughnessMap = textureLoader.load(
      "/resources/textures/TilesCeramicWhite/2K/TilesCeramicWhite_Roughness.jpg"
    );

    const offest = new THREE.Vector3(this.ROOM_SIZE, 0, this.ROOM_SIZE);
    position.multiply(offest);

    const ceilingGeometry = new THREE.PlaneGeometry(
      this.ROOM_SIZE,
      this.ROOM_SIZE
    );
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      side: THREE.BackSide,
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = -Math.PI / 2;
    ceiling.receiveShadow = true;
    ceiling.position.set(position.x, position.y + this.ROOM_HEIGHT, position.z);
    // this.scene_.add(ceiling);

    // const wallMaterial = new THREE.MeshStandardMaterial({
    //   color: 0xffffff,
    //   map: floorTexture,
    //   normalMap: normalMap,
    //   normalScale: new THREE.Vector2(1, -1),
    //   displacementMap: displacementMap,
    //   displacementScale: 0,
    //   roughnessMap: roughnessMap,
    //   roughness: 1,
    // });
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    if (N) {
      this.createMesh(
        new THREE.BoxGeometry(this.ROOM_SIZE, this.ROOM_HEIGHT, 1),
        wallMaterial,
        new THREE.Vector3(
          position.x,
          this.ROOM_HEIGHT / 2,
          position.z - this.ROOM_SIZE / 2
        )
      );
    }
    if (S) {
      this.createMesh(
        new THREE.BoxGeometry(this.ROOM_SIZE, this.ROOM_HEIGHT, 1),
        wallMaterial,
        new THREE.Vector3(
          position.x,
          this.ROOM_HEIGHT / 2,
          position.z + this.ROOM_SIZE / 2
        )
      );
    }
    if (W) {
      this.createMesh(
        new THREE.BoxGeometry(1, this.ROOM_HEIGHT, this.ROOM_SIZE),
        wallMaterial,
        new THREE.Vector3(
          position.x - this.ROOM_SIZE / 2,
          this.ROOM_HEIGHT / 2,
          position.z
        )
      );
    }
    if (E) {
      this.createMesh(
        new THREE.BoxGeometry(1, this.ROOM_HEIGHT, this.ROOM_SIZE),
        wallMaterial,
        new THREE.Vector3(
          position.x + this.ROOM_SIZE / 2,
          this.ROOM_HEIGHT / 2,
          position.z
        )
      );
    }

    if (start) {
      this.createMesh(
        new THREE.BoxGeometry(this.ROOM_SIZE, 0.2, this.ROOM_SIZE),
        new THREE.MeshStandardMaterial({
          color: 0x00ff00,
        }),
        new THREE.Vector3(position.x, 0, position.z)
      );
    }
    if (end) {
      this.createMesh(
        new THREE.BoxGeometry(this.ROOM_SIZE, 0.2, this.ROOM_SIZE),
        new THREE.MeshStandardMaterial({
          color: 0xff0000,
        }),
        new THREE.Vector3(position.x, 0, position.z)
      );
    }

    // Add the floor, walls, and box to the octree for collision detection
    // this.worldOctree_.fromGraphNode(ceiling);
  }

  createMesh(geometry, material, position) {
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(position.x, position.y, position.z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene_.add(wall);
    this.worldOctree_.fromGraphNode(wall);
  }

  createMazeFloor(width, depth) {
    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load(
      "/resources/textures/TilesCeramicWhite/2K/TilesCeramicWhite_BaseColor.jpg",
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(5, 5);
      }
    );

    const normalMap = textureLoader.load(
      "/resources/textures/TilesCeramicWhite/2K/TilesCeramicWhite_Normal.png"
    );
    const displacementMap = textureLoader.load(
      "/resources/textures/TilesCeramicWhite/2K/TilesCeramicWhite_Displacement.png"
    );
    const roughnessMap = textureLoader.load(
      "/resources/textures/TilesCeramicWhite/2K/TilesCeramicWhite_Roughness.jpg"
    );

    let total_width = width * this.ROOM_SIZE;
    let total_depth = depth * this.ROOM_SIZE;
    let position = new THREE.Vector3(
      total_width / 2 - this.ROOM_SIZE / 2,
      0,
      total_depth / 2 - this.ROOM_SIZE / 2
    );

    const floorGeometry = new THREE.PlaneGeometry(total_width, total_depth);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      map: floorTexture,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(1, -1),
      displacementMap: displacementMap,
      displacementScale: 0,
      roughnessMap: roughnessMap,
      roughness: 1,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.set(position.x, position.y, position.z);
    this.scene_.add(floor);

    this.worldOctree_.fromGraphNode(floor);
  }
}
