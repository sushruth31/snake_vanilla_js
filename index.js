import Game from "./snake.js";
export const NUM_ROWS = 20;
export const NUM_COLS = 20;

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
