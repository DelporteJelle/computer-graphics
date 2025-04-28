export default class Room {
  constructor(position, { N, E, S, W, start, end }) {
    this.pos = position;
    this.attributes = { N, E, S, W, start, end };

    this.meshes = null;
  }


}