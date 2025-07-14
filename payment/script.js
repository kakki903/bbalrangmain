// 데이터 변수
let questions = [];
let personalityTypes = {};
let shuffledQuestions = [];

// 게임 상태
let currentQuestion = 0;
let answers = {};

// DOM 요소
const startScreen = document.getElementById("start-screen");
const questionScreen = document.getElementById("question-screen");
const previewScreen = document.getElementById("preview-screen");
const resultScreen = document.getElementById("result-screen");
const startBtn = document.getElementById("start-btn");
const previewBtn = document.getElementById("preview-btn");
const backToMainBtn = document.getElementById("back-to-main-btn");
const questionText = document.getElementById("question-text");
const optionBtns = document.querySelectorAll(".option-btn");
const currentQuestionSpan = document.getElementById("current-question");
const progressBar = document.getElementById("progress");
const resultChart = document.getElementById("result-chart");
const resultDescription = document.getElementById("result-description");
const restartBtn = document.getElementById("restart-btn");
const personalityGrid = document.getElementById("personality-grid");

// 배열 셔플 함수
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 데이터 로드
async function loadData() {
  try {
    const response = await fetch("data.json");
    const data = await response.json();
    questions = data.questions;
    personalityTypes = data.personalityTypes;

    // 질문 순서 랜덤화 및 각 질문의 옵션 순서도 랜덤화
    shuffledQuestions = shuffleArray(questions).map((question) => ({
      ...question,
      shuffledOptions: shuffleArray(
        question.options.map((option, index) => ({
          text: option,
          category: question.categories[index],
        }))
      ),
    }));
  } catch (error) {
    console.error("데이터 로드 실패:", error);
  }
}

// 이벤트 리스너
startBtn.addEventListener("click", startTest);
previewBtn.addEventListener("click", showPreview);
backToMainBtn.addEventListener("click", backToMain);
restartBtn.addEventListener("click", restartTest);

optionBtns.forEach((btn, index) => {
  btn.addEventListener("click", () => selectAnswer(index));
});

// 테스트 시작
function startTest() {
  startScreen.classList.remove("active");
  questionScreen.classList.add("active");
  currentQuestion = 0;
  answers = {};
  showQuestion();
}

// 질문 표시
function showQuestion() {
  const question = shuffledQuestions[currentQuestion];
  questionText.textContent = question.question;
  currentQuestionSpan.textContent = currentQuestion + 1;

  // 진행률 업데이트
  const progress = ((currentQuestion + 1) / shuffledQuestions.length) * 100;
  progressBar.style.width = progress + "%";

  // 옵션 버튼 업데이트 (랜덤화된 옵션 사용)
  optionBtns.forEach((btn, index) => {
    if (question.shuffledOptions[index]) {
      btn.textContent = question.shuffledOptions[index].text;
      btn.dataset.category = question.shuffledOptions[index].category;
    }
    btn.classList.remove("selected");
  });
}

// 답변 선택
function selectAnswer(answerIndex) {
  const question = shuffledQuestions[currentQuestion];
  const category = question.shuffledOptions[answerIndex].category;

  // 답변 저장
  if (!answers[category]) {
    answers[category] = 0;
  }
  answers[category]++;

  // 선택된 버튼 하이라이트
  optionBtns[answerIndex].classList.add("selected");
  optionBtns[answerIndex].classList.add("pulse");

  // 다음 질문으로 이동
  setTimeout(() => {
    currentQuestion++;
    if (currentQuestion < shuffledQuestions.length) {
      showQuestion();
    } else {
      showResult();
    }
  }, 500);
}

// 자연스러운 비율 계산
function calculateNaturalPercentages(scores) {
  const totalScore = Object.values(scores).reduce(
    (sum, score) => sum + score,
    0
  );
  const basePercentages = {};

  // 기본 비율 계산
  Object.entries(scores).forEach(([category, score]) => {
    basePercentages[category] = Math.round((score / totalScore) * 100);
  });

  // 100%가 되도록 조정
  let currentSum = Object.values(basePercentages).reduce(
    (sum, percent) => sum + percent,
    0
  );

  if (currentSum !== 100) {
    const diff = 100 - currentSum;
    const sortedEntries = Object.entries(basePercentages).sort(
      ([, a], [, b]) => b - a
    );

    // 가장 높은 점수에 차이를 더하거나 빼기
    const [highestCategory] = sortedEntries[0];
    basePercentages[highestCategory] += diff;
  }

  // 자연스러운 변동 추가 (±2% 범위)
  const adjustedPercentages = {};
  const categories = Object.keys(basePercentages);
  let remainingTotal = 100;

  categories.forEach((category, index) => {
    if (index === categories.length - 1) {
      // 마지막 카테고리는 남은 비율로 설정
      adjustedPercentages[category] = remainingTotal;
    } else {
      const basePercent = basePercentages[category];
      const minAdjust = Math.max(1, basePercent - 2);
      const maxAdjust = Math.min(
        remainingTotal - (categories.length - index - 1),
        basePercent + 2
      );

      const adjustedPercent =
        Math.floor(Math.random() * (maxAdjust - minAdjust + 1)) + minAdjust;
      adjustedPercentages[category] = adjustedPercent;
      remainingTotal -= adjustedPercent;
    }
  });

  return adjustedPercentages;
}

// 성향별 배경색 설정 (강화된 색상)
const personalityColors = {
  식비: "linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)",
  쇼핑: "linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)",
  "구독/디지털": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "저축/계획": "linear-gradient(135deg, #ffa726 0%, #ff7043 100%)",
  고정비: "linear-gradient(135deg, #ab47bc 0%, #8e24aa 100%)",
  "즉흥/기타": "linear-gradient(135deg, #66bb6a 0%, #43a047 100%)",
  "굿즈/취미/이벤트": "linear-gradient(135deg, #ef5350 0%, #e53935 100%)",
};

// 결과 표시
function showResult() {
  questionScreen.classList.remove("active");
  resultScreen.classList.add("active");

  // 답변 정렬 (점수 높은 순)
  const sortedAnswers = Object.entries(answers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4); // 상위 4개만

  // 자연스러운 비율 계산
  const topAnswers = {};
  sortedAnswers.forEach(([category, score]) => {
    topAnswers[category] = score;
  });
  const naturalPercentages = calculateNaturalPercentages(topAnswers);

  // 결과 차트 생성
  resultChart.innerHTML = "";

  // 순위 컨테이너 생성
  const rankingContainer = document.createElement("div");
  rankingContainer.className = "result-ranking";

  // 상세 정보 컨테이너 생성
  const detailContainer = document.createElement("div");
  detailContainer.className = "detail-card";

  // 공유 버튼 컨테이너 생성
  const shareContainer = document.createElement("div");
  shareContainer.className = "share-container";
  shareContainer.innerHTML = `
        <div class="share-divider"></div>
        <div class="share-buttons">
            <button class="share-btn kakao-share" onclick="shareToKakao()">
                <span class="share-icon">💬</span>
                카카오톡 공유하기
            </button>
            <button class="share-btn link-share" onclick="copyLink()">
                <span class="share-icon">🔗</span>
                링크 복사하기
            </button>
        </div>
    `;

  sortedAnswers.forEach(([category, score], index) => {
    const percentage = naturalPercentages[category];
    const personality = personalityTypes[category];

    // 순위 아이템 생성
    const rankItem = document.createElement("div");
    rankItem.className = `rank-item rank-${index + 1}`;
    rankItem.dataset.category = category;

    rankItem.innerHTML = `
            <div class="rank-badge">${index + 1}</div>
            <div class="rank-content">
                <span class="rank-emoji">${personality.emoji}</span>
                <div class="rank-info">
                    <div class="rank-name">${personality.name}</div>
                    <div class="rank-percentage">(${percentage}%)</div>
                </div>
            </div>
        `;

    // 클릭 이벤트 추가
    rankItem.addEventListener("click", () => {
      showPersonalityDetail(category, detailContainer, percentage);

      // 활성화 상태 변경
      document.querySelectorAll(".rank-item").forEach((item) => {
        item.classList.remove("active");
      });
      rankItem.classList.add("active");
    });

    rankingContainer.appendChild(rankItem);
  });

  resultChart.appendChild(rankingContainer);
  resultChart.appendChild(detailContainer);
  resultChart.appendChild(shareContainer);

  // 첫 번째 항목을 기본으로 표시
  const firstCategory = sortedAnswers[0][0];
  const firstPercentage = naturalPercentages[firstCategory];
  showPersonalityDetail(firstCategory, detailContainer, firstPercentage);
  document.querySelector(".rank-item").classList.add("active");
}

// 성향 상세 정보 표시
function showPersonalityDetail(
  category,
  detailContainer = null,
  percentage = null
) {
  const personality = personalityTypes[category];
  const displayPercentage =
    percentage ||
    Math.round((answers[category] / shuffledQuestions.length) * 100);

  const detailHTML = `
        <div class="detail-header">
            <span class="detail-emoji">${personality.emoji}</span>
            <div class="detail-title">${personality.name}</div>
            <div class="detail-category">${category}</div>
            <div class="detail-percentage">${displayPercentage}%</div>
        </div>
        <div class="personality-description">${personality.description}</div>
        <div class="funny-quote">
            <span class="quote-icon">💬</span>
            "${personality.quote}"
        </div>
    `;

  if (detailContainer) {
    // 성향별 배경색 적용
    const backgroundColor =
      personalityColors[category] ||
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    detailContainer.style.background = backgroundColor;

    detailContainer.innerHTML = detailHTML;
    detailContainer.style.animation = "none";
    detailContainer.offsetHeight; // 리플로우 강제 실행
    detailContainer.style.animation = "slideUp 0.5s ease-out";
  }
}

// 카카오톡 공유 기능
function shareToKakao() {
  const topAnswers = Object.entries(answers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const topPersonality = personalityTypes[topAnswers[0][0]];
  const url = window.location.href;

  const shareText = `💰 소비 성향 진단 결과!\n\n${topPersonality.emoji} 내 소비 성향: ${topPersonality.name}\n\n"${topPersonality.quote}"\n\n당신의 소비 성향도 궁금하다면? 👇`;

  if (navigator.share) {
    navigator.share({
      title: "💰 소비 성향 진단 테스트",
      text: shareText,
      url: url,
    });
  } else {
    // 카카오톡 공유 URL 생성
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/?url=${encodeURIComponent(
      url
    )}&text=${encodeURIComponent(shareText)}`;
    window.open(kakaoUrl, "_blank");
  }
}

// 링크 복사 기능
function copyLink() {
  const url = window.location.href;
  navigator.clipboard
    .writeText(url)
    .then(() => {
      alert("링크가 복사되었습니다! 📋");
    })
    .catch(() => {
      // 복사 실패 시 수동으로 선택할 수 있도록
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("링크가 복사되었습니다! 📋");
    });
}

// 성향 미리보기 표시
function showPreview() {
  startScreen.classList.remove("active");
  previewScreen.classList.add("active");
  createPersonalityGrid();
}

// 메인화면으로 돌아가기
function backToMain() {
  previewScreen.classList.remove("active");
  startScreen.classList.add("active");
}

// 성향 그리드 생성
function createPersonalityGrid() {
  personalityGrid.innerHTML = "";

  // 그리드 컨테이너 생성
  const gridContainer = document.createElement("div");
  gridContainer.className = "personality-grid";

  // 상세 정보 컨테이너 생성
  const detailContainer = document.createElement("div");
  detailContainer.className = "personality-preview-detail";

  Object.entries(personalityTypes).forEach(([category, personality], index) => {
    const personalityCard = document.createElement("div");
    personalityCard.className = "personality-preview-card";
    personalityCard.style.background =
      personalityColors[category] ||
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    personalityCard.dataset.category = category;

    personalityCard.innerHTML = `
            <div class="preview-emoji">${personality.emoji}</div>
            <div class="preview-name">${personality.name}</div>
            <div class="preview-category">${category}</div>
        `;

    // 클릭 이벤트 추가
    personalityCard.addEventListener("click", () => {
      showPreviewDetail(category, detailContainer);

      // 활성화 상태 변경
      document.querySelectorAll(".personality-preview-card").forEach((card) => {
        card.classList.remove("active");
      });
      personalityCard.classList.add("active");
    });

    gridContainer.appendChild(personalityCard);
  });

  personalityGrid.appendChild(gridContainer);
  personalityGrid.appendChild(detailContainer);

  // 첫 번째 항목을 기본으로 표시
  const firstCategory = Object.keys(personalityTypes)[0];
  showPreviewDetail(firstCategory, detailContainer);
  document.querySelector(".personality-preview-card").classList.add("active");
}

// 성향 미리보기 상세 정보 표시
function showPreviewDetail(category, detailContainer) {
  const personality = personalityTypes[category];

  const detailHTML = `
        <div class="preview-detail-header">
            <div class="preview-detail-info">
                <h3>${personality.name}</h3>
                <div class="preview-detail-category">${category}</div>
            </div>
        </div>
        <div class="preview-detail-description">${personality.description}</div>
        <div class="preview-detail-quote">"${personality.quote}"</div>
    `;

  detailContainer.innerHTML = detailHTML;
  detailContainer.classList.add("active");

  detailContainer.style.animation = "none";
  detailContainer.offsetHeight; // 리플로우 강제 실행
  detailContainer.style.animation = "slideUp 0.5s ease-out";
}

// 테스트 재시작
function restartTest() {
  resultScreen.classList.remove("active");
  startScreen.classList.add("active");
  currentQuestion = 0;
  answers = {};
  progressBar.style.width = "0%";
}

// 초기화
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  startScreen.classList.add("active");
});
