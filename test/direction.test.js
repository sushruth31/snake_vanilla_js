import test from "node:test";
import assert from "node:assert/strict";

import { DIRECTION_BY_KEY, Direction, isOpposite } from "../src/direction.js";

const { UP, DOWN, LEFT, RIGHT } = Direction;

test("each direction is a unit step on exactly one axis", () => {
  assert.deepEqual(UP, { row: -1, col: 0 });
  assert.deepEqual(DOWN, { row: 1, col: 0 });
  assert.deepEqual(LEFT, { row: 0, col: -1 });
  assert.deepEqual(RIGHT, { row: 0, col: 1 });
});

test("directions are frozen singletons, so identity comparison is safe", () => {
  assert.ok(Object.isFrozen(UP));
  assert.equal(DIRECTION_BY_KEY.ArrowUp, UP);
  assert.equal(DIRECTION_BY_KEY.w, UP);
});

test("isOpposite holds for the two reversal pairs in both orders", () => {
  assert.ok(isOpposite(UP, DOWN));
  assert.ok(isOpposite(DOWN, UP));
  assert.ok(isOpposite(LEFT, RIGHT));
  assert.ok(isOpposite(RIGHT, LEFT));
});

test("perpendicular turns are not opposites", () => {
  assert.equal(isOpposite(UP, LEFT), false);
  assert.equal(isOpposite(RIGHT, DOWN), false);
});

test("a direction is not its own opposite", () => {
  assert.equal(isOpposite(UP, UP), false);
});

test("unmapped keys resolve to undefined rather than a default heading", () => {
  assert.equal(DIRECTION_BY_KEY.Enter, undefined);
  assert.equal(DIRECTION_BY_KEY[" "], undefined);
});
