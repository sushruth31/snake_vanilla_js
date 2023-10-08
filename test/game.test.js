import test from "node:test";
import assert from "node:assert/strict";

import { Direction } from "../src/direction.js";
import { SnakeGame, Status } from "../src/game.js";

const { UP, DOWN, LEFT, RIGHT } = Direction;

// Deterministic food placement: lowest- and highest-indexed free cell.
const FOOD_FIRST = () => 0;
const FOOD_LAST = () => 0.999999;

const newGame = (options) => new SnakeGame({ random: FOOD_LAST, ...options });

/** Enqueues each turn (null keeps the heading) and steps once per entry. */
const play = (game, turns) =>
  turns.map((turn) => {
    if (turn !== null) game.enqueueTurn(turn);
    return game.step();
  });

test("opens as a horizontal snake on the top row with score zero", () => {
  const game = newGame({ rows: 5, cols: 5 });
  assert.deepEqual(game.snapshot().body, [0, 1, 2]);
  assert.equal(game.score, 0);
  assert.equal(game.status, Status.RUNNING);
});

test("advancing moves the head and vacates the tail, holding the length", () => {
  const game = newGame({ rows: 5, cols: 5 });
  const [change] = play(game, [null]);
  assert.deepEqual(
    { head: change.head, neck: change.neck, tail: change.tail },
    { head: 3, neck: 2, tail: 0 }
  );
  assert.deepEqual(game.snapshot().body, [1, 2, 3]);
  assert.equal(game.score, 0);
});

test("running into the right wall ends the game", () => {
  const game = newGame({ rows: 5, cols: 5 });
  const changes = play(game, [null, null, null]);
  assert.deepEqual(
    changes.map((change) => change.status),
    [Status.RUNNING, Status.RUNNING, Status.LOST]
  );
});

test("running into the bottom wall ends the game", () => {
  const game = newGame({ rows: 5, cols: 5 });
  const changes = play(game, [DOWN, null, null, null, null]);
  assert.equal(changes.at(-2).status, Status.RUNNING, "the last row is reachable");
  assert.equal(changes.at(-1).status, Status.LOST);
});

test("moving left from column zero hits a wall instead of wrapping to the previous row", () => {
  const game = newGame({ rows: 4, cols: 4, initialLength: 2 });
  play(game, [DOWN, LEFT]);
  assert.deepEqual(game.snapshot().body, [5, 4], "head sits in the left column");
  const [change] = play(game, [null]);
  assert.equal(change.status, Status.LOST);
  assert.deepEqual(game.snapshot().body, [5, 4], "cell 3 was never entered");
});

test("moving up from row zero hits a wall even though the index stays negative-free", () => {
  const game = newGame({ rows: 4, cols: 4, initialLength: 2 });
  const changes = play(game, [DOWN, RIGHT, UP, null]);
  assert.equal(changes.at(-1).status, Status.LOST);
});

test("the head may enter the cell the tail vacates on the same tick", () => {
  const game = newGame({ rows: 4, cols: 4, initialLength: 4 });
  const changes = play(game, [DOWN, LEFT, UP]);
  assert.equal(changes.at(-1).status, Status.RUNNING);
  assert.deepEqual(game.snapshot().body, [3, 7, 6, 2]);
});

test("the head may not enter a body cell that is not the vacating tail", () => {
  const game = newGame({ rows: 5, cols: 5, initialLength: 5 });
  const changes = play(game, [DOWN, LEFT, UP]);
  assert.equal(changes.at(-1).status, Status.LOST);
});

test("eating grows the snake, leaves the tail in place and raises the score", () => {
  const game = new SnakeGame({ rows: 5, cols: 5, random: FOOD_FIRST });
  const [change] = play(game, [null]);
  assert.equal(change.tail, null, "no cell is vacated on a growth tick");
  assert.equal(change.score, 1);
  assert.deepEqual(game.snapshot().body, [0, 1, 2, 3]);
  assert.equal(change.food, 4, "the next meal is drawn from the free pool");
});

test("filling the last free cell wins instead of stalling with nowhere to place food", () => {
  const game = newGame({ rows: 1, cols: 3, initialLength: 2 });
  const [change] = play(game, [null]);
  assert.equal(change.status, Status.WON);
  assert.equal(change.food, null);
  assert.equal(game.score, 1);
});

test("a reversal is rejected against the current heading and against a pending turn", () => {
  const game = newGame({ rows: 5, cols: 5 });
  assert.equal(game.enqueueTurn(LEFT), false, "cannot reverse into the neck");
  assert.equal(game.enqueueTurn(UP), true);
  assert.equal(game.enqueueTurn(DOWN), false, "cannot reverse a queued turn");
});

test("repeating the current heading is rejected so it cannot fill the buffer", () => {
  const game = newGame({ rows: 5, cols: 5 });
  assert.equal(game.enqueueTurn(RIGHT), false);
});

test("the turn buffer holds at most two turns", () => {
  const game = newGame({ rows: 5, cols: 5 });
  assert.equal(game.enqueueTurn(UP), true);
  assert.equal(game.enqueueTurn(LEFT), true);
  assert.equal(game.enqueueTurn(DOWN), false);
});

test("buffered turns are applied one per tick, not collapsed into one", () => {
  const game = newGame({ rows: 5, cols: 5 });
  play(game, [DOWN]);
  assert.equal(game.enqueueTurn(LEFT), true);
  assert.equal(game.enqueueTurn(UP), true);
  assert.equal(game.step().head, 6);
  assert.equal(game.step().head, 1);
});

test("stepping after the game has ended is inert", () => {
  const game = newGame({ rows: 5, cols: 5 });
  play(game, [null, null, null]);
  const body = game.snapshot().body;
  const change = game.step();
  assert.equal(change.status, Status.LOST);
  assert.deepEqual(game.snapshot().body, body);
});

test("reset restores the opening position, score and heading", () => {
  const game = newGame({ rows: 5, cols: 5 });
  play(game, [DOWN, LEFT]);
  const snapshot = game.reset();
  assert.deepEqual(snapshot.body, [0, 1, 2]);
  assert.equal(snapshot.score, 0);
  assert.equal(snapshot.status, Status.RUNNING);
  assert.equal(game.step().head, 3, "heading is back to rightward");
});

test("the tick interval drops 40ms per meal from 400ms", () => {
  const game = new SnakeGame({ rows: 5, cols: 5, random: FOOD_FIRST });
  assert.equal(game.intervalMs, 400);
  play(game, [null]);
  assert.equal(game.intervalMs, 360);
});

test("a snake longer than the board is wide is rejected at construction", () => {
  assert.throws(() => new SnakeGame({ rows: 5, cols: 3, initialLength: 4 }), RangeError);
  assert.throws(() => new SnakeGame({ rows: 5, cols: 5, initialLength: 0 }), RangeError);
});

test("random play never duplicates a body cell, places food on the snake or outruns the speed floor", () => {
  const game = new SnakeGame({ rows: 8, cols: 8 });
  const turns = Object.values(Direction);
  for (let tick = 0; tick < 3000; tick += 1) {
    game.enqueueTurn(turns[Math.floor(Math.random() * turns.length)]);
    const { status, food } = game.step();
    const { body } = game.snapshot();
    assert.equal(new Set(body).size, body.length, "body cells stay unique");
    assert.equal(food !== null && body.includes(food), false, "food avoids the snake");
    assert.ok(game.intervalMs >= 100 && game.intervalMs <= 400);
    if (status !== Status.RUNNING) game.reset();
  }
});
