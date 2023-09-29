// constants
const NUM_ROWS = 20;
const NUM_COLS = 20;
const CELL = 30;
const INIT_IDS = [0, 1, 2].map((i) => `${0}-${i}`);

// game state
let intervalId = null;
let score = 0;
// snake type is a set of cell ids
let currentSnake = new Set(INIT_IDS);
let interval = 400;
let currentFood = getFood();

function getFood() {
  return `${Math.floor(Math.random() * NUM_ROWS)}-${Math.floor(
    Math.random() * NUM_COLS
  )}`;
}

function getNewFood() {
  const attempt = getFood();
  if (currentSnake.has(attempt) || attempt === currentFood) {
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
    row.style.border = "1px solid red";
    for (let j = 0; j < NUM_COLS; j++) {
      // add cells to the row
      const cell = document.createElement("div");
      cell.style.width = `${CELL}px`;
      cell.style.height = `${CELL}px`;
      cell.style.border = "1px solid red";
      cell.id = `${i}-${j}`;
      row.appendChild(cell);
    }
    canvas.appendChild(row);
  }
}

function toId(...args) {
  return args.join("-");
}

function fromId(id) {
  return id.split("-").map((i) => parseInt(i));
}

function drawSnakeAndFood() {
  for (let i = 0; i < NUM_ROWS; i++) {
    for (let j = 0; j < NUM_COLS; j++) {
      const id = toId(i, j);
      const cell = document.getElementById(id);
      // add food
      if (id === currentFood) {
        cell.style.background = "red";
        continue;
      }
      cell.style.background = currentSnake.has(id) ? "green" : "white";
    }
  }
}

const moveRight = ([row, col]) => [row, col + 1];
const moveLeft = ([row, col]) => [row, col - 1];
const moveUp = ([row, col]) => [row - 1, col];
const moveDown = ([row, col]) => [row + 1, col];
const dirQueue = [moveRight];

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

let currentDir = moveRight;

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
  const head = [...currentSnake][currentSnake.size - 1];
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
  } else {
    // remove the tail
    currentSnake.delete([...currentSnake][0]);
  }
  drawSnakeAndFood();
}

window.addEventListener("keydown", (e) => {
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
      console.log("down");
      dirQueue.push(moveDown);
      break;
  }
});

function gameOver() {
  const modal = document.getElementById("gameovermodal");
  modal.style.display = "flex";
  clearInterval(intervalId);
}

function restartGame() {
  const modal = document.getElementById("gameovermodal");
  modal.style.display = "none";
  currentSnake = new Set(INIT_IDS);
  currentDir = moveRight;
  currentFood = getFood();
  drawSnakeAndFood();
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
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    } else {
      startGameLoop();
    }
  });

  // start btn handler
  const startBtn = document.getElementById("start");
  startBtn.addEventListener("click", startGameLoop);
}

function main() {
  // create the board
  initCanvas();
  createHandlers();

  //set up the game loop
  startGameLoop();
  drawSnakeAndFood();
}

window.addEventListener("load", main);
