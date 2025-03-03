import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Box3, BoxGeometry, Mesh, MeshBasicMaterial } from "three";
import * as THREE from "https://cdn.skypack.dev/three@0.136";

export class SceneBuilder {
  constructor(debugging = false) {
    this.debugging_ = debugging;
    this.loader_ = new GLTFLoader().setPath("/resources/");
  }

  /**
   * Adds object to the scene and adds it to the octree
   * To reduce lagg we use the bounding box for collisions
   * Adds a wireframe to represent the collision box for debugging when debugging is enabled
   *
   * @param {*} path
   * @param {*} x
   * @param {*} y
   * @param {*} z
   * @param {*} scene
   * @param {*} octree
   */
  load_glb_object(path, x, y, z, scene, octree) {
    this.loader_.load(path, (gltf) => {
      const object = gltf.scene;
      scene.add(object);
      object.position.set(x, y, z);

      const boundingBox = new Box3().setFromObject(object);
      const size = boundingBox.getSize(new THREE.Vector3());
      const center = boundingBox.getCenter(new THREE.Vector3());

      const boxMaterial = new MeshBasicMaterial({
        color: 0xff0000,
        visible: this.debugging_,
        wireframe: this.debugging_,
      });
      const boxMesh = new Mesh(
        new BoxGeometry(size.x, size.y, size.z),
        boxMaterial
      );
      boxMesh.position.set(center.x, center.y, center.z);
      scene.add(boxMesh);

      octree.fromGraphNode(boxMesh);

      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    });
  }
}
