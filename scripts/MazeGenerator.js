import * as THREE from "https://cdn.skypack.dev/three@0.136";

export default class MazeGenerator {
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

    // this.start_tile = this.tiles[Math.floor(width / 2)][Math.floor(depth / 2)];
    this.start_tile = this.tiles[0][0];
    this.stack.push(this.start_tile);
    this.start_tile.start = true;
    this.start_tile.distance_to_start = 0;
    this.start_tile.hall_id = 0;
    this.start_tile.visited = true;
  }

  /**
   * Randomized depth-first search (https://en.wikipedia.org/wiki/Maze_generation_algorithm)
   *
   * This algo crreates a maze by going depth first through the tree by visiting all unvisited neighbors of the tiles on the stack
   * For example, we start with one tile and visit a random neighbor, we then push this one on the stack and repeat until there
   * are no more unvisited tiles.
   * This creates a maze with long hallways.
   *
   * By randomly going breadth first instead of depth first, we can create more but shorter hallways.
   *
   */
  generateMaze() {
    return new Promise((resolve) => {
      console.log("Generating maze...");
      let hall_id = 1;
      let max_distance = 0;
      let max_distance_tile = this.start_tile;
      let max_hall_id = 0;

      while (this.stack.length > 0) {
        //Get first tile from the stack and check if it has any unvisited neighbors
        let current = this.stack.pop();
        let unvisited_neighbours = this.getUnvisitedNeighbors(current);

        //If it has unvisited neighbors, pick one at random, remove the wall between them, and add it to the stack
        if (unvisited_neighbours.length > 0) {
          let next =
            unvisited_neighbours[
              Math.floor(Math.random() * unvisited_neighbours.length)
            ];

          this.removeWall(current, next);
          next.hall_id = hall_id;
          next.distance_to_start = current.distance_to_start + 1;
          next.visited = true;

          if (next.distance_to_start > max_distance) {
            max_distance = next.distance_to_start;
            max_distance_tile = next;
          }

          //Random chance to go breadth first instead of depth first (to create more but shorter hallways)
          if (Math.random() > 0.7) {
            this.stack.push(next); // Push next 1st
            if (unvisited_neighbours.length > 1)
              this.stack.push(current); // Push current 2nd
            else hall_id++;
          } else {
            if (unvisited_neighbours.length > 1)
              this.stack.push(current); // Push current 1st
            else hall_id++;
            this.stack.push(next); // Push next 2nd
          }

          if (hall_id > max_hall_id) max_hall_id = hall_id;
        }
      }

      max_distance_tile.end = true;
      max_distance_tile.playerDest = true;

      //Remove walls between hallways to create loops, by using the hall_id property. The smaller the difference between hall_id, the closer the hallways are towards each other
      //We can use the amound of difference to control how big the "shortcuts" may be.
      let chance = 0.2;
      for (let i = 0; i < this.width; i++) {
        for (let j = 0; j < this.depth; j++) {
          let tile = this.tiles[i][j];
          if (tile.has_shortcut || tile.start || tile.end) continue;
          let neighbors = this.getNeighbors(tile);
          for (let neighbor of neighbors) {
            if (
              !neighbor.has_shortcut &&
              !neighbor.start &&
              !neighbor.end &&
              Math.abs(tile.hall_id - neighbor.hall_id) > 6 &&
              Math.abs(tile.hall_id - neighbor.hall_id) < max_hall_id / 5
            ) {
              if (Math.random() < chance) {
                tile.has_shortcut = true;
                neighbor.has_shortcut = true;
                this.removeWall(tile, neighbor);
                chance += 0.05;
              }
              chance == 0.2;
            }
          }
        }
      }
      console.log("Finished generating maze!");
      resolve();
    });
  }

  /**
   * Draws maze on the minimap
   * @param {*} scene_
   */
  drawMaze(scene_) {
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

    const mazeGroup = new THREE.Group();

    for (let i = 0; i < this.tiles.length; i++) {
      for (let j = 0; j < this.tiles[i].length; j++) {
        const tile = this.tiles[i][j];

        if (tile.start) {
          const geometry = new THREE.BoxGeometry(0.7, 0, 0.7);
          const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
          const startTileMesh = new THREE.Mesh(geometry, material);
          startTileMesh.position.set(i, 0.05, j);
          mazeGroup.add(startTileMesh);
        }

        if (tile.end) {
          const geometry = new THREE.BoxGeometry(0.7, 0, 0.7);
          const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
          const startTileMesh = new THREE.Mesh(geometry, material);
          startTileMesh.position.set(i, 0.05, j);
          mazeGroup.add(startTileMesh);
        }

        if (tile.N) {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(i - 0.5, 0, j - 0.5),
            new THREE.Vector3(i + 0.5, 0, j - 0.5),
          ]);
          mazeGroup.add(new THREE.Line(geometry, lineMaterial));
        }
        if (tile.E) {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(i + 0.5, 0, j - 0.5),
            new THREE.Vector3(i + 0.5, 0, j + 0.5),
          ]);
          mazeGroup.add(new THREE.Line(geometry, lineMaterial));
        }
        if (tile.S) {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(i - 0.5, 0, j + 0.5),
            new THREE.Vector3(i + 0.5, 0, j + 0.5),
          ]);
          mazeGroup.add(new THREE.Line(geometry, lineMaterial));
        }
        if (tile.W) {
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(i - 0.5, 0, j - 0.5),
            new THREE.Vector3(i - 0.5, 0, j + 0.5),
          ]);
          mazeGroup.add(new THREE.Line(geometry, lineMaterial));
        }
        if (tile.pathToDest) {
          const geometry = new THREE.CircleGeometry(0.1, 16);
          const material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
          const pathTileMesh = new THREE.Mesh(geometry, material);
          pathTileMesh.rotation.x = -Math.PI / 2;
          pathTileMesh.position.set(i, 0.05, j);
          mazeGroup.add(pathTileMesh);
        }
      }
    }

    scene_.add(mazeGroup);
  }

  /**
   * Finds the shortest path between two tiles using breadth-first search
   * @param {Tile} src The player tile
   * @param {Tile} dest The destination tile for the path
   */
  shortestPath(scene, src_x, src_y) {
    console.log("Finding shortest path to tile...");
    this.shortestPathIterative(this.tiles[src_x][src_y]);

    this.drawMaze(scene);
  }

  shortestPathIterative(src) {
    let queue = [src];
    let visited = new Set();
    let parentMap = new Map();
    visited.add(src);

    while (queue.length > 0) {
      let current = queue.shift();

      if (current.playerDest) {
        let pathTile = current;
        while (pathTile) {
          pathTile.pathToDest = true;
          pathTile = parentMap.get(pathTile);
        }
        break;
      }

      let neighbours = this.getPossibleNeighbours(current);
      for (let neighbour of neighbours) {
        if (!visited.has(neighbour)) {
          visited.add(neighbour);
          parentMap.set(neighbour, current);
          queue.push(neighbour);
        }
      }
    }
  }
  /**
   * Gets all neighbours from a tile
   * @param {Tile} tile
   * @returns list of tiles
   */
  getNeighbors(tile) {
    let neighbours = [
      { x: tile.x, y: tile.y - 1 },
      { x: tile.x, y: tile.y + 1 },
      { x: tile.x - 1, y: tile.y },
      { x: tile.x + 1, y: tile.y },
    ]
      .filter(
        (
          loc // Filter out-of-bounds
        ) =>
          loc.x >= 0 && loc.x < this.width && loc.y >= 0 && loc.y < this.depth
      )
      .map((loc) => this.tiles[loc.x][loc.y]); // Map to tile
    return neighbours;
  }

  /**
   * Get all the neighbours of a tile that are possible to move to
   * @param {Tile} tile
   */
  getPossibleNeighbours(tile) {
    let neighbours = this.getNeighbors(tile).filter(
      (neighbour) =>
        (neighbour.x > tile.x && !tile.E) ||
        (neighbour.x < tile.x && !tile.W) ||
        (neighbour.y > tile.y && !tile.S) ||
        (neighbour.y < tile.y && !tile.N)
    );
    return neighbours;
  }

  /**
   * Removes walls between tiles
   * @param {Tile} tile1
   * @param {Tile} tile2
   */
  removeWall(tile1, tile2) {
    let x = tile1.x - tile2.x;
    if (x === 1) tile1.W = tile2.E = false;
    else if (x === -1) tile1.E = tile2.W = false;

    let y = tile1.y - tile2.y;
    if (y === 1) tile1.N = tile2.S = false;
    else if (y === -1) tile1.S = tile2.N = false;
  }

  /**
   * Gets all unvisited neighbours of a tile
   * @param {Tile} tile
   * @returns list of tiles
   */
  getUnvisitedNeighbors(tile) {
    let neighbours = this.getNeighbors(tile).filter(
      // Get all neighbours
      (neighbour) => !neighbour.visited // Filter unvisited
    );
    return neighbours;
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
    this.playerLoc = false; //True if player is standing on this tile
    this.playerDest = false; //True if the player has set a destination on this tile
    this.pathToDest = false; //All tiles that are part of the path to the destination tile
  }
}
