const canvas = document.getElementById("canvas");
const NUM_ROWS = 20;
const NUM_COLS = 20;
const CELL = 30;
// snake type is a set of cell ids
const initIds = [0, 1, 2].map((i) => `${0}-${i}`);
const currentSnake = new Set(initIds);
let interval = 700;
let intervalId = null;

function initCanvas() {
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

function toId(row, col) {
  return `${row}-${col}`;
}

function fromId(id) {
  return id.split("-").map((i) => parseInt(i));
}

function drawSnake(snake) {
  for (let i = 0; i < NUM_ROWS; i++) {
    for (let j = 0; j < NUM_COLS; j++) {
      const id = toId(i, j);
      const cell = document.getElementById(id);
      if (snake.has(id)) {
        cell.style.background = "green";
      } else {
        cell.style.background = "white";
      }
    }
  }
}

const moveRight = ([row, col]) => [row, col + 1];

function step() {
  const head = [...currentSnake][currentSnake.size - 1];
  const nextHead = moveRight(fromId(head));
  currentSnake.add(toId(...nextHead));
  currentSnake.delete([...currentSnake][0]);
  drawSnake(currentSnake);
}

intervalId = setInterval(step, interval);

initCanvas();

drawSnake(currentSnake);
