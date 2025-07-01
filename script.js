
// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
    loadSiteData();
});

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
        
        const sites = await response.json();
        
        // 카드들 생성
        createCards(sites);
        
    } catch (error) {
        console.error('Error loading data:', error);
        container.innerHTML = `<div class="error">오류가 발생했습니다: ${error.message}</div>`;
    }
}

// 카드들을 생성하는 함수
function createCards(sites) {
    const container = document.getElementById('cards-container');
    
    // 컨테이너 비우기
    container.innerHTML = '';
    
    // 각 사이트에 대해 카드 생성
    sites.forEach(site => {
        const card = createCard(site);
        container.appendChild(card);
    });
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

// 카드에 애니메이션 효과 추가 (선택사항)
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

// 데이터 로드 후 애니메이션 실행
function createCards(sites) {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';
    
    sites.forEach(site => {
        const card = createCard(site);
        container.appendChild(card);
    });
    
    // 애니메이션 효과 추가
    setTimeout(addCardAnimation, 100);
}
