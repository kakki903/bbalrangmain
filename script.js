
// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeControls();
    loadSiteData();
});

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
    const clearFilters = document.getElementById('clear-filters');
    
    themeToggle.addEventListener('click', toggleTheme);
    clearFilters.addEventListener('click', clearAllFilters);
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

// 카테고리 체크박스 생성
function populateCategoryFilter(sites) {
    const checkboxContainer = document.getElementById('category-checkboxes');
    
    // 중복 제거 후 정렬된 카테고리 목록 생성
    const categories = [...new Set(sites.map(site => site.category))].sort();
    
    // 기존 체크박스들 제거
    checkboxContainer.innerHTML = '';
    
    // 새 체크박스들 추가
    categories.forEach(category => {
        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.className = 'category-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `category-${category}`;
        checkbox.value = category;
        checkbox.addEventListener('change', filterByCategory);
        
        const label = document.createElement('label');
        label.htmlFor = `category-${category}`;
        label.textContent = category;
        
        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(label);
        
        // 체크박스 래퍼 클릭 시 체크박스 토글
        checkboxWrapper.addEventListener('click', function(e) {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                filterByCategory();
            }
            updateCheckboxStyle(checkboxWrapper, checkbox.checked);
        });
        
        // 체크박스 직접 클릭 시에도 스타일 업데이트
        checkbox.addEventListener('change', function() {
            updateCheckboxStyle(checkboxWrapper, checkbox.checked);
        });
        
        checkboxContainer.appendChild(checkboxWrapper);
    });
}

// 체크박스 스타일 업데이트
function updateCheckboxStyle(wrapper, isChecked) {
    if (isChecked) {
        wrapper.classList.add('selected');
    } else {
        wrapper.classList.remove('selected');
    }
}

// 카테고리별 필터링 (다중 선택)
function filterByCategory() {
    const checkboxes = document.querySelectorAll('#category-checkboxes input[type="checkbox"]');
    const selectedCategories = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedCategories.push(checkbox.value);
        }
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

// 모든 필터 해제
function clearAllFilters() {
    const checkboxes = document.querySelectorAll('#category-checkboxes input[type="checkbox"]');
    const checkboxWrappers = document.querySelectorAll('.category-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    checkboxWrappers.forEach(wrapper => {
        wrapper.classList.remove('selected');
    });
    
    // 모든 사이트 표시
    createCards(allSites);
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
