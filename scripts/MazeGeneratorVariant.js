import * as THREE from "https://cdn.skypack.dev/three@0.136";
import { max } from "three/tsl";

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
    this.tiles[0][0].distance_to_start = 0;
    this.tiles[0][0].hall_id = 0;
    this.tiles[0][0].visited = true;
  }

  generateMaze() {
    return new Promise((resolve) => {
      console.log("Generating maze...");
      let hall_id = 1;
      let max_distance = 0;
      let max_distance_tile = this.tiles[0][0];
      let max_hall_id = 0;

      while (this.stack.length > 0) {
        //Get first tile from the stack and check if it has any unvisited neighbors
        let current = this.stack.pop();
        let unvisitedNeighbors = this.getUnvisitedNeighbors(current);

        //If it has unvisited neighbors, pick one at random, remove the wall between them, and add it to the stack
        if (unvisitedNeighbors.length > 0) {
          let next =
            unvisitedNeighbors[
              Math.floor(Math.random() * unvisitedNeighbors.length)
            ];

          this.removeWall(current, next);
          next.hall_id = hall_id;
          next.distance_to_start = current.distance_to_start + 1;
          next.visited = true;

          if (next.distance_to_start > max_distance) {
            max_distance = next.distance_to_start;
            max_distance_tile = next;
          }

          if (unvisitedNeighbors.length > 1) {
            this.stack.push(current);
          } else {
            hall_id++;
          }
          if (hall_id > max_hall_id) {
            max_hall_id = hall_id;
          }
          this.stack.push(next);
        }
      }

      max_distance_tile.end = true;

      //Remove walls between hallways to create loops, by using the hall_id property. The smaller the difference between hall_id, the closer the hallways are towards each other
      //We can use the amound of difference to control how big the "shortcuts" may be.
      for (let i = 0; i < this.width; i++) {
        for (let j = 0; j < this.depth; j++) {
          let tile = this.tiles[i][j];
          if (tile.has_shortcut) continue;
          let neighbors = this.getNeighbors(tile);
          for (let neighbor of neighbors) {
            if (
              !neighbor.has_shortcut &&
              Math.abs(tile.hall_id - neighbor.hall_id) > 6 &&
              Math.abs(tile.hall_id - neighbor.hall_id) < max_hall_id / 5
            ) {
              if (Math.random() > 0.5) {
                tile.has_shortcut = true;
                neighbor.has_shortcut = true;
                this.removeWall(tile, neighbor);
              }
            }
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
        row += "|";
        // row += t.distance_to_start.toString().padStart(3, " ");
        if (t.has_shortcut) {
          // Add red and bold formatting using ANSI escape codes
          row += `\x1b[1m\x1b[31m${t.hall_id
            .toString()
            .padStart(3, " ")}\x1b[0m`;
        } else {
          row += t.hall_id.toString().padStart(3, " ");
        }
      }
      console.log(row);
    }
  }

  getNeighbors(tile) {
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
        neigbors.push(neighbor);
      }
    }
    return neigbors;
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
    //Properties used for generation
    this.visited = false;
    this.hall_id = -1; //Hallway ID
    this.distance_to_start = -1; //Distance from this tile to the start tile
    this.x = x;
    this.y = y;
    this.has_shortcut = false;

    //Properties used for rendering
    this.N = true;
    this.S = true;
    this.E = true;
    this.W = true;
    this.end = false; //True for the end tile
    this.start = false; //True for the start tile
  }
}
