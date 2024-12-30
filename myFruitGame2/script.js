// ===============================
// 1) ロガークラス (ログ表示担当)
// ===============================
class Logger {
  constructor(logElementId) {
    this.logElement = document.getElementById(logElementId);
  }

  log(message) {
    // 現在時刻をつける
    const now = new Date().toLocaleTimeString();
    const newLog = `[${now}] ${message}\n`;
    this.logElement.textContent += newLog;

    // 自動的に下までスクロール
    this.logElement.scrollTop = this.logElement.scrollHeight;
  }
}

// ===============================
// 2) プレイヤークラス
// ===============================
class Player {
  constructor(elementId) {
    this.playerElement = document.getElementById(elementId);
    this.speed = 10;
  }

  move(dx) {
    // 現在のleft値を取得
    const currentLeft = parseInt(window.getComputedStyle(this.playerElement).left);
    const parentWidth = this.playerElement.parentElement.clientWidth;
    const playerWidth = this.playerElement.clientWidth;

    let newLeft = currentLeft + dx;
    // 画面外に出ないように制限
    if (newLeft < 0) newLeft = 0;
    if (newLeft > parentWidth - playerWidth) {
      newLeft = parentWidth - playerWidth;
    }
    this.playerElement.style.left = newLeft + "px";
  }

  getRect() {
    return this.playerElement.getBoundingClientRect();
  }
}

// ===============================
// 3) フルーツクラス (落下オブジェクト)
// ===============================
class Fruit {
  constructor(parentElement) {
    // DOM要素作成
    this.fruitElement = document.createElement("div");
    this.fruitElement.classList.add("fruit");
    parentElement.appendChild(this.fruitElement);

    // ランダム位置に配置
    const parentWidth = parentElement.clientWidth;
    this.fruitElement.style.left = Math.random() * (parentWidth - 30) + "px";
    this.fruitElement.style.top = "0px";
  }

  update() {
    let currentTop = parseInt(this.fruitElement.style.top);
    currentTop += 5; // 落下速度
    this.fruitElement.style.top = currentTop + "px";
  }

  isOutOfBounds(parentElement) {
    // 画面外（下端）に出たかどうか
    return parseInt(this.fruitElement.style.top) > parentElement.clientHeight;
  }

  remove() {
    this.fruitElement.remove();
  }

  getRect() {
    return this.fruitElement.getBoundingClientRect();
  }
}

// ===============================
// 4) ゲームエンジン (メインループなど)
// ===============================
class GameEngine {
  constructor(logger, gameAreaId, playerId, scoreValueId) {
    this.logger = logger; // ロガーインスタンス
    this.gameArea = document.getElementById(gameAreaId);
    this.player = new Player(playerId);
    this.scoreValueElement = document.getElementById(scoreValueId);

    this.fruits = [];           // 落下オブジェクト管理
    this.isGameRunning = false; // ゲーム進行中フラグ
    this.gameDuration = 30000;  // ゲーム時間（ms）
    this.startTime = 0;
    this.score = 0;
    this.fruitSpawnInterval = null;
    this.gameLoopId = null;
  }

  start() {
    // リセット
    this.reset();

    this.logger.log("ゲーム開始！");
    this.isGameRunning = true;
    this.startTime = Date.now();
    this.score = 0;
    this.scoreValueElement.textContent = this.score;

    // 一定間隔でフルーツ生成
    this.fruitSpawnInterval = setInterval(() => {
      const fruit = new Fruit(this.gameArea);
      this.fruits.push(fruit);
      this.logger.log("フルーツ生成");
    }, 1000);

    // メインループ開始
    this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
  }

  reset() {
    // 既存のフルーツを削除
    this.fruits.forEach((fruit) => fruit.remove());
    this.fruits = [];

    // ループとIntervalを停止
    if (this.fruitSpawnInterval) clearInterval(this.fruitSpawnInterval);
    if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);

    // プレイヤーを中央へ
    const playerElem = this.player.playerElement;
    playerElem.style.left = "50%";
    playerElem.style.transform = "translateX(-50%)";

    this.isGameRunning = false;
    this.logger.log("ゲームリセット");
  }

  gameLoop() {
    const elapsedTime = Date.now() - this.startTime;
    if (elapsedTime >= this.gameDuration) {
      this.end();
      return;
    }

    // フルーツを更新
    this.fruits.forEach((fruit, index) => {
      fruit.update();

      // 画面外に消えたら削除
      if (fruit.isOutOfBounds(this.gameArea)) {
        fruit.remove();
        this.fruits.splice(index, 1);
        this.logger.log("フルーツ消去（画面外）");
      }
      // 衝突判定
      else if (this.isColliding(fruit, this.player)) {
        this.score++;
        this.scoreValueElement.textContent = this.score;
        this.logger.log("フルーツキャッチ！ +1");
        fruit.remove();
        this.fruits.splice(index, 1);
      }
    });

    // 次フレームをリクエスト
    if (this.isGameRunning) {
      this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }
  }

  end() {
    this.logger.log("ゲーム終了！ スコア: " + this.score);
    clearInterval(this.fruitSpawnInterval);
    cancelAnimationFrame(this.gameLoopId);
    this.isGameRunning = false;

    alert(`ゲーム終了！ スコア: ${this.score}`);
  }

  isColliding(fruit, player) {
    const fRect = fruit.getRect();
    const pRect = player.getRect();
    return !(
      fRect.right < pRect.left ||
      fRect.left > pRect.right ||
      fRect.bottom < pRect.top ||
      fRect.top > pRect.bottom
    );
  }

  // キーイベント処理
  onKeyDown(e) {
    if (!this.isGameRunning) return;
    if (e.key === "ArrowLeft") {
      this.player.move(-this.player.speed);
      this.logger.log("プレイヤー移動：左");
    } else if (e.key === "ArrowRight") {
      this.player.move(this.player.speed);
      this.logger.log("プレイヤー移動：右");
    }
  }
}

// ===============================
// 5) メインスクリプト
// ===============================
const logger = new Logger("log-messages");
const gameEngine = new GameEngine(logger, "game-area", "player", "score-value");

// スタートボタン
document.getElementById("start-btn").addEventListener("click", () => {
  if (!gameEngine.isGameRunning) {
    gameEngine.start();
  }
});

// キーボード操作
document.addEventListener("keydown", (e) => {
  gameEngine.onKeyDown(e);
});
