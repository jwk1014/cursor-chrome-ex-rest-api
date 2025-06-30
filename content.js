// Content Script - 웹 페이지에서 실행됨

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('REST API 관리자 Content Script가 로드되었습니다.');
});

// 메시지 리스너 (필요시 사용)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageInfo') {
        sendResponse({
            url: window.location.href,
            title: document.title
        });
    }
}); 