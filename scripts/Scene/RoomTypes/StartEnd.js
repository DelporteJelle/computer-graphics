import * as THREE from "three";
//import * as THREE from "https://cdn.skypack.dev/three@0.136";

const EXIT_LIFT = "glb/elevator.glb";
export default function loadStartEndPreset(
  sceneBuilder,
  position,
  sides,
) {
  const rotation = getRotation(sides);
  if (rotation)
    sceneBuilder.load_glb_object(
      EXIT_LIFT,
      position,
      {
        rotation: rotation,
        scale: new THREE.Vector3(0.015, 0.015, 0.015)
      }
    );
}

function getRotation(sides) {
  // N E S W
  const walls = sides
    .map((value, index) => value ? -1 : index)
    .filter(index => index !== -1);
  const index = walls[Math.floor(Math.random() * walls.length)];

  switch (index) {
    case 0: // N
      return new THREE.Euler(0, 0, 0, 'XYZ');
    case 1: // E
      return new THREE.Euler(0, -Math.PI / 2, 0, 'XYZ');
    case 2: // S
      return new THREE.Euler(0, Math.PI, 0, 'XYZ');
    case 3: // W
      return new THREE.Euler(0, Math.PI / 2, 0, 'XYZ');
    default:
      return null
  }
}