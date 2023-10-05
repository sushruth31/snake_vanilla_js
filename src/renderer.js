const CELL = "cell";
const SNAKE = "cell snake";
const HEAD = "cell snake head";
const FOOD = "cell food";

/**
 * Owns every DOM write for the board. The grid is built once and addressed by
 * the same integer index the game uses, so a repaint is a direct array lookup.
 */
export class BoardRenderer {
  #cells;

  constructor(container, { rows, cols, cellSize }) {
    container.style.setProperty("--cols", cols);
    container.style.setProperty("--cell-size", `${cellSize}px`);
    this.#cells = Array.from({ length: rows * cols }, () => {
      const cell = document.createElement("div");
      cell.className = CELL;
      return container.appendChild(cell);
    });
  }

  /** Full repaint — first frame and after a reset only. */
  drawAll({ body, food }) {
    for (const cell of this.#cells) cell.className = CELL;
    for (const index of body) this.#cells[index].className = SNAKE;
    this.#cells[body.at(-1)].className = HEAD;
    if (food !== null) this.#cells[food].className = FOOD;
  }

  /** Incremental repaint — at most four cells touched per tick. */
  applyChange({ head, neck, tail, food }) {
    if (tail !== null) this.#cells[tail].className = CELL;
    if (neck !== null) this.#cells[neck].className = SNAKE;
    if (head !== null) this.#cells[head].className = HEAD;
    if (food !== null) this.#cells[food].className = FOOD;
  }
}
