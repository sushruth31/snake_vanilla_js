import { DIRECTION_BY_KEY } from "./direction.js";
import { SnakeGame, Status } from "./game.js";
import { BoardRenderer } from "./renderer.js";

const BOARD = Object.freeze({ rows: 20, cols: 20, cellSize: 24 });

const OUTCOME_TEXT = Object.freeze({
  [Status.LOST]: "Game over",
  [Status.WON]: "Board cleared",
});

/** Wires input, the timer and the overlay to the pure game. Holds no rules. */
class GameController {
  #game;
  #renderer;
  #ui;
  #timer = null;

  constructor(game, renderer, ui) {
    this.#game = game;
    this.#renderer = renderer;
    this.#ui = ui;
    ui.start.addEventListener("click", () => this.start());
    ui.pause.addEventListener("click", () => this.pause());
    ui.restart.addEventListener("click", () => this.restart());
    window.addEventListener("keydown", (event) => this.#handleKeydown(event));
    this.#renderer.drawAll(this.#game.snapshot());
    this.#showScore(0);
  }

  /** A fresh timeout per tick, so the difficulty ramp applies immediately. */
  start() {
    if (this.#timer !== null || this.#game.status !== Status.RUNNING) return;
    this.#timer = setTimeout(() => this.#tick(), this.#game.intervalMs);
  }

  pause() {
    clearTimeout(this.#timer);
    this.#timer = null;
  }

  restart() {
    this.pause();
    this.#ui.overlay.classList.remove("visible");
    this.#renderer.drawAll(this.#game.reset());
    this.#showScore(0);
    this.start();
  }

  #tick() {
    this.#timer = null;
    const change = this.#game.step();
    this.#renderer.applyChange(change);
    this.#showScore(change.score);
    if (change.status === Status.RUNNING) return this.start();
    this.#finish(change.status);
  }

  #finish(status) {
    this.#ui.outcome.textContent = OUTCOME_TEXT[status];
    this.#ui.overlay.classList.add("visible");
  }

  #handleKeydown(event) {
    const direction = DIRECTION_BY_KEY[event.key];
    if (direction === undefined) return;
    event.preventDefault();
    this.#game.enqueueTurn(direction);
  }

  #showScore(score) {
    for (const element of this.#ui.scores) element.textContent = score;
  }
}

const readUi = () => ({
  scores: document.querySelectorAll(".score"),
  overlay: document.getElementById("overlay"),
  outcome: document.getElementById("outcome"),
  start: document.getElementById("start"),
  pause: document.getElementById("pause"),
  restart: document.getElementById("restart"),
});

const board = document.getElementById("board");
const game = new SnakeGame(BOARD);
const controller = new GameController(game, new BoardRenderer(board, BOARD), readUi());
controller.start();
