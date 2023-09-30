import Game from "./snake.js";

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
