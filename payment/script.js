// 전역 변수
let currentQuestion = 0;
let answers = [];
let testData = null;
let currentResults = null;
let userName = "";

// 카카오 SDK 초기화
document.addEventListener("DOMContentLoaded", function () {
  // 카카오 JavaScript 키로 초기화 (실제 키로 교체 필요)
  if (
    typeof Kakao !== "undefined" &&
    Kakao.isInitialized &&
    !Kakao.isInitialized()
  ) {
    Kakao.init("YOUR_KAKAO_JS_KEY"); // 실제 카카오 JavaScript 키로 교체 필요
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

  // URL 파라미터에서 비율 데이터 추출
  const categoryMapping = {
    food: "식비",
    shopping: "쇼핑",
    subscription: "구독/디지털",
    saving: "저축/계획",
    fixed: "고정비",
    impulse: "즉흥/기타",
    goods: "굿즈/취미/이벤트",
  };

  // 공유된 이름 확인 및 디코딩
  const sharedName = urlParams.get("name");
  if (sharedName) {
    try {
      // 이중 인코딩된 경우를 대비해 두 번 디코딩 시도
      userName = decodeURIComponent(decodeURIComponent(sharedName));
    } catch (e) {
      try {
        // 한 번만 인코딩된 경우
        userName = decodeURIComponent(sharedName);
      } catch (e2) {
        // 디코딩 실패 시 원본 사용
        userName = sharedName;
      }
    }
  }

  for (const [key, value] of urlParams) {
    if (categoryMapping[key] && value) {
      const category = categoryMapping[key];
      percentageResults[category] = parseInt(value);
    }
  }

  // 결과 데이터가 있으면 결과 화면으로 이동
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

  // 공유받은 결과의 제목 업데이트
  const resultTitle = document.getElementById("result-title");
  if (userName) {
    resultTitle.innerHTML = `🎉 ${userName}님의 소비 성향 결과`;
  } else {
    resultTitle.innerHTML = `🎉 당신의 소비 성향 결과`;
  }

  // 비율을 바탕으로 결과 객체 생성
  const results = Object.entries(percentageResults)
    .map(([category, percentage]) => ({
      category,
      score: 0, // URL에서 온 경우 원점수는 의미없음
      percentage: percentage,
      personality: testData.personalityTypes[category] || {
        name: "알 수 없음",
        emoji: "❓",
        description: "알 수 없는 성향입니다.",
        quote: "데이터를 확인해주세요.",
      },
    }))
    .filter((result) => result.personality); // 유효한 성향만 포함

  // 비율 순으로 정렬
  const sortedResults = results.sort((a, b) => b.percentage - a.percentage);

  // 결과를 currentResults에 저장 (공유 기능을 위해)
  currentResults = {};
  sortedResults.forEach((result) => {
    currentResults[result.category] = result.percentage;
  });

  // 결과 화면 표시
  if (sortedResults.length > 0) {
    showScreen("result-screen");
    renderResultRanking(sortedResults);
    renderDetailCard(sortedResults[0]);
  } else {
    // 유효한 결과가 없으면 시작 화면으로
    showScreen("start-screen");
  }
}

// 테스트 시작
function startTest() {
  if (!testData) {
    alert("데이터를 로드하는 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  // 이름 입력 확인
  const nameInput = document.getElementById("user-name");
  userName = nameInput.value.trim();

  if (!userName) {
    nameInput.focus();
    nameInput.style.borderColor = "#ff6b6b";
    nameInput.style.animation = "shake 0.5s ease-in-out";
    setTimeout(() => {
      nameInput.style.borderColor = "#e9ecef";
      nameInput.style.animation = "";
    }, 500);
    return;
  }

  currentQuestion = 0;
  answers = [];

  // 질문 순서 랜덤화
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

// 성향 미리보기 표시
function showPreview() {
  if (!testData) {
    alert("데이터를 로드하는 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  showScreen("preview-screen");
  renderPersonalityGrid();
}

// 시작 화면으로 돌아가기
function showStartScreen() {
  showScreen("start-screen");
  // URL 파라미터 제거
  window.history.replaceState({}, document.title, window.location.pathname);
}

// 화면 전환
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });
  document.getElementById(screenId).classList.add("active");
}

// 성향 그리드 렌더링
function renderPersonalityGrid() {
  const grid = document.getElementById("personality-grid");
  grid.innerHTML = "";

  Object.entries(testData.personalityTypes).forEach(
    ([category, personality]) => {
      const card = document.createElement("div");
      // 카테고리명을 CSS 클래스명으로 변환 (공백과 특수문자 제거)
      const categoryClass = category.replace(/[^가-힣a-zA-Z0-9]/g, "");
      card.className = `personality-preview-card ${categoryClass}`;
      card.onclick = () => togglePersonalityDetail(category, card);

      card.innerHTML = `
            <div class="preview-emoji">${personality.emoji}</div>
            <div class="preview-name">${personality.name}</div>
            <div class="preview-category">${category}</div>
        `;

      grid.appendChild(card);
    }
  );
}

// 성향 상세 정보 토글
function togglePersonalityDetail(category, cardElement) {
  const detailContainer = document.getElementById("personality-detail");
  const personality = testData.personalityTypes[category];

  // 모든 카드의 active 클래스 제거
  document.querySelectorAll(".personality-preview-card").forEach((card) => {
    card.classList.remove("active");
  });

  // 현재 카드가 이미 활성화되어 있다면 토글 (닫기)
  if (
    detailContainer.classList.contains("active") &&
    detailContainer.dataset.currentCategory === category
  ) {
    detailContainer.classList.remove("active");
    detailContainer.dataset.currentCategory = "";
    return;
  }

  // 새로운 카드 활성화
  cardElement.classList.add("active");
  detailContainer.dataset.currentCategory = category;

  detailContainer.innerHTML = `
        <div class="preview-detail-header">
            <div class="preview-detail-emoji">${personality.emoji}</div>
            <div class="preview-detail-info">
                <h3>${personality.name}</h3>
                <div class="preview-detail-category">${category}</div>
            </div>
        </div>
        <div class="preview-detail-description">
            ${personality.description}
        </div>
        <div class="preview-detail-quote">
            ${personality.quote}
        </div>
    `;

  detailContainer.classList.add("active");
}

// 질문 표시
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

  // 답변 순서 랜덤화를 위한 인덱스 배열 생성
  const optionIndices = Array.from(
    { length: question.options.length },
    (_, i) => i
  );
  shuffleArray(optionIndices);

  // 랜덤화된 순서로 답변 표시
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
  return array;
}

// 선택지 선택
function selectOption(optionIndex) {
  const buttons = document.querySelectorAll(".option-btn");

  // 클릭된 버튼 찾기
  let clickedButton = null;
  buttons.forEach((btn) => {
    btn.classList.remove("selected");
    if (
      btn.textContent ===
      testData.questions[currentQuestion].options[optionIndex]
    ) {
      clickedButton = btn;
    }
  });

  // 클릭된 버튼에 선택 표시
  if (clickedButton) {
    clickedButton.classList.add("selected");
  }

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

  // 모든 카테고리 초기화
  Object.keys(testData.personalityTypes).forEach((category) => {
    categoryScores[category] = 0;
  });

  // 답변에 따른 점수 계산
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

  // 개인화된 제목 표시
  const resultTitle = document.getElementById("result-title");
  if (userName) {
    resultTitle.innerHTML = `🎉 ${userName}님의 소비 성향 결과`;
  } else {
    resultTitle.innerHTML = `🎉 당신의 소비 성향 결과`;
  }

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
    // 카테고리별 클래스명 생성 (공백과 특수문자 제거)
    const categoryClass = result.category.replace(/[^가-힣a-zA-Z0-9]/g, "");
    rankItem.className = `rank-item rank-${
      index + 1
    } clickable ${categoryClass}`;
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
  if (!activeRankItem) {
    alert("선택된 결과가 없습니다.");
    return;
  }

  const topPersonalityName =
    activeRankItem.querySelector(".rank-name")?.textContent || "알 수 없음";
  const topPercentage =
    activeRankItem.querySelector(".rank-percentage")?.textContent || "0%";

  // 성향 정보 찾기
  let topPersonality = null;
  for (const personality of Object.values(testData.personalityTypes)) {
    if (personality.name === topPersonalityName) {
      topPersonality = personality;
      break;
    }
  }

  if (!topPersonality) {
    topPersonality = {
      quote: "나만의 독특한 소비 성향!",
    };
  }

  const shareURL = generateShareURL();

  // 공유 메시지에 이름 포함
  const shareTitle = userName
    ? `💰 ${userName}님의 소비 성향 테스트 결과`
    : "💰 소비 성향 테스트 결과";
  const shareDescription = userName
    ? `${userName}님의 소비 성향은 "${topPersonalityName}"! (${topPercentage})\n${topPersonality.quote}`
    : `나의 소비 성향은 "${topPersonalityName}"! (${topPercentage})\n${topPersonality.quote}`;

  Kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title: shareTitle,
      description: shareDescription,
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

  // 이름이 있으면 URL에 포함
  if (userName) {
    params.append("name", encodeURIComponent(userName));
  }

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
  loadTestData()
    .then(() => {
      showScreen("start-screen");
    })
    .catch((error) => {
      console.error("데이터 로드 중 오류:", error);
      showScreen("start-screen");
    });
}
