import * as THREE from "https://cdn.skypack.dev/three@0.136";

export class MazeGeneratorVariant {
  constructor(width, depth) {
    this.width = width;
    this.depth = depth;
    this.tiles = [];
    this.stack = [];

    for (let i = 0; i < width; i++) {
      this.tiles[i] = [];
      for (let j = 0; j < depth; j++) {
        let tile = new Tile(i, j);
        this.tiles[i][j] = tile;
      }
    }
    this.stack.push(this.tiles[0][0]);
    this.tiles[0][0].start = true;
  }

  generateMaze() {
    return new Promise((resolve) => {
      console.log("Generating maze...");
      while (this.stack.length > 0) {
        let current = this.stack.pop();
        let unvisitedNeighbors = this.getUnvisitedNeighbors(current);
        if (unvisitedNeighbors.length > 0) {
          let next =
            unvisitedNeighbors[
              Math.floor(Math.random() * unvisitedNeighbors.length)
            ];

          this.removeWall(current, next);

          next.visited = true;
          if (unvisitedNeighbors.length > 1) {
            this.stack.push(current);
          }
          this.stack.push(next);
        }
      }

      //Open up a random wall in each column and row to make the maze more open
      //TODO

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
    }
  }

  removeWall(tile1, tile2) {
    let x = tile1.x - tile2.x;
    if (x === 1) {
      tile1.W = false;
      tile2.E = false;
    } else if (x === -1) {
      tile1.E = false;
      tile2.W = false;
    }

    let y = tile1.y - tile2.y;
    if (y === 1) {
      tile1.N = false;
      tile2.S = false;
    } else if (y === -1) {
      tile1.S = false;
      tile2.N = false;
    }
  }

  getUnvisitedNeighbors(tile) {
    let locs = [
      { x: tile.x, y: tile.y - 1 },
      { x: tile.x, y: tile.y + 1 },
      { x: tile.x - 1, y: tile.y },
      { x: tile.x + 1, y: tile.y },
    ];
    let neigbors = [];
    for (let loc of locs) {
      if (
        loc.x >= 0 &&
        loc.x < this.width &&
        loc.y >= 0 &&
        loc.y < this.depth
      ) {
        let neighbor = this.tiles[loc.x][loc.y];
        if (!neighbor.visited) {
          neigbors.push(neighbor);
        }
      }
    }
    return neigbors;
  }
}

export class Tile {
  constructor(x, y) {
    this.visited = false;
    this.x = x;
    this.y = y;
    this.N = true;
    this.S = true;
    this.E = true;
    this.W = true;
    this.end = false;
    this.start = false;
  }
}
