import * as THREE from "https://cdn.skypack.dev/three@0.136";

export class MazeGenerator {
  constructor(width, depth) {
    this.tiles_by_hall = {};
    this.tiles = [];
    let counter = 0;
    for (let i = 0; i < width; i++) {
      this.tiles[i] = [];
      for (let j = 0; j < depth; j++) {
        let tile = new MazeTile(i, j, counter);
        this.tiles[i][j] = tile;
        this.tiles_by_hall[counter] = [tile];
        counter++;
      }
    }

    this.walls = [];
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < depth; j++) {
        if (i != 0) {
          this.walls.push(
            new MazeWall(this.tiles[i - 1][j], this.tiles[i][j], "V")
          );
        }
        if (j != 0) {
          this.walls.push(
            new MazeWall(this.tiles[i][j - 1], this.tiles[i][j], "H")
          );
        }
      }
    }
  }

  /**
   * Iterative randomized Kruskal's algorithm
   * @returns
   */
  generateMaze() {
    return new Promise((resolve) => {
      console.log("Generating maze...");

      let shuffledWalls = this.walls.sort(() => Math.random() - 0.1);
      shuffledWalls = this.walls.sort(() => Math.random() - 0.5);

      while (shuffledWalls.length > 0) {
        let wall = shuffledWalls.pop();
        if (wall.tile_side1.hall != wall.tile_side2.hall) {
          let side1 = this.tiles_by_hall[wall.tile_side1.hall];
          let side2 = this.tiles_by_hall[wall.tile_side2.hall];
          this.tiles_by_hall[wall.tile_side2.hall] = [];
          for (let tile of side2) {
            tile.hall = wall.tile_side1.hall;
          }
          side1.push(...side2);
          this.tiles_by_hall[wall.tile_side1.hall] = side1;

          if (wall.orientation == "V") {
            wall.tile_side1.E = false;
            wall.tile_side2.W = false;
          } else {
            wall.tile_side1.S = false;
            wall.tile_side2.N = false;
          }
        }
      }

      this.printMaze();
      resolve();
    });
  }

  printMaze() {
    for (let i = 0; i < this.tiles.length; i++) {
      let row = "";
      for (let j = 0; j < this.tiles[i].length; j++) {
        let t = this.tiles[i][j];
        t.W ? (row += "|") : (row += " ");
        t.N && t.S ? (row += "=") : t.N || t.S ? (row += "-") : (row += " ");
        t.E ? (row += "|") : (row += " ");
      }
      console.log(row);
    }
  }
}

export class MazeWall {
  constructor(tile_side1, tile_side2, orientation) {
    this.tile_side1 = tile_side1;
    this.tile_side2 = tile_side2;
    this.orientation = orientation;
  }
}

export class MazeTile {
  constructor(x, y, hall) {
    this.hall = hall; //Used for maze generation
    this.position = new THREE.Vector3(x, 0, y);
    this.N = true;
    this.E = true;
    this.S = true;
    this.W = true;
  }
}
