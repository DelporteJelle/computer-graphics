import { roughness } from "three/tsl";
import { normalMap } from "three/tsl";

const BASE_PATH = "/resources/textures";

/**
 * Textures mapped to source files
 */
export const TILES_CERAMIC_WHITE = {
  baseColor: `${BASE_PATH}/TilesCeramicWhite/2K/TilesCeramicWhite_BaseColor.jpg"`,
  normalMap: `${BASE_PATH}/TilesCeramicWhite/2K/TilesCeramicWhite_Normal.png`,
  displacementMap: `${BASE_PATH}/TilesCeramicWhite/2K/TilesCeramicWhite_Displacement.png`,
  roughnessMap: `${BASE_PATH}/TilesCeramicWhite/2K/TilesCeramicWhite_Roughness.jpg`,
};

export const ICE_TEXTURE = {
  baseColor: `${BASE_PATH}/Ice/Ice002_1K-JPG_Color.jpg`,
  normalMap: `${BASE_PATH}/Ice/Ice002_1K-JPG_NormalGL.jpg`,
  displacementMap: `${BASE_PATH}/Ice/Ice002_1K-JPG_Displacement.jpg`,
  roughnessMap: `${BASE_PATH}/Ice/Ice002_1K-JPG_Roughness.jpg`,
  color2: `${BASE_PATH}/Ice/Ice003_1K-JPG_Color.jpg`,
};

export const SLATE_FLOOR_TILE = {
  baseColor: `${BASE_PATH}/SlateFloorTile/2K/SlateFloorTile_BaseColor.jpg`,
  normalMap: `${BASE_PATH}/SlateFloorTile/2K/SlateFloorTile_Normal.png`,
  displacementMap: `${BASE_PATH}/SlateFloorTile/2K/SlateFloorTile_Displacement.png`,
  roughnessMap: `${BASE_PATH}/SlateFloorTile/2K/SlateFloorTile_Roughness.jpg`,
};

export const STONE_PATH = {
  baseColor: `/resources/textures/StonePath/Stone_Path_007_basecolor.jpg`,
  normalMap: `/resources/textures/StonePath/Stone_Path_007_normal.jpg`,
  displacementMap: `/resources/textures/StonePath/Stone_Path_007_height.png`,
  roughnessMap: `/resources/textures/StonePath/Stone_Path_007_roughness.jpg`,
  ambienOcclusionMap: `/resources/textures/StonePath/Stone_Path_007_ambientOcclusion.jpg`,
};

export const STONE_WALL = {
  baseColor: `${BASE_PATH}/wall_stone/Wall_Stone_022_basecolor.jpg`,
  normalMap: `${BASE_PATH}/wall_stone/Wall_Stone_022_normal.jpg`,
  displacementMap: `${BASE_PATH}/wall_stone/Wall_Stone_022_height.png`,
  roughnessMap: `${BASE_PATH}/wall_stone/Wall_Stone_022_roughness.jpg`,
  ambienOcclusionMap: `${BASE_PATH}/wall_stone/Wall_Stone_022_ambientOcclusion.jpg`,
};

export const STYLIZED_STONE_WALL = {
  baseColor: `${BASE_PATH}/stylized_stone_wall/Stylized_Stone_Wall_001_basecolor.jpg`,
  normalMap: `${BASE_PATH}/stylized_stone_wall/Stylized_Stone_Wall_001_normal.jpg`,
  displacementMap: `${BASE_PATH}/stylized_stone_wall/Stylized_Stone_Wall_001_height.png`,
  roughnessMap: `${BASE_PATH}/stylized_stone_wall/Stylized_Stone_Wall_001_roughness.jpg`,
  ambienOcclusionMap: `${BASE_PATH}/stylized_stone_wall/Stylized_Stone_Wall_001_ambientOcclusion.jpg`,
};

export const QUAKE = {
  wallTiles: `${BASE_PATH}/Quake/wall_tiles.jpg`,
};
