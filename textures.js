/**
 * Textures mapped to source files
 * Acquired from:
 * - https://ambientcg.com/
 */

import { metalness, normalMap, roughness } from "three/tsl";

const BASE_PATH = "/resources/textures";

/**
 * STONES
 */
export const TILES_CERAMIC_WHITE = {
  baseColor: `${BASE_PATH}/TilesCeramicWhite/2K/TilesCeramicWhite_BaseColor.jpg"`,
  normalMap: `${BASE_PATH}/TilesCeramicWhite/2K/TilesCeramicWhite_Normal.png`,
  displacementMap: `${BASE_PATH}/TilesCeramicWhite/2K/TilesCeramicWhite_Displacement.png`,
  roughnessMap: `${BASE_PATH}/TilesCeramicWhite/2K/TilesCeramicWhite_Roughness.jpg`,
};

export const SLATE_FLOOR_TILE = {
  baseColor: `${BASE_PATH}/SlateFloorTile/2K/SlateFloorTile_BaseColor.jpg`,
  normalMap: `${BASE_PATH}/SlateFloorTile/2K/SlateFloorTile_Normal.png`,
  displacementMap: `${BASE_PATH}/SlateFloorTile/2K/SlateFloorTile_Displacement.png`,
  roughnessMap: `${BASE_PATH}/SlateFloorTile/2K/SlateFloorTile_Roughness.jpg`,
};

export const STONE_PATH = {
  baseColor: `${BASE_PATH}/StonePath/Stone_Path_007_basecolor.jpg`,
  normalMap: `${BASE_PATH}/StonePath/Stone_Path_007_normal.jpg`,
  displacementMap: `${BASE_PATH}/StonePath/Stone_Path_007_height.png`,
  roughnessMap: `${BASE_PATH}/StonePath/Stone_Path_007_roughness.jpg`,
  ambientOcclusionMap: `${BASE_PATH}/StonePath/Stone_Path_007_ambientOcclusion.jpg`,
};

export const STONE_WALL = {
  baseColor: `${BASE_PATH}/StoneWall/Wall_Stone_022_basecolor.jpg`,
  normalMap: `${BASE_PATH}/StoneWall/Wall_Stone_022_normal.jpg`,
  displacementMap: `${BASE_PATH}/StoneWall/Wall_Stone_022_height.png`,
  roughnessMap: `${BASE_PATH}/StoneWall/Wall_Stone_022_roughness.jpg`,
  ambientOcclusionMap: `${BASE_PATH}/StoneWall/Wall_Stone_022_ambientOcclusion.jpg`,
};

export const STYLIZED_STONE_WALL = {
  baseColor: `${BASE_PATH}/StylizedStoneWall/Stylized_Stone_Wall_001_basecolor.jpg`,
  normalMap: `${BASE_PATH}/StylizedStoneWall/Stylized_Stone_Wall_001_normal.jpg`,
  displacementMap: `${BASE_PATH}/StylizedStoneWall/Stylized_Stone_Wall_001_height.png`,
  roughnessMap: `${BASE_PATH}/StylizedStoneWall/Stylized_Stone_Wall_001_roughness.jpg`,
  ambientOcclusionMap: `${BASE_PATH}/StylizedStoneWall/Stylized_Stone_Wall_001_ambientOcclusion.jpg`,
};

export const QUAKE = {
  wallTiles: `${BASE_PATH}/Quake/wall_tiles.jpg`,
};

export const TILES_MARBLE_BLACK = {
  baseColor: `${BASE_PATH}/TilesMarbleBlack/Tiles075_2K-PNG_Color.png`,
  normalMap: `${BASE_PATH}/TilesMarbleBlack/Tiles075_2K-PNG_NormalGL.png`,
  displacementMap: `${BASE_PATH}/TilesMarbleBlack/Tiles075_2K-PNG_Displacement.png`,
  roughnessMap: `${BASE_PATH}/TilesMarbleBlack/Tiles075_2K-PNG_Roughness.png`,
};

export const MOSSY_BRICKS = {
  baseColor: `${BASE_PATH}/MossyBricks/Bricks075B_1K-PNG_Color.png`,
  normalMap: `${BASE_PATH}/MossyBricks/Bricks075B_1K-PNG_NormalGL.png`,
  displacementMap: `${BASE_PATH}/MossyBricks/Bricks075B_1K-PNG_Displacement.png`,
  roughnessMap: `${BASE_PATH}/MossyBricks/Bricks075B_1K-PNG_Roughness.png`,
  ambientOcclusionMap: `${BASE_PATH}/MossyBricks/Bricks075B_1K-PNG_AmbientOcclusion.png`,
};
/**
 * METALS
 */
export const METAL_PLATES = {
  baseColor: `${BASE_PATH}/MetalPlates/MetalPlates010_1K-PNG_Color.png`,
  normalMap: `${BASE_PATH}/MetalPlates/MetalPlates010_1K-PNG_NormalGL.png`,
  displacementMap: `${BASE_PATH}/MetalPlates/MetalPlates010_1K-PNG_Displacement.png`,
  roughnessMap: `${BASE_PATH}/MetalPlates/MetalPlates010_1K-PNG_Roughness.png`,
  ambientOcclusionMap: `${BASE_PATH}/MetalPlates/MetalPlates010_1K-PNG_AmbientOcclusion.png`,
};

export const METAL_WALKWAY = {
  baseColor: `${BASE_PATH}/MetalWalkway/MetalWalkway005_2K-PNG_Color.png`,
  normalMap: `${BASE_PATH}/MetalWalkway/MetalWalkway005_2K-PNG_NormalGL.png`,
  displacementMap: `${BASE_PATH}/MetalWalkway/MetalWalkway005_2K-PNG_Displacement.png`,
  roughnessMap: `${BASE_PATH}/MetalWalkway/MetalWalkway005_2K-PNG_Roughness.png`,
  ambientOcclusionMap: `${BASE_PATH}/MetalWalkway/MetalWalkway005_2K-PNG_AmbientOcclusion.png`,
};

export const CONCRETE_METAL = {
  baseColor: `${BASE_PATH}/ConcreteMetal/Concrete041C_1K-PNG_Color.png`,
  normalMap: `${BASE_PATH}/ConcreteMetal/Concrete041C_1K-PNG_NormalGL.png`,
  displacementMap: `${BASE_PATH}/ConcreteMetal/Concrete041C_1K-PNG_Displacement.png`,
  roughnessMap: `${BASE_PATH}/ConcreteMetal/Concrete041C_1K-PNG_Roughness.png`,
  ambientOcclusionMap: `${BASE_PATH}/ConcreteMetal/Concrete041C_1K-PNG_AmbientOcclusion.png`,
  metalness: `${BASE_PATH}/ConcreteMetal/Concrete041C_1K-PNG_Metallness.png`,
};

export const METAL_PLATES_GLOSSY = {
  baseColor: `${BASE_PATH}/MetalPlates006_1K-JPG_Color.jpg`,
  normalMap: `${BASE_PATH}/MetalPlates006_1K-JPG_NormalGL.jpg`,
  displacementMap: `${BASE_PATH}/MetalPlates006_1K-JPG_Displacement.jpg`,
  roughnessMap: `${BASE_PATH}/MetalPlates006_1K-JPG_Roughness.jpg`,
};

/**
 * ELEMENTS
 */
export const LAVA_TEXTURE = {
  baseColor: `${BASE_PATH}/Lava/Lava004_1K-PNG_Color.png`,
  normalMap: `${BASE_PATH}/Lava/Lava004_1K-PNG_NormalGL.png`,
  displacementMap: `${BASE_PATH}/Lava/Lava004_1K-PNG_Displacement.png`,
  roughnessMap: `${BASE_PATH}/Lava/Lava004_1K-PNG_Roughness.png`,
  emissionMap: `${BASE_PATH}/Lava/Lava004_1K-PNG_Emission.png`,
};
/**
 *  emissive: 0xff4500,
    emissiveMap: emissionMap,
    emissiveIntensity: 2,
 */

export const ICE_TEXTURE = {
  baseColor: `${BASE_PATH}/Ice/Ice002_1K-JPG_Color.jpg`,
  normalMap: `${BASE_PATH}/Ice/Ice002_1K-JPG_NormalGL.jpg`,
  displacementMap: `${BASE_PATH}/Ice/Ice002_1K-JPG_Displacement.jpg`,
  roughnessMap: `${BASE_PATH}/Ice/Ice002_1K-JPG_Roughness.jpg`,
  color2: `${BASE_PATH}/Ice/Ice003_1K-JPG_Color.jpg`,
};
