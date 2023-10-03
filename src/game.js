import { Direction, isOpposite } from "./direction.js";

export const Status = Object.freeze({
  RUNNING: "running",
  WON: "won",
  LOST: "lost",
});

const SLOWEST_TICK_MS = 400;
const FASTEST_TICK_MS = 100;
const SPEEDUP_PER_MEAL_MS = 40;
const MAX_BUFFERED_TURNS = 2;

/**
 * Snake rules with no reference to the DOM, a timer or a random global.
 *
 * A cell is a single integer `row * cols + col`, so membership tests against the
 * body and the free-cell pool are O(1) Set lookups. `step()` returns the cells
 * that changed, which is all a renderer needs to repaint.
 */
export class SnakeGame {
  #rows;
  #cols;
  #initialLength;
  #random;
  #body;
  #occupied;
  #free;
  #food;
  #direction;
  #turns;
  #status;

  constructor({ rows = 20, cols = 20, initialLength = 3, random = Math.random } = {}) {
    if (initialLength < 1 || initialLength > cols) {
      throw new RangeError(`initialLength must be between 1 and cols (${cols}), got ${initialLength}`);
    }
    this.#rows = rows;
    this.#cols = cols;
    this.#initialLength = initialLength;
    this.#random = random;
    this.reset();
  }

  get rows() {
    return this.#rows;
  }

  get cols() {
    return this.#cols;
  }

  get status() {
    return this.#status;
  }

  get score() {
    return this.#body.length - this.#initialLength;
  }

  /** Difficulty ramp: one meal shaves 40ms off the tick, floored at 100ms. */
  get intervalMs() {
    return Math.max(FASTEST_TICK_MS, SLOWEST_TICK_MS - this.score * SPEEDUP_PER_MEAL_MS);
  }

  /** Full state, for the initial paint and after a reset. */
  snapshot() {
    return Object.freeze({
      status: this.#status,
      body: [...this.#body],
      food: this.#food,
      score: this.score,
    });
  }

  reset() {
    const cells = Array.from({ length: this.#rows * this.#cols }, (_, cell) => cell);
    this.#body = cells.slice(0, this.#initialLength);
    this.#occupied = new Set(this.#body);
    this.#free = new Set(cells.filter((cell) => !this.#occupied.has(cell)));
    this.#direction = Direction.RIGHT;
    this.#turns = [];
    this.#status = Status.RUNNING;
    this.#food = this.#takeRandomFreeCell();
    return this.snapshot();
  }

  /**
   * Buffers a turn, validated against the last *pending* turn rather than the
   * current heading — otherwise two keypresses inside one tick can reverse the
   * snake into its own neck. Returns false when the turn is rejected.
   */
  enqueueTurn(direction) {
    if (this.#turns.length >= MAX_BUFFERED_TURNS) return false;
    const last = this.#turns.at(-1) ?? this.#direction;
    if (direction === last || isOpposite(direction, last)) return false;
    this.#turns.push(direction);
    return true;
  }

  step() {
    if (this.#status !== Status.RUNNING) return this.#change(null, null);
    this.#direction = this.#turns.shift() ?? this.#direction;
    const head = this.#nextHead();
    if (head === null || this.#collides(head)) return this.#lose();
    return head === this.#food ? this.#grow(head) : this.#advance(head);
  }

  /** Decodes to row/col first: index arithmetic alone wraps across row edges. */
  #nextHead() {
    const head = this.#body.at(-1);
    const row = Math.floor(head / this.#cols) + this.#direction.row;
    const col = (head % this.#cols) + this.#direction.col;
    const inside = row >= 0 && row < this.#rows && col >= 0 && col < this.#cols;
    return inside ? row * this.#cols + col : null;
  }

  /** The tail vacates on the same tick, so chasing it is legal unless growing. */
  #collides(head) {
    const vacating = head === this.#food ? null : this.#body[0];
    return this.#occupied.has(head) && head !== vacating;
  }

  #grow(head) {
    this.#body.push(head);
    this.#occupied.add(head);
    this.#food = this.#takeRandomFreeCell();
    if (this.#food === null) this.#status = Status.WON;
    return this.#change(head, null);
  }

  #advance(head) {
    const tail = this.#body.shift();
    this.#occupied.delete(tail);
    this.#free.add(tail);
    this.#body.push(head);
    this.#occupied.add(head);
    this.#free.delete(head);
    return this.#change(head, tail);
  }

  #lose() {
    this.#status = Status.LOST;
    return this.#change(null, null);
  }

  /**
   * Draws uniformly from the maintained free-cell pool in O(free) and removes
   * the winner, so food is never placed on the snake and a full board simply
   * yields null. Returns null when no cell is free.
   */
  #takeRandomFreeCell() {
    let remaining = Math.floor(this.#random() * this.#free.size);
    for (const cell of this.#free) {
      if (remaining-- > 0) continue;
      this.#free.delete(cell);
      return cell;
    }
    return null;
  }

  #change(head, tail) {
    return Object.freeze({
      status: this.#status,
      head,
      neck: head === null ? null : this.#body.at(-2) ?? null,
      tail,
      food: this.#food,
      score: this.score,
    });
  }
}
