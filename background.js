// Chrome Extension Background Service Worker

// 확장 프로그램 설치 시 초기화
chrome.runtime.onInstalled.addListener(() => {
    console.log('REST API 관리자 확장 프로그램이 설치되었습니다.');
    
    // 기본 데이터 초기화
    chrome.storage.local.get(['savedRequests', 'historyRecords'], (result) => {
        if (!result.savedRequests) {
            chrome.storage.local.set({ savedRequests: [] });
        }
        if (!result.historyRecords) {
            chrome.storage.local.set({ historyRecords: [] });
        }
    });
});

// 확장 프로그램 아이콘 클릭 시 새 탭 열기
chrome.action.onClicked.addListener(async (tab) => {
    // 이미 열린 탭이 있는지 확인
    const tabs = await chrome.tabs.query({});
    const existingTab = tabs.find(t => t.url && t.url.includes('chrome-extension://') && t.url.includes('main.html'));
    
    if (existingTab) {
        // 이미 열린 탭이 있으면 해당 탭으로 포커스
        await chrome.tabs.update(existingTab.id, { active: true });
        await chrome.windows.update(existingTab.windowId, { focused: true });
    } else {
        // 새 탭에서 메인 페이지 열기
        await chrome.tabs.create({
            url: chrome.runtime.getURL('main.html')
        });
    }
});

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getData') {
        chrome.storage.local.get(['savedRequests', 'historyRecords'], (result) => {
            sendResponse({
                savedRequests: result.savedRequests || [],
                historyRecords: result.historyRecords || []
            });
        });
        return true; // 비동기 응답을 위해 true 반환
    }
    
    if (request.action === 'saveData') {
        chrome.storage.local.set({
            savedRequests: request.savedRequests,
            historyRecords: request.historyRecords
        }, () => {
            sendResponse({ success: true });
        });
        return true;
    }
}); 