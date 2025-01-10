/********************************************************
 * 戦車ゲーム MVP 実装 (改善版)
 * 
 * - 1 or 2人プレイ
 * - 戦車(レベル1〜5)による速度 & 弾数制限
 * - NPCの簡易行動
 * - 基地HP 3
 * - 当たり判定
 * - スペースキーのデフォルト動作阻止 (e.preventDefault())
 * - 自弾との衝突を確実に回避（オフセット＆衝突条件）
 * 
 * Canvasで描画 (width=600, height=400)
 ********************************************************/

// Canvas 要素
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// UI 要素
const startButton = document.getElementById("startButton");
const messageArea = document.getElementById("messageArea");
const p1BaseHPSpan = document.getElementById("p1BaseHP");
const p2BaseHPSpan = document.getElementById("p2BaseHP");
const playerCountRadios = document.getElementsByName("playerCount");
const p2LevelWrap = document.getElementById("p2LevelWrap");
const npcLevelWrap = document.getElementById("npcLevelWrap");

// ゲーム全体の状態
let gameActive = false;
let playerCount = 1; // 1 or 2
let p1Level = 1;
let p2Level = 1;
let npcLevel = 1;

// 基地 HP
let p1BaseHP = 3;
let p2BaseHP = 3; // 2人目 or NPC

//---------------------------------------------------
// 戦車クラス
//---------------------------------------------------
class Tank {
  constructor(x, y, level, isPlayer, color) {
    this.x = x;
    this.y = y;
    this.level = level;
    this.isPlayer = isPlayer; 
    this.color = color;

    // レベルに応じて速度をわずかに上昇
    this.speed = 1.0 + 0.2 * (this.level - 1);

    // 同時に存在できる弾数
    this.maxBullets = (this.level >= 4) ? 2 : 1;

    // 現在アクティブな弾
    this.activeBullets = 0;

    // 生存フラグ
    this.alive = true;
  }

  draw() {
    if (!this.alive) return;
    ctx.fillStyle = this.color;
    // シンプルに 20x20 の四角形
    ctx.fillRect(this.x - 10, this.y - 10, 20, 20);
  }
}

//---------------------------------------------------
// 弾クラス
//---------------------------------------------------
class Bullet {
  constructor(x, y, vx, vy, owner) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.owner = owner; // Tankオブジェクト
    this.alive = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // 画面外に出たら消滅
    if (
      this.x < 0 || this.x > canvas.width ||
      this.y < 0 || this.y > canvas.height
    ) {
      this.alive = false;
      if (this.owner) {
        this.owner.activeBullets--;
      }
    }
  }

  draw() {
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

//---------------------------------------------------
// 障害物クラス (MVP: 固定で一つ置く例のみ)
//---------------------------------------------------
class Obstacle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  draw() {
    ctx.fillStyle = "#666";
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

//---------------------------------------------------
// 基地クラス (HPはゲーム側で管理。ここでは描画のみ。)
//---------------------------------------------------
class Base {
  constructor(x, y, w, h, color, owner) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;
    this.owner = owner; // "P1" or "P2"
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

//---------------------------------------------------
// ゲーム用変数
//---------------------------------------------------
let tank1, tank2;        // 戦車
let bullets = [];        // 弾
let obstacles = [];      // 障害物
let baseP1, baseP2;      // 基地

// NPC用
let npcFireCooldown = 0;
let npcMoveTimer = 0;
let npcTargetX = 0;
let npcTargetY = 0;

// ゲームループ
let lastTime = 0;
const FPS = 60;
const frameDelay = 1000 / FPS;

// キー入力管理: "KeyW", "KeyS", "ArrowUp", "Space"など
let keys = {};

//---------------------------------------------------
// イベントリスナー
//---------------------------------------------------
document.addEventListener("keydown", (e) => {
  // スペースキーなどのデフォルト動作 (スクロール等) を無効化
  // 必要に応じて「該当キーのみ」preventDefault()する例
  if (
    e.code === "Space" ||           // スペースキー
    e.code === "ArrowUp" ||         // 上下左右キー
    e.code === "ArrowDown" ||
    e.code === "ArrowLeft" ||
    e.code === "ArrowRight"
  ) {
    e.preventDefault();
  }

  keys[e.code] = true;
});

document.addEventListener("keyup", (e) => {
  if (
    e.code === "Space" ||
    e.code === "ArrowUp" ||
    e.code === "ArrowDown" ||
    e.code === "ArrowLeft" ||
    e.code === "ArrowRight"
  ) {
    e.preventDefault();
  }

  keys[e.code] = false;
});

startButton.addEventListener("click", () => {
  // プレイヤー人数を取得
  for (let i = 0; i < playerCountRadios.length; i++) {
    if (playerCountRadios[i].checked) {
      playerCount = parseInt(playerCountRadios[i].value);
      break;
    }
  }
  p1Level = parseInt(document.getElementById("p1Level").value);
  p2Level = parseInt(document.getElementById("p2Level").value);
  npcLevel = parseInt(document.getElementById("npcLevel").value);

  initGame();
});

function updateLevelSelectVisibility() {
  let selectedCount = 1;
  for (let i = 0; i < playerCountRadios.length; i++) {
    if (playerCountRadios[i].checked) {
      selectedCount = parseInt(playerCountRadios[i].value);
      break;
    }
  }
  if (selectedCount === 1) {
    // 1人プレイ => NPC
    p2LevelWrap.classList.add("hidden");
    npcLevelWrap.classList.remove("hidden");
  } else {
    // 2人プレイ
    p2LevelWrap.classList.remove("hidden");
    npcLevelWrap.classList.add("hidden");
  }
}

// 初期状態のラジオボタン
playerCountRadios.forEach((radio) => {
  radio.addEventListener("change", updateLevelSelectVisibility);
});
updateLevelSelectVisibility();

//---------------------------------------------------
// ゲーム初期化
//---------------------------------------------------
function initGame() {
  gameActive = true;
  messageArea.textContent = "";

  // 基地HP初期化
  p1BaseHP = 3;
  p2BaseHP = 3;
  p1BaseHPSpan.textContent = `P1基地HP: ${p1BaseHP}`;
  p2BaseHPSpan.textContent = `P2/NPC基地HP: ${p2BaseHP}`;

  // 障害物リセット（ここでは1つだけ例で置く）
  obstacles = [];
  obstacles.push(new Obstacle(250, 150, 100, 100));

  // 基地配置 (左端が P1, 右端が P2/NPC)
  baseP1 = new Base(20, canvas.height / 2 - 30, 30, 60, "blue", "P1");
  baseP2 = new Base(canvas.width - 50, canvas.height / 2 - 30, 30, 60, "red", "P2");

  // 戦車配置
  tank1 = new Tank(60, canvas.height / 2, p1Level, true, "blue");

  if (playerCount === 2) {
    // プレイヤー2
    tank2 = new Tank(canvas.width - 60, canvas.height / 2, p2Level, true, "red");
  } else {
    // NPC
    tank2 = new Tank(canvas.width - 60, canvas.height / 2, npcLevel, false, "red");
    npcFireCooldown = 0;
    npcMoveTimer = 0;
    npcTargetX = tank2.x;
    npcTargetY = tank2.y;
  }

  bullets = [];

  // ゲームループ開始
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

//---------------------------------------------------
// メインループ
//---------------------------------------------------
function gameLoop(timestamp) {
  if (!gameActive) return;

  const delta = timestamp - lastTime;
  if (delta >= frameDelay) {
    update();
    draw();
    lastTime = timestamp;
  }
  requestAnimationFrame(gameLoop);
}

//---------------------------------------------------
// ゲーム更新
//---------------------------------------------------
function update() {
  // 両方死んだら引き分け
  if (!tank1.alive && !tank2.alive) {
    gameOver("引き分け(双方撃破)");
    return;
  }
  // どちらかが死んでいる
  if (!tank1.alive) {
    gameOver("P1 撃破… P2/NPCの勝利");
    return;
  }
  if (!tank2.alive) {
    gameOver("P2/NPC 撃破… P1の勝利");
    return;
  }

  // 基地HPチェック
  if (p1BaseHP <= 0) {
    gameOver("P1基地破壊… P2/NPCの勝利");
    return;
  }
  if (p2BaseHP <= 0) {
    gameOver("P2/NPC基地破壊… P1の勝利");
    return;
  }

  // プレイヤー1の操作
  if (tank1.alive) {
    handlePlayerMove(tank1, "P1");
  }

  // プレイヤー2 か NPC
  if (tank2.alive) {
    if (playerCount === 2) {
      handlePlayerMove(tank2, "P2");
    } else {
      // NPC行動
      npcBehavior();
    }
  }

  // 弾の更新
  bullets.forEach((b) => {
    if (!b.alive) return;
    b.update();
    checkBulletCollision(b);
  });

  // 生きている弾だけ残す
  bullets = bullets.filter((b) => b.alive);
}

//---------------------------------------------------
// ゲーム描画
//---------------------------------------------------
function draw() {
  // 画面クリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 障害物
  obstacles.forEach((obs) => obs.draw());

  // 基地描画
  baseP1.draw();
  baseP2.draw();

  // 戦車描画
  tank1.draw();
  tank2.draw();

  // 弾描画
  bullets.forEach((b) => {
    if (b.alive) {
      b.draw();
    }
  });
}

//---------------------------------------------------
// プレイヤー/戦車の移動処理
//---------------------------------------------------
function handlePlayerMove(tank, playerTag) {
  if (!tank.alive) return;

  // キー設定: e.code ベース
  let upCode, downCode, leftCode, rightCode, fireCode;

  if (playerCount === 2) {
    // 2人プレイ
    if (playerTag === "P1") {
      // A/D/W/X/S -> e.code で見るなら: KeyA, KeyD, KeyW, KeyX, KeyS
      upCode = "KeyW";    // W
      downCode = "KeyX";  // X
      leftCode = "KeyA";  // A
      rightCode = "KeyD"; // D
      fireCode = "KeyS";  // S
    } else {
      // プレイヤー2 -> 矢印キー + スペース
      upCode = "ArrowUp";
      downCode = "ArrowDown";
      leftCode = "ArrowLeft";
      rightCode = "ArrowRight";
      fireCode = "Space";
    }
  } else {
    // 1人プレイ -> tank1 は矢印 + スペース
    if (playerTag === "P1") {
      upCode = "ArrowUp";
      downCode = "ArrowDown";
      leftCode = "ArrowLeft";
      rightCode = "ArrowRight";
      fireCode = "Space";
    }
  }

  // 移動ベクトル
  let vx = 0;
  let vy = 0;
  if (keys[upCode]) vy -= 1;
  if (keys[downCode]) vy += 1;
  if (keys[leftCode]) vx -= 1;
  if (keys[rightCode]) vx += 1;

  const len = Math.sqrt(vx * vx + vy * vy);
  if (len > 0) {
    vx /= len; 
    vy /= len;
    vx *= tank.speed;
    vy *= tank.speed;

    const newX = tank.x + vx;
    const newY = tank.y + vy;
    // 障害物判定
    if (!checkObstacleCollision(newX, newY)) {
      tank.x = newX;
      tank.y = newY;
    }
  }

  // 発射
  if (keys[fireCode]) {
    shootBullet(tank);
  }
}

//---------------------------------------------------
// NPCの行動
//---------------------------------------------------
function npcBehavior() {
  if (!tank2.alive) return;

  // 一定間隔で砲撃
  npcFireCooldown--;
  if (npcFireCooldown <= 0) {
    // tank1(プレイヤー)に向けて発射
    let dx = tank1.x - tank2.x;
    let dy = tank1.y - tank2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      dx /= dist;
      dy /= dist;
      shootBullet(tank2, dx, dy); 
    }
    npcFireCooldown = 120; // 2秒周期(60FPS換算)
  }

  // 一定間隔でランダム移動
  npcMoveTimer--;
  if (npcMoveTimer <= 0) {
    npcTargetX = Math.random() * (canvas.width - 100) + 50;
    npcTargetY = Math.random() * (canvas.height - 100) + 50;
    npcMoveTimer = 180; // 3秒周期
  }

  // 簡易パスファインディング (直線移動)
  let dx = npcTargetX - tank2.x;
  let dy = npcTargetY - tank2.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 5) {
    dx /= dist;
    dy /= dist;
    dx *= tank2.speed;
    dy *= tank2.speed;
    const newX = tank2.x + dx;
    const newY = tank2.y + dy;
    if (!checkObstacleCollision(newX, newY)) {
      tank2.x = newX;
      tank2.y = newY;
    }
  }
}

//---------------------------------------------------
// 弾の発射 (自機から少しオフセットして生成)
//---------------------------------------------------
function shootBullet(tank, dxOverride, dyOverride) {
  if (!tank.alive) return;
  if (tank.activeBullets >= tank.maxBullets) return; // 同時発射数制限

  // 弾の方向ベクトル
  let dirX = 0;
  let dirY = 0;

  if (typeof dxOverride === "number" && typeof dyOverride === "number") {
    // NPC用
    dirX = dxOverride;
    dirY = dyOverride;
  } else {
    // プレイヤー用: 現在の移動キー方向を参照
    // (または直前に押した方向を保持する方式も可)
    // ここでは簡易的に "直近フレームのキー状態" で方向を決定
    let upCode, downCode, leftCode, rightCode;
    if (tank === tank1 && playerCount === 2) {
      // P1 のキー
      upCode = "KeyW";
      downCode = "KeyX";
      leftCode = "KeyA";
      rightCode = "KeyD";
      // もし1人プレイの場合
      if (playerCount === 1) {
        upCode = "ArrowUp";
        downCode = "ArrowDown";
        leftCode = "ArrowLeft";
        rightCode = "ArrowRight";
      }
    } else if (tank === tank2 && playerCount === 2) {
      // P2 のキー
      upCode = "ArrowUp";
      downCode = "ArrowDown";
      leftCode = "ArrowLeft";
      rightCode = "ArrowRight";
    } else {
      // 1人プレイで tank1 のみ
      upCode = "ArrowUp";
      downCode = "ArrowDown";
      leftCode = "ArrowLeft";
      rightCode = "ArrowRight";
    }

    if (keys[upCode]) dirY -= 1;
    if (keys[downCode]) dirY += 1;
    if (keys[leftCode]) dirX -= 1;
    if (keys[rightCode]) dirX += 1;

    let d = Math.sqrt(dirX * dirX + dirY * dirY);
    if (d === 0) {
      // キーが無ければ仮に上方向に撃つ
      dirY = -1;
    } else {
      dirX /= d;
      dirY /= d;
    }
  }

  // 弾速 = 戦車の速度 * 2.5
  const bulletSpeed = tank.speed * 2.5;
  let vx = dirX * bulletSpeed;
  let vy = dirY * bulletSpeed;

  // 戦車中心から少し前方に弾を生成 (自機衝突を防ぐ)
  const offset = 14; 
  const startX = tank.x + (dirX * offset);
  const startY = tank.y + (dirY * offset);

  const bullet = new Bullet(startX, startY, vx, vy, tank);
  bullets.push(bullet);
  tank.activeBullets++;
}

//---------------------------------------------------
// 弾の衝突判定
//---------------------------------------------------
function checkBulletCollision(bullet) {
  if (!bullet.alive) return;

  // 1) 障害物との衝突
  for (let obs of obstacles) {
    if (pointInRect(bullet.x, bullet.y, obs.x, obs.y, obs.w, obs.h)) {
      bullet.alive = false;
      bullet.owner.activeBullets--;
      return;
    }
  }

  // 2) 基地への衝突
  // P1基地
  if (pointInRect(bullet.x, bullet.y, baseP1.x, baseP1.y, baseP1.w, baseP1.h)) {
    bullet.alive = false;
    bullet.owner.activeBullets--;
    // 自分の基地なら無効化 (弾だけ消える)
    if (bullet.owner !== tank1) {
      p1BaseHP--;
      p1BaseHPSpan.textContent = `P1基地HP: ${p1BaseHP}`;
    }
    return;
  }
  // P2/NPC基地
  if (pointInRect(bullet.x, bullet.y, baseP2.x, baseP2.y, baseP2.w, baseP2.h)) {
    bullet.alive = false;
    bullet.owner.activeBullets--;
    // 自分の基地なら無効化
    if (bullet.owner !== tank2) {
      p2BaseHP--;
      p2BaseHPSpan.textContent = `P2/NPC基地HP: ${p2BaseHP}`;
    }
    return;
  }

  // 3) 戦車との衝突
  //    - 自分の弾が自分に当たらないようにする (owner !== 該当戦車)
  if (tank1.alive && bullet.owner !== tank1) {
    if (pointInCircle(bullet.x, bullet.y, tank1.x, tank1.y, 10)) {
      tank1.alive = false;
      bullet.alive = false;
      bullet.owner.activeBullets--;
      return;
    }
  }
  if (tank2.alive && bullet.owner !== tank2) {
    if (pointInCircle(bullet.x, bullet.y, tank2.x, tank2.y, 10)) {
      tank2.alive = false;
      bullet.alive = false;
      bullet.owner.activeBullets--;
      return;
    }
  }
}

//---------------------------------------------------
// 障害物との衝突判定 (AABB)
// 戦車は 20x20, 中心 (x,y) から半径10の四角形とみなす
//---------------------------------------------------
function checkObstacleCollision(x, y) {
  const halfSize = 10;
  for (let obs of obstacles) {
    if (
      rectOverlap(
        x - halfSize, y - halfSize, 20, 20,
        obs.x, obs.y, obs.w, obs.h
      )
    ) {
      return true;
    }
  }
  return false;
}

//---------------------------------------------------
// ゲーム終了処理
//---------------------------------------------------
function gameOver(msg) {
  gameActive = false;
  messageArea.textContent = `ゲーム終了: ${msg}`;
}

//---------------------------------------------------
// 当たり判定用ユーティリティ関数
//---------------------------------------------------
function pointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function pointInCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return !(
    ax + aw < bx ||
    ax > bx + bw ||
    ay + ah < by ||
    ay > by + bh
  );
}
