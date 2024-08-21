const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const pausedLabel = document.getElementById("paused-label")

const OFFSET_X = 0;
const OFFSET_Y = 50;

// Set canvas size
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight - OFFSET_Y;
console.log("width", ctx.canvas.width);
console.log("height", ctx.canvas.height);

// Constants
const CELL_SIZE = 20;
const GRID_WIDTH = Math.floor(ctx.canvas.width / CELL_SIZE);
const GRID_HEIGHT = Math.floor(ctx.canvas.height / CELL_SIZE);
console.log("grid width", GRID_WIDTH);
console.log("grid height", GRID_HEIGHT);

const ALIVE = 1
const DIED = 0
const DIED_NEXT = 2

const GRID_LINE_COLOR = "#505050"
const ALIVE_COLOR = "#FFFFFF";
const DIED_COLOR = "#101010";
const DIED_NEXT_COLOR = "#CCCCCC";

// Global variables
let lastGridI = -1, lastGridJ = -1;
let mouseDown = false;
let mouseIsMoving = false;
let firstPause = true;
let pause = true;
let grid;
let intervalId;
let timeScale = 2;
let savedGrid;


function createGrid() {
    let grid = new Array(GRID_HEIGHT);
    for (let i = 0; i < GRID_HEIGHT; ++i) {
        grid[i] = new Array(GRID_WIDTH);
        for (let j = 0; j < GRID_WIDTH; ++j) {
            grid[i][j] = DIED;
        }
    }
    return grid;
}

function drawGrid(ctx, grid) {
    ctx.fillStyle = DIED_COLOR;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = GRID_LINE_COLOR;
    for (var i = 0; i < grid.length; ++i) {
        for (let j = 0; j < grid[i].length; ++j) {
            // Draw grid lines
            ctx.strokeRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
}

function fillCell(ctx, i, j) {
    ctx.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
}

function randerCell(ctx, grid) {
    for (var i = 0; i < grid.length; ++i) {
        for (let j = 0; j < grid[i].length; ++j) {
            if (grid[i][j] === DIED) {
                ctx.fillStyle = DIED_COLOR;
            } else if (grid[i][j] === DIED_NEXT) {
                ctx.fillStyle = DIED_NEXT_COLOR;
            } else if (grid[i][j] === ALIVE) {
                ctx.fillStyle = ALIVE_COLOR;
            }
            fillCell(ctx, i, j);
        }
    }
}

function cellOnClick(e, etype, grid) {
    if (pause === false) return;
    // console.log("mouse:", e.clientX, e.clientY)
    let i = Math.floor((e.clientY - OFFSET_Y) / CELL_SIZE);
    let j = Math.floor((e.clientX - OFFSET_X) / CELL_SIZE);
    if (i < 0 || j < 0) return;
    // console.log(i, j);

    if (etype === "mousemove") {
        if (mouseDown === false) return;
        mouseIsMoving = true;
        if (i === lastGridI && j === lastGridJ) return;
        lastGridI = i;
        lastGridJ = j;
    } else {
        if (mouseIsMoving === true) return;
    }

    // If outside the grid, do nothing
    if (j >= GRID_WIDTH || i >= GRID_HEIGHT) return;
    if (grid[i][j] === 1) {
        grid[i][j] = DIED;
    } else {
        grid[i][j] = ALIVE;
    }
    randerCell(ctx, grid);
}

function gameOfLife(grid) {
    // grid_next_gen is initialized with all dead cell
    let grid_next_gen = createGrid();
    let aliveNeighbor;
    for (i = 0; i < grid.length; ++i) {
        for (j = 0; j < grid[i].length; ++j) {
            // Count the alive neighbors around the cell
            aliveNeighbor = 0;
            for (let fi = i - 1; fi < i + 2; ++fi) {
                for (let fj = j - 1; fj < j + 2; ++fj) {
                    if (fi < 0 || fi >= GRID_HEIGHT || fj < 0 || fj >= GRID_WIDTH) {
                        continue;
                    } else if (fi === i && fj === j) {
                        continue;
                    }
                    if (grid[fi][fj] === ALIVE) {
                        aliveNeighbor += 1;
                    }
                }
            }
            // Determine the next generation of the cell
            if (grid[i][j] === ALIVE) {
                if (aliveNeighbor < 2 || aliveNeighbor > 3) {
                    grid_next_gen[i][j] = DIED_NEXT;
                } else {
                    grid_next_gen[i][j] = ALIVE;
                }
            } else {
                if (aliveNeighbor === 3) {
                    grid_next_gen[i][j] = ALIVE;
                }
            }
        }
    }
    return grid_next_gen;
}


document.body.onmousedown = function () {
    mouseDown = true;
    console.log("down")
}
document.body.onmouseup = function () {
    mouseDown = false;
}

document.addEventListener("mousemove", (e) => {
    cellOnClick(e, "mousemove", grid)
})

document.addEventListener("click", (e) => {
    cellOnClick(e, "click", grid)
    mouseIsMoving = false;
})

document.addEventListener("keydown", (e) => {
    console.log(e.code, timeScale)
    if (e.code === "Space") {
        if (pause === true) {
            // Save the grid pattern, in order to restore
            if (firstPause === true) {
                firstPause = false;
                savedGrid = grid;
            }
            pause = false;
            pausedLabel.textContent = "";
        } else {
            pause = true;
            console.log("pause");
            pausedLabel.textContent = "PAUSED, press spacebar to begin";
        }
    } else if (e.code === "KeyN") { // New
        grid = createGrid();
        firstPause = true;
        pause = true;
    } else if (e.code === "KeyR") { // Restore
        grid = savedGrid;
        pause = true;
    } else if (e.code === "ArrowUp" || e.code === "Period") { // Speed up
        clearInterval(intervalId);
        timeScale *= 2;
        intervalId = setInterval(gameLoop, 1000 / timeScale);
    } else if (e.code === "ArrowDown" || e.code === "Comma") { // Speed down
        clearInterval(intervalId);
        timeScale /= 2;
        if (timeScale <= 0.125) timeScale = 0.125;
        intervalId = setInterval(gameLoop, 1000 / timeScale);
    }
})


grid = createGrid()
drawGrid(ctx, grid);
function gameLoop() {
    if (pause === false) {
        grid = gameOfLife(grid)
    }
    randerCell(ctx, grid);
}

intervalId = setInterval(gameLoop, 1000 / timeScale);