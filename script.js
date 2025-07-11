document.addEventListener("DOMContentLoaded", function () {
  loadSiteData();
});

let allSites = [];

async function loadSiteData() {
  const container = document.getElementById("cards-container");
  try {
    container.innerHTML = '<div class="loading">데이터를 불러오는 중...</div>';
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("데이터를 불러올 수 없습니다.");
    allSites = await response.json();
    populateCategoryFilter(allSites);
    createCards(allSites);
  } catch (error) {
    console.error("Error loading data:", error);
    container.innerHTML = `<div class="error">오류 발생: ${error.message}</div>`;
  }
}

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

function filterByCategory() {
  const selected = Array.from(
    document.querySelectorAll(".category-tag.selected")
  ).map((el) => el.dataset.category);
  const filtered =
    selected.length === 0
      ? allSites
      : allSites.filter((site) => selected.includes(site.category));
  createCards(filtered);
}

function createCards(sites) {
  const container = document.getElementById("cards-container");
  container.innerHTML = "";
  if (sites.length === 0) {
    container.innerHTML =
      '<div class="loading">해당 카테고리에 사이트가 없습니다.</div>';
    return;
  }
  sites.forEach((site) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3 class="card-title">${site.title}</h3>
      <p class="card-description">${site.description}</p>
      <span class="card-category">${site.category}</span><br/>
      <a href="${site.url}" target="_blank" class="card-url">방문하기 →</a>
    `;
    container.appendChild(card);
  });
}
