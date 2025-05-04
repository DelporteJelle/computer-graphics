import * as THREE from "https://cdn.skypack.dev/three@0.136";
import * as RR from "../RoomResources"
import { ROOM_SIZE, ROOM_HEIGHT } from "../../../config"

// Positions
const POS_1_OFFSET = {
  x: ROOM_SIZE * 0.25,
  z: ROOM_SIZE * 0.25
}
const POS_2_OFFSET = {
  x: -ROOM_SIZE * 0.25,
  z: ROOM_SIZE * 0.25
}
const POS_3_OFFSET = {
  x: ROOM_SIZE * 0.25,
  z: -ROOM_SIZE * 0.25
}
const POS_4_OFFSET = {
  x: -ROOM_SIZE * 0.25,
  z: -ROOM_SIZE * 0.25
}
const POS_5_OFFSET = {
  x: 0,
  z: 0
}

const OFFSETS = [POS_1_OFFSET, POS_2_OFFSET, POS_3_OFFSET, POS_4_OFFSET, POS_5_OFFSET]

export default function loadParkourPreset1(
  position,
) {
  const meshes = {
    visual: [],
    collision: []
  };

  OFFSETS.forEach((offset) => {
    // 50% chance to add a mesh
    if (Math.random() < 0.25) return;

    const meshPosition = new THREE.Vector3(
      position.x + offset.x,
      -1,
      position.z + offset.z
    );
    const visualMesh = new THREE.Mesh(
      RR.ROUND_PLATFORM,
      RR.FLOOR_MATERIAL_END
    );
    visualMesh.position.copy(meshPosition);
    visualMesh.receiveShadow = true;

    const collisionMesh = new THREE.Mesh(
      RR.ROUND_PLATFORM,
      RR.INVISIBLE_MATERIAL
    );
    collisionMesh.position.copy(meshPosition)

    meshes.visual.push(visualMesh);
    meshes.collision.push(collisionMesh)

  })

  return meshes;
}

/**
 * @TODO
 * Random mesh
 * - Cilinder
 * - Beam
 * - Platform
 */
function getRandomMesh() {

}