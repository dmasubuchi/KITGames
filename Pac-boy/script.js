const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');

canvas.width = 500;
canvas.height = 500;

const tileSize = 25;
const rows = 9;
const cols = 10;
let gameRunning = false;

// Game State
const pacman = { x: 1, y: 1, direction: "right" };
let score = 0;
const ghosts = [
    { x: 8, y: 8, direction: "random" }, // Random moving ghost
    { x: 7, y: 7, direction: "chase" }, // Chasing ghost
    { x: 5, y: 5, direction: "ambush" }, // Ambush ghost
    { x: 3, y: 3, direction: "patrol", patrolPoints: [[3, 3], [3, 8], [8, 8]] } // Patrol ghost
];
const pellets = [];

// Map (0: empty, 1: pellet, 9: wall)
const map = [
    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
    [9, 1, 1, 1, 1, 1, 1, 1, 1, 9],
    [9, 1, 9, 9, 1, 9, 9, 9, 1, 9],
    [9, 1, 1, 1, 1, 1, 1, 1, 1, 9],
    [9, 1, 9, 9, 9, 9, 9, 9, 1, 9],
    [9, 1, 1, 1, 1, 1, 1, 1, 1, 9],
    [9, 1, 9, 9, 9, 9, 9, 9, 1, 9],
    [9, 1, 1, 1, 1, 1, 1, 1, 1, 9],
    [9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
];

// Initialize pellets
for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
        if (map[y][x] === 1) {
            pellets.push({ x, y });
        }
    }
}

// Function to move Pac-man
function movePacman() {
    switch (pacman.direction) {
        case "right":
            if (map[pacman.y][pacman.x + 1] !== 9) pacman.x++;
            break;
        case "left":
            if (map[pacman.y][pacman.x - 1] !== 9) pacman.x--;
            break;
        case "up":
            if (map[pacman.y - 1][pacman.x] !== 9) pacman.y--;
            break;
        case "down":
            if (map[pacman.y + 1][pacman.x] !== 9) pacman.y++;
            break;
    }
}

// Function to move ghosts
function moveGhosts() {
    ghosts.forEach(ghost => {
        // Simple random movement for demonstration
        const directions = ["right", "left", "up", "down"];
        ghost.direction = directions[Math.floor(Math.random() * directions.length)];
        switch (ghost.direction) {
            case "right":
                if (map[ghost.y][ghost.x + 1] !== 9) ghost.x++;
                break;
            case "left":
                if (map[ghost.y][ghost.x - 1] !== 9) ghost.x--;
                break;
            case "up":
                if (map[ghost.y - 1][ghost.x] !== 9) ghost.y--;
                break;
            case "down":
                if (map[ghost.y + 1][ghost.x] !== 9) ghost.y++;
                break;
        }
    });
}

// Function to update the game state
function update() {
    movePacman();
    moveGhosts();
    // Check collisions (implement collision logic here)
}

// Function to render the game
function render() {
    console.log('Rendering...');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render the map
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (map[y][x] === 9) {
                ctx.fillStyle = 'blue';
                ctx.fillRect(x * 40, y * 40, 40, 40);
            } else if (pellets.some(p => p.x === x && p.y === y)) {
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(x * 40 + 20, y * 40 + 20, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Render Pac-man
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(pacman.x * 40 + 20, pacman.y * 40 + 20, 20, 0, Math.PI * 2);
    ctx.fill();

    // Render ghosts
    ctx.fillStyle = 'red';
    ghosts.forEach(ghost => {
        ctx.beginPath();
        ctx.arc(ghost.x * 40 + 20, ghost.y * 40 + 20, 20, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Game loop
function gameLoop() {
    if (gameRunning) {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }
}

// Start button event listener
startButton.addEventListener('click', () => {
    gameRunning = true;
    startButton.style.display = 'none';
    gameLoop();
});

// Keyboard event listener for Pac-man movement
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowRight':
            pacman.direction = 'right';
            break;
        case 'ArrowLeft':
            pacman.direction = 'left';
            break;
        case 'ArrowUp':
            pacman.direction = 'up';
            break;
        case 'ArrowDown':
            pacman.direction = 'down';
            break;
    }
});
