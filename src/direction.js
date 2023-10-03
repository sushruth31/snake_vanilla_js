const UP = Object.freeze({ row: -1, col: 0 });
const DOWN = Object.freeze({ row: 1, col: 0 });
const LEFT = Object.freeze({ row: 0, col: -1 });
const RIGHT = Object.freeze({ row: 0, col: 1 });

export const Direction = Object.freeze({ UP, DOWN, LEFT, RIGHT });

const OPPOSITES = new Map([
  [UP, DOWN],
  [DOWN, UP],
  [LEFT, RIGHT],
  [RIGHT, LEFT],
]);

export const isOpposite = (one, other) => OPPOSITES.get(one) === other;

export const DIRECTION_BY_KEY = Object.freeze({
  ArrowUp: UP,
  ArrowDown: DOWN,
  ArrowLeft: LEFT,
  ArrowRight: RIGHT,
  w: UP,
  s: DOWN,
  a: LEFT,
  d: RIGHT,
});
