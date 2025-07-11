// DOM 로딩 후 초기화
document.addEventListener("DOMContentLoaded", async function () {
  await loadLayout();
  initializeTheme();
  initializeControls();
  loadSiteData();
  initializeAds();
});

// header/footer 동적 삽입
async function loadLayout() {
  const header = document.getElementById("main-header");
  const footer = document.getElementById("main-footer");

  if (header) {
    const res = await fetch("header.html");
    header.innerHTML = await res.text();
  }

  if (footer) {
    const res = await fetch("footer.html");
    footer.innerHTML = await res.text();
  }
}

// AdSense 초기화
function initializeAds() {
  try {
    (adsbygoogle = window.adsbygoogle || []).push({});
    (adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) {
    console.warn("AdSense 초기화 실패:", e);
  }
}

// 테마 관련
function initializeTheme() {
  const theme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", theme);
  updateThemeIcon(theme);
}

function initializeControls() {
  const toggle = document.getElementById("theme-toggle");
  if (toggle) toggle.addEventListener("click", toggleTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const newTheme = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = document.querySelector(".toggle-icon");
  if (icon) icon.textContent = theme === "dark" ? "☀️" : "🌙";
}

// 사이트 데이터 관련
let allSites = [];

async function loadSiteData() {
  const container = document.getElementById("cards-container");
  if (!container) return;

  container.innerHTML = '<div class="loading">데이터를 불러오는 중...</div>';

  try {
    const res = await fetch("data.json");
    if (!res.ok) throw new Error("데이터 로딩 실패");
    allSites = await res.json();
    populateCategoryFilter(allSites);
    createCards(allSites);
  } catch (err) {
    container.innerHTML = `<div class="error">오류 발생: ${err.message}</div>`;
  }
}

function populateCategoryFilter(sites) {
  const container = document.getElementById("category-tags");
  if (!container) return;

  const categories = [...new Set(sites.map((site) => site.category))].sort();
  container.innerHTML = "";

  categories.forEach((category) => {
    const tag = document.createElement("div");
    tag.className = "category-tag selected";
    tag.textContent = category;
    tag.dataset.category = category;
    tag.addEventListener("click", () => {
      tag.classList.toggle("selected");
      filterByCategory();
    });
    container.appendChild(tag);
  });
}

function filterByCategory() {
  const selected = [...document.querySelectorAll(".category-tag.selected")].map(
    (tag) => tag.dataset.category
  );

  if (selected.length === 0) {
    createCards(allSites);
  } else {
    const filtered = allSites.filter((site) =>
      selected.includes(site.category)
    );
    createCards(filtered);
  }
}

function createCards(sites) {
  const container = document.getElementById("cards-container");
  if (!container) return;

  container.innerHTML = "";

  if (sites.length === 0) {
    container.innerHTML =
      '<div class="loading">해당 카테고리에 사이트가 없습니다.</div>';
    return;
  }

  sites.forEach((site) => container.appendChild(createCard(site)));
  setTimeout(addCardAnimation, 100);
}

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
        <a href="${site.url}" target="_blank" class="card-url" onclick="event.stopPropagation();">방문하기 →</a>
      </div>
    </div>
  `;
  card.addEventListener("click", () => window.open(site.url, "_blank"));
  return card;
}

function addCardAnimation() {
  const cards = document.querySelectorAll(".card");
  cards.forEach((card, i) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    setTimeout(() => {
      card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, i * 100);
  });
}
