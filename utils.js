// direction fns
export const moveRight = ([row, col]) => [row, col + 1];
export const moveLeft = ([row, col]) => [row, col - 1];
export const moveUp = ([row, col]) => [row - 1, col];
export const moveDown = ([row, col]) => [row + 1, col];

export function toId(...args) {
  return args.join("-");
}

export function fromId(id) {
  return id.split("-").map((i) => parseInt(i));
}

export function isOpposite(dir1, dir2) {
  if (dir1 === moveRight && dir2 === moveLeft) {
    return true;
  }
  if (dir1 === moveLeft && dir2 === moveRight) {
    return true;
  }
  if (dir1 === moveUp && dir2 === moveDown) {
    return true;
  }
  if (dir1 === moveDown && dir2 === moveUp) {
    return true;
  }
  if (dir1 === dir2) {
    return true;
  }
  return false;
}
