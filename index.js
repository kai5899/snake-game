class Game {
  constructor() {
    this.gameSetup();
    this.overlaysetup();
    this.build_Side_Menu();
    this.lastRender = 0
    this.start();
  }

  start() {
    // Set the animation interval to approximately 60 frames per second (16 ms per frame)
    // this.intervalId = setInterval(this.animate.bind(this), 16);
    this.lastRender = performance.now();
    requestAnimationFrame(this.animate.bind(this));
  }

  gameSetup() {
    // Setup code remains unchanged
    this.height = 600;
    this.width = 600;
    this.score = 0;
    this.playground = $(`<div class="playground"></div>`);
    this.html = $(`<div class="game"></div>`);

    this.canvasBoard = new CanvasBoard(this);
    this.snake = new SnakeHead({
      position: { x: 50, y: 50 },
      canvas: this.canvasBoard,
      gameOverCallback: this.gameOver.bind(this),
      gameRestartCallback :this.restartGame.bind(this),
    });

    this.sideMenu = $('<div class="sidemenu"></div>');
    this.sideMenu.append($(`<div class="welcome">WELCOME</div><div class="welcome"><h4>Use</h4></div>`));
    $("#root").append(this.sideMenu);
    this.playground.append(this.html);
    $("#root").append(this.playground);
  }

  overlaysetup() {
    // Setup code remains unchanged
    this.game_over_overlay = $('<div class="game-over"><div class="wrapper"><h1>GAME OVER</h1><div class="score">Score: <span class="score-number">' + this.score + '</span></div><a href="#" class="play-again">Play again</a></div></div>');
    this.html.append(this.game_over_overlay);
    this.game_over_overlay.find(".play-again").on("click",()=>{
      this.snake.restartGame();
    });
    this.game_over_overlay.hide();
  }

  animate(timestamp) {
    const progress = timestamp - this.lastRender;

    if (progress > 100) { // Control the update rate (60 is about 16.67 ms for roughly 60fps)
      this.canvasBoard.clearCanvas();
      this.snake.update();
      this.lastRender = timestamp;
    }

    if (this.snake.isRunning) {
      requestAnimationFrame(this.animate.bind(this));
    }
  }
  // animate() {
  //   // If game over, clear the interval
  //   if (!this.snake.isRunning) {
  //     clearInterval(this.intervalId);
  //     return;
  //   }

  //   this.canvasBoard.clearCanvas();
  //   this.snake.update();
  // }

  gameOver() {
    playSound("wrong");
    this.html.find(".score-number").text(this.score);
    this.game_over_overlay.slideDown();
    // Clear the interval when game is over
    clearInterval(this.intervalId);
  }

  restartGame(){
    this.game_over_overlay.slideUp();
    this.score = 0;
    this.updateScoreUi();
    
    // Reset and restart the snake
    // this.snake.restartGame();
    
    // Clear any existing interval and start a new one
    clearInterval(this.intervalId);
    this.start();
  }

  build_Side_Menu() {
    // Menu building code remains unchanged
    this.score_element = $('<div class="current-score">Score: <span class="score-number">0</span></div>');
    this.secondRow = $('<div class="second-row" style="display: flex; justify-content: space-evenly; width: 100%;"></div>');
    this.secondRow.append(new LetterButton("A").element, new LetterButton("S").element, new LetterButton("D").element);
    this.sideMenu.append(new LetterButton("W").element, this.secondRow, this.score_element);
  }

  increaseScore(){
    this.score += 1;
    this.updateScoreUi();
  }

  updateScoreUi(){
    this.sideMenu.find(".score-number").text(this.score);
  }

}

class LetterButton {
  constructor(letter) {
    this.element = $('<div class="button" id=' + letter + "></div>");

    this.element.css({
      width: 40,
      height: 40,
      backgroundColor: "white",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: "15%",
    });

    this.text = letter;
    this.textElement = $('<div class="button-text">' + this.text + "</div>");
    this.element.append(this.textElement);
  }
}

function playSound(name) {
  var audio = new Audio("sounds/" + name + ".mp3");
  audio.play();
}

function animateButton(char) {
  var b = $("#" + char);
  b.addClass("pressed");

  setTimeout(function () {
    b.removeClass("pressed");
  }, 100);
}

class CanvasBoard {
  constructor(game) {
    this.game = game;
    this.height = game.width; // 600px
    this.width = game.height; // 600px
    this.canvas = $(
      `<canvas class="canvas-board" width="595" height="595" style="display: block; width: 100%; height: 100%;  padding: 0;"></canvas>`
    );
    this.context = this.canvas[0].getContext("2d");
    this.game.html.append(this.canvas);
  }

  clearCanvas() {
    this.context.clearRect(0, 0, this.width, this.height);
    // this. drawGrid();
  }

  drawGrid() {
    const gridSize = 20; // Size of the grid cells
    this.context.strokeStyle = '#f'; // Color of the grid lines
    this.context.lineWidth = 1; // Thickness of the grid lines

    // Drawing vertical lines
    for (let x = gridSize; x < this.width; x += gridSize) {
      this.context.beginPath();
      this.context.moveTo(x, 0);
      this.context.lineTo(x, this.height);
      this.context.stroke();
    }

    // Drawing horizontal lines
    for (let y = gridSize; y < this.height; y += gridSize) {
      this.context.beginPath();
      this.context.moveTo(0, y);
      this.context.lineTo(this.width, y);
      this.context.stroke();
    }
  }
}

class SnakeHead {
  constructor({ position, canvas, gameOverCallback,gameRestartCallback }) {
    this.position = position;
    this.velocity = 20;
    this.canvas = canvas;
    this.radius = 10;
    this.direction = "r";
    this.tails = [];
    this.positionHistory = [];

    this.gameOverCallback = gameOverCallback;

    this.gameRestartCallback = gameRestartCallback;

    this.isRunning = true;

    this.food = new Food(this);
    this.bindMovementsKeys();
  }

  draw() {
    this.drawCircle(this.position, "#153448");
    this.food.draw();
    this.tails.forEach((tail) => tail.draw());
  }

  drawCircle(position, color) {
    this.canvas.context.beginPath();
    this.canvas.context.arc(
      position.x,
      position.y,
      this.radius,
      0,
      2 * Math.PI
    );
    this.canvas.context.fillStyle = color;
    this.canvas.context.fill();
  }

  update() {
    if (!this.isRunning) return;
    this.updatePositionHistory();
    this.move();
    this.checkOverFlow();
    this.checkFoodCollision();
    this.positionTails();
    this.checkHeadTailCollision();
    this.draw();
  }

  move() {
    const moves = {
      u: () => (this.position.y -= this.velocity),
      d: () => (this.position.y += this.velocity),
      l: () => (this.position.x -= this.velocity),
      r: () => (this.position.x += this.velocity),
    };
    moves[this.direction]?.();
  }

  updatePositionHistory() {
    this.positionHistory.push({ ...this.position });
    if (this.positionHistory.length > 300) this.positionHistory.shift();
  }

  checkOverFlow() {
    if (this.position.x + this.radius > this.canvas.width)
      this.position.x = this.radius;
    if (this.position.x - this.radius < 0)
      this.position.x = this.canvas.width - this.radius;
    if (this.position.y + this.radius > this.canvas.height)
      this.position.y = this.radius;
    if (this.position.y - this.radius < 0)
      this.position.y = this.canvas.height - this.radius;
  }

  bindMovementsKeys() {
    $(document).on("keydown", (event) => {
      const directionMap = { w: "u", s: "d", a: "l", d: "r", h: "s" };
      if (directionMap[event.key]) {
        this.direction = directionMap[event.key];
        animateButton(event.key.toUpperCase());
      }
    });
  }

  positionTails() {
    this.tails.forEach((tail, index) => {
      const posIndex = (index + 1) * 1;
      if (posIndex < this.positionHistory.length)
        tail.move(this.positionHistory[this.positionHistory.length - posIndex]);
    });
  }

  checkFoodCollision() {
    const distance = Math.hypot(
      this.position.x - this.food.x,
      this.position.y - this.food.y
    );
    if (distance < this.radius + this.food.radius) {
      this.food = new Food(this);
      this.addTail();
      this.canvas.game.increaseScore();
    }
  }

  checkHeadTailCollision() {
    if (this.tails.length > 1 && this.positionHistory.length > 50) {
      // Start checking after enough movement
      for (let tail of this.tails.slice(1)) {
        // Ignore the first tail for the initial moments
        let dx = this.position.x - tail.position.x;
        let dy = this.position.y - tail.position.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.radius * 2) {
          this.gameOver();
          break;
        }
      }
    }
  }

  gameOver() {
    this.isRunning = false;
    this.gameOverCallback();

  }

  restartGame(){
    this.isRunning = true;
    this.direction = "r"; // Reset direction to right
    this.position = { x: 50, y: 50 }; // Reset position to start
    this.tails = []; // Clear all tails
    this.positionHistory = []; // Clear position history
    
    // Reset the food position
    this.food = new Food(this);
    
    this.gameRestartCallback(); // C
  }

  addTail() {
    this.tails.push(new Tail(this));
  }
}

class Tail {
  constructor(snakeHead) {
    this.position = { ...snakeHead.position };
    this.radius = 10;
    this.ctx = snakeHead.canvas.context;
  }

  draw() {
    this.ctx.beginPath();
    this.ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = "red";
    this.ctx.fill();
  }

  move(position) {
    this.position = { ...position };
  }
}

class Food {
  constructor(snake) {
    this.snake = snake;
    this.ctx = snake.canvas.context;
    this.radius = 10;
    this.gridSize = 20; // This should match the gridSize used in the grid drawing

    // Adjusted to align with the grid
    this.x = Math.floor(Math.random() * ((snake.canvas.width - this.radius) / this.gridSize)) * this.gridSize + this.radius;
    this.y = Math.floor(Math.random() * ((snake.canvas.height - this.radius) / this.gridSize)) * this.gridSize + this.radius;
  }

  draw() {
    this.snake.drawCircle({ x: this.x, y: this.y }, "green");
  }
}

new Game();

























// class Game {
//   constructor() {
//     this.gameSetup();
//     this.overlaysetup();
//     this.build_Side_Menu();
//     this.start();
//   }

//   start() {
//     requestAnimationFrame(this.animate.bind(this));
//     // this.intervalId = setInterval(this.animate.bind(this), 60);
//   }

//   gameSetup() {
//     this.height = 600;
//     this.width = 600;
//     this.score = 0;
//     this.playground = $(`<div class="playground" ></div>`);
//     this.html = $(`<div class="game"></div>`);

//     this.canvasBoard = new CanvasBoard(this);
//     this.snake = new SnakeHead({
//       position: { x: 50, y: 50 },
//       canvas: this.canvasBoard,
//       gameOverCallback: this.gameOver.bind(this),
//     });

//     this.sideMenu = $('<div class ="sidemenu" > </div>');

//     this.sideMenu.append(
//       $(` <div class="welcome">WELCOME</div>
//     <div class="welcome">
//       <h4>Use</h4>
//     </div>`)
//     );
//     $("#root").append(this.sideMenu);
//     this.playground.append(this.html);
//     $("#root").append(this.playground);
//   }

//   overlaysetup() {
//     this.game_over_overlay = $(
//       '<div class="game-over"><div class="wrapper"><h1>GAME OVER</h1><div class="score">Score: <span class="score-number">' +
//         this.score +
//         '</span></div><a href="#" class="play-again">Play again</a></div></div>'
//     );
//     this.html.append(this.game_over_overlay);
//     this.game_over_overlay.hide();
//   }

//   animate() {
//     this.canvasBoard.clearCanvas();
//     this.snake.update();
//     requestAnimationFrame(this.animate.bind(this));
//   }

//   gameOver() {
//     // alert("Game Over! Your score: " + this.score);
//     playSound("wrong");
//     this.html.find(".score-number").text(this.score);
//     this.game_over_overlay.slideDown();
//     // Optionally, reset the game or provide options to restart
//   }

//   build_Side_Menu() {
//     this.score_element = $(
//       '<div class="current-score">Score: <span class="score-number">0</span></div>'
//     );

//     this.secondRow = $('<div class="second-row"></div>');

//     this.secondRow.css({
//       display: "flex",
//       justifyContent: "space-evenly",
//       width: "100%",
//     });

//     var w = new LetterButton("W");
//     var a = new LetterButton("A");
//     var s = new LetterButton("S");
//     var d = new LetterButton("D");

//     this.sideMenu.append(w.element);
//     this.secondRow.append(a.element);
//     this.secondRow.append(s.element);
//     this.secondRow.append(d.element);
//     this.sideMenu.append(this.secondRow);
//     this.sideMenu.append(this.score_element);
//   }
// }