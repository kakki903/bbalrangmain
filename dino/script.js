// 게임 설정
const GAME_CONFIG = {
  canvas: {
    width: 1200,
    height: 400,
  },
  ground: {
    height: 50,
  },
  gravity: 0.8,
  jumpPower: -9, // 조정된 1단 점프력
  doubleJumpPower: -11, // 조정된 2단 점프력 (적절한 높이)
  slideHeight: 30,
  baseSpeed: 5,
  speedIncrease: 0.001,
  speedBoostInterval: 15000, // 15초마다 속도 증가
  speedBoostAmount: 0.3, // 15초마다 속도 30% 증가
  obstacleMinDistance: 200,
  obstacleMaxDistance: 400,
};

// 플레이어 색상
const PLAYER_COLORS = ["#FF6347", "#4CAF50", "#2196F3", "#FF9800"];

// 조작 키 설정 (변경 가능)
let PLAYER_KEYS = [
  { jump: "Space", slide: "ArrowDown" }, // 플레이어 1
  { jump: "KeyW", slide: "KeyS" }, // 플레이어 2
  { jump: "KeyI", slide: "KeyK" }, // 플레이어 3
  { jump: "Numpad8", slide: "Numpad2" }, // 플레이어 4
];

// 키 설정 변경 상태
let isChangingKey = null; // { playerIndex, keyType } 또는 null

// 게임 상태
let gameState = {
  screen: "menu", // 'menu', 'game', 'gameOver', 'paused'
  players: 1,
  mode: "battle", // 'score', 'battle'
  speedMultiplier: 1,
  score: 0,
  distance: 0,
  gameSpeed: GAME_CONFIG.baseSpeed,
  isPaused: false,
  gameStartTime: 0,
  lastSpeedBoost: 0, // 마지막 속도 증가 시간
  speedBoostCount: 0, // 속도 증가 횟수
};

// 게임 객체들
let canvas, ctx;
let players = [];
let obstacles = [];
let gameLoop;
let pressedKeys = {};

// DOM 요소들
let mainMenu, gameScreen, gameOverScreen, pauseScreen;
let playerButtons, modeButtons, speedButtons;
let keySettings,
  bestScores,
  scoreDisplay,
  speedDisplay,
  playerStatus,
  finalResults;

// 초기화
document.addEventListener("DOMContentLoaded", () => {
  initializeDOM();
  initializeCanvas();
  initializeEventListeners();
  loadBestScores();
  updateKeySettings();
});

function initializeDOM() {
  // 화면 요소들
  mainMenu = document.getElementById("main-menu");
  gameScreen = document.getElementById("game-screen");
  gameOverScreen = document.getElementById("game-over");
  pauseScreen = document.getElementById("pause-screen");

  // 메뉴 버튼들
  playerButtons = document.querySelectorAll(".player-btn");
  modeButtons = document.querySelectorAll(".mode-btn");
  speedButtons = document.querySelectorAll(".speed-btn");

  // 기타 요소들
  keySettings = document.getElementById("key-settings");
  bestScores = document.getElementById("best-scores");
  scoreDisplay = document.getElementById("score-display");
  speedDisplay = document.getElementById("speed-display");
  playerStatus = document.getElementById("player-status");
  finalResults = document.getElementById("final-results");
}

function initializeCanvas() {
  canvas = document.getElementById("game-canvas");
  ctx = canvas.getContext("2d");
  updateCanvasSize();
}

function updateCanvasSize() {
  // 플레이어 수에 따라 캔버스 높이 조정
  const baseHeight = 250; // 1인용 기본 높이
  const heightPerPlayer = 200; // 플레이어당 추가 높이
  const newHeight = Math.max(baseHeight, heightPerPlayer * gameState.players);

  GAME_CONFIG.canvas.height = newHeight;

  // 고해상도 지원
  const ratio = window.devicePixelRatio || 1;
  canvas.width = GAME_CONFIG.canvas.width * ratio;
  canvas.height = newHeight * ratio;
  canvas.style.width = GAME_CONFIG.canvas.width + "px";
  canvas.style.height = newHeight + "px";
  ctx.scale(ratio, ratio);
}

function initializeEventListeners() {
  // 메뉴 버튼 이벤트
  playerButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      playerButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      gameState.players = parseInt(btn.dataset.players);
      updateCanvasSize(); // 캔버스 크기 업데이트
      updateKeySettings();
    });
  });

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      gameState.mode = btn.dataset.mode;
    });
  });

  speedButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      speedButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      gameState.speedMultiplier = parseFloat(btn.dataset.speed);
    });
  });

  // 게임 제어 버튼들
  document
    .getElementById("start-game-btn")
    .addEventListener("click", startGame);
  document.getElementById("pause-btn").addEventListener("click", togglePause);
  document.getElementById("restart-btn").addEventListener("click", startGame);
  document.getElementById("menu-btn").addEventListener("click", showMainMenu);
  document.getElementById("resume-btn").addEventListener("click", togglePause);
  document
    .getElementById("pause-menu-btn")
    .addEventListener("click", showMainMenu);

  // 키보드 이벤트
  document.addEventListener("keydown", (e) => {
    // 키 설정 변경 모드인 경우
    if (isChangingKey) {
      PLAYER_KEYS[isChangingKey.playerIndex][isChangingKey.keyType] = e.code;
      isChangingKey = null;
      updateKeySettings();
      e.preventDefault();
      return;
    }

    if (gameState.screen === "game" && !gameState.isPaused) {
      handlePlayerInput(e.code, true); // 키 다운 이벤트
    }

    // ESC 키로 일시정지
    if (e.key === "Escape" && gameState.screen === "game") {
      togglePause();
    }

    pressedKeys[e.code] = true;
  });

  document.addEventListener("keyup", (e) => {
    if (gameState.screen === "game" && !gameState.isPaused) {
      handlePlayerInput(e.code, false); // 키 업 이벤트
    }
    pressedKeys[e.code] = false;
  });
}

function updateKeySettings() {
  keySettings.innerHTML = "";

  const keyNames = {
    Space: "스페이스바",
    ArrowDown: "아래화살표",
    ArrowUp: "위화살표",
    ArrowLeft: "왼쪽화살표",
    ArrowRight: "오른쪽화살표",
    KeyW: "W",
    KeyA: "A",
    KeyS: "S",
    KeyD: "D",
    KeyQ: "Q",
    KeyE: "E",
    KeyR: "R",
    KeyT: "T",
    KeyI: "I",
    KeyO: "O",
    KeyP: "P",
    KeyK: "K",
    KeyL: "L",
    Numpad8: "넘패드8",
    Numpad2: "넘패드2",
    Numpad4: "넘패드4",
    Numpad6: "넘패드6",
    Enter: "엔터",
    ShiftLeft: "왼쪽Shift",
    ShiftRight: "오른쪽Shift",
  };

  for (let i = 0; i < gameState.players; i++) {
    const playerKeys = PLAYER_KEYS[i];
    const div = document.createElement("div");
    div.className = "player-keys";
    div.dataset.player = i + 1;

    const jumpKeyName = keyNames[playerKeys.jump] || playerKeys.jump;
    const slideKeyName = keyNames[playerKeys.slide] || playerKeys.slide;

    div.innerHTML = `
        <span style="color: ${PLAYER_COLORS[i]}; font-weight: bold;">플레이어 ${
      i + 1
    }:</span>
        <div class="key-controls">
            <button class="key-change-btn" onclick="changeKey(${i}, 'jump')">${jumpKeyName} (점프)</button>
            <button class="key-change-btn" onclick="changeKey(${i}, 'slide')">${slideKeyName} (슬라이드)</button>
        </div>
    `;
    keySettings.appendChild(div);
  }
}

function changeKey(playerIndex, keyType) {
  isChangingKey = { playerIndex, keyType };
  const allBtns = document.querySelectorAll(".key-change-btn");
  allBtns.forEach(
    (btn) =>
      (btn.textContent = btn.textContent.includes("점프")
        ? "점프키를 눌러주세요..."
        : "슬라이드키를 눌러주세요...")
  );
}

function loadBestScores() {
  const scores = JSON.parse(localStorage.getItem("dinoRunBestScores") || "{}");
  let html = "";

  for (let playerCount = 1; playerCount <= 4; playerCount++) {
    const scoreKey = `${playerCount}p_score`;
    const battleKey = `${playerCount}p_battle`;

    if (scores[scoreKey] || scores[battleKey]) {
      html += `<div><strong>${playerCount}인:</strong>`;
      if (scores[scoreKey]) html += ` 점수모드 ${scores[scoreKey]}점`;
      if (scores[battleKey]) html += ` 대결모드 ${scores[battleKey]}점`;
      html += "</div>";
    }
  }

  bestScores.innerHTML = html || "아직 기록이 없습니다.";
}

function saveBestScore() {
  const scores = JSON.parse(localStorage.getItem("dinoRunBestScores") || "{}");
  const key = `${gameState.players}p_${gameState.mode}`;

  if (!scores[key] || gameState.score > scores[key]) {
    scores[key] = gameState.score;
    localStorage.setItem("dinoRunBestScores", JSON.stringify(scores));
    return true; // 신기록
  }
  return false;
}

// 플레이어 클래스
class Player {
  constructor(index) {
    this.index = index;
    this.gameAreaHeight = GAME_CONFIG.canvas.height / gameState.players;
    this.gameAreaY = index * this.gameAreaHeight;
    this.x = 80;
    this.groundY =
      this.gameAreaY + this.gameAreaHeight - GAME_CONFIG.ground.height - 50;
    this.y = this.groundY;
    this.width = 40;
    this.height = 50;
    this.velocityY = 0;
    this.isJumping = false;
    this.canDoubleJump = false; // 2단 점프 가능 여부
    this.isSliding = false;
    this.isAlive = true;
    this.color = PLAYER_COLORS[index];
    this.distance = 0;
    this.keys = PLAYER_KEYS[index];
    this.obstacles = []; // 각 플레이어별 독립된 장애물
  }

  update() {
    // 중력 적용 (죽어도 물리적 움직임은 계속)
    if (this.isJumping) {
      this.velocityY += GAME_CONFIG.gravity;
      this.y += this.velocityY;

      // 착지 체크
      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.velocityY = 0;
        this.isJumping = false;
        this.canDoubleJump = false; // 착지 시 2단 점프 리셋
      }
    } else {
      // 점프 중이 아닐 때 슬라이딩 높이 조정
      if (this.isSliding) {
        this.height = GAME_CONFIG.slideHeight;
        this.y = this.groundY + (50 - GAME_CONFIG.slideHeight);
      } else {
        this.height = 50;
        if (!this.isJumping) {
          this.y = this.groundY;
        }
      }
    }

    // 살아있을 때만 거리 증가
    if (this.isAlive) {
      this.distance += gameState.gameSpeed * gameState.speedMultiplier;
    }
  }

  jump() {
    if (this.isAlive) {
      if (!this.isJumping) {
        // 1단 점프
        this.isJumping = true;
        this.velocityY = GAME_CONFIG.jumpPower;
        this.canDoubleJump = true;
        this.isSliding = false; // 점프 시 슬라이딩 해제
      } else if (this.canDoubleJump) {
        // 2단 점프
        this.velocityY = GAME_CONFIG.doubleJumpPower;
        this.canDoubleJump = false;
      }
    }
  }

  startSlide() {
    if (this.isAlive) {
      this.isSliding = true;
    }
  }

  stopSlide() {
    this.isSliding = false;
  }

  draw() {
    if (!this.isAlive) {
      ctx.globalAlpha = 0.3;
    }

    // 디노 몸체 (메인 색상)
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x + 5, this.y + 20, 30, 25);

    // 디노 머리
    ctx.fillRect(this.x + 35, this.y + 10, 15, 15);

    // 디노 목
    ctx.fillRect(this.x + 30, this.y + 15, 10, 10);

    // 디노 꼬리
    ctx.fillRect(this.x, this.y + 25, 10, 8);

    // 다리 (슬라이딩 시 다르게 표시)
    if (this.isSliding) {
      // 슬라이딩 시 다리
      ctx.fillRect(this.x + 10, this.y + 40, 8, 5);
      ctx.fillRect(this.x + 22, this.y + 40, 8, 5);
    } else {
      // 일반 다리
      ctx.fillRect(this.x + 10, this.y + 45, 6, 8);
      ctx.fillRect(this.x + 24, this.y + 45, 6, 8);
    }

    // 눈
    ctx.fillStyle = "white";
    ctx.fillRect(this.x + 37, this.y + 12, 3, 3);
    ctx.fillRect(this.x + 42, this.y + 12, 3, 3);

    // 눈동자
    ctx.fillStyle = "black";
    ctx.fillRect(this.x + 38, this.y + 13, 1, 1);
    ctx.fillRect(this.x + 43, this.y + 13, 1, 1);

    // 입
    ctx.fillStyle = "black";
    ctx.fillRect(this.x + 45, this.y + 18, 3, 2);

    // 플레이어 번호 표시
    ctx.fillStyle = "white";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeText(`P${this.index + 1}`, this.x + this.width / 2, this.y - 5);
    ctx.fillText(`P${this.index + 1}`, this.x + this.width / 2, this.y - 5);

    ctx.globalAlpha = 1;
  }

  getHitbox() {
    return {
      x: this.x + 5,
      y: this.y + 5,
      width: this.width - 10,
      height: this.height - 10,
    };
  }
}

// 장애물 클래스
class Obstacle {
  constructor(x, type = "cactus", playerIndex = 0) {
    this.x = x;
    this.type = type;
    this.playerIndex = playerIndex;

    const gameAreaHeight = GAME_CONFIG.canvas.height / gameState.players;
    const gameAreaY = playerIndex * gameAreaHeight;
    const groundY = gameAreaY + gameAreaHeight - GAME_CONFIG.ground.height;

    if (type === "bird") {
      this.width = 40;
      this.height = 20; // 새 높이를 유지
      this.y = groundY - 60; // 위치를 높여 슬라이드로 피할 수 있도록 조정
      this.color = "#8B4513";
    } else if (type === "lowCactus") {
      this.width = 30;
      this.height = 20; // 낮은 선인장 크기 줄임
      this.y = groundY - this.height;
      this.color = "#32CD32";
    } else if (type === "cactus") {
      this.width = 20;
      this.height = 80; // 일반 선인장 크기를 줄임
      this.y = groundY - this.height;
      this.color = "#228B22";
    }
  }
  update() {
    this.x -= gameState.gameSpeed * gameState.speedMultiplier;
  }

  draw() {
    ctx.fillStyle = this.color;
    if (this.type === "cactus") {
      // 매우 높은 선인장 - 2단 점프로만 통과 가능
      ctx.fillRect(this.x + 5, this.y, 15, this.height);
      ctx.fillRect(this.x, this.y + 25, 25, 20);
      ctx.fillRect(this.x + 8, this.y - 8, 8, 25);
      ctx.fillRect(this.x + 3, this.y + 45, 6, 20);
      ctx.fillRect(this.x + 16, this.y + 45, 6, 20);
      // 추가 가지들로 더 높게
      ctx.fillRect(this.x + 2, this.y + 65, 4, 15);
      ctx.fillRect(this.x + 19, this.y + 65, 4, 15);
    } else if (this.type === "bird") {
      // 새 - 2단 점프 또는 슬라이드로만 통과 가능 (높은 위치)
      ctx.fillRect(this.x + 10, this.y + 5, 20, 15);
      ctx.fillRect(this.x + 5, this.y + 8, 10, 8);
      ctx.fillRect(this.x + 30, this.y + 8, 10, 8);
      // 날개
      ctx.fillStyle = "#654321";
      ctx.fillRect(this.x + 12, this.y, 16, 8);
      ctx.fillRect(this.x + 15, this.y + 15, 10, 5);
    } else if (this.type === "lowCactus") {
      // 중간 높이 선인장 - 1단 점프로만 통과 가능
      ctx.fillRect(this.x + 2, this.y, 26, this.height);
      ctx.fillRect(this.x + 5, this.y - 10, 8, 20);
      ctx.fillRect(this.x + 17, this.y - 10, 8, 20);
      ctx.fillRect(this.x, this.y + 20, 30, 15);
    }
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}

function handlePlayerInput(code, isKeyDown) {
  for (let player of players) {
    if (!player.isAlive) continue;

    if (code === player.keys.jump && isKeyDown) {
      player.jump();
    }

    if (code === player.keys.slide) {
      if (isKeyDown) {
        player.startSlide();
      } else {
        player.stopSlide();
      }
    }
  }
}

function checkCollisions() {
  for (let player of players) {
    if (!player.isAlive) continue;

    const playerHitbox = player.getHitbox();

    for (let obstacle of player.obstacles) {
      const obstacleHitbox = obstacle.getHitbox();

      if (
        playerHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
        playerHitbox.x + playerHitbox.width > obstacleHitbox.x &&
        playerHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
        playerHitbox.y + playerHitbox.height > obstacleHitbox.y
      ) {
        player.isAlive = false;

        // 점수모드에서 한 명이라도 죽으면 게임 종료
        if (gameState.mode === "score") {
          endGame();
          return;
        }
      }
    }
  }

  // 대결모드에서 모든 플레이어가 죽었는지 체크
  if (gameState.mode === "battle") {
    const alivePlayers = players.filter((p) => p.isAlive);
    if (alivePlayers.length === 0) {
      endGame();
    }
  }
}

function spawnObstacles() {
  for (let player of players) {
    // 죽은 플레이어는 새로운 장애물 생성하지 않음
    if (!player.isAlive) continue;

    const lastObstacle = player.obstacles[player.obstacles.length - 1];
    const minDistance = GAME_CONFIG.obstacleMinDistance;
    const maxDistance = GAME_CONFIG.obstacleMaxDistance;
    const spawnX = GAME_CONFIG.canvas.width;

    if (
      !lastObstacle ||
      spawnX - lastObstacle.x >
        minDistance + Math.random() * (maxDistance - minDistance)
    ) {
      const rand = Math.random();
      let type;
      if (rand < 0.33) {
        type = "cactus"; // 33% - 2단 점프로만 통과
      } else if (rand < 0.66) {
        type = "lowCactus"; // 33% - 1단 점프로만 통과
      } else {
        type = "bird"; // 33% - 2단 점프 또는 슬라이드로만 통과
      }

      const obstacle = new Obstacle(spawnX, type, player.index);
      player.obstacles.push(obstacle);
    }
  }
}

function updateGame() {
  if (gameState.isPaused) return;

  // 15초마다 속도 증가
  const currentTime = Date.now();
  const elapsedTime = currentTime - gameState.gameStartTime;
  const expectedBoosts = Math.floor(
    elapsedTime / GAME_CONFIG.speedBoostInterval
  );

  if (expectedBoosts > gameState.speedBoostCount) {
    gameState.speedMultiplier += GAME_CONFIG.speedBoostAmount;
    gameState.speedBoostCount = expectedBoosts;
  }

  // 기본 게임 속도 증가
  gameState.gameSpeed += GAME_CONFIG.speedIncrease;

  // 플레이어 업데이트
  for (let player of players) {
    player.update();

    // 살아있는 플레이어의 장애물만 업데이트 (죽은 플레이어 영역은 정지)
    if (player.isAlive) {
      for (let obstacle of player.obstacles) {
        obstacle.update();
      }

      // 화면 밖 장애물 제거
      player.obstacles = player.obstacles.filter(
        (obstacle) => obstacle.x > -obstacle.width
      );
    }
  }

  // 새 장애물 생성 (살아있는 플레이어에게만)
  spawnObstacles();

  // 충돌 체크
  checkCollisions();

  // 점수 업데이트 (살아있는 플레이어들의 평균 거리)
  const alivePlayers = players.filter((p) => p.isAlive);
  if (alivePlayers.length > 0) {
    const totalDistance = alivePlayers.reduce((sum, p) => sum + p.distance, 0);
    gameState.distance = totalDistance / alivePlayers.length;
    gameState.score = Math.floor(gameState.distance / 10);
  }

  // UI 업데이트
  updateGameUI();
}

function renderGame() {
  // 캔버스 클리어
  ctx.clearRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);

  // 각 플레이어별 게임 영역 그리기 (세로 분할)
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const areaHeight = player.gameAreaHeight;
    const areaY = player.gameAreaY;

    // 게임 영역 구분선
    if (i > 0) {
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, areaY);
      ctx.lineTo(GAME_CONFIG.canvas.width, areaY);
      ctx.stroke();
    }

    // 각 영역의 배경
    drawBackground(areaY, areaHeight, i);

    // 각 영역의 땅
    ctx.fillStyle = "#DEB887";
    ctx.fillRect(
      0,
      areaY + areaHeight - GAME_CONFIG.ground.height,
      GAME_CONFIG.canvas.width,
      GAME_CONFIG.ground.height
    );

    // 각 플레이어의 장애물 그리기
    for (let obstacle of player.obstacles) {
      obstacle.draw();
    }

    // 플레이어 그리기
    player.draw();

    // 플레이어 정보 표시
    ctx.fillStyle = player.color;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "left";
    ctx.fillText(
      `플레이어 ${i + 1} - ${Math.floor(player.distance / 10)} 점`,
      10,
      areaY + 25
    );

    if (!player.isAlive) {
      // 플레이어 수에 따른 등수 표시 결정
      let rankText = "";
      let rankEmoji = "";
      let backgroundColor = "";
      let flashColor = "";

      if (gameState.players === 1) {
        rankText = "GAME OVER";
        rankEmoji = "💀";
        backgroundColor = "rgba(139, 0, 0, 0.8)";
        flashColor = "rgba(255, 0, 0, 0.4)";
      } else {
        // 현재 죽은 플레이어들 중에서의 순위 계산
        const deadPlayers = players.filter((p) => !p.isAlive);
        const sortedDeadPlayers = deadPlayers.sort(
          (a, b) => b.distance - a.distance
        );
        const playerRank =
          sortedDeadPlayers.findIndex((p) => p.index === player.index) + 1;

        // 전체 플레이어 수를 기준으로 실제 등수 계산
        const totalDeadCount = deadPlayers.length;
        const actualRank = gameState.players - totalDeadCount + playerRank;

        if (gameState.players === 2) {
          if (actualRank === 1) {
            rankText = "1등";
            rankEmoji = "🥇";
            backgroundColor = "rgba(255, 215, 0, 0.8)"; // 금색
            flashColor = "rgba(255, 223, 0, 0.4)";
          } else {
            rankText = "2등";
            rankEmoji = "🥈";
            backgroundColor = "rgba(192, 192, 192, 0.8)"; // 은색
            flashColor = "rgba(211, 211, 211, 0.4)";
          }
        } else if (gameState.players === 3) {
          if (actualRank === 1) {
            rankText = "1등";
            rankEmoji = "🥇";
            backgroundColor = "rgba(255, 215, 0, 0.8)"; // 금색
            flashColor = "rgba(255, 223, 0, 0.4)";
          } else if (actualRank === 2) {
            rankText = "2등";
            rankEmoji = "🥈";
            backgroundColor = "rgba(192, 192, 192, 0.8)"; // 은색
            flashColor = "rgba(211, 211, 211, 0.4)";
          } else {
            rankText = "3등";
            rankEmoji = "🥉";
            backgroundColor = "rgba(205, 127, 50, 0.8)"; // 동색
            flashColor = "rgba(218, 165, 32, 0.4)";
          }
        } else if (gameState.players === 4) {
          if (actualRank === 1) {
            rankText = "1등";
            rankEmoji = "🥇";
            backgroundColor = "rgba(255, 215, 0, 0.8)"; // 금색
            flashColor = "rgba(255, 223, 0, 0.4)";
          } else if (actualRank === 2) {
            rankText = "2등";
            rankEmoji = "🥈";
            backgroundColor = "rgba(192, 192, 192, 0.8)"; // 은색
            flashColor = "rgba(211, 211, 211, 0.4)";
          } else if (actualRank === 3) {
            rankText = "3등";
            rankEmoji = "🥉";
            backgroundColor = "rgba(205, 127, 50, 0.8)"; // 동색
            flashColor = "rgba(218, 165, 32, 0.4)";
          } else {
            rankText = "꼴등";
            rankEmoji = "💀";
            backgroundColor = "rgba(139, 0, 0, 0.8)"; // 빨간색
            flashColor = "rgba(255, 0, 0, 0.4)";
          }
        }
      }

      // 죽은 플레이어 영역에 등수에 맞는 배경색
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, areaY, GAME_CONFIG.canvas.width, areaHeight);

      // 번쩍이는 효과를 위한 추가 레이어
      const flashIntensity = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
      ctx.fillStyle = flashColor.replace(
        "0.4",
        (flashIntensity * 0.4).toString()
      );
      ctx.fillRect(0, areaY, GAME_CONFIG.canvas.width, areaHeight);

      // 등수/게임오버 텍스트 표시
      ctx.fillStyle = "white";
      ctx.font = "bold 36px Arial";
      ctx.textAlign = "center";
      ctx.strokeStyle = "darkred";
      ctx.lineWidth = 3;
      ctx.strokeText(
        `${rankEmoji} ${rankText} ${rankEmoji}`,
        GAME_CONFIG.canvas.width / 2,
        areaY + areaHeight / 2
      );
      ctx.fillText(
        `${rankEmoji} ${rankText} ${rankEmoji}`,
        GAME_CONFIG.canvas.width / 2,
        areaY + areaHeight / 2
      );

      // 추가 텍스트
      if (gameState.players === 1) {
        ctx.fillStyle = "yellow";
        ctx.font = "bold 18px Arial";
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeText(
          "ELIMINATED!",
          GAME_CONFIG.canvas.width / 2,
          areaY + areaHeight / 2 + 40
        );
        ctx.fillText(
          "ELIMINATED!",
          GAME_CONFIG.canvas.width / 2,
          areaY + areaHeight / 2 + 40
        );
      } else {
        ctx.fillStyle = "yellow";
        ctx.font = "bold 18px Arial";
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeText(
          `${Math.floor(player.distance / 10)}점`,
          GAME_CONFIG.canvas.width / 2,
          areaY + areaHeight / 2 + 40
        );
        ctx.fillText(
          `${Math.floor(player.distance / 10)}점`,
          GAME_CONFIG.canvas.width / 2,
          areaY + areaHeight / 2 + 40
        );
      }
    }
  }
}

function drawBackground(areaY, areaHeight, playerIndex) {
  // 배경은 단순하게 유지
}

function updateGameUI() {
  scoreDisplay.textContent = `점수: ${gameState.score}`;
  const currentSpeed =
    (gameState.gameSpeed / GAME_CONFIG.baseSpeed) * gameState.speedMultiplier;
  speedDisplay.textContent = `속도: ${currentSpeed.toFixed(1)}x`;

  // 속도에 따른 색상 변경
  if (currentSpeed >= 2.0) {
    speedDisplay.style.color = "#ff0000";
  } else if (currentSpeed >= 1.5) {
    speedDisplay.style.color = "#ff8c00";
  } else {
    speedDisplay.style.color = "#666";
  }

  // 플레이어 상태 업데이트
  playerStatus.innerHTML = "";
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const div = document.createElement("div");
    div.className = `player-info ${player.isAlive ? "alive" : "dead"}`;
    div.style.borderColor = player.color;
    div.style.color = player.color;
    div.textContent = `플레이어 ${i + 1}: ${
      player.isAlive ? "생존" : "사망"
    } | ${Math.floor(player.distance / 10)} 점`;
    playerStatus.appendChild(div);
  }
}

function startGame() {
  // 게임 상태 초기화
  gameState.screen = "game";
  gameState.score = 0;
  gameState.distance = 0;
  gameState.gameSpeed = GAME_CONFIG.baseSpeed;
  gameState.isPaused = false;
  gameState.gameStartTime = Date.now();
  gameState.lastSpeedBoost = 0;
  gameState.speedBoostCount = 0;
  gameState.speedMultiplier = parseFloat(
    document.querySelector(".speed-btn.active").dataset.speed
  );

  // 캔버스 크기 업데이트
  updateCanvasSize();

  // 플레이어 생성
  players = [];
  for (let i = 0; i < gameState.players; i++) {
    players.push(new Player(i));
  }

  // 키 설정 변경 모드 해제
  isChangingKey = null;

  // 화면 전환
  showScreen("game");

  // 게임 루프 시작
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(() => {
    updateGame();
    renderGame();
  }, 1000 / 60); // 60 FPS
}

function endGame() {
  gameState.screen = "gameOver";
  clearInterval(gameLoop);

  // 최고 기록 저장
  const isNewRecord = saveBestScore();

  // 3초 후에 결과 화면 표시
  setTimeout(() => {
    showGameResults(isNewRecord);
    showScreen("gameOver");
    loadBestScores(); // 최고 기록 새로고침
  }, 700);
}

function showGameResults(isNewRecord) {
  let html = "";

  if (gameState.mode === "score") {
    html += `<div class="result-item">`;
    html += `<strong>최종 점수: ${gameState.score}점</strong>`;
    if (isNewRecord) html += ` 🎉 신기록!`;
    html += `</div>`;

    html += `<h4>개별 점수:</h4>`;
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      html += `<div class="result-item" style="border-color: ${player.color}">`;
      html += `플레이어 ${i + 1}: ${Math.floor(player.distance / 10)}점`;
      html += `</div>`;
    }
  } else {
    // 대결모드 순위
    const sortedPlayers = [...players].sort((a, b) => {
      if (a.isAlive && !b.isAlive) return -1;
      if (!a.isAlive && b.isAlive) return 1;
      return b.distance - a.distance;
    });

    html += `<h4>최종 순위:</h4>`;
    for (let i = 0; i < sortedPlayers.length; i++) {
      const player = sortedPlayers[i];
      const rank = i + 1;
      const medal =
        rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";

      html += `<div class="result-item" style="border-color: ${player.color}">`;
      html += `${rank}위 ${medal} 플레이어 ${player.index + 1}: ${Math.floor(
        player.distance / 10
      )}점`;
      html += `</div>`;
    }

    if (isNewRecord) {
      html += `<div style="color: #FF6347; font-weight: bold; margin-top: 10px;">🎉 신기록!</div>`;
    }
  }

  finalResults.innerHTML = html;
}

function togglePause() {
  if (gameState.screen !== "game" && gameState.screen !== "paused") return;

  gameState.isPaused = !gameState.isPaused;

  if (gameState.isPaused) {
    gameState.screen = "paused";
    showScreen("paused");
    clearInterval(gameLoop);
  } else {
    gameState.screen = "game";
    showScreen("game");
    gameLoop = setInterval(() => {
      updateGame();
      renderGame();
    }, 1000 / 60);
  }
}

function showMainMenu() {
  gameState.screen = "menu";
  clearInterval(gameLoop);
  showScreen("menu");
}

function showScreen(screenName) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.add("hidden");
  });

  const screens = {
    menu: mainMenu,
    game: gameScreen,
    gameOver: gameOverScreen,
    paused: pauseScreen,
  };

  if (screens[screenName]) {
    screens[screenName].classList.remove("hidden");
  }
}

// 페이지 언로드 시 게임 루프 정리
window.addEventListener("beforeunload", () => {
  if (gameLoop) clearInterval(gameLoop);
});

// 모바일 터치 버튼 이벤트 등록 + 조작키 설정 제거 + 가로화면 전용 + 플레이어 버튼 제한
window.addEventListener("DOMContentLoaded", () => {
  const mobileControls = document.getElementById("mobile-controls");
  const jumpBtn = document.getElementById("mobile-jump");
  const slideBtn = document.getElementById("mobile-slide");
  const keySettingsSection =
    document.getElementById("key-settings")?.parentElement;
  const playerButtons = document.querySelectorAll(".player-btn");

  const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

  if (isMobile) {
    // 모바일 환경이면 조작버튼 보여주고, 키 설정은 숨김
    mobileControls?.classList.remove("hidden");
    keySettingsSection?.classList.add("hidden");

    // 플레이어 1명 고정 및 나머지 버튼 비활성화
    playerButtons.forEach((btn) => {
      if (btn.dataset.players === "1") {
        btn.classList.add("active");
      } else {
        btn.disabled = true;
        btn.classList.remove("active");
      }
    });

    // 가로모드 권장 안내
    if (window.innerHeight > window.innerWidth) {
      alert("더 나은 플레이를 위해 기기를 가로 화면으로 돌려주세요!");
    }
  }

  // 기본적으로 플레이어 1만 조작 (모바일 기준)
  jumpBtn?.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (typeof PLAYER_KEYS !== "undefined") {
      handlePlayerInput(PLAYER_KEYS[0].jump, true);
    }
  });

  slideBtn?.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (typeof PLAYER_KEYS !== "undefined") {
      handlePlayerInput(PLAYER_KEYS[0].slide, true);
    }
  });

  slideBtn?.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (typeof PLAYER_KEYS !== "undefined") {
      handlePlayerInput(PLAYER_KEYS[0].slide, false);
    }
  });
});
