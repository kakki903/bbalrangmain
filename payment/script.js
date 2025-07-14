let currentQuestion = 0;
let answers = [];

// 질문 순서 랜덤화
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

  // 새 카드 활성화
  cardElement.classList.add("active");
  detailContainer.classList.add("active");
  detailContainer.dataset.currentCategory = category;

  // 상세 정보 업데이트
  const descriptionHTML = `
        <div class="detail-header">
            <div class="detail-emoji">${personality.emoji}</div>
            <div class="detail-title">${personality.name}</div>
            <div class="detail-category">${category}</div>
            <div class="detail-percentage">${personality.percentage}%</div>
        </div>
        <div class="personality-description">${personality.description}</div>
        <div class="funny-quote"><span class="quote-icon">💬</span>${personality.quote}</div>
    `;
  detailContainer.innerHTML = descriptionHTML;
}

// 선택지 선택
function selectOption(optionIndex) {
  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach((btn) => btn.classList.remove("selected"));
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

  // 총 점수 계산
  const totalScore = Object.values(categoryScores).reduce(
    (sum, score) => sum + score,
    0
  );

  // 모든 결과에 대해 비율을 먼저 계산하고 조정
  const results = Object.entries(categoryScores).map(([category, score]) => {
    // 기본 비율 계산
    let basePercentage = totalScore > 0 ? (score / totalScore) * 100 : 0;

    // 미세 조정
    let adjustedPercentage = Math.round(basePercentage);
    return {
      category,
      score,
      percentage: adjustedPercentage,
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
    const maxScoreResult = results.reduce((max, current) =>
      current.score > max.score ? current : max
    );
    maxScoreResult.percentage += difference;
    if (maxScoreResult.percentage < 1) {
      maxScoreResult.percentage = 1;
    }
  }

  renderResultRanking(results);
  renderDetailCard(results[0]);
}

// 결과 순위 렌더링
function renderResultRanking(results) {
  const rankingContainer = document.getElementById("result-ranking");
  rankingContainer.innerHTML = "";

  // 상위 4개만 표시
  const topResults = results.slice(0, 4);

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
  document.querySelectorAll(".rank-item").forEach((item) => {
    item.classList.remove("active");
  });

  rankItemElement.classList.add("active");
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

  const shareURL = generateShareURL();
  const topPersonality = Object.keys(currentResults)
    .map((category) => testData.personalityTypes[category])
    .find((personality) => personality);

  Kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title: "💰 소비 성향 테스트 결과",
      description: `나의 소비 성향은 "${topPersonality.name}"! (${currentResults[topPersonality].percentage})\n${topPersonality.quote}`,
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
      alert("링크 복사에 실패했습니다.");
    });
}

// 테스트 재시작
function restartTest() {
  showStartScreen();
  currentQuestion = 0;
  answers = [];
}
