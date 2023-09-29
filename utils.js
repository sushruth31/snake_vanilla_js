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

export function getTail(snake) {
  return [...snake][0];
}

export function getHead(snake) {
  return [...snake][snake.size - 1];
}
