// 전역 변수
let currentQuestion = 0;
let answers = [];
let testData = null;
let currentResults = null;

// 카카오 SDK 초기화
document.addEventListener("DOMContentLoaded", function () {
  if (
    typeof Kakao !== "undefined" &&
    Kakao.isInitialized &&
    !Kakao.isInitialized()
  ) {
    Kakao.init("YOUR_KAKAO_JS_KEY");
  }

  loadTestData();
  checkURLForSharedResult();
});

// 데이터 로드
async function loadTestData() {
  try {
    const response = await fetch("data.json");
    const data = await response.json();
    testData = data;
    testData.shuffledQuestions = [...data.questions]; // 원본 복사
    console.log("테스트 데이터 로드 완료");
    return testData;
  } catch (error) {
    console.error("데이터 로드 실패:", error);
    throw error;
  }
}

// 질문 순서 랜덤화
function shuffleQuestions() {
  const shuffled = [...testData.questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  testData.shuffledQuestions = shuffled;
}

// 질문 보기 순서 랜덤 섞기
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 테스트 시작
function startTest() {
  if (!testData) {
    alert("데이터를 로드하는 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  currentQuestion = 0;
  answers = [];

  shuffleQuestions();
  showScreen("question-screen");
  showQuestion();
}

// 질문 표시
function showQuestion() {
  const question = testData.shuffledQuestions[currentQuestion];
  const progress =
    ((currentQuestion + 1) / testData.shuffledQuestions.length) * 100;

  document.getElementById("progress-fill").style.width = progress + "%";
  document.getElementById("question-number").textContent = `질문 ${
    currentQuestion + 1
  }/${testData.shuffledQuestions.length}`;
  document.getElementById("question-text").textContent = question.question;

  const optionsContainer = document.getElementById("options-container");
  optionsContainer.innerHTML = "";

  const optionIndices = Array.from(
    { length: question.options.length },
    (_, i) => i
  );
  shuffleArray(optionIndices);

  optionIndices.forEach((originalIndex) => {
    const button = document.createElement("button");
    button.className = "option-btn";
    button.textContent = question.options[originalIndex];
    button.onclick = () => selectOption(originalIndex);
    optionsContainer.appendChild(button);
  });
}

// 선택지 선택
function selectOption(optionIndex) {
  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach((btn) => btn.classList.remove("selected"));
  // class 추가는 의미 없지만 유지
  setTimeout(() => {
    answers.push(optionIndex);
    currentQuestion++;

    if (currentQuestion < testData.shuffledQuestions.length) {
      showQuestion();
    } else {
      calculateResult();
    }
  }, 300);
}

// 결과 계산
function calculateResult() {
  const categoryScores = {};

  Object.keys(testData.personalityTypes).forEach((category) => {
    categoryScores[category] = 0;
  });

  answers.forEach((answerIndex, questionIndex) => {
    const question = testData.shuffledQuestions[questionIndex];
    const category = question.categories[answerIndex];
    categoryScores[category]++;
  });

  showResult(categoryScores);
}

// 결과 표시
function showResult(categoryScores) {
  currentResults = categoryScores;
  showScreen("result-screen");

  // 총 점수 계산
  const totalScore = Object.values(categoryScores).reduce(
    (sum, score) => sum + score,
    0
  );

  // 모든 결과에 대해 비율을 먼저 계산하고 조정
  const results = Object.entries(categoryScores).map(([category, score]) => {
    // 기본 비율 계산
    let basePercentage = totalScore > 0 ? (score / totalScore) * 100 : 0;

    // 미묘한 조정 (모든 항목에 대해 동일한 로직 적용)
    let adjustedPercentage = basePercentage;
    if (basePercentage > 0) {
      // -1~+1% 범위에서 조정
      adjustedPercentage += (Math.random() - 0.5) * 2;
    }

    // 최소 1%, 최대 75% 제한
    adjustedPercentage = Math.max(1, Math.min(75, adjustedPercentage));

    return {
      category,
      score,
      percentage: Math.round(adjustedPercentage),
      personality: testData.personalityTypes[category],
    };
  });

  // 전체 비율이 100%에 가깝게 미세 조정
  const totalPercentage = results.reduce(
    (sum, result) => sum + result.percentage,
    0
  );
  const difference = 100 - totalPercentage;
  if (Math.abs(difference) <= 5 && results.length > 0) {
    // 가장 높은 점수를 가진 항목에 차이만큼 조정
    const maxScoreResult = results.reduce((max, current) =>
      current.score > max.score ? current : max
    );
    maxScoreResult.percentage += difference;
    // 음수가 되지 않도록 보정
    if (maxScoreResult.percentage < 1) {
      maxScoreResult.percentage = 1;
    }
  }

  // 비율 조정 후 다시 순위별로 정렬
  const sortedResults = results.sort((a, b) => b.percentage - a.percentage);

  // 순위 표시
  renderResultRanking(sortedResults);

  // 최고 점수 성향의 상세 정보 표시
  renderDetailCard(sortedResults[0]);
}

// 결과 순위 렌더링
function renderResultRanking(sortedResults) {
  const rankingContainer = document.getElementById("result-ranking");
  rankingContainer.innerHTML = "";

  // 상위 4개만 표시
  const topResults = sortedResults.slice(0, 4);

  topResults.forEach((result, index) => {
    const rankItem = document.createElement("div");
    rankItem.className = `rank-item rank-${index + 1} clickable`;
    rankItem.onclick = () => selectRankItem(result, rankItem, index);

    rankItem.innerHTML = `
            <div class="rank-badge">${index + 1}</div>
            <div class="rank-content">
                <div class="rank-emoji">${result.personality.emoji}</div>
                <div class="rank-info">
                    <div class="rank-name">${result.personality.name}</div>
                    <div class="rank-percentage">${result.percentage}%</div>
                </div>
            </div>
        `;

    rankingContainer.appendChild(rankItem);
  });

  // 첫 번째 항목을 기본으로 선택
  if (topResults.length > 0) {
    const firstItem = rankingContainer.firstElementChild;
    firstItem.classList.add("active");
  }
}

// 랭킹 아이템 선택
function selectRankItem(result, rankItemElement, index) {
  // 모든 랭킹 아이템의 active 클래스 제거
  document.querySelectorAll(".rank-item").forEach((item) => {
    item.classList.remove("active");
  });

  // 선택된 아이템에 active 클래스 추가
  rankItemElement.classList.add("active");

  // 해당 결과의 상세 정보 표시
  renderDetailCard(result);
}

// 상세 카드 렌더링
function renderDetailCard(topResult) {
  const detailCard = document.getElementById("detail-card");

  // 카테고리별 클래스명 생성
  const categoryClass = topResult.category.replace(/[^가-힣a-zA-Z0-9]/g, "");
  detailCard.className = `detail-card ${categoryClass}`;

  detailCard.innerHTML = `
        <div class="detail-header">
            <div class="detail-emoji">${topResult.personality.emoji}</div>
            <div class="detail-title">${topResult.personality.name}</div>
            <div class="detail-category">${topResult.category}</div>
            <div class="detail-percentage">${topResult.percentage}%</div>
        </div>
        <div class="personality-description">
            ${topResult.personality.description}
        </div>
        <div class="funny-quote">
            <span class="quote-icon">💬</span>
            ${topResult.personality.quote}
        </div>
    `;
}

// 카카오톡 공유
function shareKakao() {
  if (!currentResults) {
    alert("공유할 결과가 없습니다.");
    return;
  }

  if (typeof Kakao === "undefined" || !Kakao.isInitialized()) {
    alert(
      "카카오톡 공유 기능을 사용할 수 없습니다. 잠시 후 다시 시도해주세요."
    );
    return;
  }

  // 1위 결과 찾기 (현재 활성화된 카드에서)
  const activeRankItem = document.querySelector(".rank-item.active");
  const topPersonalityName =
    activeRankItem.querySelector(".rank-name").textContent;
  const topPercentage =
    activeRankItem.querySelector(".rank-percentage").textContent;

  // 성향 정보 찾기
  let topPersonality = null;
  for (const personality of Object.values(testData.personalityTypes)) {
    if (personality.name === topPersonalityName) {
      topPersonality = personality;
      break;
    }
  }

  const shareURL = generateShareURL();

  Kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title: "💰 소비 성향 테스트 결과",
      description: `나의 소비 성향은 "${topPersonalityName}"! (${topPercentage})\n${topPersonality.quote}`,
      imageUrl: "https://your-domain.com/og-image.png", // 실제 이미지 URL로 교체
      link: {
        mobileWebUrl: shareURL,
        webUrl: shareURL,
      },
    },
    buttons: [
      {
        title: "나도 테스트하기",
        link: {
          mobileWebUrl: shareURL,
          webUrl: shareURL,
        },
      },
    ],
  });
}

// 링크 복사
function shareLink() {
  if (!currentResults) {
    alert("공유할 결과가 없습니다.");
    return;
  }

  const shareURL = generateShareURL();

  navigator.clipboard
    .writeText(shareURL)
    .then(() => {
      alert("링크가 클립보드에 복사되었습니다!");
    })
    .catch(() => {
      // 클립보드 API가 지원되지 않는 경우 폴백
      const textArea = document.createElement("textarea");
      textArea.value = shareURL;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("링크가 복사되었습니다!");
    });
}

// 공유 URL 생성
function generateShareURL() {
  if (!currentResults) return window.location.origin + window.location.pathname;

  const params = new URLSearchParams();

  // 카테고리를 영문으로 매핑
  const categoryMapping = {
    식비: "food",
    쇼핑: "shopping",
    "구독/디지털": "subscription",
    "저축/계획": "saving",
    고정비: "fixed",
    "즉흥/기타": "impulse",
    "굿즈/취미/이벤트": "goods",
  };

  // 현재 화면에 표시된 비율을 가져오기
  const rankItems = document.querySelectorAll(".rank-item");
  rankItems.forEach((item) => {
    const categoryText = item.querySelector(".rank-name").textContent;
    const percentageText = item.querySelector(".rank-percentage").textContent;
    const percentage = parseInt(percentageText.replace("%", ""));

    // 성향 이름으로 카테고리 찾기
    for (const [category, personality] of Object.entries(
      testData.personalityTypes
    )) {
      if (personality.name === categoryText) {
        const key = categoryMapping[category];
        if (key) {
          params.append(key, percentage.toString());
        }
        break;
      }
    }
  });

  return (
    window.location.origin + window.location.pathname + "?" + params.toString()
  );
}

// 테스트 다시 하기
function restartTest() {
  currentQuestion = 0;
  answers = [];
  currentResults = null;

  // URL 파라미터 제거
  window.history.replaceState({}, document.title, window.location.pathname);

  // 테스트 데이터 다시 로드해서 원본 순서로 복원 후 재시작
  loadTestData().then(() => {
    showScreen("start-screen");
  });
}
