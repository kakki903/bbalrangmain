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
    testData = await response.json();
    console.log("테스트 데이터 로드 완료");
    return testData;
  } catch (error) {
    console.error("데이터 로드 실패:", error);
    throw error;
  }
}

// URL에서 공유된 결과 확인
function checkURLForSharedResult() {
  const urlParams = new URLSearchParams(window.location.search);
  const percentageResults = {};

  const categoryMapping = {
    food: "식비",
    shopping: "쇼핑",
    subscription: "구독/디지털",
    saving: "저축/계획",
    fixed: "고정비",
    impulse: "즉흥/기타",
    goods: "굿즈/취미/이벤트",
  };

  for (const [key, value] of urlParams) {
    if (categoryMapping[key] && value) {
      const category = categoryMapping[key];
      percentageResults[category] = parseInt(value);
    }
  }

  if (Object.keys(percentageResults).length > 0) {
    showResultFromURL(percentageResults);
  }
}

// URL에서 받은 결과로 결과 화면 표시
function showResultFromURL(percentageResults) {
  if (!testData) {
    setTimeout(() => showResultFromURL(percentageResults), 100);
    return;
  }

  const results = Object.entries(percentageResults).map(
    ([category, percentage]) => ({
      category,
      score: 0,
      percentage: percentage,
      personality: testData.personalityTypes[category],
    })
  );

  currentResults = {};
  results.forEach((result) => {
    currentResults[result.category] = result.percentage;
  });

  showScreen("result-screen");
  renderResultRanking(results);
  renderDetailCard(results[0]);
}

// 질문 시작
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

// 질문 순서 랜덤화
function shuffleQuestions() {
  for (let i = testData.questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [testData.questions[i], testData.questions[j]] = [
      testData.questions[j],
      testData.questions[i],
    ];
  }
}

// 질문 표시 함수
function showQuestion() {
  const question = testData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / testData.questions.length) * 100;

  document.getElementById("progress-fill").style.width = progress + "%";
  document.getElementById("question-number").textContent = `질문 ${
    currentQuestion + 1
  }/${testData.questions.length}`;
  document.getElementById("question-text").textContent = question.question;

  const optionsContainer = document.getElementById("options-container");
  optionsContainer.innerHTML = "";

  // 답변 랜덤화
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

// 배열 랜덤 섞기 유틸리티 함수
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 선택지 선택
function selectOption(optionIndex) {
  const buttons = document.querySelectorAll(".option-btn");

  // 모든 버튼 색상 초기화
  buttons.forEach((btn) => btn.classList.remove("selected"));

  // 클릭한 버튼 색상 추가
  buttons[optionIndex].classList.add("selected");

  setTimeout(() => {
    answers.push(optionIndex);
    currentQuestion++;

    if (currentQuestion < testData.questions.length) {
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
    const question = testData.questions[questionIndex];
    const category = question.categories[answerIndex];
    categoryScores[category]++;
  });

  showResult(categoryScores);
}

// 결과 표시
function showResult(categoryScores) {
  currentResults = categoryScores;
  showScreen("result-screen");

  const totalScore = Object.values(categoryScores).reduce(
    (sum, score) => sum + score,
    0
  );

  const results = Object.entries(categoryScores).map(([category, score]) => {
    let percentage = totalScore > 0 ? (score / totalScore) * 100 : 0;
    return {
      category,
      score,
      percentage: Math.round(percentage),
      personality: testData.personalityTypes[category],
    };
  });

  const sortedResults = results.sort((a, b) => b.percentage - a.percentage);
  renderResultRanking(sortedResults);
  renderDetailCard(sortedResults[0]);
}

// 결과 순위 렌더링
function renderResultRanking(sortedResults) {
  const rankingContainer = document.getElementById("result-ranking");
  rankingContainer.innerHTML = "";

  sortedResults.forEach((result, index) => {
    const rankItem = document.createElement("div");
    rankItem.className = `rank-item rank-${index + 1} clickable`;
    rankItem.onclick = () => selectRankItem(result, rankItem);

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
}

// 상세 카드 렌더링
function renderDetailCard(topResult) {
  const detailCard = document.getElementById("detail-card");
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
            <span class="quote-icon">💬</span>${topResult.personality.quote}
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
