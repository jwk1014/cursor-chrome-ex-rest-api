// 전역 변수
let savedRequests = [];
let historyRecords = [];
let currentTab = 'saved-requests';
let proxySettings = {
    enabled: false,
    url: '',
    username: '',
    password: ''
};

// DOM 요소들
const elements = {
    // 탭 관련
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // 작은 탭 관련
    smallTabButtons: document.querySelectorAll('.tab-btn-small'),
    smallTabContents: document.querySelectorAll('.tab-content-small'),
    
    // 요청 폼
    methodSelect: document.getElementById('method'),
    urlInput: document.getElementById('url'),
    requestTitleInput: document.getElementById('request-title'),
    bodyContentType: document.getElementById('body-content-type'),
    requestBodyJson: document.getElementById('request-body-json'),
    requestBodyText: document.getElementById('request-body-text'),
    sendRequestBtn: document.getElementById('send-request'),
    saveRequestBtn: document.getElementById('save-request'),
    
    // 응답 관련
    statusCode: document.getElementById('status-code'),
    statusText: document.getElementById('status-text'),
    responseTime: document.getElementById('response-time'),
    responseBodyContent: document.getElementById('response-body-content'),
    responseHeadersContent: document.getElementById('response-headers-content'),
    
    // 목록 관련
    savedRequestsList: document.getElementById('saved-requests-list'),
    historyList: document.getElementById('history-list'),
    addSavedRequestBtn: document.getElementById('add-saved-request'),
    clearHistoryBtn: document.getElementById('clear-history'),
    
    // 설정 관련
    proxyEnabled: document.getElementById('proxy-enabled'),
    proxyUrl: document.getElementById('proxy-url'),
    proxyUsername: document.getElementById('proxy-username'),
    proxyPassword: document.getElementById('proxy-password'),
    saveSettingsBtn: document.getElementById('save-settings')
};

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadData();
    loadSettings();
    renderLists();
});

// 이벤트 리스너 초기화
function initializeEventListeners() {
    // 메인 탭 전환
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
    
    // 작은 탭 전환
    elements.smallTabButtons.forEach(button => {
        button.addEventListener('click', () => switchSmallTab(button.dataset.tab));
    });
    
    // 요청 보내기
    elements.sendRequestBtn.addEventListener('click', sendRequest);
    
    // 요청 저장
    elements.saveRequestBtn.addEventListener('click', saveRequest);
    
    // 새 요청 추가
    elements.addSavedRequestBtn.addEventListener('click', addNewRequest);
    
    // 기록 삭제
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    
    // 설정 저장
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Content-Type 변경
    elements.bodyContentType.addEventListener('change', switchBodyFormat);
    
    // 키-값 쌍 추가 버튼들
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', () => addKeyValuePair(btn.dataset.target));
    });
    
    // 키-값 쌍 삭제 버튼들 (이벤트 위임)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            removeKeyValuePair(e.target);
        }
    });
}

// 탭 전환
function switchTab(tabName) {
    currentTab = tabName;
    
    // 탭 버튼 활성화
    elements.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // 탭 콘텐츠 전환
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
}

// 작은 탭 전환
function switchSmallTab(tabName) {
    elements.smallTabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    elements.smallTabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
}

// Body 형식 전환
function switchBodyFormat() {
    const contentType = elements.bodyContentType.value;
    const bodyFormats = document.querySelectorAll('.body-format');
    
    // 모든 형식 숨기기
    bodyFormats.forEach(format => {
        format.classList.remove('active');
    });
    
    // 선택된 형식 보이기
    switch (contentType) {
        case 'application/json':
            document.getElementById('json-body').classList.add('active');
            break;
        case 'application/x-www-form-urlencoded':
            document.getElementById('form-body').classList.add('active');
            break;
        case 'text/plain':
            document.getElementById('text-body').classList.add('active');
            break;
    }
}

// 데이터 로드
async function loadData() {
    try {
        const result = await chrome.storage.local.get(['savedRequests', 'historyRecords']);
        savedRequests = result.savedRequests || [];
        historyRecords = result.historyRecords || [];
    } catch (error) {
        console.error('데이터 로드 실패:', error);
    }
}

// 설정 로드
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get(['proxySettings']);
        proxySettings = result.proxySettings || {
            enabled: false,
            url: '',
            username: '',
            password: ''
        };
        
        // UI에 설정 반영
        elements.proxyEnabled.checked = proxySettings.enabled;
        elements.proxyUrl.value = proxySettings.url;
        elements.proxyUsername.value = proxySettings.username;
        elements.proxyPassword.value = proxySettings.password;
    } catch (error) {
        console.error('설정 로드 실패:', error);
    }
}

// 데이터 저장
async function saveData() {
    try {
        await chrome.storage.local.set({
            savedRequests: savedRequests,
            historyRecords: historyRecords
        });
    } catch (error) {
        console.error('데이터 저장 실패:', error);
    }
}

// 설정 저장
async function saveSettings() {
    try {
        proxySettings = {
            enabled: elements.proxyEnabled.checked,
            url: elements.proxyUrl.value.trim(),
            username: elements.proxyUsername.value.trim(),
            password: elements.proxyPassword.value.trim()
        };
        
        await chrome.storage.local.set({ proxySettings: proxySettings });
        alert('설정이 저장되었습니다.');
    } catch (error) {
        console.error('설정 저장 실패:', error);
        alert('설정 저장에 실패했습니다.');
    }
}

// 목록 렌더링
function renderLists() {
    renderSavedRequests();
    renderHistory();
}

// 저장된 요청 목록 렌더링
function renderSavedRequests() {
    elements.savedRequestsList.innerHTML = '';
    
    savedRequests.forEach((request, index) => {
        const item = createListItem(request, index, 'saved');
        elements.savedRequestsList.appendChild(item);
    });
}

// 호출 기록 목록 렌더링
function renderHistory() {
    elements.historyList.innerHTML = '';
    
    historyRecords.forEach((record, index) => {
        const item = createListItem(record, index, 'history');
        elements.historyList.appendChild(item);
    });
}

// 리스트 아이템 생성
function createListItem(item, index, type) {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.dataset.index = index;
    div.dataset.type = type;
    
    const title = type === 'saved' ? item.title : `${item.method} ${item.url}`;
    const details = type === 'saved' 
        ? `${item.method} ${item.url}` 
        : `${new Date(item.timestamp).toLocaleString()} - ${item.statusCode}`;
    
    div.innerHTML = `
        <div class="list-item-title">${title}</div>
        <div class="list-item-details">${details}</div>
        <div class="list-item-actions">
            <button class="btn-secondary" onclick="loadItem(${index}, '${type}')">로드</button>
            <button class="btn-secondary" onclick="deleteItem(${index}, '${type}')">삭제</button>
        </div>
    `;
    
    return div;
}

// 아이템 로드
function loadItem(index, type) {
    const item = type === 'saved' ? savedRequests[index] : historyRecords[index];
    
    if (!item) return;
    
    // 폼에 데이터 로드
    elements.methodSelect.value = item.method;
    elements.urlInput.value = item.url;
    elements.requestTitleInput.value = item.title || '';
    
    // Body Content-Type 및 데이터 로드
    if (item.contentType) {
        elements.bodyContentType.value = item.contentType;
        switchBodyFormat();
        
        switch (item.contentType) {
            case 'application/json':
                elements.requestBodyJson.value = item.body || '';
                break;
            case 'application/x-www-form-urlencoded':
                loadKeyValuePairs('form-data-container', item.formData || {});
                break;
            case 'text/plain':
                elements.requestBodyText.value = item.body || '';
                break;
        }
    } else {
        // 기존 호환성을 위해
        elements.requestBodyJson.value = item.body || '';
    }
    
    // 헤더 로드
    loadKeyValuePairs('headers-container', item.headers || {});
    
    // 쿼리 파라미터 로드
    loadKeyValuePairs('params-container', item.params || {});
    
    // 응답 데이터가 있으면 로드
    if (type === 'history' && item.response) {
        elements.statusCode.textContent = item.response.statusCode;
        elements.statusText.textContent = item.response.statusText;
        elements.responseTime.textContent = `${item.response.time}ms`;
        elements.responseBodyContent.textContent = formatResponseBody(item.response.body);
        elements.responseHeadersContent.textContent = formatHeaders(item.response.headers);
        
        // 상태 코드에 따른 클래스 추가
        elements.statusCode.className = 'status-code ' + getStatusClass(item.response.statusCode);
    }
}

// 아이템 삭제
function deleteItem(index, type) {
    if (type === 'saved') {
        savedRequests.splice(index, 1);
    } else {
        historyRecords.splice(index, 1);
    }
    
    saveData();
    renderLists();
}

// 키-값 쌍 로드
function loadKeyValuePairs(containerId, data) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    Object.entries(data).forEach(([key, value]) => {
        addKeyValueRow(container, key, value);
    });
    
    // 최소 하나의 빈 행 추가
    if (Object.keys(data).length === 0) {
        addKeyValueRow(container);
    }
}

// 키-값 쌍 추가
function addKeyValuePair(containerId) {
    const container = document.getElementById(containerId);
    addKeyValueRow(container);
}

// 키-값 행 추가
function addKeyValueRow(container, key = '', value = '') {
    const row = document.createElement('div');
    row.className = 'key-value-row';
    row.innerHTML = `
        <input type="text" placeholder="Key" class="key-input" value="${key}">
        <input type="text" placeholder="Value" class="value-input" value="${value}">
        <button class="remove-btn">×</button>
    `;
    container.appendChild(row);
}

// 키-값 쌍 삭제
function removeKeyValuePair(button) {
    const row = button.parentElement;
    const container = row.parentElement;
    
    // 최소 하나의 행은 유지
    if (container.children.length > 1) {
        row.remove();
    }
}

// 새 요청 추가
function addNewRequest() {
    // 폼 초기화
    elements.methodSelect.value = 'GET';
    elements.urlInput.value = '';
    elements.requestTitleInput.value = '';
    elements.bodyContentType.value = 'application/json';
    elements.requestBodyJson.value = '';
    elements.requestBodyText.value = '';
    
    // Body 형식 전환
    switchBodyFormat();
    
    // 헤더와 파라미터 초기화
    document.getElementById('headers-container').innerHTML = `
        <div class="key-value-row">
            <input type="text" placeholder="Key" class="key-input">
            <input type="text" placeholder="Value" class="value-input">
            <button class="remove-btn">×</button>
        </div>
    `;
    
    document.getElementById('params-container').innerHTML = `
        <div class="key-value-row">
            <input type="text" placeholder="Key" class="key-input">
            <input type="text" placeholder="Value" class="value-input">
            <button class="remove-btn">×</button>
        </div>
    `;
    
    document.getElementById('form-data-container').innerHTML = `
        <div class="key-value-row">
            <input type="text" placeholder="Key" class="key-input">
            <input type="text" placeholder="Value" class="value-input">
            <button class="remove-btn">×</button>
        </div>
    `;
    
    // 응답 초기화
    clearResponse();
}

// 요청 저장
function saveRequest() {
    const title = elements.requestTitleInput.value.trim();
    if (!title) {
        alert('요청 제목을 입력해주세요.');
        return;
    }
    
    const requestData = getRequestData();
    requestData.title = title;
    
    savedRequests.unshift(requestData);
    saveData();
    renderLists();
    
    alert('요청이 저장되었습니다.');
}

// 요청 보내기
async function sendRequest() {
    const requestData = getRequestData();
    
    if (!requestData.url) {
        alert('URL을 입력해주세요.');
        return;
    }
    
    try {
        elements.sendRequestBtn.disabled = true;
        elements.sendRequestBtn.textContent = '요청 중...';
        
        const startTime = Date.now();
        const response = await makeRequest(requestData);
        const endTime = Date.now();
        
        // 응답 표시
        displayResponse(response, endTime - startTime);
        
        // 기록에 저장
        const historyRecord = {
            ...requestData,
            timestamp: Date.now(),
            response: {
                ...response,
                time: endTime - startTime
            }
        };
        
        historyRecords.unshift(historyRecord);
        saveData();
        renderLists();
        
    } catch (error) {
        console.error('요청 실패:', error);
        alert('요청에 실패했습니다: ' + error.message);
    } finally {
        elements.sendRequestBtn.disabled = false;
        elements.sendRequestBtn.textContent = '요청 보내기';
    }
}

// 요청 데이터 수집
function getRequestData() {
    const headers = getKeyValuePairs('headers-container');
    const params = getKeyValuePairs('params-container');
    const contentType = elements.bodyContentType.value;
    
    let body = '';
    let formData = {};
    
    switch (contentType) {
        case 'application/json':
            body = elements.requestBodyJson.value;
            break;
        case 'application/x-www-form-urlencoded':
            formData = getKeyValuePairs('form-data-container');
            body = new URLSearchParams(formData).toString();
            break;
        case 'text/plain':
            body = elements.requestBodyText.value;
            break;
    }
    
    return {
        method: elements.methodSelect.value,
        url: elements.urlInput.value,
        headers: headers,
        params: params,
        contentType: contentType,
        body: body,
        formData: formData
    };
}

// 키-값 쌍 수집
function getKeyValuePairs(containerId) {
    const container = document.getElementById(containerId);
    const pairs = {};
    
    container.querySelectorAll('.key-value-row').forEach(row => {
        const keyInput = row.querySelector('.key-input');
        const valueInput = row.querySelector('.value-input');
        const key = keyInput.value.trim();
        const value = valueInput.value.trim();
        
        if (key) {
            pairs[key] = value;
        }
    });
    
    return pairs;
}

// 실제 HTTP 요청 수행 (프록시 지원)
async function makeRequest(requestData) {
    const url = new URL(requestData.url);
    
    // 쿼리 파라미터 추가
    Object.entries(requestData.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });
    
    const options = {
        method: requestData.method,
        headers: requestData.headers
    };
    
    // Content-Type 헤더 추가
    if (requestData.contentType && requestData.contentType !== 'application/x-www-form-urlencoded') {
        options.headers['Content-Type'] = requestData.contentType;
    }
    
    // Body 추가 (GET 요청이 아닌 경우)
    if (requestData.method !== 'GET' && requestData.body) {
        if (requestData.contentType === 'application/json') {
            try {
                options.body = JSON.parse(requestData.body);
            } catch {
                options.body = requestData.body;
            }
        } else if (requestData.contentType === 'application/x-www-form-urlencoded') {
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            options.body = requestData.body;
        } else {
            options.body = requestData.body;
        }
    }
    
    // 프록시 설정이 활성화된 경우
    if (proxySettings.enabled && proxySettings.url) {
        const proxyUrl = new URL(proxySettings.url);
        
        // 프록시 인증 정보 추가
        if (proxySettings.username && proxySettings.password) {
            const auth = btoa(`${proxySettings.username}:${proxySettings.password}`);
            options.headers['Proxy-Authorization'] = `Basic ${auth}`;
        }
        
        // 프록시를 통해 요청
        const proxyRequestUrl = `${proxySettings.url}?target=${encodeURIComponent(url.toString())}`;
        const response = await fetch(proxyRequestUrl, options);
        
        let body;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            body = await response.json();
        } else {
            body = await response.text();
        }
        
        return {
            statusCode: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: body
        };
    } else {
        // 직접 요청
        const response = await fetch(url.toString(), options);
        
        let body;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            body = await response.json();
        } else {
            body = await response.text();
        }
        
        return {
            statusCode: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: body
        };
    }
}

// 응답 표시
function displayResponse(response, time) {
    elements.statusCode.textContent = response.statusCode;
    elements.statusText.textContent = response.statusText;
    elements.responseTime.textContent = `${time}ms`;
    elements.responseBodyContent.textContent = formatResponseBody(response.body);
    elements.responseHeadersContent.textContent = formatHeaders(response.headers);
    
    // 상태 코드에 따른 클래스 추가
    elements.statusCode.className = 'status-code ' + getStatusClass(response.statusCode);
}

// 응답 본문 포맷팅
function formatResponseBody(body) {
    if (typeof body === 'object') {
        return JSON.stringify(body, null, 2);
    }
    return body;
}

// 헤더 포맷팅
function formatHeaders(headers) {
    return Object.entries(headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
}

// 상태 코드 클래스 결정
function getStatusClass(statusCode) {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400) return 'error';
    if (statusCode >= 300 && statusCode < 400) return 'warning';
    return '';
}

// 응답 초기화
function clearResponse() {
    elements.statusCode.textContent = '-';
    elements.statusText.textContent = '-';
    elements.responseTime.textContent = '-';
    elements.responseBodyContent.textContent = '응답이 여기에 표시됩니다.';
    elements.responseHeadersContent.textContent = '응답 헤더가 여기에 표시됩니다.';
    elements.statusCode.className = 'status-code';
}

// 기록 삭제
function clearHistory() {
    if (confirm('모든 호출 기록을 삭제하시겠습니까?')) {
        historyRecords = [];
        saveData();
        renderLists();
    }
} 