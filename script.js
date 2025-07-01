
// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
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
        console.log('AdSense 초기화 중 오류:', e);
    }
}

// 전체 사이트 데이터를 저장할 변수
let allSites = [];

// 테마 초기화
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

// 컨트롤 초기화
function initializeControls() {
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', toggleTheme);
}

// 테마 토글 기능
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// 테마 아이콘 업데이트
function updateThemeIcon(theme) {
    const icon = document.querySelector('.toggle-icon');
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// JSON 데이터를 로드하는 함수
async function loadSiteData() {
    const container = document.getElementById('cards-container');
    
    try {
        // 로딩 메시지 표시
        container.innerHTML = '<div class="loading">데이터를 불러오는 중...</div>';
        
        // JSON 파일 읽기
        const response = await fetch('data.json');
        
        if (!response.ok) {
            throw new Error('데이터를 불러올 수 없습니다.');
        }
        
        allSites = await response.json();
        
        // 카테고리 필터 옵션 생성
        populateCategoryFilter(allSites);
        
        // 카드들 생성
        createCards(allSites);
        
    } catch (error) {
        console.error('Error loading data:', error);
        container.innerHTML = `<div class="error">오류가 발생했습니다: ${error.message}</div>`;
    }
}

// 카테고리 태그 생성
function populateCategoryFilter(sites) {
    const tagsContainer = document.getElementById('category-tags');
    
    // 중복 제거 후 정렬된 카테고리 목록 생성
    const categories = [...new Set(sites.map(site => site.category))].sort();
    
    // 기존 태그들 제거
    tagsContainer.innerHTML = '';
    
    // 새 태그들 추가
    categories.forEach(category => {
        const tag = document.createElement('div');
        tag.className = 'category-tag selected'; // 기본으로 선택된 상태
        tag.textContent = category;
        tag.dataset.category = category;
        
        // 태그 클릭 이벤트
        tag.addEventListener('click', function() {
            // 선택/해제 토글
            tag.classList.toggle('selected');
            filterByCategory();
        });
        
        tagsContainer.appendChild(tag);
    });
}

// 카테고리별 필터링 (다중 선택)
function filterByCategory() {
    const selectedTags = document.querySelectorAll('.category-tag.selected');
    const selectedCategories = [];
    
    selectedTags.forEach(tag => {
        selectedCategories.push(tag.dataset.category);
    });
    
    if (selectedCategories.length === 0) {
        // 선택된 카테고리가 없으면 모든 사이트 표시
        createCards(allSites);
    } else {
        // 선택된 카테고리들의 사이트만 필터링
        const filteredSites = allSites.filter(site => 
            selectedCategories.includes(site.category)
        );
        createCards(filteredSites);
    }
}



// 카드들을 생성하는 함수
function createCards(sites) {
    const container = document.getElementById('cards-container');
    
    // 컨테이너 비우기
    container.innerHTML = '';
    
    if (sites.length === 0) {
        container.innerHTML = '<div class="loading">해당 카테고리에 사이트가 없습니다.</div>';
        return;
    }
    
    // 각 사이트에 대해 카드 생성
    sites.forEach(site => {
        const card = createCard(site);
        container.appendChild(card);
    });
    
    // 애니메이션 효과 추가
    setTimeout(addCardAnimation, 100);
}

// 개별 카드를 생성하는 함수
function createCard(site) {
    // 카드 요소 생성
    const card = document.createElement('div');
    card.className = 'card';
    
    // 카드 HTML 구조 생성
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
    
    // 카드 클릭 이벤트 추가
    card.addEventListener('click', function() {
        window.open(site.url, '_blank');
    });
    
    return card;
}

// 카드에 애니메이션 효과 추가
function addCardAnimation() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}
