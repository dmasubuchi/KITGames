/******************************************************
 * script.js
 *
 *  - メインループ (毎フレーム)
 *  - 矢印キー (上下左右) を取得
 *  - 右側ログは最新10件のみ表示 (tail -10 的な動作)
 *  - ログには現在時刻を入れて表示
 ******************************************************/

// 要素参照
const arrowDisplay = document.getElementById("arrow-display");
const logContainer = document.getElementById("log-container");

// フレームカウント
let frameCount = 0;
// ログを保持する配列 (最大10件)
let logLines = [];
// 現在押された矢印
let lastArrowText = "No Input";

// ------------------------------
// キー入力受付
// ------------------------------
document.addEventListener("keydown", (e) => {
  let arrow = null;
  switch (e.key) {
    case "ArrowUp":
      arrow = "UP";
      break;
    case "ArrowDown":
      arrow = "DOWN";
      break;
    case "ArrowLeft":
      arrow = "LEFT";
      break;
    case "ArrowRight":
      arrow = "RIGHT";
      break;
    default:
      // その他のキーは無視
      return;
  }
  lastArrowText = arrow;
  // 画面中央の表示を更新
  arrowDisplay.textContent = arrow;

  // ログに「キー入力があった」旨を追加
  addLog(`Key: ${arrow}`);
});

// ------------------------------
// メインループ
// ------------------------------
function gameLoop() {
  frameCount++;

  // 毎フレームの情報をログに追加
  addLog(`Frame ${frameCount}`);

  // 次フレームへ
  requestAnimationFrame(gameLoop);
}

// ------------------------------
// ログを追加 (最大10件)
function addLog(message) {
  // 時刻を取得 (現在時刻)
  const now = new Date().toLocaleTimeString();
  const line = `[${now}] ${message}`;

  // 配列に追加
  logLines.push(line);

  // 10件を超えたら古いものを削除 (先頭を消す)
  if (logLines.length > 10) {
    logLines.shift();
  }

  // 画面への描画を更新
  renderLog();
}

// ------------------------------
// ログを画面に表示 (最新10行)
function renderLog() {
  // 内容をいったんクリア
  logContainer.innerHTML = "";

  // logLines に入っている文を順番に表示
  // 先頭（古い）→ 後ろ（新しい）
  for (let i = 0; i < logLines.length; i++) {
    const div = document.createElement("div");
    div.textContent = logLines[i];
    logContainer.appendChild(div);
  }

  // スクロール下に追従
  logContainer.scrollTop = logContainer.scrollHeight;
}

// ------------------------------
// 初期化
// ------------------------------
window.addEventListener("load", () => {
  // まだ何もログが無い状態でも表示を描画
  renderLog();
  // メインループ開始
  gameLoop();
});
