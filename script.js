// DOM이 로드되면 실행
document.addEventListener("DOMContentLoaded", function () {
  initializeControls();
  loadSiteData();
  initializeAds();
});

// AdSense 광고 초기화
function initializeAds() {
  try {
    (adsbygoogle = window.adsbygoogle || []).push({});
    (adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) {
    console.log("AdSense 초기화 중 오류:", e);
  }
}

// 전체 사이트 데이터를 저장할 변수
let allSites = [];

// 컨트롤 초기화
function initializeControls() {
  // 현재는 제거된 테마 기능 외에 별도 컨트롤 없음
}

// JSON 데이터를 로드하는 함수
async function loadSiteData() {
  const container = document.getElementById("cards-container");

  try {
    container.innerHTML = '<div class="loading">데이터를 불러오는 중...</div>';
    const response = await fetch("data.json");

    if (!response.ok) {
      throw new Error("데이터를 불러올 수 없습니다.");
    }

    allSites = await response.json();

    populateCategoryFilter(allSites);
    createCards(allSites);
  } catch (error) {
    console.error("Error loading data:", error);
    container.innerHTML = `<div class="error">오류가 발생했습니다: ${error.message}</div>`;
  }
}

// 카테고리 태그 생성
function populateCategoryFilter(sites) {
  const tagsContainer = document.getElementById("category-tags");
  const categories = [...new Set(sites.map((site) => site.category))].sort();

  tagsContainer.innerHTML = "";

  categories.forEach((category) => {
    const tag = document.createElement("div");
    tag.className = "category-tag selected";
    tag.textContent = category;
    tag.dataset.category = category;

    tag.addEventListener("click", function () {
      tag.classList.toggle("selected");
      filterByCategory();
    });

    tagsContainer.appendChild(tag);
  });
}

// 카테고리별 필터링
function filterByCategory() {
  const selectedTags = document.querySelectorAll(".category-tag.selected");
  const selectedCategories = Array.from(selectedTags).map(
    (tag) => tag.dataset.category
  );

  if (selectedCategories.length === 0) {
    createCards(allSites);
  } else {
    const filteredSites = allSites.filter((site) =>
      selectedCategories.includes(site.category)
    );
    createCards(filteredSites);
  }
}

// 카드 생성
function createCards(sites) {
  const container = document.getElementById("cards-container");
  container.innerHTML = "";

  if (sites.length === 0) {
    container.innerHTML =
      '<div class="loading">해당 카테고리에 사이트가 없습니다.</div>';
    return;
  }

  sites.forEach((site) => {
    const card = createCard(site);
    container.appendChild(card);
  });

  setTimeout(addCardAnimation, 100);
}

// 카드 하나 생성
function createCard(site) {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <div class="card-image">
      <img src="${site.image}" alt="${site.title}" onerror="this.style.display='none';">
    </div>
    <div class="card-content">
      <h3 class="card-title">${site.title}</h3>
      <p class="card-description">${site.description}</p>
      <div class="card-footer">
        <span class="card-category">${site.category}</span>
        <a href="${site.url}" target="_blank" class="card-url" onclick="event.stopPropagation();">
          방문하기 →
        </a>
      </div>
    </div>
  `;

  card.addEventListener("click", function () {
    window.open(site.url, "_blank");
  });

  return card;
}

// 카드 애니메이션
function addCardAnimation() {
  const cards = document.querySelectorAll(".card");

  cards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";

    setTimeout(() => {
      card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, index * 100);
  });
}
