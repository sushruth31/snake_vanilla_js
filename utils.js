export function toId(...args) {
  return args.join("-");
}

export function fromId(id) {
  return id.split("-").map((i) => parseInt(i));
}

export class Direction {
  static moveRight([row, col]) {
    return [row, col + 1];
  }

  static moveLeft([row, col]) {
    return [row, col - 1];
  }

  static moveUp([row, col]) {
    return [row - 1, col];
  }

  static moveDown([row, col]) {
    return [row + 1, col];
  }

  static isOpposite(dir1, dir2) {
    if (dir1 === this.moveRight && dir2 === this.moveLeft) {
      return true;
    }
    if (dir1 === this.moveLeft && dir2 === this.moveRight) {
      return true;
    }
    if (dir1 === this.moveUp && dir2 === this.moveDown) {
      return true;
    }
    if (dir1 === this.moveDown && dir2 === this.moveUp) {
      return true;
    }
    if (dir1 === dir2) {
      return true;
    }
    return false;
  }
}
