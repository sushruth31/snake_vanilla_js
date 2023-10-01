import { NUM_COLS, NUM_ROWS } from "./index.js";
import { toId, fromId, Direction } from "./utils.js";

class Snake extends Set {
  currentDir = Direction.moveRight;
  constructor(ids) {
    super(ids);
  }
  get direction() {
    return this.currentDir;
  }

  set direction(dir) {
    this.currentDir = dir;
  }

  getHead() {
    return [...this][this.size - 1];
  }
  getTail() {
    return [...this][0];
  }
  removeTail() {
    this.delete(this.getTail());
  }

  getNextHead() {
    return this.currentDir(fromId(this.getHead()));
  }

  isOutOfBounds() {
    const [row, col] = this.getNextHead();
    return row < 0 || row >= NUM_ROWS || col < 0 || col >= NUM_COLS;
  }
}

export default class Game {
  INIT_IDS = [0, 1, 2].map((i) => `${0}-${i}`);
  FASTEST_INTERVAL = 100;
  SLOWEST_INTERVAL = 400;
  INCREMENT = 40;
  CELL = 30;
  // map to store the cells so dom lookups are not needed on every draw
  cellMap = new Map();
  modal = document.getElementById("gameovermodal");
  scoreEls = document.getElementsByClassName("score");
  canvas = document.getElementById("canvas");
  restartBtn = document.getElementById("restart");
  pauseBtn = document.getElementById("pause");
  startBtn = document.getElementById("start");

  // game state
  intervalId = null;
  score = 0;
  // snake type is a set of cell ids
  currentSnake = new Snake(this.INIT_IDS);
  interval = this.SLOWEST_INTERVAL;
  currentFood = this.getFood();
  dirQueue = [Direction.moveRight];
  currentVacant = new Set();

  // create a new handle keydown function so the reference to this is correct
  handleKeydownRef = this.handleKeydown.bind(this);

  initCanvas() {
    for (let i = 0; i < NUM_ROWS; i++) {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "center";
      row.style.width = `${this.CELL * NUM_COLS}px`;
      row.style.height = `${this.CELL}px`;
      for (let j = 0; j < NUM_COLS; j++) {
        // add cells to the row
        const cell = document.createElement("div");
        cell.style.width = `${this.CELL}px`;
        cell.style.height = `${this.CELL}px`;
        cell.id = `${i}-${j}`;
        row.appendChild(cell);
      }
      this.canvas.appendChild(row);
    }
  }

  clearInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  createHandlers() {
    // restart btn handler
    this.restartBtn.addEventListener("click", this.restartGame.bind(this));

    //pause btn handler
    this.pauseBtn.addEventListener("click", () => {
      window.removeEventListener("keydown", this.handleKeydownRef);
      this.clearInterval();
    });

    // start btn handler
    this.startBtn.addEventListener("click", () => {
      if (this.intervalId) {
        // dont do anything if the game is already running
        return;
      }
      window.addEventListener("keydown", this.handleKeydownRef);
      this.startGameLoop();
    });

    window.addEventListener("keydown", this.handleKeydownRef);
  }

  startGameLoop() {
    this.clearInterval();
    this.intervalId = setInterval(this.step.bind(this), this.interval);
  }

  // getFood will check if the food is in the snake, if it is, it will try again
  getFood() {
    const attempt = `${Math.floor(Math.random() * NUM_ROWS)}-${Math.floor(
      Math.random() * NUM_COLS
    )}`;
    if (this.currentSnake.has(attempt)) {
      return this.getFood();
    }
    return attempt;
  }

  // get new food will check if the food is the same as the current food, if it is, it will try again
  // will return null if there are no more vacant spots
  getNewFood() {
    if (!this.currentVacant.size) {
      return null;
    }
    const attempt = this.getFood();
    if (attempt === this.currentFood) {
      return this.getNewFood();
    }
    return attempt;
  }

  updateScore() {
    this.score = this.currentSnake.size - this.INIT_IDS.length;
    for (const scoreEl of this.scoreEls) {
      scoreEl.innerHTML = this.score;
    }
  }

  drawSnakeAndFood() {
    for (let i = 0; i < NUM_ROWS; i++) {
      for (let j = 0; j < NUM_COLS; j++) {
        const id = toId(i, j);
        let cell;
        if (this.cellMap.has(id)) {
          cell = this.cellMap.get(id);
        } else {
          cell = document.getElementById(id);
          this.cellMap.set(id, cell);
        }
        // add food
        if (id === this.currentFood) {
          cell.style.background = "red";
          continue;
        }
        if (this.currentSnake.has(id)) {
          cell.style.background = "green";
          cell.style.borderRadius = "20%";
          cell.style.transition = "background 0.2s";
          // add eyes to head
          const head = this.currentSnake.getHead();
          const headCell =
            this.cellMap.get(head) ?? document.getElementById(head);
          headCell.style.background = "black";
          headCell.style.borderRadius = "50%";
        } else {
          cell.style.background = "white";
        }
      }
    }
    this.updateVacant();
  }

  setNextDir() {
    // get the direction from the queue
    let nextDir = this.currentSnake.direction;
    while (this.dirQueue.length > 0) {
      const potentialDir = this.dirQueue.shift();
      if (Direction.isOpposite(potentialDir, this.currentSnake.direction)) {
        // continue to the next potential direction
        continue;
      }
      nextDir = potentialDir;
      break;
    }
    this.currentSnake.direction = nextDir;
  }

  step() {
    this.setNextDir();
    const nextHead = this.currentSnake.getNextHead();
    const nextId = toId(...nextHead);
    if (
      this.currentSnake.isOutOfBounds() ||
      // check if the next head is in the snake
      this.currentSnake.has(nextId)
    ) {
      return this.gameOver();
    }
    // add the head regardless of whether it eats food or not
    this.currentSnake.add(nextId);
    // if it doesnt eat food, remove the tail
    if (nextId === this.currentFood) {
      this.currentFood = this.getNewFood();
      if (this.currentFood === null) {
        return this.gameOver();
      }
      // update the score
      this.updateScore();
      // update the interval
      if (this.interval > this.FASTEST_INTERVAL) {
        this.interval -= this.INCREMENT;
        this.startGameLoop();
      }
    } else {
      // remove the tail
      this.currentSnake.removeTail();
    }
    this.drawSnakeAndFood();
  }

  gameOver() {
    this.modal.style.display = "flex";
    this.clearInterval();
    window.removeEventListener("keydown", this.handleKeydownRef);
  }

  handleKeydown(e) {
    switch (e.key) {
      case "ArrowRight":
        this.dirQueue.push(Direction.moveRight);
        break;
      case "ArrowLeft":
        this.dirQueue.push(Direction.moveLeft);
        break;
      case "ArrowUp":
        this.dirQueue.push(Direction.moveUp);
        break;
      case "ArrowDown":
        this.dirQueue.push(Direction.moveDown);
        break;
    }
  }

  // updates the current vacant set
  // this is to set determine if there is an available spot for food
  updateVacant() {
    this.currentVacant = new Set();
    for (let i = 0; i < NUM_ROWS; i++) {
      for (let j = 0; j < NUM_COLS; j++) {
        this.currentVacant.add(toId(i, j));
      }
    }
    for (const id of this.currentSnake) {
      this.currentVacant.delete(id);
    }
  }

  restartGame() {
    this.modal.style.display = "none";
    this.currentSnake = new Snake(this.INIT_IDS);
    this.currentFood = this.getFood();
    this.interval = this.SLOWEST_INTERVAL;
    this.updateScore();
    this.drawSnakeAndFood();
    this.createHandlers();
    this.startGameLoop();
  }
}
