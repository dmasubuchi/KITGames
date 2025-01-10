/********************************************************
 * 戦車ゲーム MVP 実装
 * 
 * - 1 or 2人プレイ
 * - 戦車(レベル1〜5)による速度 & 弾数制限
 * - NPCの簡易行動
 * - 基地HP 3
 * - 当たり判定（自分の弾が自分に当たらないように修正）
 * 
 * Canvasで描画 (width=600, height=400)
 ********************************************************/

// ゲームキャンバス
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// UI要素
const startButton = document.getElementById("startButton");
const messageArea = document.getElementById("messageArea");
const p1BaseHPSpan = document.getElementById("p1BaseHP");
const p2BaseHPSpan = document.getElementById("p2BaseHP");
const playerCountRadios = document.getElementsByName("playerCount");
const p2LevelWrap = document.getElementById("p2LevelWrap");
const npcLevelWrap = document.getElementById("npcLevelWrap");

// プレイヤーやNPCのステータス
let gameActive = false;
let playerCount = 1; // 1 or 2
let p1Level = 1;
let p2Level = 1;
let npcLevel = 1;

// 基地HP
let p1BaseHP = 3;
let p2BaseHP = 3; // 2人目 or NPC

// 戦車クラス
class Tank {
  constructor(x, y, level, isPlayer, color) {
    this.x = x;
    this.y = y;
    this.level = level;
    this.isPlayer = isPlayer; 
    this.color = color;

    // レベルに応じたパラメータ設定
    // 基本速度を 1.0 として、レベルで少しだけ加算
    this.speed = 1.0 + 0.2 * (this.level - 1);

    // 同時に存在できる弾数
    this.maxBullets = (this.level >= 4) ? 2 : 1;

    // 現在存在する弾数
    this.activeBullets = 0;

    // 生存フラグ
    this.alive = true;
  }

  // 戦車を描画 (シンプルに四角)
  draw() {
    if (!this.alive) return;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - 10, this.y - 10, 20, 20);
  }
}

// 弾クラス
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
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
      this.alive = false;
      if (this.owner) this.owner.activeBullets--;
    }
  }

  draw() {
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 障害物（四角形）クラス (MVPなので固定配置にする)
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

// 基地 (HP3)
class Base {
  constructor(x, y, w, h, color, owner) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;
    this.owner = owner; // "P1" or "P2/NPC"
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

// ゲーム内オブジェクト
let tank1, tank2; // tank2がNPCかプレイヤー2か
let bullets = [];
let obstacles = [];
let baseP1, baseP2; // 各陣営の基地

// NPC用
let npcFireCooldown = 0;
let npcMoveTimer = 0;
let npcTargetX = 0;
let npcTargetY = 0;

// ゲームループ用
let lastTime = 0;
const FPS = 60;
const frameDelay = 1000 / FPS;

// キー入力
let keys = {};

// イベントリスナー
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// スタートボタン
startButton.addEventListener("click", () => {
  // プレイヤー人数
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

// ラジオボタンの状態によって、プレイヤー2レベル or NPCレベルの表示を切り替え
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

playerCountRadios.forEach(radio => {
  radio.addEventListener("change", updateLevelSelectVisibility);
});
updateLevelSelectVisibility(); // 初期状態

//---------------------------------------------------
// ゲーム初期化
//---------------------------------------------------
function initGame() {
  gameActive = true;
  messageArea.textContent = "";
  p1BaseHP = 3;
  p2BaseHP = 3;
  p1BaseHPSpan.textContent = `P1基地HP: ${p1BaseHP}`;
  p2BaseHPSpan.textContent = `P2/NPC基地HP: ${p2BaseHP}`;

  // 障害物リセット
  obstacles = [];
  // 例: 中央付近に1つ置く
  obstacles.push(new Obstacle(250, 150, 100, 100));

  // 基地配置 (左端がP1, 右端がP2/NPC)
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
    // NPC用変数リセット
    npcFireCooldown = 0;
    npcMoveTimer = 0;
    npcTargetX = tank2.x;
    npcTargetY = tank2.y;
  }

  // 弾リスト
  bullets = [];

  // 描画ループ開始
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

//---------------------------------------------------
// メインループ
//---------------------------------------------------
function gameLoop(timestamp) {
  if (!gameActive) return; // ゲーム終了後は停止

  const delta = timestamp - lastTime;
  if (delta >= frameDelay) {
    update();
    draw();
    lastTime = timestamp;
  }
  requestAnimationFrame(gameLoop);
}

//---------------------------------------------------
// 更新処理
//---------------------------------------------------
function update() {
  if (!tank1.alive && !tank2.alive) {
    gameOver("引き分け(双方撃破)");
    return;
  } else if (!tank1.alive) {
    gameOver("P1 撃破… P2/NPCの勝利");
    return;
  } else if (!tank2.alive) {
    gameOver("P2/NPC 撃破… P1の勝利");
    return;
  }

  if (p1BaseHP <= 0) {
    gameOver("P1基地破壊… P2/NPCの勝利");
    return;
  } else if (p2BaseHP <= 0) {
    gameOver("P2/NPC基地破壊… P1の勝利");
    return;
  }

  // プレイヤー1操作
  if (tank1.alive) {
    handlePlayerMove(tank1, "P1");
  }

  // プレイヤー2 or NPC操作
  if (tank2.alive) {
    if (playerCount === 2) {
      handlePlayerMove(tank2, "P2");
    } else {
      // NPC
      npcBehavior();
    }
  }

  // 弾の更新
  bullets.forEach(b => {
    if (!b.alive) return;
    b.update();
    // 衝突判定
    checkBulletCollision(b);
  });
  // 消滅した弾を削除
  bullets = bullets.filter(b => b.alive);
}

//---------------------------------------------------
// 描画処理
//---------------------------------------------------
function draw() {
  // クリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 障害物描画
  obstacles.forEach(obs => obs.draw());

  // 基地描画
  baseP1.draw();
  baseP2.draw();

  // 戦車描画
  tank1.draw();
  tank2.draw();

  // 弾描画
  bullets.forEach(b => {
    if (b.alive) b.draw();
  });
}

//---------------------------------------------------
// プレイヤー/戦車の移動処理
//---------------------------------------------------
function handlePlayerMove(tank, playerTag) {
  if (!tank.alive) return;

  // キー設定
  let upKey, downKey, leftKey, rightKey, fireKey;
  if (playerCount === 2) {
    // 2人プレイ
    if (playerTag === "P1") {
      upKey = "w";
      downKey = "x"; // W/Xが上下
      leftKey = "a";
      rightKey = "d";
      fireKey = "s";
    } else {
      upKey = "ArrowUp";
      downKey = "ArrowDown";
      leftKey = "ArrowLeft";
      rightKey = "ArrowRight";
      fireKey = " ";
    }
  } else {
    // 1人プレイ => P1は矢印キーとスペース
    // => tank1がP1、tank2はNPC
    if (playerTag === "P1") {
      upKey = "ArrowUp";
      downKey = "ArrowDown";
      leftKey = "ArrowLeft";
      rightKey = "ArrowRight";
      fireKey = " ";
    }
  }

  // 移動ベクトル
  let vx = 0;
  let vy = 0;
  if (keys[upKey]) vy -= 1;
  if (keys[downKey]) vy += 1;
  if (keys[leftKey]) vx -= 1;
  if (keys[rightKey]) vx += 1;

  const len = Math.sqrt(vx*vx + vy*vy);
  if (len > 0) {
    vx /= len; // 単位ベクトル
    vy /= len;
    vx *= tank.speed;
    vy *= tank.speed;

    // 移動候補
    const newX = tank.x + vx;
    const newY = tank.y + vy;

    // 障害物衝突判定(単純なAABB)
    if (!checkObstacleCollision(newX, newY)) {
      tank.x = newX;
      tank.y = newY;
    }
  }

  // 攻撃
  if (keys[fireKey]) {
    shootBullet(tank);
  }
}

//---------------------------------------------------
// NPCの行動
//---------------------------------------------------
function npcBehavior() {
  if (!tank2.alive) return;

  // 1) 大砲発射(一定間隔)
  npcFireCooldown--;
  if (npcFireCooldown <= 0) {
    // プレイヤーの位置に向けて発射(ざっくり)
    let dx = tank1.x - tank2.x;
    let dy = tank1.y - tank2.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 0) {
      dx /= dist;
      dy /= dist;
      // NPCが砲撃
      shootBullet(tank2, dx, dy);
    }
    npcFireCooldown = 120; // 2秒(60fps換算)
  }

  // 2) 一定間隔でランダム移動
  npcMoveTimer--;
  if (npcMoveTimer <= 0) {
    npcTargetX = Math.random() * (canvas.width - 100) + 50;
    npcTargetY = Math.random() * (canvas.height - 100) + 50;
    npcMoveTimer = 180; // 3秒ごとに目標再設定
  }

  // 簡易パスファインディング(直線的に近づく)
  let dx = npcTargetX - tank2.x;
  let dy = npcTargetY - tank2.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
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
// 弾の発射
// 自分の弾が自分に当たらないよう、発射位置を少し前にずらす
//---------------------------------------------------
function shootBullet(tank, dxOverride, dyOverride) {
  if (!tank.alive) return;
  if (tank.activeBullets >= tank.maxBullets) return; // 同時発射数超過

  let vx = 0;
  let vy = 0;

  // (A) NPCなど、方向が渡されている場合
  if (typeof dxOverride === "number" && typeof dyOverride === "number") {
    vx = dxOverride;
    vy = dyOverride;
  } else {
    // (B) プレイヤーのキー入力方向を調べる
    let upKey, downKey, leftKey, rightKey;

    if (tank === tank1 && playerCount === 2) {
      // P1 (2人プレイ時)
      upKey = "w";
      downKey = "x";
      leftKey = "a";
      rightKey = "d";
      if (playerCount === 1) {
        // 実際には1人プレイでtank1の場合: 矢印キー
        upKey = "ArrowUp";
        downKey = "ArrowDown";
        leftKey = "ArrowLeft";
        rightKey = "ArrowRight";
      }
    } else if (tank === tank2 && playerCount === 2) {
      // P2
      upKey = "ArrowUp";
      downKey = "ArrowDown";
      leftKey = "ArrowLeft";
      rightKey = "ArrowRight";
    } else {
      // 1人プレイで tank1 のみ操作、NPCは dxOverride/dyOverride で動く
      upKey = "ArrowUp";
      downKey = "ArrowDown";
      leftKey = "ArrowLeft";
      rightKey = "ArrowRight";
    }

    let dirX = 0;
    let dirY = 0;
    if (keys[upKey]) dirY -= 1;
    if (keys[downKey]) dirY += 1;
    if (keys[leftKey]) dirX -= 1;
    if (keys[rightKey]) dirX += 1;

    const dist = Math.sqrt(dirX*dirX + dirY*dirY);
    if (dist === 0) {
      // もし方向キー押していないなら、仮に上方向(-1)に撃つ
      dirY = -1;
    } else {
      dirX /= dist; // 単位ベクトル化
      dirY /= dist;
    }
    vx = dirX;
    vy = dirY;
  }

  // 弾速は戦車の速度の 2.5 倍
  const bulletSpeed = tank.speed * 2.5;
  vx *= bulletSpeed;
  vy *= bulletSpeed;

  // ★★★★★ ここで「戦車の中心から少し前」に弾を出す ★★★★★
  // 戦車本体を半径10ピクセル程度と想定し、+数ピクセル先に弾を生成
  const offset = 14; // 戦車のサイズよりやや大きめのオフセット
  const startX = tank.x + (vx / bulletSpeed) * offset;
  const startY = tank.y + (vy / bulletSpeed) * offset;

  // 弾オブジェクト生成
  const bullet = new Bullet(startX, startY, vx, vy, tank);
  bullets.push(bullet);
  tank.activeBullets++;
}

//---------------------------------------------------
// 弾の衝突判定
//---------------------------------------------------
function checkBulletCollision(bullet) {
  if (!bullet.alive) return;

  // 障害物
  for (let obs of obstacles) {
    if (pointInRect(bullet.x, bullet.y, obs.x, obs.y, obs.w, obs.h)) {
      bullet.alive = false;
      bullet.owner.activeBullets--;
      return;
    }
  }

  // 基地
  // P1基地
  if (pointInRect(bullet.x, bullet.y, baseP1.x, baseP1.y, baseP1.w, baseP1.h)) {
    bullet.alive = false;
    bullet.owner.activeBullets--;
    if (bullet.owner !== null) {
      // 所有者がP1以外の場合、基地ダメージ
      if (bullet.owner !== tank1) {
        p1BaseHP--;
        p1BaseHPSpan.textContent = `P1基地HP: ${p1BaseHP}`;
      }
    }
    return;
  }
  // P2/NPC基地
  if (pointInRect(bullet.x, bullet.y, baseP2.x, baseP2.y, baseP2.w, baseP2.h)) {
    bullet.alive = false;
    bullet.owner.activeBullets--;
    if (bullet.owner !== null) {
      // 所有者がP2以外の場合、基地ダメージ
      if (bullet.owner !== tank2) {
        p2BaseHP--;
        p2BaseHPSpan.textContent = `P2/NPC基地HP: ${p2BaseHP}`;
      }
    }
    return;
  }

  // 戦車同士
  if (tank1.alive && bullet.owner !== tank1) {
    // 弾の座標がtank1の半径(10)以内なら命中
    if (pointInCircle(bullet.x, bullet.y, tank1.x, tank1.y, 10)) {
      tank1.alive = false;
      bullet.alive = false;
      bullet.owner.activeBullets--;
      return;
    }
  }
  if (tank2.alive && bullet.owner !== tank2) {
    // 弾の座標がtank2の半径(10)以内なら命中
    if (pointInCircle(bullet.x, bullet.y, tank2.x, tank2.y, 10)) {
      tank2.alive = false;
      bullet.alive = false;
      bullet.owner.activeBullets--;
      return;
    }
  }
}

//---------------------------------------------------
// 障害物衝突判定（AABB）
// tankを小さな四角(20x20)として衝突確認
//---------------------------------------------------
function checkObstacleCollision(x, y) {
  const halfSize = 10;
  for (let obs of obstacles) {
    if (rectOverlap(
      x - halfSize, y - halfSize, 20, 20,
      obs.x, obs.y, obs.w, obs.h
    )) {
      return true;
    }
  }
  return false;
}

//---------------------------------------------------
// ヘルパー関数
//---------------------------------------------------
function gameOver(msg) {
  gameActive = false;
  messageArea.textContent = `ゲーム終了: ${msg}`;
}

function pointInRect(px, py, rx, ry, rw, rh) {
  return (px >= rx && px <= rx + rw && py >= ry && py <= ry + rh);
}

function pointInCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return (dx*dx + dy*dy <= r*r);
}

function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return !(
    ax + aw < bx ||
    ax > bx + bw ||
    ay + ah < by ||
    ay > by + bh
  );
}
