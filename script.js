// 전역 변수
let todos = [];
let currentDate = new Date().toISOString().split('T')[0];
let lastCheckedDate = new Date().toISOString().split('T')[0];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let editingTodoId = null;
let valorantDate = new Date().toISOString().split('T')[0];
let editingPracticeId = null;
let gameEntries = [];

// 랭크 순서
const rankOrder = ['언랭크', '아이언', '브론즈', '실버', '골드', '플래티넘', '다이아몬드', '초월자', '불멸', '레디언트'];
let statsSteps = [];
let currentStatsStepIndex = 0;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    checkDateChange();
    setInterval(checkDateChange, 60000); // 1분마다 체크
});

// 앱 초기화
function initializeApp() {
    // 날짜 선택기 초기화
    const dateInput = document.getElementById('selected-date');
    dateInput.value = currentDate;
    dateInput.addEventListener('change', handleDateChange);
    
    updateDateDisplay();
    loadTodos();
    setupEventListeners();
    renderCalendar();
    showCalendarTodos(currentDate);
    document.getElementById('valorant-date').value = valorantDate;
    loadValorantData();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 탭 전환
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // 할일 추가
    document.getElementById('add-todo-btn').addEventListener('click', addTodo);
    document.getElementById('todo-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    // 날짜 네비게이션
    document.getElementById('prev-day').addEventListener('click', () => {
        changeDate(-1);
    });
    document.getElementById('next-day').addEventListener('click', () => {
        changeDate(1);
    });

    // 달력 네비게이션
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });
    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    // 발로란트 액션
    document.getElementById('save-valorant-data').addEventListener('click', saveValorantData);
    document.getElementById('search-stats').addEventListener('click', searchStats);
    document.getElementById('youtube-link').addEventListener('click', openYouTube);
    
    // 발로란트 날짜 선택
    document.getElementById('valorant-date').addEventListener('change', (e) => {
        valorantDate = e.target.value;
        loadValorantData();
    });
    document.getElementById('valorant-date').value = valorantDate;
    
    // 연습 계획 추가
    document.getElementById('add-practice-btn').addEventListener('click', addPracticeItem);
    
    // 게임 추가
    document.getElementById('add-game-btn').addEventListener('click', addGameEntry);
    
    // 통계보기 버튼
    document.getElementById('view-stats-btn').addEventListener('click', showStatsModal);
    
    // 통계 모달 닫기
    document.getElementById('close-stats-modal').addEventListener('click', () => {
        document.getElementById('stats-modal').classList.remove('active');
    });
    document.getElementById('prev-stats-step').addEventListener('click', () => navigateStatsStep(-1));
    document.getElementById('next-stats-step').addEventListener('click', () => navigateStatsStep(1));
    
    // 자동 저장 기능 (입력 필드 변경 시)
    setupAutoSave();

    // 모달 닫기
    document.getElementById('close-detail-modal').addEventListener('click', () => {
        document.getElementById('todo-detail-modal').classList.remove('active');
    });
    document.getElementById('close-edit-modal').addEventListener('click', () => {
        document.getElementById('edit-todo-modal').classList.remove('active');
    });

    // 모달 외부 클릭 시 닫기
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // 할일 상세 저장/삭제
    document.getElementById('save-detail').addEventListener('click', saveTodoDetail);
    document.getElementById('delete-detail').addEventListener('click', deleteTodoDetail);

    // 할일 수정 저장/취소
    document.getElementById('save-edit').addEventListener('click', saveEditTodo);
    document.getElementById('cancel-edit').addEventListener('click', () => {
        document.getElementById('edit-todo-modal').classList.remove('active');
    });

    // 사진 업로드
    document.querySelector('.photo-upload').addEventListener('click', () => {
        document.getElementById('photo-input').click();
    });
}

// 날짜 변경 체크 (다음날로 넘어갔는지 확인)
function checkDateChange() {
    const today = new Date().toISOString().split('T')[0];
    
    if (today !== lastCheckedDate) {
        // 날짜가 바뀌었으면 전날의 할일 목록 삭제 (새로 시작하는 느낌)
        deleteOldTodos(lastCheckedDate);
        lastCheckedDate = today;
        
        // 현재 선택된 날짜가 전날이면 오늘로 변경하고 전날 데이터 삭제
        if (currentDate < today) {
            deleteOldTodos(currentDate);
            currentDate = today;
            document.getElementById('selected-date').value = currentDate;
            updateDateDisplay();
            loadTodos();
        }
    }
}

// 전날의 할일 목록 삭제
function deleteOldTodos(date) {
    const storageKey = `todos_${date}`;
    localStorage.removeItem(storageKey);
    
    // 전체 목록에서도 해당 날짜의 할일 제거
    const allTodos = JSON.parse(localStorage.getItem('all_todos') || '[]');
    const filteredTodos = allTodos.filter(t => t.date !== date);
    localStorage.setItem('all_todos', JSON.stringify(filteredTodos));
    
    console.log(`전날(${date})의 할일 목록이 삭제되었습니다.`);
}

// 날짜 변경 핸들러
function handleDateChange(e) {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];
    
    // 다음날로 넘어가면 전날 데이터 삭제
    if (selectedDate > currentDate && selectedDate >= today) {
        // 다음날로 넘어갔을 때 전날 데이터 삭제
        deleteOldTodos(currentDate);
    }
    
    currentDate = selectedDate;
    updateDateDisplay();
    loadTodos();
}

// 날짜 변경 (이전/다음 날)
function changeDate(days) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + days);
    const newDate = date.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    // 다음날로 넘어가면 전날 데이터 삭제 (새로 시작하는 느낌)
    if (newDate > currentDate && newDate >= today) {
        deleteOldTodos(currentDate);
    }
    
    currentDate = newDate;
    document.getElementById('selected-date').value = currentDate;
    updateDateDisplay();
    loadTodos();
}

// 날짜 표시 업데이트
function updateDateDisplay() {
    const date = new Date(currentDate);
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateStr = date.toLocaleDateString('ko-KR', options);
    document.getElementById('current-date-display').textContent = dateStr;
}

// 할일 추가
function addTodo() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    
    if (text === '') return;
    
    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        date: currentDate,
        memo: '',
        photo: null
    };
    
    todos.push(todo);
    input.value = '';
    saveTodos();
    renderTodos();
}

// 할일 목록 렌더링
function renderTodos() {
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';
    
    const todayTodos = todos.filter(todo => todo.date === currentDate);
    
    if (todayTodos.length === 0) {
        todoList.innerHTML = '<li style="text-align: center; color: #999; padding: 20px;">할일이 없습니다.</li>';
        return;
    }
    
    todayTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <div class="todo-item-content">
                <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                       onchange="toggleTodo(${todo.id})">
                <span>${todo.text}</span>
            </div>
            <div class="todo-item-actions">
                <button class="btn-edit" onclick="openEditModal(${todo.id})">수정</button>
                <button class="btn-delete" onclick="deleteTodo(${todo.id})">삭제</button>
            </div>
        `;
        
        todoList.appendChild(li);
    });
}

// 할일 완료 토글
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
    }
}

// 할일 삭제
function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
}

// 할일 수정 모달 열기
function openEditModal(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    editingTodoId = id;
    document.getElementById('edit-todo-input').value = todo.text;
    document.getElementById('edit-todo-modal').classList.add('active');
}

// 할일 수정 저장
function saveEditTodo() {
    const input = document.getElementById('edit-todo-input');
    const text = input.value.trim();
    
    if (text === '') return;
    
    const todo = todos.find(t => t.id === editingTodoId);
    if (todo) {
        todo.text = text;
        saveTodos();
        renderTodos();
    }
    
    document.getElementById('edit-todo-modal').classList.remove('active');
    editingTodoId = null;
}

// 할일 상세 모달 열기
function openDetailModal(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    document.getElementById('detail-date').textContent = todo.date;
    document.getElementById('detail-status').textContent = todo.completed ? '완료' : '미완료';
    document.getElementById('detail-memo').value = todo.memo || '';
    document.getElementById('char-count').textContent = (todo.memo || '').length;
    
    document.getElementById('detail-memo').addEventListener('input', (e) => {
        document.getElementById('char-count').textContent = e.target.value.length;
    });
    
    editingTodoId = id;
    document.getElementById('todo-detail-modal').classList.add('active');
}

// 할일 상세 저장
function saveTodoDetail() {
    const memo = document.getElementById('detail-memo').value;
    const todo = todos.find(t => t.id === editingTodoId);
    
    if (todo) {
        todo.memo = memo;
        saveTodos();
    }
    
    document.getElementById('todo-detail-modal').classList.remove('active');
    editingTodoId = null;
}

// 할일 상세 삭제
function deleteTodoDetail() {
    deleteTodo(editingTodoId);
    document.getElementById('todo-detail-modal').classList.remove('active');
    editingTodoId = null;
}

// 할일 저장
function saveTodos() {
    const storageKey = `todos_${currentDate}`;
    const todayTodos = todos.filter(todo => todo.date === currentDate);
    localStorage.setItem(storageKey, JSON.stringify(todayTodos));
    
    // 모든 할일 저장 (전체 목록 유지)
    const allTodos = JSON.parse(localStorage.getItem('all_todos') || '[]');
    const otherTodos = allTodos.filter(t => t.date !== currentDate);
    localStorage.setItem('all_todos', JSON.stringify([...otherTodos, ...todayTodos]));
}

// 할일 불러오기
function loadTodos() {
    const storageKey = `todos_${currentDate}`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
        const todayTodos = JSON.parse(saved);
        // 전체 목록에서 현재 날짜 할일만 필터링
        const allTodos = JSON.parse(localStorage.getItem('all_todos') || '[]');
        todos = allTodos.filter(t => t.date !== currentDate).concat(todayTodos);
    } else {
        // 현재 날짜에 할일이 없으면 전체 목록에서 제거
        const allTodos = JSON.parse(localStorage.getItem('all_todos') || '[]');
        todos = allTodos.filter(t => t.date !== currentDate);
    }
    
    renderTodos();
}

// 탭 전환
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    if (tabName === 'calendar') {
        renderCalendar();
        showCalendarTodos(currentDate);
    }
    if (tabName === 'valorant') {
        loadValorantData();
    }
}

// 달력에서 선택한 날짜의 할일 표시
function showCalendarTodos(date) {
    const allTodos = JSON.parse(localStorage.getItem('all_todos') || '[]');
    const dateTodos = allTodos.filter(t => t.date === date);
    
    const titleEl = document.getElementById('selected-date-todos-title');
    const listEl = document.getElementById('calendar-todo-list');
    
    if (dateTodos.length === 0) {
        titleEl.textContent = '선택한 날짜에 할일이 없습니다.';
        listEl.innerHTML = '';
        return;
    }
    
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    titleEl.textContent = `${dateStr}의 할일 목록`;
    
    listEl.innerHTML = '';
    dateTodos.forEach(todo => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="${todo.completed ? 'completed' : ''}">${todo.completed ? '✓' : ''} ${todo.text}</span>
        `;
        listEl.appendChild(li);
    });
}

// 달력 렌더링
function renderCalendar() {
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    document.getElementById('current-month-year').textContent = `${currentYear}년 ${monthNames[currentMonth]}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';
    
    // 빈 칸 추가
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDiv = document.createElement('div');
        calendarGrid.appendChild(emptyDiv);
    }
    
    // 날짜 추가
    const today = new Date();
    const allTodos = JSON.parse(localStorage.getItem('all_todos') || '[]');
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = day;
        
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // 오늘 날짜 표시
        if (currentYear === today.getFullYear() && 
            currentMonth === today.getMonth() && 
            day === today.getDate()) {
            dayDiv.classList.add('today');
        }
        
        // 할일이 있는 날 표시
        const hasTodos = allTodos.some(t => t.date === dateStr);
        if (hasTodos) {
            dayDiv.classList.add('has-todos');
        }
        
        dayDiv.addEventListener('click', () => {
            currentDate = dateStr;
            document.getElementById('selected-date').value = currentDate;
            updateDateDisplay();
            showCalendarTodos(dateStr);
            // 리스트 탭으로 이동하지 않고 달력 탭에 머물면서 할일 표시
        });
        
        calendarGrid.appendChild(dayDiv);
    }
}

// 발로란트 데이터 저장
function saveValorantData() {
    const practiceItems = [];
    document.querySelectorAll('#practice-list li').forEach(li => {
        const input = li.querySelector('input');
        if (input && input.value.trim()) {
            practiceItems.push(input.value.trim());
        } else {
            const text = li.querySelector('.practice-text');
            if (text) {
                practiceItems.push(text.textContent.trim());
            }
        }
    });
    
    // 목표 랭크와 주요 에이전트는 전역 설정으로 저장
    const globalSettings = {
        mainAgent: document.getElementById('main-agent-input').value || '미설정',
        targetRank: document.getElementById('target-rank-input').value || '미설정'
    };
    localStorage.setItem('valorant_global_settings', JSON.stringify(globalSettings));
    
    // 게임 기록 수집
    collectGameEntries();
    
    // 날짜별 데이터 (현재 랭크는 날짜별로 구분)
    const data = {
        currentRank: document.getElementById('current-rank-input').value || '언랭크',
        feedback: document.getElementById('feedback-text').value || '',
        games: gameEntries,
        practicePlan: practiceItems
    };
    
    const storageKey = `valorant_data_${valorantDate}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
    
    // 전체 발로란트 데이터도 업데이트
    const allValorantData = JSON.parse(localStorage.getItem('all_valorant_data') || '{}');
    allValorantData[valorantDate] = data;
    localStorage.setItem('all_valorant_data', JSON.stringify(allValorantData));
    
    alert('데이터가 저장되었습니다.');
}

// 발로란트 데이터 불러오기
function loadValorantData() {
    const storageKey = `valorant_data_${valorantDate}`;
    const saved = localStorage.getItem(storageKey);
    
    // 목표 랭크와 주요 에이전트는 날짜와 무관하게 유지 (전역 설정)
    const globalSettings = JSON.parse(localStorage.getItem('valorant_global_settings') || '{}');
    document.getElementById('main-agent-input').value = globalSettings.mainAgent || '미설정';
    document.getElementById('target-rank-input').value = globalSettings.targetRank || '미설정';
    
    if (saved) {
        const data = JSON.parse(saved);
        document.getElementById('current-rank-input').value = data.currentRank || '언랭크';
        document.getElementById('feedback-text').value = data.feedback || '';
        
        // 게임 기록 불러오기
        gameEntries = data.games || [];
        renderGameEntries();
        
        // 연습 계획 불러오기
        renderPracticePlan(data.practicePlan || []);
    } else {
        // 기본값 설정
        document.getElementById('current-rank-input').value = '언랭크';
        document.getElementById('feedback-text').value = '';
        gameEntries = [];
        renderGameEntries();
        renderPracticePlan([]);
    }
}

// 연습 계획 렌더링
function renderPracticePlan(practices) {
    const listEl = document.getElementById('practice-list');
    listEl.innerHTML = '';
    
    if (practices.length === 0) {
        practices = [
            '코박스 카론 루틴',
            '사격장 보통 오른손 미세조정 연습',
            '보통 무빙 연습 어려움 조금',
            '데스매치 주 총기들로 1~3등 2번 할때까지',
            '팀데매 30킬 이상 하기'
        ];
    }
    
    practices.forEach((practice, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="text" value="${practice}" class="practice-input" data-index="${index}">
            <div class="practice-actions">
                <button class="btn-save-practice" onclick="savePracticeItem(${index})">저장</button>
                <button class="btn-delete-practice" onclick="deletePracticeItem(${index})">삭제</button>
            </div>
        `;
        listEl.appendChild(li);
    });
}

// 연습 계획 항목 추가
function addPracticeItem() {
    const listEl = document.getElementById('practice-list');
    const li = document.createElement('li');
    const index = listEl.children.length;
    li.innerHTML = `
        <input type="text" placeholder="연습 항목을 입력하세요" class="practice-input" data-index="${index}">
        <div class="practice-actions">
            <button class="btn-save-practice" onclick="savePracticeItem(${index})">저장</button>
            <button class="btn-delete-practice" onclick="deletePracticeItem(${index})">삭제</button>
        </div>
    `;
    listEl.appendChild(li);
}

// 연습 계획 항목 저장
function savePracticeItem(index) {
    const inputs = document.querySelectorAll('.practice-input');
    if (inputs[index]) {
        inputs[index].readOnly = false;
        // 자동 저장은 saveValorantData에서 처리
    }
}

// 연습 계획 항목 삭제
function deletePracticeItem(index) {
    const listEl = document.getElementById('practice-list');
    if (listEl.children[index]) {
        listEl.children[index].remove();
        // 인덱스 재설정
        Array.from(listEl.children).forEach((li, i) => {
            const input = li.querySelector('input');
            const saveBtn = li.querySelector('.btn-save-practice');
            const deleteBtn = li.querySelector('.btn-delete-practice');
            if (input) input.dataset.index = i;
            if (saveBtn) saveBtn.setAttribute('onclick', `savePracticeItem(${i})`);
            if (deleteBtn) deleteBtn.setAttribute('onclick', `deletePracticeItem(${i})`);
        });
    }
}

// 전역 설정 저장 (목표 랭크, 주요 에이전트)
function saveGlobalSettings() {
    const globalSettings = {
        mainAgent: document.getElementById('main-agent-input').value || '미설정',
        targetRank: document.getElementById('target-rank-input').value || '미설정'
    };
    localStorage.setItem('valorant_global_settings', JSON.stringify(globalSettings));
}

// 자동 저장 설정
function setupAutoSave() {
    // 입력 필드 변경 시 자동 저장
    const autoSaveFields = [
        'current-rank-input',
        'main-agent-input',
        'target-rank-input',
        'feedback-text',
        'win-rate-input',
        'avg-kill-input',
        'avg-death-input',
        'avg-assist-input'
    ];
    
    autoSaveFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // 목표 랭크와 주요 에이전트는 전역 설정 저장
            if (fieldId === 'main-agent-input' || fieldId === 'target-rank-input') {
                field.addEventListener('input', debounce(saveGlobalSettings, 1000));
                field.addEventListener('change', saveGlobalSettings);
            } else {
                field.addEventListener('input', debounce(autoSaveValorantData, 1000));
                field.addEventListener('change', autoSaveValorantData);
            }
        }
    });
    
    // 연습 계획 입력 필드 자동 저장
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('practice-input')) {
            debounce(autoSaveValorantData, 1000)();
        }
        // 게임 기록 입력 필드 자동 저장
        if (e.target.classList.contains('game-stat-input')) {
            debounce(() => {
                collectGameEntries();
                autoSaveValorantData();
            }, 500)();
        }
    });
    
    // 게임 결과 버튼 클릭 이벤트
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('result-btn')) {
            const gameIndex = parseInt(e.target.dataset.gameIndex);
            const result = e.target.dataset.result;
            setGameResult(gameIndex, result);
        }
    });
}

// 디바운스 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 자동 저장 함수
function autoSaveValorantData() {
    const practiceItems = [];
    document.querySelectorAll('#practice-list li').forEach(li => {
        const input = li.querySelector('input');
        if (input && input.value.trim()) {
            practiceItems.push(input.value.trim());
        } else {
            const text = li.querySelector('.practice-text');
            if (text) {
                practiceItems.push(text.textContent.trim());
            }
        }
    });
    
    // 목표 랭크와 주요 에이전트는 전역 설정으로 저장
    const globalSettings = {
        mainAgent: document.getElementById('main-agent-input').value || '미설정',
        targetRank: document.getElementById('target-rank-input').value || '미설정'
    };
    localStorage.setItem('valorant_global_settings', JSON.stringify(globalSettings));
    
    // 게임 기록 수집
    collectGameEntries();
    
    // 날짜별 데이터 (현재 랭크는 날짜별로 구분)
    const data = {
        currentRank: document.getElementById('current-rank-input').value || '언랭크',
        feedback: document.getElementById('feedback-text').value || '',
        games: gameEntries,
        practicePlan: practiceItems
    };
    
    const storageKey = `valorant_data_${valorantDate}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
    
    // 전체 발로란트 데이터도 업데이트
    const allValorantData = JSON.parse(localStorage.getItem('all_valorant_data') || '{}');
    allValorantData[valorantDate] = data;
    localStorage.setItem('all_valorant_data', JSON.stringify(allValorantData));
}

// 게임 항목 추가
function addGameEntry() {
    const game = {
        id: Date.now(),
        result: null, // 'win' or 'loss'
        kill: '',
        death: '',
        assist: ''
    };
    gameEntries.push(game);
    renderGameEntries();
}

// 게임 기록 렌더링
function renderGameEntries() {
    const listEl = document.getElementById('games-list');
    listEl.innerHTML = '';
    
    if (gameEntries.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">게임을 추가해주세요.</p>';
        return;
    }
    
    gameEntries.forEach((game, index) => {
        const gameDiv = document.createElement('div');
        gameDiv.className = 'game-entry';
        gameDiv.innerHTML = `
            <div class="game-entry-number">${index + 1}판</div>
            <div class="game-result-buttons">
                <button class="result-btn win ${game.result === 'win' ? 'active' : ''}" 
                        data-game-index="${index}" data-result="win">승</button>
                <button class="result-btn loss ${game.result === 'loss' ? 'active' : ''}" 
                        data-game-index="${index}" data-result="loss">패</button>
            </div>
            <input type="number" class="game-stat-input" placeholder="킬" 
                   value="${game.kill}" data-game-index="${index}" data-stat="kill"
                   ${game.result === null ? 'disabled' : ''}>
            <input type="number" class="game-stat-input" placeholder="데스" 
                   value="${game.death}" data-game-index="${index}" data-stat="death"
                   ${game.result === null ? 'disabled' : ''}>
            <input type="number" class="game-stat-input" placeholder="어시스트" 
                   value="${game.assist}" data-game-index="${index}" data-stat="assist"
                   ${game.result === null ? 'disabled' : ''}>
            <button class="delete-game-btn" onclick="deleteGameEntry(${index})">삭제</button>
        `;
        listEl.appendChild(gameDiv);
    });
}

// 게임 결과 설정
function setGameResult(gameIndex, result) {
    if (gameEntries[gameIndex]) {
        gameEntries[gameIndex].result = result;
        renderGameEntries();
        autoSaveValorantData();
    }
}

// 게임 항목 삭제
function deleteGameEntry(index) {
    gameEntries.splice(index, 1);
    renderGameEntries();
    autoSaveValorantData();
}

// 게임 기록 수집
function collectGameEntries() {
    document.querySelectorAll('.game-entry').forEach((entry, index) => {
        if (gameEntries[index]) {
            const killInput = entry.querySelector('input[data-stat="kill"]');
            const deathInput = entry.querySelector('input[data-stat="death"]');
            const assistInput = entry.querySelector('input[data-stat="assist"]');
            
            if (killInput) gameEntries[index].kill = killInput.value || '';
            if (deathInput) gameEntries[index].death = deathInput.value || '';
            if (assistInput) gameEntries[index].assist = assistInput.value || '';
        }
    });
}

// 통계 모달 상태
let statsSteps = [];
let currentStatsStepIndex = 0;

// 통계 모달 표시
function showStatsModal() {
    statsSteps = buildStatsSteps();
    currentStatsStepIndex = 0;
    renderStatsStep();
    document.getElementById('stats-modal').classList.add('active');
}

function buildStatsSteps() {
    const today = new Date(valorantDate);
    const isLastDayOfMonth = isLastDay(today);
    return isLastDayOfMonth ? ['today', 'monthly', 'rank'] : ['today', 'comparison', 'rank'];
}

function renderStatsStep() {
    const step = statsSteps[currentStatsStepIndex];
    let contentHtml = '';
    let title = '📊 통계';
    
    if (step === 'today') {
        contentHtml = renderTodayStatsContent();
        title = '📊 오늘 통계';
    } else if (step === 'comparison') {
        contentHtml = renderDailyComparisonContent();
        title = '🆚 오늘 vs 어제';
    } else if (step === 'monthly') {
        contentHtml = renderMonthlyStatsContent();
        title = '📅 월간 통계';
    } else if (step === 'rank') {
        contentHtml = renderRankComparisonContent();
        title = '🏆 랭크 비교';
    }
    
    document.getElementById('stats-content').innerHTML = contentHtml;
    document.getElementById('stats-modal-title').textContent = title;
    updateStatsNavButtons();
}

function updateStatsNavButtons() {
    const prevBtn = document.getElementById('prev-stats-step');
    const nextBtn = document.getElementById('next-stats-step');
    prevBtn.disabled = currentStatsStepIndex === 0;
    const isLast = currentStatsStepIndex === statsSteps.length - 1;
    nextBtn.textContent = isLast ? '닫기' : '다음';
}

function navigateStatsStep(direction) {
    const newIndex = currentStatsStepIndex + direction;
    if (newIndex < 0) return;
    if (newIndex >= statsSteps.length) {
        document.getElementById('stats-modal').classList.remove('active');
        return;
    }
    currentStatsStepIndex = newIndex;
    renderStatsStep();
}

function renderTodayStatsContent() {
    const todayData = getDayStats(valorantDate);
    return `
        <div class="comparison-section">
            <div class="comparison-title">오늘의 결과</div>
            <div class="stats-comparison">
                ${createSingleStatCard('승률', todayData.winRate, '%')}
                ${createSingleStatCard('평균 킬', todayData.avgKill, '')}
                ${createSingleStatCard('평균 데스', todayData.avgDeath, '')}
                ${createSingleStatCard('평균 어시스트', todayData.avgAssist, '')}
            </div>
            ${createSingleDayGraph('오늘', todayData)}
        </div>
    `;
}

function renderDailyComparisonContent() {
    const todayData = getDayStats(valorantDate);
    const yesterdayData = getDayStats(getPreviousDay(valorantDate));
    return `
        <div class="comparison-section">
            <div class="comparison-title">오늘 vs 어제</div>
            <div class="stats-comparison">
                ${createStatCard('승률', todayData.winRate, yesterdayData.winRate, '%')}
                ${createStatCard('평균 킬', todayData.avgKill, yesterdayData.avgKill, '')}
                ${createStatCard('평균 데스', todayData.avgDeath, yesterdayData.avgDeath, '')}
                ${createStatCard('평균 어시스트', todayData.avgAssist, yesterdayData.avgAssist, '')}
            </div>
            ${createComparisonGraph('오늘', '어제', todayData, yesterdayData)}
        </div>
    `;
}

function renderMonthlyStatsContent() {
    const today = new Date(valorantDate);
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const currentMonthStats = getMonthStats(year, month);
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    const previousMonthStats = getMonthStats(previousYear, previousMonth);
    return `
        <div class="comparison-section">
            <div class="comparison-title">${year}년 ${month}월 통계</div>
            <div class="monthly-stats">
                <h4>이번 달 총 게임 수: ${currentMonthStats.totalGames}판</h4>
                <div class="stats-comparison">
                    ${createStatCard('승률', currentMonthStats.winRate, previousMonthStats.winRate, '%')}
                    ${createStatCard('평균 킬', currentMonthStats.avgKill, previousMonthStats.avgKill, '')}
                    ${createStatCard('평균 데스', currentMonthStats.avgDeath, previousMonthStats.avgDeath, '')}
                    ${createStatCard('평균 어시스트', currentMonthStats.avgAssist, previousMonthStats.avgAssist, '')}
                </div>
                ${createComparisonGraph('이번 달', '저번 달', currentMonthStats, previousMonthStats)}
            </div>
        </div>
    `;
}

function renderRankComparisonContent() {
    const today = new Date(valorantDate);
    const isLastDayOfMonth = isLastDay(today);
    const compareDate = isLastDayOfMonth
        ? getLastDayOfPreviousMonth(today.getFullYear(), today.getMonth() + 1)
        : getPreviousDay(valorantDate);
    const currentLabel = isLastDayOfMonth ? '이번 달' : '오늘';
    const compareLabel = isLastDayOfMonth ? '저번 달' : '어제';
    return `
        <div class="comparison-section">
            <div class="comparison-title">랭크 변화</div>
            ${createRankComparison(currentLabel, compareLabel, valorantDate, compareDate)}
        </div>
    `;
}

function createSingleStatCard(label, value, unit) {
    const displayValue = typeof value === 'number' ? value.toFixed(1) : value;
    return `
        <div class="stat-card-compare">
            <h4>${label}</h4>
            <div class="stat-value">${displayValue}${unit}</div>
            <div class="stat-change neutral">현재 수치</div>
        </div>
    `;
}

function createSingleDayGraph(label, data) {
    const metrics = [
        { key: 'winRate', label: '승률', unit: '%' },
        { key: 'avgKill', label: '평균 킬', unit: '' },
        { key: 'avgDeath', label: '평균 데스', unit: '' },
        { key: 'avgAssist', label: '평균 어시', unit: '' }
    ];
    const maxValue = Math.max(
        data.winRate,
        data.avgKill,
        data.avgDeath,
        data.avgAssist,
        1
    );
    
    return `
        <div class="graph-container">
            <div class="graph-title">${label} 그래프</div>
            <div class="bar-graph">
                ${metrics.map(metric => `
                    <div class="bar-item">
                        <div class="bar" style="height: ${(data[metric.key] / maxValue) * 100}%">
                            <span class="bar-value">${data[metric.key].toFixed(1)}${metric.unit}</span>
                        </div>
                        <div class="bar-label">${metric.label}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function createComparisonGraph(label1, label2, data1, data2) {
    const metrics = [
        { key: 'winRate', label: '승률', unit: '%' },
        { key: 'avgKill', label: '평균 킬', unit: '' },
        { key: 'avgDeath', label: '평균 데스', unit: '' },
        { key: 'avgAssist', label: '평균 어시', unit: '' }
    ];
    const maxValue = Math.max(
        data1.winRate, data1.avgKill, data1.avgDeath, data1.avgAssist,
        data2.winRate, data2.avgKill, data2.avgDeath, data2.avgAssist,
        1
    );
    
    return `
        <div class="graph-container">
            <div class="graph-title">${label1}과 ${label2} 그래프 비교</div>
            <div class="bar-graph">
                ${metrics.map(metric => `
                    <div class="bar-item">
                        <div class="bar" style="height: ${(data1[metric.key] / maxValue) * 100}%">
                            <span class="bar-value">${data1[metric.key].toFixed(1)}${metric.unit}</span>
                        </div>
                        <div class="bar secondary" style="height: ${(data2[metric.key] / maxValue) * 100}%">
                            <span class="bar-value">${data2[metric.key].toFixed(1)}${metric.unit}</span>
                        </div>
                        <div class="bar-label">${metric.label}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function createStatCard(label, current, previous, unit) {
    const change = current - previous;
    const safePrevious = previous === 0 ? 1 : previous;
    const changePercent = ((change / safePrevious) * 100).toFixed(1);
    let changeClass = 'neutral';
    let changeText = '변화 없음';
    
    if (change > 0.01) {
        changeClass = 'positive';
        changeText = `+${change.toFixed(1)}${unit} (+${changePercent}%)`;
    } else if (change < -0.01) {
        changeClass = 'negative';
        changeText = `${change.toFixed(1)}${unit} (${changePercent}%)`;
    }
    
    return `
        <div class="stat-card-compare">
            <h4>${label}</h4>
            <div class="stat-value">${current.toFixed(1)}${unit}</div>
            <div class="stat-change ${changeClass}">${changeText}</div>
        </div>
    `;
}

function createRankComparison(currentLabel, previousLabel, currentDate, previousDate) {
    const currentRankObj = parseRank(getRankForDate(currentDate));
    const previousRankObj = parseRank(getRankForDate(previousDate));
    const diff = currentRankObj.score - previousRankObj.score;
    let arrow = '→';
    let changeClass = 'neutral';
    let changeText = '변화 없음';
    
    if (diff > 0) {
        arrow = '↑';
        changeClass = 'positive';
        changeText = diff >= 4 ? '티어 승급!' : `${diff}단계 상승`;
    } else if (diff < 0) {
        arrow = '↓';
        changeClass = 'negative';
        changeText = diff <= -4 ? '티어 하락' : `${Math.abs(diff)}단계 하락`;
    }
    
    return `
        <div class="rank-comparison">
            <h4>랭크 비교</h4>
            <div class="rank-display">
                <div class="rank-item">
                    <div class="rank-label">${currentLabel}</div>
                    <div class="rank-value">${formatRankDisplay(currentRankObj)}</div>
                </div>
                <div class="rank-arrow">${arrow}</div>
                <div class="rank-item">
                    <div class="rank-label">${previousLabel}</div>
                    <div class="rank-value">${formatRankDisplay(previousRankObj)}</div>
                </div>
            </div>
            <div class="stat-change ${changeClass}">${changeText}</div>
        </div>
    `;
}

function parseRank(rankString) {
    if (!rankString) {
        return { tier: '언랭크', level: 0, score: 0 };
    }
    
    const normalized = rankString.trim().toLowerCase();
    const rankAliases = {
        '언랭크': '언랭크',
        '아이언': '아이언',
        'iron': '아이언',
        '브론즈': '브론즈',
        'bronze': '브론즈',
        '실버': '실버',
        'silver': '실버',
        '골드': '골드',
        'gold': '골드',
        '플래': '플래티넘',
        '플레': '플래티넘',
        '플래티넘': '플래티넘',
        'plat': '플래티넘',
        '다이아': '다이아몬드',
        '다이아몬드': '다이아몬드',
        'diamond': '다이아몬드',
        '초월자': '초월자',
        'ascendant': '초월자',
        '불멸': '불멸',
        'immortal': '불멸',
        '레디언트': '레디언트',
        'radiant': '레디언트'
    };
    
    const match = normalized.match(/([a-z가-힣]+)/);
    const tierKey = match ? match[1] : '언랭크';
    const tier = rankAliases[tierKey] || '언랭크';
    
    const levelMatch = normalized.match(/([123])/);
    const hasLevels = ['아이언', '브론즈', '실버', '골드', '플래티넘', '다이아몬드', '초월자', '불멸'].includes(tier);
    const level = levelMatch ? parseInt(levelMatch[1], 10) : (hasLevels ? 1 : 0);
    
    const tierIndex = rankOrder.indexOf(tier);
    const levelScore = hasLevels ? level : 0;
    const score = Math.max(0, tierIndex) * 4 + levelScore;
    
    return { tier, level, hasLevels, score };
}

function formatRankDisplay(rankObj) {
    if (!rankObj) return '언랭크';
    if (rankObj.hasLevels && rankObj.level) {
        return `${rankObj.tier} ${rankObj.level}`;
    }
    return rankObj.tier;
}

// 날짜별 통계 가져오기
function getDayStats(date) {
    const storageKey = `valorant_data_${date}`;
    const saved = localStorage.getItem(storageKey);
    
    if (!saved) {
        return { winRate: 0, avgKill: 0, avgDeath: 0, avgAssist: 0, totalGames: 0 };
    }
    
    const data = JSON.parse(saved);
    const games = data.games || [];
    const validGames = games.filter(g => g.result !== null);
    
    if (validGames.length === 0) {
        return { winRate: 0, avgKill: 0, avgDeath: 0, avgAssist: 0, totalGames: 0 };
    }
    
    const wins = validGames.filter(g => g.result === 'win').length;
    const winRate = (wins / validGames.length) * 100;
    
    const kills = validGames.reduce((sum, g) => sum + (parseInt(g.kill) || 0), 0);
    const deaths = validGames.reduce((sum, g) => sum + (parseInt(g.death) || 0), 0);
    const assists = validGames.reduce((sum, g) => sum + (parseInt(g.assist) || 0), 0);
    
    return {
        winRate: winRate,
        avgKill: kills / validGames.length,
        avgDeath: deaths / validGames.length,
        avgAssist: assists / validGames.length,
        totalGames: validGames.length
    };
}

// 월간 통계 가져오기
function getMonthStats(year, month) {
    const allValorantData = JSON.parse(localStorage.getItem('all_valorant_data') || '{}');
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    
    let allGames = [];
    let totalGames = 0;
    
    Object.keys(allValorantData).forEach(date => {
        if (date.startsWith(monthStr)) {
            const games = allValorantData[date].games || [];
            allGames = allGames.concat(games);
            totalGames += games.filter(g => g.result !== null).length;
        }
    });
    
    const validGames = allGames.filter(g => g.result !== null);
    
    if (validGames.length === 0) {
        return { winRate: 0, avgKill: 0, avgDeath: 0, avgAssist: 0, totalGames: 0 };
    }
    
    const wins = validGames.filter(g => g.result === 'win').length;
    const winRate = (wins / validGames.length) * 100;
    
    const kills = validGames.reduce((sum, g) => sum + (parseInt(g.kill) || 0), 0);
    const deaths = validGames.reduce((sum, g) => sum + (parseInt(g.death) || 0), 0);
    const assists = validGames.reduce((sum, g) => sum + (parseInt(g.assist) || 0), 0);
    
    return {
        winRate: winRate,
        avgKill: kills / validGames.length,
        avgDeath: deaths / validGames.length,
        avgAssist: assists / validGames.length,
        totalGames: totalGames
    };
}

// 날짜의 랭크 가져오기
function getRankForDate(date) {
    const storageKey = `valorant_data_${date}`;
    const saved = localStorage.getItem(storageKey);
    
    if (!saved) {
        return '언랭크';
    }
    
    const data = JSON.parse(saved);
    return data.currentRank || '언랭크';
}

// 이전 날짜 가져오기
function getPreviousDay(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

// 마지막 날인지 확인
function isLastDay(date) {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return date.getDate() === lastDay.getDate();
}

// 저번 달 마지막 날 가져오기
function getLastDayOfPreviousMonth(year, month) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const lastDay = new Date(prevYear, prevMonth, 0);
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
}

// 전적 검색
function searchStats() {
    window.open('https://tracker.gg/valorant', '_blank');
}

// 유튜브 열기 (앱이 있으면 앱으로, 없으면 웹으로)
function openYouTube() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const isIOS = /iphone|ipad|ipod/i.test(userAgent.toLowerCase());
    const isAndroid = /android/i.test(userAgent.toLowerCase());
    
    if (isMobile) {
        let appUrl;
        const webUrl = 'https://www.youtube.com';
        
        if (isIOS) {
            // iOS의 경우
            appUrl = 'youtube://';
        } else if (isAndroid) {
            // Android의 경우
            appUrl = 'vnd.youtube://';
        } else {
            appUrl = 'vnd.youtube://';
        }
        
        // 앱으로 열기 시도
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = appUrl;
        document.body.appendChild(iframe);
        
        // 앱이 없으면 웹으로 폴백
        setTimeout(() => {
            document.body.removeChild(iframe);
            window.open(webUrl, '_blank');
        }, 1000);
    } else {
        // 데스크톱인 경우 웹으로 열기
        window.open('https://www.youtube.com', '_blank');
    }
}

