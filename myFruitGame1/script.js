// HTML要素の取得
const gameContainer = document.getElementById("game-container");
const player = document.getElementById("player");
const startButton = document.getElementById("start-btn");
const scoreValue = document.getElementById("score-value");

// ゲームに使用する変数
let score = 0;
let isGameRunning = false;
let fruitSpawnIntervalId = null;
let gameLoopId = null;
let gameDuration = 30000; // 30秒 (ミリ秒)
let startTime = 0;
let playerSpeed = 10; // 左右移動スピード

//--------------------------------
// イベントリスナー
//--------------------------------

// ゲーム開始ボタンをクリックしたとき
startButton.addEventListener("click", () => {
  if (!isGameRunning) {
    startGame();
  }
});

// キーボード操作 (左右キー)
document.addEventListener("keydown", (e) => {
  if (!isGameRunning) return;

  if (e.key === "ArrowLeft") {
    movePlayer(-playerSpeed);
  } else if (e.key === "ArrowRight") {
    movePlayer(playerSpeed);
  }
});

//--------------------------------
// ゲーム開始
//--------------------------------
function startGame() {
  resetGame();

  isGameRunning = true;
  score = 0;
  scoreValue.textContent = score;

  // ゲーム開始時間を記録
  startTime = Date.now();

  // 一定間隔(1秒)でフルーツ生成
  fruitSpawnIntervalId = setInterval(spawnFruit, 1000);

  // メインゲームループ開始
  gameLoopId = requestAnimationFrame(gameLoop);
}

//--------------------------------
// ゲームリセット
//--------------------------------
function resetGame() {
  // 既存のフルーツ要素を削除
  const existingFruits = document.querySelectorAll(".fruit");
  existingFruits.forEach((fruit) => {
    fruit.remove();
  });

  // タイマーやループをクリア
  if (fruitSpawnIntervalId) {
    clearInterval(fruitSpawnIntervalId);
  }
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
  }

  // プレイヤーを中央へ配置
  player.style.left = "50%";
  player.style.transform = "translateX(-50%)";

  isGameRunning = false;
}

//--------------------------------
// フルーツ生成
//--------------------------------
function spawnFruit() {
  const fruit = document.createElement("div");
  fruit.classList.add("fruit");

  // 横位置をランダムに (gameContainer の幅を考慮)
  const fruitX = Math.random() * (gameContainer.clientWidth - 30);
  fruit.style.left = fruitX + "px";
  fruit.style.top = "0px";

  gameContainer.appendChild(fruit);
}

//--------------------------------
// メインゲームループ
//--------------------------------
function gameLoop() {
  // 時間経過チェック
  const elapsedTime = Date.now() - startTime;
  if (elapsedTime >= gameDuration) {
    endGame();
    return;
  }

  // フルーツを落下 (全ての.fruitを取得して動かす)
  const fruits = document.querySelectorAll(".fruit");
  fruits.forEach((fruit) => {
    let currentTop = parseInt(fruit.style.top);
    currentTop += 5; // 落下速度(ピクセル/フレーム)
    fruit.style.top = currentTop + "px";

    // 画面外(下端)に到達したら削除
    if (currentTop > gameContainer.clientHeight) {
      fruit.remove();
      return;
    }

    // 当たり判定 (fruit と player)
    if (isColliding(fruit, player)) {
      // スコアアップ
      score++;
      scoreValue.textContent = score;

      // キャッチしたフルーツは削除
      fruit.remove();
    }
  });

  // 次フレームをリクエスト (ループ継続)
  if (isGameRunning) {
    gameLoopId = requestAnimationFrame(gameLoop);
  }
}

//--------------------------------
// 当たり判定
//--------------------------------
function isColliding(a, b) {
  const aRect = a.getBoundingClientRect();
  const bRect = b.getBoundingClientRect();

  return !(
    aRect.right < bRect.left ||
    aRect.left > bRect.right ||
    aRect.bottom < bRect.top ||
    aRect.top > bRect.bottom
  );
}

//--------------------------------
// ゲーム終了
//--------------------------------
function endGame() {
  // フルーツ生成停止
  clearInterval(fruitSpawnIntervalId);
  // アニメーション停止
  cancelAnimationFrame(gameLoopId);

  isGameRunning = false;

  // 結果表示
  alert(`ゲーム終了！ スコア: ${score}`);
}

//--------------------------------
// プレイヤーを動かす
//--------------------------------
function movePlayer(dx) {
  const currentLeft = parseInt(window.getComputedStyle(player).left);
  let newLeft = currentLeft + dx;

  // 左端・右端の画面外に行かないように制限
  if (newLeft < 0) {
    newLeft = 0;
  }
  if (newLeft > gameContainer.clientWidth - player.clientWidth) {
    newLeft = gameContainer.clientWidth - player.clientWidth;
  }

  player.style.left = newLeft + "px";
}
