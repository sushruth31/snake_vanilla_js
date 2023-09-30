import {
  moveRight,
  moveLeft,
  moveUp,
  moveDown,
  toId,
  fromId,
  isOpposite,
} from "./utils.js";
// constants

// updates the current vacant set
// this is to set determine if there is an available spot for food

function main() {
  // create the board
  const game = new Game();
  game.initCanvas();
  game.createHandlers();

  game.updateScore();

  //render snake and set up the game loop
  game.drawSnakeAndFood();
  game.startGameLoop();
}

window.addEventListener("load", main);

class Snake extends Set {
  constructor(ids) {
    super(ids);
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
}

class Game {
  NUM_ROWS = 20;
  INIT_IDS = [0, 1, 2].map((i) => `${0}-${i}`);
  NUM_COLS = 20;
  FASTEST_INTERVAL = 100;
  SLOWEST_INTERVAL = 400;
  INCREMENT = 40;
  CELL = 30;
  // map to store the cells so dom lookups are not needed on every draw
  cellMap = new Map();
  modal = document.getElementById("gameovermodal");
  scoreEls = document.getElementsByClassName("score");
  canvas = document.getElementById("canvas");

  // game state
  intervalId = null;
  score = 0;
  // snake type is a set of cell ids
  currentSnake = new Snake(this.INIT_IDS);
  interval = this.SLOWEST_INTERVAL;
  currentFood = this.getFood();
  currentDir = moveRight;
  dirQueue = [moveRight];
  currentVacant = new Set();

  initCanvas() {
    for (let i = 0; i < this.NUM_ROWS; i++) {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "center";
      row.style.width = `${this.CELL * this.NUM_COLS}px`;
      row.style.height = `${this.CELL}px`;
      for (let j = 0; j < this.NUM_COLS; j++) {
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

  createHandlers() {
    // restart btn handler
    const restartBtn = document.getElementById("restart");
    restartBtn.addEventListener("click", this.restartGame.bind(this));

    //pause btn handler
    const pauseBtn = document.getElementById("pause");
    pauseBtn.addEventListener("click", () => {
      window.removeEventListener("keydown", this.handleKeydown.bind(this));
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    });

    // start btn handler
    const startBtn = document.getElementById("start");
    startBtn.addEventListener("click", () => {
      if (this.intervalId) {
        // dont do anything if the game is already running
        return;
      }
      window.addEventListener("keydown", this.handleKeydown.bind(this));
      this.startGameLoop();
    });

    window.addEventListener("keydown", this.handleKeydown.bind(this));
  }

  startGameLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.intervalId = setInterval(this.step.bind(this), this.interval);
  }

  // getFood will check if the food is in the snake, if it is, it will try again
  getFood() {
    const attempt = `${Math.floor(Math.random() * this.NUM_ROWS)}-${Math.floor(
      Math.random() * this.NUM_COLS
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

  updateScore(val = 0) {
    for (const scoreEl of this.scoreEls) {
      scoreEl.innerHTML = val;
    }
  }

  drawSnakeAndFood() {
    for (let i = 0; i < this.NUM_ROWS; i++) {
      for (let j = 0; j < this.NUM_COLS; j++) {
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

  step() {
    // get the direction from the queue
    let nextDir = this.currentDir;
    while (this.dirQueue.length > 0) {
      const potentialDir = this.dirQueue.shift();
      if (isOpposite(potentialDir, this.currentDir)) {
        // continue to the next potential direction
        continue;
      }
      nextDir = potentialDir;
      break;
    }
    this.currentDir = nextDir;
    const head = this.currentSnake.getHead();
    const nextHead = this.currentDir(fromId(head));
    const nextId = toId(...nextHead);
    if (
      this.isOutOfBounds(nextHead) ||
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
      this.updateScore(++this.score);
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

  isOutOfBounds([row, col]) {
    return row < 0 || row >= this.NUM_ROWS || col < 0 || col >= this.NUM_COLS;
  }

  gameOver() {
    this.modal.style.display = "flex";
    clearInterval(this.intervalId);
    window.removeEventListener("keydown", this.handleKeydown.bind(this));
  }

  handleKeydown(e) {
    switch (e.key) {
      case "ArrowRight":
        this.dirQueue.push(moveRight);
        break;
      case "ArrowLeft":
        this.dirQueue.push(moveLeft);
        break;
      case "ArrowUp":
        this.dirQueue.push(moveUp);
        break;
      case "ArrowDown":
        this.dirQueue.push(moveDown);
        break;
    }
  }

  updateVacant() {
    this.currentVacant = new Set();
    for (let i = 0; i < this.NUM_ROWS; i++) {
      for (let j = 0; j < this.NUM_COLS; j++) {
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
    this.currentDir = moveRight;
    this.currentFood = this.getFood();
    this.interval = this.SLOWEST_INTERVAL;
    this.score = 0;
    this.updateScore(this.score);
    this.drawSnakeAndFood();
    this.createHandlers();
    this.startGameLoop();
  }
}
