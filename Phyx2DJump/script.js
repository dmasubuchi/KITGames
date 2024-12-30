
/******************************************************
 * script.js
 *
 * 2D物理ジャンプ + ランダムマップ生成 + リロードボタン
 * + explanation.html で下部の解説を読み込む
 ******************************************************/

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const reloadBtn = document.getElementById("reload-btn");

// キー状態
let keyLeft = false;
let keyRight = false;
let keyUp = false;

// プレイヤー
let player = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  width: 30,
  height: 30,
  mass: 1.0,
  onGround: false
};

// 障害物(ランダムで1～3個)
let obstacles = [];

// マップ: lineSegments (坂や床、壁)
// 例: 左半分が上り坂、右半分が下り坂、左右端が壁
let lineSegments = [
  // 床: 左からx=0～400で上昇
  { x1: 0,   y1: 400, x2: 400, y2: 350 },
  // 床: x=400～800で下降
  { x1: 400, y1: 350, x2: 800, y2: 400 },
  // 左壁
  { x1: 0,   y1: 0,   x2: 0,   y2: 400 },
  // 右壁
  { x1: 800, y1: 0,   x2: 800, y2: 400 }
];

// 物理定数
const GRAVITY = 0.3;
const FRICTION = 0.9;
const MOVE_SPEED = 0.3;
const JUMP_SPEED = -8;
const BOUNCE_FACTOR = 0.3;

// -------------- キーボード受付 --------------
document.addEventListener("keydown",(e)=>{
  switch(e.key){
    case "ArrowLeft":  keyLeft = true;  break;
    case "ArrowRight": keyRight = true; break;
    case "ArrowUp":    keyUp = true;    break;
  }
});
document.addEventListener("keyup",(e)=>{
  switch(e.key){
    case "ArrowLeft":  keyLeft = false; break;
    case "ArrowRight": keyRight = false;break;
    case "ArrowUp":    keyUp = false;   break;
  }
});

// -------------- リロードボタン --------------
reloadBtn.addEventListener("click", () => {
  initGame();
});

// -------------- ページロード時 --------------
window.addEventListener("load", () => {
  initGame();
  mainLoop();
});

/******************************************************
 * initGame
 * - プレイヤーをランダム位置に初期化
 * - 障害物を1～3個ランダム配置
 ******************************************************/
function initGame() {
  // プレイヤー
  player.x = Math.random()*100 + 50; // 50~150
  player.y = 50;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;

  // 障害物(1~3個)
  obstacles = [];
  const obstacleCount = Math.floor(Math.random()*3) + 1; // 1..3
  for(let i=0; i<obstacleCount; i++){
    obstacles.push({
      x: Math.random()*(canvas.width-60)+30,
      y: Math.random()*100+200,
      vx: 0,
      vy: 0,
      width: 40,
      height: 40,
      mass: 1.5
    });
  }
}

/******************************************************
 * mainLoop
 * - 毎フレーム update → draw
 ******************************************************/
function mainLoop() {
  updatePlayer();
  updateObstacles();
  drawScene();
  requestAnimationFrame(mainLoop);
}

/******************************************************
 * updatePlayer
 ******************************************************/
function updatePlayer() {
  // 入力による左右移動
  if(keyLeft) {
    player.vx -= MOVE_SPEED;
  }
  if(keyRight) {
    player.vx += MOVE_SPEED;
  }
  // ジャンプ
  if(keyUp && player.onGround) {
    player.vy = JUMP_SPEED;
    player.onGround = false;
  }

  // 重力 & 水平減衰
  player.vy += GRAVITY;
  player.vx *= FRICTION;

  // 位置を更新
  player.x += player.vx;
  player.y += player.vy;

  // マップ(坂や壁)との衝突
  player.onGround = false;
  checkLineSegmentsCollision(player);

  // 障害物衝突
  obstacles.forEach(obs => {
    handleCollisionRect(player, obs);
  });
}

/******************************************************
 * updateObstacles
 ******************************************************/
function updateObstacles() {
  obstacles.forEach(obs => {
    obs.vy += GRAVITY;
    obs.vx *= FRICTION;
    obs.x += obs.vx;
    obs.y += obs.vy;

    // マップ(坂や壁)との衝突
    checkLineSegmentsCollision(obs);

    // 障害物同士の衝突は省略(複数がぶつかる場合は同様のrect衝突で対応)
  });
}

/******************************************************
 * checkLineSegmentsCollision
 * - lineSegments(床や壁)と簡易衝突
 ******************************************************/
function checkLineSegmentsCollision(obj) {
  lineSegments.forEach(seg => {
    // bounding box
    const dx = seg.x2 - seg.x1;
    const dy = seg.y2 - seg.y1;

    // 垂直壁?
    if(Math.abs(dx) < 0.01) {
      // x付近で衝突
      let left = Math.min(seg.x1, seg.x2);
      let right = Math.max(seg.x1, seg.x2);
      if(obj.x + obj.width > left && obj.x < right) {
        // 衝突
        // x位置補正
        if(dx>0) {
          // 右壁
          obj.x = left - obj.width;
          obj.vx = -obj.vx*BOUNCE_FACTOR;
        } else {
          // 左壁
          obj.x = right;
          obj.vx = -obj.vx*BOUNCE_FACTOR;
        }
      }
    } else {
      // 傾斜床
      let minX = Math.min(seg.x1, seg.x2);
      let maxX = Math.max(seg.x1, seg.x2);

      // 中心x
      let centerX = obj.x + obj.width/2;
      if(centerX>=minX && centerX<=maxX){
        // t = (centerX - x1)/dx
        let t = (centerX - seg.x1)/dx;
        if(t>=0 && t<=1) {
          // lineY
          let lineY = seg.y1 + dy*t;
          // obj の下端 y+height が lineYより下に行かない
          if((obj.y + obj.height) > lineY) {
            obj.y = lineY - obj.height;
            obj.vy = -obj.vy*BOUNCE_FACTOR;

            // プレイヤーなら onGround = true
            if(obj === player){
              player.onGround = true;
            }
          }
        }
      }
    }
  });

  // Canvas左端 or 右端(念のため)
  if(obj.x<0) {
    obj.x = 0;
    obj.vx = -obj.vx*BOUNCE_FACTOR;
  }
  if(obj.x+obj.width>canvas.width) {
    obj.x = canvas.width - obj.width;
    obj.vx = -obj.vx*BOUNCE_FACTOR;
  }
  // 上端
  if(obj.y<0) {
    obj.y=0;
    obj.vy=-obj.vy*BOUNCE_FACTOR;
  }
  // 下端(今回不要なら省略)
  if(obj.y+obj.height>canvas.height) {
    obj.y = canvas.height-obj.height;
    obj.vy = -obj.vy*BOUNCE_FACTOR;
  }
}

/******************************************************
 * handleCollisionRect
 * - obj同士の衝突(単純なrect)
 ******************************************************/
function handleCollisionRect(a,b) {
  if(!isRectColliding(a,b)) return;

  // 重なりを解消
  const overlapX1 = (a.x + a.width) - b.x;
  const overlapX2 = (b.x + b.width) - a.x;
  const overlapY1 = (a.y + a.height) - b.y;
  const overlapY2 = (b.y + b.height) - a.y;
  const minXPen = Math.min(overlapX1, overlapX2);
  const minYPen = Math.min(overlapY1, overlapY2);

  // 水平 or 垂直どちらが小さいかで分離方向決定
  if(minXPen < minYPen){
    // 水平分離
    if(a.x<b.x) {
      a.x-=minXPen*0.5;
      b.x+=minXPen*0.5;
    } else {
      a.x+=minXPen*0.5;
      b.x-=minXPen*0.5;
    }
    // vx反転
    a.vx = -a.vx*BOUNCE_FACTOR;
    b.vx = -b.vx*BOUNCE_FACTOR;
  } else {
    // 垂直分離
    if(a.y<b.y) {
      a.y-=minYPen*0.5;
      b.y+=minYPen*0.5;
    } else {
      a.y+=minYPen*0.5;
      b.y-=minYPen*0.5;
    }
    // vy反転
    a.vy = -a.vy*BOUNCE_FACTOR;
    b.vy = -b.vy*BOUNCE_FACTOR;
  }
}

/******************************************************
 * isRectColliding
 ******************************************************/
function isRectColliding(r1,r2){
  if(r1.x+r1.width<r2.x) return false;
  if(r1.x>r2.x+r2.width) return false;
  if(r1.y+r1.height<r2.y) return false;
  if(r1.y>r2.y+r2.height) return false;
  return true;
}

/******************************************************
 * 描画
 ******************************************************/
function drawScene() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // lineSegments(坂や床、壁)を可視化
  ctx.strokeStyle="black";
  ctx.lineWidth=2;
  lineSegments.forEach(seg => {
    ctx.beginPath();
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
    ctx.stroke();
  });

  // プレイヤー(青)
  ctx.fillStyle="blue";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // 障害物(赤)
  ctx.fillStyle="red";
  obstacles.forEach(obs => {
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
  });
}
