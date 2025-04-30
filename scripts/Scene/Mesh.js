import * as THREE from "https://cdn.skypack.dev/three@0.136";

const createMesh = (geometry, position, material) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position); // Use copy, not set
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene_.add(mesh); // Add to scene
  octree_.fromGraphNode(mesh); // Add to octree
};