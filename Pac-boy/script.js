/********************************************************************
 * Pac-boy (Pac-Man風 MVP)
 *
 * 修正ポイント:
 * - ゴーストの速度に掛ける係数 ghostSlow を導入し、初期値を 0.3 に設定
 * - ghosts の速度は (ghostSlow) を使って一括管理
 ********************************************************************/

let canvas, ctx;
let score = 0;
let gameRunning = false;
let animationFrameId;
let pelletsRemaining = 0;
let statusMessageElement;

// ゴースト全体の速度に掛ける係数
let ghostSlow = 0.05;

// マップデータ (外周が壁)
const map = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,1,0,0,0,0,0,0,1,0],
  [0,1,0,1,1,1,1,1,1,1,1,0,1,0],
  [0,1,1,1,0,1,0,0,0,0,1,1,1,0],
  [0,1,0,1,1,1,0,0,0,1,1,0,1,0],
  [0,1,1,1,1,1,1,0,1,1,1,1,1,0],
  [0,1,0,0,0,1,1,1,1,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const TILE_SIZE = 32;
const ROWS = map.length;    
const COLS = map[0].length; 

// Pac-boy (プレイヤー)
const player = {
  x: 1,
  y: 1,
  color: "yellow"
};

/**
 * ゴーストは speed と moveCounter を持ち、
 * speed * ghostSlow に基づいて動きを制御する。
 */
const ghosts = [
  { x: 5, y: 5, color: "red",    dirX: 0, dirY: 0, speed: 1.0, moveCounter: 0 },
  { x: 6, y: 5, color: "pink",   dirX: 0, dirY: 0, speed: 1.0, moveCounter: 0 },
  { x: 7, y: 5, color: "cyan",   dirX: 0, dirY: 0, speed: 1.0, moveCounter: 0 },
  { x: 8, y: 5, color: "orange", dirX: 0, dirY: 0, speed: 1.0, moveCounter: 0 }
];

// ====== イベントリスナー (キー1回押すと1マスだけ移動) ======
window.addEventListener("keydown", (e) => {
  if (!gameRunning) return;

  let dx = 0, dy = 0;
  switch(e.key) {
    case "ArrowUp":    dy = -1; break;
    case "ArrowDown":  dy =  1; break;
    case "ArrowLeft":  dx = -1; break;
    case "ArrowRight": dx =  1; break;
    default: return;
  }

  const nextX = player.x + dx;
  const nextY = player.y + dy;

  if (!isWall(nextX, nextY)) {
    player.x = nextX;
    player.y = nextY;
    // 餌を食べる
    if (map[nextY][nextX] === 1) {
      map[nextY][nextX] = 2;
      pelletsRemaining--;
      updateScore(10);
      if (pelletsRemaining === 0) {
        gameClear();
      }
    }
    // ゴースト衝突判定
    if (checkGhostCollision()) {
      gameOver();
    }
  }
});

// 初期化
function init() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  statusMessageElement = document.getElementById("statusMessage");

  // マップ内の餌数を数える
  pelletsRemaining = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (map[row][col] === 1) {
        pelletsRemaining++;
      }
    }
  }
}

// ゲーム開始
function startGame() {
  score = 0;
  updateScore(0);
  gameRunning = true;
  statusMessageElement.textContent = "";

  // プレイヤー初期位置
  player.x = 1; 
  player.y = 1;

  // ゴースト初期位置 (速度系リセット)
  ghosts[0].x = 5; ghosts[0].y = 5; ghosts[0].dirX = 0; ghosts[0].dirY = 0; ghosts[0].moveCounter = 0;
  ghosts[1].x = 6; ghosts[1].y = 5; ghosts[1].dirX = 0; ghosts[1].dirY = 0; ghosts[1].moveCounter = 0;
  ghosts[2].x = 7; ghosts[2].y = 5; ghosts[2].dirX = 0; ghosts[2].dirY = 0; ghosts[2].moveCounter = 0;
  ghosts[3].x = 8; ghosts[3].y = 5; ghosts[3].dirX = 0; ghosts[3].dirY = 0; ghosts[3].moveCounter = 0;

  // マップリセット
  resetMap();

  // ゲームループ開始
  gameLoop();
}

// ====== ゲームループ ======
function gameLoop() {
  if (!gameRunning) return;

  // ゴースト移動
  moveGhosts();

  // 衝突チェック
  if (checkGhostCollision()) {
    gameOver();
    return;
  }

  // 描画
  draw();

  animationFrameId = requestAnimationFrame(gameLoop);
}

// ====== ゴースト移動 (ghostSlow を適用) ======
function moveGhosts() {
  ghosts.forEach((ghost) => {
    // ghost.speed * ghostSlow を毎フレーム加算
    ghost.moveCounter += (ghost.speed * ghostSlow);

    // moveCounter >= 1 になった時点で1マス移動
    if (ghost.moveCounter >= 1) {
      ghost.moveCounter = 0;

      // 移動先
      const nextX = ghost.x + ghost.dirX;
      const nextY = ghost.y + ghost.dirY;

      // ランダム方向転換 or 移動先が壁の場合に向きを変える
      if (Math.random() < 0.02 || isWall(nextX, nextY)) {
        const dirs = [
          { x:  1, y:  0 },
          { x: -1, y:  0 },
          { x:  0, y:  1 },
          { x:  0, y: -1 }
        ];
        const randDir = dirs[Math.floor(Math.random() * dirs.length)];
        ghost.dirX = randDir.x;
        ghost.dirY = randDir.y;
      }

      // 再度移動先を計算
      const newX = ghost.x + ghost.dirX;
      const newY = ghost.y + ghost.dirY;
      // 壁でなければ更新
      if (!isWall(newX, newY)) {
        ghost.x = newX;
        ghost.y = newY;
      }
    }
  });
}

// ====== ゴースト衝突判定 ======
function checkGhostCollision() {
  for (const ghost of ghosts) {
    if (ghost.x === player.x && ghost.y === player.y) {
      return true;
    }
  }
  return false;
}

// ====== 描画 ======
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawMap();
  drawPacBoy(player.x, player.y, player.color);
  ghosts.forEach((ghost) => {
    drawGhost(ghost.x, ghost.y, ghost.color);
  });
}

// ====== マップ描画 ======
function drawMap() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tile = map[row][col];
      if (tile === 0) {
        ctx.fillStyle = "blue";
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else if (tile === 1) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        const centerX = col * TILE_SIZE + TILE_SIZE / 2;
        const centerY = row * TILE_SIZE + TILE_SIZE / 2;
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // tile === 2 => 道 (餌なし) なので塗らない
    }
  }
}

// ====== Pac-boy(黄色円) 描画 ======
function drawPacBoy(x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const centerX = x * TILE_SIZE + TILE_SIZE / 2;
  const centerY = y * TILE_SIZE + TILE_SIZE / 2;
  ctx.arc(centerX, centerY, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
}

// ====== ゴースト(菱形) 描画 ======
function drawGhost(x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const centerX = x * TILE_SIZE + TILE_SIZE / 2;
  const centerY = y * TILE_SIZE + TILE_SIZE / 2;
  const halfSize = TILE_SIZE / 2 - 2;
  ctx.moveTo(centerX, centerY - halfSize);      
  ctx.lineTo(centerX + halfSize, centerY);      
  ctx.lineTo(centerX, centerY + halfSize);      
  ctx.lineTo(centerX - halfSize, centerY);      
  ctx.closePath();
  ctx.fill();
}

// ====== 壁チェック ======
function isWall(x, y) {
  if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return true;
  return (map[y][x] === 0);
}

// ====== マップをリセット ======
function resetMap() {
  pelletsRemaining = 0;
  const originalMap = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,1,0,0,0,0,0,0,1,0],
    [0,1,0,1,1,1,1,1,1,1,1,0,1,0],
    [0,1,1,1,0,1,0,0,0,0,1,1,1,0],
    [0,1,0,1,1,1,0,0,0,1,1,0,1,0],
    [0,1,1,1,1,1,1,0,1,1,1,1,1,0],
    [0,1,0,0,0,1,1,1,1,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      map[r][c] = originalMap[r][c];
      if (map[r][c] === 1) {
        pelletsRemaining++;
      }
    }
  }
}

// ====== スコア更新 ======
function updateScore(add) {
  score += add;
  document.getElementById("scoreDisplay").textContent = "Score: " + score;
}

// ====== ゲームクリア ======
function gameClear() {
  gameRunning = false;
  statusMessageElement.textContent = "YOU WIN!";
  cancelAnimationFrame(animationFrameId);
}

// ====== ゲームオーバー ======
function gameOver() {
  gameRunning = false;
  statusMessageElement.textContent = "GAME OVER!";
  cancelAnimationFrame(animationFrameId);
}

// ====== ウィンドウロード時初期化 & スタートボタン ======
window.onload = () => {
  init();
  document.getElementById("startButton").addEventListener("click", () => {
    if (!gameRunning) {
      startGame();
    }
  });
};
