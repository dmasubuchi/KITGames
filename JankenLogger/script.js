/******************************************************
 * script.js
 * 
 * じゃんけんゲーム
 * - グー・チョキ・パーを選択
 * - CPUの手をランダム決定
 * - 勝敗を判定
 * - ローカルストレージに履歴保存
 * - 再読み込みしても履歴が残る
 * - 勝敗回数 & 勝率を表示
 ******************************************************/

// UI要素
const btnGu = document.getElementById("btn-gu");
const btnChoki = document.getElementById("btn-choki");
const btnPa = document.getElementById("btn-pa");
const resultArea = document.getElementById("result-area");
const historyList = document.getElementById("history-list");
const statsArea = document.getElementById("stats-area");

// ローカルストレージのキー
const STORAGE_KEY = "jankenGameHistory";

// ゲームの履歴 (配列)
let gameHistory = [];

// ------------------------------
// 起動時に履歴をロード
// ------------------------------
window.addEventListener("load", () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    gameHistory = JSON.parse(saved);
  }
  renderHistory();
  renderStats();
});

// ------------------------------
// ボタンイベント
// ------------------------------
btnGu.addEventListener("click", () => onUserPick("グー"));
btnChoki.addEventListener("click", () => onUserPick("チョキ"));
btnPa.addEventListener("click", () => onUserPick("パー"));

// ------------------------------
// ユーザーが手を選んだとき
// ------------------------------
function onUserPick(userHand) {
  const cpuHand = getCpuHand();
  const result = judgeResult(userHand, cpuHand);

  // 結果を画面に表示
  resultArea.textContent = `あなた: ${userHand} / CPU: ${cpuHand} → ${result}`;

  // 履歴に追加
  const timestamp = new Date().toLocaleString();
  const entry = {
    time: timestamp,
    user: userHand,
    cpu: cpuHand,
    result: result
  };
  gameHistory.push(entry);

  // ローカルストレージ保存
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameHistory));

  // 履歴と統計を再描画
  renderHistory();
  renderStats();
}

// ------------------------------
// CPUの手をランダムに決定
// ------------------------------
function getCpuHand() {
  const hands = ["グー", "チョキ", "パー"];
  const index = Math.floor(Math.random() * hands.length);
  return hands[index];
}

// ------------------------------
// 勝敗判定
// ------------------------------
function judgeResult(u, c) {
  if (u === c) return "あいこ";

  if (
    (u === "グー"   && c === "チョキ") ||
    (u === "チョキ" && c === "パー") ||
    (u === "パー"   && c === "グー")
  ) {
    return "あなたの勝ち";
  } else {
    return "あなたの負け";
  }
}

// ------------------------------
// 履歴描画 (新しい順)
// ------------------------------
function renderHistory() {
  historyList.innerHTML = "";
  const reversed = [...gameHistory].reverse();

  reversed.forEach(entry => {
    const div = document.createElement("div");
    div.textContent = `[${entry.time}] あなた:${entry.user} CPU:${entry.cpu} → ${entry.result}`;
    historyList.appendChild(div);
  });
}

// ------------------------------
// 勝率など統計情報を表示
// ------------------------------
function renderStats() {
  let wins = 0;
  let losses = 0;
  let draws = 0;

  gameHistory.forEach(entry => {
    if (entry.result === "あなたの勝ち") {
      wins++;
    } else if (entry.result === "あなたの負け") {
      losses++;
    } else {
      // あいこ
      draws++;
    }
  });

  const total = gameHistory.length;
  let winRate = 0;
  if (total > 0) {
    winRate = (wins / total) * 100;
  }

  // 表示用テキスト
  statsArea.innerHTML = `
    <div>対戦回数: ${total}</div>
    <div>勝ち: ${wins} / 負け: ${losses} / あいこ: ${draws}</div>
    <div>勝率: ${winRate.toFixed(1)}%</div>
  `;
}
