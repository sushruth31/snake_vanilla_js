import {
  moveRight,
  moveLeft,
  moveUp,
  moveDown,
  toId,
  fromId,
  getHead,
  getTail,
} from "./utils.js";
// constants
const NUM_ROWS = 20;
const NUM_COLS = 20;
const FASTEST_INTERVAL = 100;
const SLOWEST_INTERVAL = 400;
const INCREMENT = 40;
const CELL = 30;
const INIT_IDS = [0, 1, 2].map((i) => `${0}-${i}`);
// map to store the cells so dom lookups are not needed on every draw
const cellMap = new Map();
const modal = document.getElementById("gameovermodal");
const scoreEls = document.getElementsByClassName("score");

// game state
let intervalId = null;
let score = 0;
// snake type is a set of cell ids
let currentSnake = new Set(INIT_IDS);
let interval = SLOWEST_INTERVAL;
let currentFood = getFood();
let currentDir = moveRight;
const dirQueue = [moveRight];
let currentVacant = new Set();

// updates the current vacant set
// this is to set determine if there is an available spot for food
function updateVacant() {
  currentVacant = new Set();
  for (let i = 0; i < NUM_ROWS; i++) {
    for (let j = 0; j < NUM_COLS; j++) {
      currentVacant.add(toId(i, j));
    }
  }
  for (let id of currentSnake) {
    currentVacant.delete(id);
  }
}

// getFood will check if the food is in the snake, if it is, it will try again
function getFood() {
  const attempt = `${Math.floor(Math.random() * NUM_ROWS)}-${Math.floor(
    Math.random() * NUM_COLS
  )}`;
  if (currentSnake.has(attempt)) {
    return getFood();
  }
  return attempt;
}

// get new food will check if the food is the same as the current food, if it is, it will try again
// will return null if there are no more vacant spots
function getNewFood() {
  if (!currentVacant.size) {
    return null;
  }
  const attempt = getFood();
  if (attempt === currentFood) {
    return getNewFood();
  }
  return attempt;
}

function initCanvas() {
  const canvas = document.getElementById("canvas");
  for (let i = 0; i < NUM_ROWS; i++) {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "center";
    row.style.width = `${CELL * NUM_COLS}px`;
    row.style.height = `${CELL}px`;
    for (let j = 0; j < NUM_COLS; j++) {
      // add cells to the row
      const cell = document.createElement("div");
      cell.style.width = `${CELL}px`;
      cell.style.height = `${CELL}px`;
      cell.id = `${i}-${j}`;
      row.appendChild(cell);
    }
    canvas.appendChild(row);
  }
}

function drawSnakeAndFood() {
  for (let i = 0; i < NUM_ROWS; i++) {
    for (let j = 0; j < NUM_COLS; j++) {
      const id = toId(i, j);
      let cell;
      if (cellMap.has(id)) {
        cell = cellMap.get(id);
      } else {
        cell = document.getElementById(id);
        cellMap.set(id, cell);
      }
      // add food
      if (id === currentFood) {
        cell.style.background = "red";
        continue;
      }
      if (currentSnake.has(id)) {
        cell.style.background = "green";
        cell.style.borderRadius = "20%";
        cell.style.transition = "background 0.2s";
        // add eyes to head
        const head = getHead(currentSnake);
        const headCell = cellMap.get(head) ?? document.getElementById(head);
        headCell.style.background = "black";
        headCell.style.borderRadius = "50%";
      } else {
        cell.style.background = "white";
      }
    }
  }
  updateVacant();
}

function isOpposite(dir1, dir2) {
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

function isOutOfBounds([row, col]) {
  return row < 0 || row >= NUM_ROWS || col < 0 || col >= NUM_COLS;
}

function step() {
  // get the direction from the queue
  let nextDir = currentDir;
  while (dirQueue.length > 0) {
    const potentialDir = dirQueue.shift();
    if (isOpposite(potentialDir, currentDir)) {
      // continue to the next potential direction
      continue;
    }
    nextDir = potentialDir;
    break;
  }
  currentDir = nextDir;
  const head = getHead(currentSnake);
  const nextHead = currentDir(fromId(head));
  const nextId = toId(...nextHead);
  if (
    isOutOfBounds(nextHead) ||
    // check if the next head is in the snake
    currentSnake.has(nextId)
  ) {
    return gameOver();
  }
  // add the head regardless of whether it eats food or not
  currentSnake.add(nextId);
  // if it doesnt eat food, remove the tail
  if (nextId === currentFood) {
    currentFood = getNewFood();
    if (currentFood === null) {
      return gameOver();
    }
    // update the score
    updateScore(++score);
    // update the interval
    if (interval > FASTEST_INTERVAL) {
      interval -= INCREMENT;
      clearInterval(intervalId);
      startGameLoop();
    }
  } else {
    // remove the tail
    currentSnake.delete(getTail(currentSnake));
  }
  drawSnakeAndFood();
}

function gameOver() {
  modal.style.display = "flex";
  clearInterval(intervalId);
  window.removeEventListener("keydown", handleKeydown);
}

function restartGame() {
  modal.style.display = "none";
  currentSnake = new Set(INIT_IDS);
  currentDir = moveRight;
  currentFood = getFood();
  interval = SLOWEST_INTERVAL;
  if (intervalId) {
    clearInterval(intervalId);
  }
  score = 0;
  updateScore(score);
  drawSnakeAndFood();
  createHandlers();
  startGameLoop();
}

function startGameLoop() {
  intervalId = setInterval(step, interval);
}

function createHandlers() {
  // restart btn handler
  const restartBtn = document.getElementById("restart");
  restartBtn.addEventListener("click", restartGame);

  //pause btn handler
  const pauseBtn = document.getElementById("pause");
  pauseBtn.addEventListener("click", () => {
    window.removeEventListener("keydown", handleKeydown);
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    } else {
      startGameLoop();
    }
  });

  // start btn handler
  const startBtn = document.getElementById("start");
  startBtn.addEventListener("click", () => {
    window.addEventListener("keydown", handleKeydown);
    startGameLoop();
  });

  window.addEventListener("keydown", handleKeydown);
}

function handleKeydown(e) {
  switch (e.key) {
    case "ArrowRight":
      dirQueue.push(moveRight);
      break;
    case "ArrowLeft":
      dirQueue.push(moveLeft);
      break;
    case "ArrowUp":
      dirQueue.push(moveUp);
      break;
    case "ArrowDown":
      dirQueue.push(moveDown);
      break;
  }
}

function updateScore(val) {
  for (const scoreEl of scoreEls) {
    scoreEl.innerHTML = val;
  }
}

function main() {
  // create the board
  initCanvas();
  createHandlers();

  updateScore(score);

  //set up the game loop
  startGameLoop();
  drawSnakeAndFood();
}

window.addEventListener("load", main);
