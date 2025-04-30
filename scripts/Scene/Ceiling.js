import * as THREE from "https://cdn.skypack.dev/three@0.136";
import * as Config from "../../config";
import { SLATE_FLOOR_TILE, METAL_WALKWAY } from "../../textures";

export default function createCeiling(scene_, octree_, { width, depth, height })  {
  const textureLoader = new THREE.TextureLoader();
  const texture = METAL_WALKWAY;

  const ceilingTexture = textureLoader.load(texture.baseColor, (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width, depth);
  });
  const normalMap = textureLoader.load(texture.normalMap, (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width, depth);
  });
  const displacementMap = textureLoader.load(
    texture.displacementMap,
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(width, depth);
  });
  const roughnessMap = textureLoader.load(texture.roughnessMap, (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width, depth);
  });
  const ambientOcclusionMap = textureLoader.load(
    texture.ambienOcclusionMap,
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(width, depth);
    }
  );

  const total_width = width * Config.ROOM_SIZE;
  const total_depth = depth * Config.ROOM_SIZE;
  const position = new THREE.Vector3(
    total_width / 2 - Config.ROOM_SIZE / 2,
    height,
    total_depth / 2 - Config.ROOM_SIZE / 2
  );

  /**
   * SCENE
   */
  const visualCeilingGeometry = new THREE.PlaneGeometry(
    total_width,
    total_depth,
    total_width * 5,
    total_depth * 5
  );
  const visualCeilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x666666,
    map: ceilingTexture,
    normalMap: normalMap,
    normalScale: new THREE.Vector2(1, -1),
    displacementMap: displacementMap,
    displacementScale: 0.7,
    roughnessMap: roughnessMap,
    roughness: 0.5,
    aoMap: ambientOcclusionMap,
    aoMapIntensity: 1,
  });

  const visualCeiling = new THREE.Mesh(
    visualCeilingGeometry, 
    visualCeilingMaterial
  );

  visualCeiling.receiveShadow = true;
  visualCeiling.rotation.x = Math.PI / 2;
  visualCeiling.position.set(position.x, position.y, position.z);

  // Add visual plane to the scene (not the octree)
  scene_.add(visualCeiling);

  /**
   * OCTREE
   */
  const collisionCeilingGeometry = new THREE.PlaneGeometry(
    total_width,
    total_depth,
    1, 1
  );

  const collisionCeilingMaterial = new THREE.MeshBasicMaterial({
    visible: false,
  }); 
  
  // Invisible collision plane
  const collisionCeiling = new THREE.Mesh(
    collisionCeilingGeometry,
    collisionCeilingMaterial
  );


  collisionCeiling.rotation.x = -Math.PI / 2;
  collisionCeiling.position.set(position.x, position.y, position.z);

  // Add collision plane to the octree
  octree_.fromGraphNode(collisionCeiling);
}