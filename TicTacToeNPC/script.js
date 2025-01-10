/***************************************
 * 3目並べ (Tic-Tac-Toe) バトル
 * index.html と style.css の要件を満たす
 * 純粋なJavaScript実装
 ***************************************/

// グローバル変数
let board = [];           // ゲーム盤(3x3)を2次元配列で管理
let currentPlayer = "X";  // 現在のプレイヤー ("X" or "O")
let gameActive = false;   // ゲーム中かどうか
let playerWins = 0;
let computerWins = 0;
let draws = 0;

// カーソル位置 (0〜2, 0〜2)
let cursorRow = 0;
let cursorCol = 0;

// 難易度関連
let difficultyLevel = "easy"; // "easy", "medium", "hard"

// 乱数判定用: コンピューターのミス確率
// 初級:  Y + 0 と Xの比較
// 中級:  Y - 20 と Xの比較
// 上級:  Y - 35 と Xの比較
// （仕様に忠実にするにはさらに細かいループなどあるが、ここでは簡略化して実装）
function shouldMakeMistake() {
  const X = Math.floor(Math.random() * 10) + 1; // 1〜10
  const Y = Math.floor(Math.random() * 10) + 1; // 1〜10

  let offset = 0;
  if (difficultyLevel === "medium") {
    offset = -20;
  } else if (difficultyLevel === "hard") {
    offset = -35;
  }

  // Yにoffsetを加算
  const adjustedY = Y + offset;
  
  // adjustedY > X ならミスする
  return adjustedY > X;
}

// スコアの表示更新
function updateScoreDisplay() {
  document.getElementById("playerWins").textContent = playerWins;
  document.getElementById("computerWins").textContent = computerWins;
  document.getElementById("draws").textContent = draws;
}

// ターン表示の更新
function updateTurnInfo() {
  const turnInfo = document.getElementById("currentTurn");
  turnInfo.textContent = (currentPlayer === "X") ? "プレイヤー(X)" : "コンピュータ(O)";
}

// ゲームボードを初期化
function resetBoard() {
  board = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""]
  ];
}

// ゲームボードを再描画
function renderBoard() {
  const boardContainer = document.getElementById("gameBoard");
  boardContainer.innerHTML = ""; // 一旦クリア

  for (let row = 0; row < 3; row++) {
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("board-row");

    for (let col = 0; col < 3; col++) {
      const cellDiv = document.createElement("div");
      cellDiv.classList.add("cell");

      // カーソル位置ならハイライト
      if (row === cursorRow && col === cursorCol) {
        cellDiv.classList.add("cursor");
      }

      if (board[row][col] === "X") {
        cellDiv.textContent = "X";
        cellDiv.classList.add("X");
      } else if (board[row][col] === "O") {
        cellDiv.textContent = "O";
        cellDiv.classList.add("O");
      }

      rowDiv.appendChild(cellDiv);
    }
    boardContainer.appendChild(rowDiv);
  }
}

// 指定のプレイヤーが勝ったかどうか
function checkWin(player) {
  // 横3列
  for (let r = 0; r < 3; r++) {
    if (board[r][0] === player && board[r][1] === player && board[r][2] === player) {
      return true;
    }
  }
  // 縦3列
  for (let c = 0; c < 3; c++) {
    if (board[0][c] === player && board[1][c] === player && board[2][c] === player) {
      return true;
    }
  }
  // 斜め2パターン
  if (board[0][0] === player && board[1][1] === player && board[2][2] === player) {
    return true;
  }
  if (board[0][2] === player && board[1][1] === player && board[2][0] === player) {
    return true;
  }
  return false;
}

// 盤が埋まったかどうか
function isBoardFull() {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[r][c] === "") {
        return false;
      }
    }
  }
  return true;
}

// ゲーム終了時の処理
function endGame(result) {
  gameActive = false;
  if (result === "X") {
    playerWins++;
    alert("プレイヤー(X)の勝ち！");
  } else if (result === "O") {
    computerWins++;
    alert("コンピュータ(O)の勝ち！");
  } else {
    draws++;
    alert("引き分け！");
  }
  updateScoreDisplay();
}

// コンピューターが最適手を探す（超簡易版）
function getBestMove() {
  // 1. まずコンピューターが勝てる一手があればそこを打つ
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[r][c] === "") {
        board[r][c] = "O";
        if (checkWin("O")) {
          board[r][c] = "";
          return { row: r, col: c };
        }
        board[r][c] = "";
      }
    }
  }
  // 2. 次に、プレイヤー(X)の勝ちを阻止できるならそこを打つ
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[r][c] === "") {
        board[r][c] = "X";
        if (checkWin("X")) {
          board[r][c] = "";
          return { row: r, col: c };
        }
        board[r][c] = "";
      }
    }
  }
  // 3. どこでもいいので空いているマスを返す（ランダムに）
  let available = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[r][c] === "") {
        available.push({ row: r, col: c });
      }
    }
  }
  const randIndex = Math.floor(Math.random() * available.length);
  return available[randIndex];
}

// コンピューターの手を打つ（思考時間を含める）
function computerMove() {
  // 思考をしているふりで1〜3秒ランダムにウェイト
  const thinkingTime = (Math.floor(Math.random() * 3) + 1) * 1000;

  setTimeout(() => {
    // ミスをするかどうか判定
    const doMistake = shouldMakeMistake();

    let move;
    if (doMistake) {
      // ミス：完全にランダムな空マスへ打つ
      let emptyCells = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (board[r][c] === "") {
            emptyCells.push({ row: r, col: c });
          }
        }
      }
      if (emptyCells.length > 0) {
        const randIndex = Math.floor(Math.random() * emptyCells.length);
        move = emptyCells[randIndex];
      }
    } else {
      // 最適手を打つ
      move = getBestMove();
    }

    if (!move) {
      // 仮に空きマスが無い場合
      checkEndState();
      return;
    }

    board[move.row][move.col] = "O";
    renderBoard();
    checkEndState();
  }, thinkingTime);
}

function checkEndState() {
  // 勝利判定
  if (checkWin(currentPlayer)) {
    endGame(currentPlayer);
    return;
  }
  // 引き分け判定
  if (isBoardFull()) {
    endGame("draw");
    return;
  }

  // ターン交代
  currentPlayer = (currentPlayer === "X") ? "O" : "X";
  updateTurnInfo();

  // プレイヤーがコンピューターなら自動で打つ
  if (currentPlayer === "O" && gameActive) {
    computerMove();
  }
}

/**************************************************************
 * イベント関連
 **************************************************************/
// キー操作
function handleKeyDown(e) {
  if (!gameActive) return;

  if (currentPlayer !== "X") {
    // プレイヤーのターンでない場合は操作を受け付けない
    return;
  }

  switch (e.key) {
    case "ArrowUp":
      cursorRow = (cursorRow + 3 - 1) % 3; // 上移動
      renderBoard();
      break;
    case "ArrowDown":
      cursorRow = (cursorRow + 1) % 3; // 下移動
      renderBoard();
      break;
    case "ArrowLeft":
      cursorCol = (cursorCol + 3 - 1) % 3; // 左移動
      renderBoard();
      break;
    case "ArrowRight":
      cursorCol = (cursorCol + 1) % 3; // 右移動
      renderBoard();
      break;
    case " ":
    case "Spacebar":
      // スペースキーでコマを置く
      if (board[cursorRow][cursorCol] === "") {
        board[cursorRow][cursorCol] = "X";
        renderBoard();
        checkEndState();
      }
      break;
    default:
      break;
  }
}

function startGame() {
  // 難易度選択を取得
  const radios = document.getElementsByName("difficulty");
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      difficultyLevel = radios[i].value;
      break;
    }
  }

  // 盤面初期化
  resetBoard();
  renderBoard();

  // プレイヤー(X)からスタート
  currentPlayer = "X";
  gameActive = true;
  updateTurnInfo();
}

// メイン
window.addEventListener("load", () => {
  document.addEventListener("keydown", handleKeyDown);
  document.getElementById("startButton").addEventListener("click", startGame);
  updateScoreDisplay(); // 初期スコア表示
  renderBoard();        // 初期ボード描画
});
