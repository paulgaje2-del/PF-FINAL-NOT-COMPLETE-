let tasks = [];

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const categorySelect = document.getElementById('category-select');
const prioritySelect = document.getElementById('priority-select');
const timerInput = document.getElementById('timer-input');
const taskList = document.getElementById('task-list');
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const taskCounter = document.getElementById('task-counter');
const notification = document.getElementById('notification');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const exportBtn = document.getElementById('export-btn');

function loadTasks() {
    const stored = localStorage.getItem('tasks');
    if (stored) tasks = JSON.parse(stored);
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark');
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function debounce(func, delay) {
    let timeout;
    return () => {
        clearTimeout(timeout);
        timeout = setTimeout(func, delay);
    };
}

function showNotification(msg, type = 'success') {
    notification.textContent = msg;
    notification.className = type;
    notification.classList.remove('hidden');
    setTimeout(() => notification.classList.add('hidden'), 2000);
}

function updateCounter() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    taskCounter.textContent = `Total: ${total} | Completed: ${completed} | Pending: ${total - completed}`;
}

function filterTasks() {
    const search = searchInput.value.toLowerCase();
    const category = filterSelect.value;
    return tasks.filter(t =>
        t.text.toLowerCase().includes(search) &&
        (category === 'all' || t.category === category)
    );
}

function renderTasks() {
    const filtered = filterTasks();
    taskList.innerHTML = '';
    filtered.forEach(task => {
        const li = document.createElement('li');
        li.dataset.id = task.id;
        if (task.completed) li.classList.add('completed');
        li.innerHTML = `
            <span class="task-text">${task.text}</span>
            <span class="category-badge category-${task.category}">${task.category}</span>
            <span class="priority-badge priority-${task.priority}">${task.priority}</span>
            ${task.timer ? `<span class="timer-display">${Math.floor(task.timer.timeLeft / 60)}:${(task.timer.timeLeft % 60).toString().padStart(2, '0')}</span>
            <div class="timer-controls">
                <button class="timer-btn start-btn">${task.timer.isRunning ? 'Pause' : 'Start'}</button>
                <button class="timer-btn reset-btn">Reset</button>
            </div>` : ''}
            <button class="delete-btn">Delete</button>
        `;
        taskList.appendChild(li);
    });
    updateCounter();
}

function initializeCategories() {
    const categories = ['Food', 'Places', 'Work', 'Activities', 'Assignments', 'Personals'];
    categorySelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    filterSelect.innerHTML = '<option value="all">All Categories</option>' + categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function startTimer(task) {
    if (task.timer.interval) clearInterval(task.timer.interval);
    task.timer.isRunning = true;
    task.timer.interval = setInterval(() => {
        task.timer.timeLeft--;
        if (task.timer.timeLeft <= 0) {
            clearInterval(task.timer.interval);
            task.timer.isRunning = false;
            showNotification(`Timer for ${task.text} ended`, 'error');
        }
        renderTasks();
    }, 1000);
}

function pauseTimer(task) {
    if (task.timer.interval) clearInterval(task.timer.interval);
    task.timer.isRunning = false;
}

function resetTimer(task) {
    pauseTimer(task);
    task.timer.timeLeft = task.timer.initial;
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (text) {
        const task = {
            id: Date.now(),
            text,
            category: categorySelect.value,
            priority: prioritySelect.value,
            completed: false
        };
        const timerMin = parseInt(timerInput.value);
        if (timerMin > 0) {
            task.timer = { initial: timerMin * 60, timeLeft: timerMin * 60, isRunning: false, interval: null };
        }
        tasks.push(task);
        saveTasks();
        renderTasks();
        taskInput.value = '';
        timerInput.value = '';
        showNotification('Task added');
    }
});

taskList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const id = +li.dataset.id;
    const task = tasks.find(t => t.id === id);
    if (e.target.classList.contains('delete-btn')) {
        if (task.timer) clearInterval(task.timer.interval);
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
        showNotification('Task deleted', 'error');
    } else if (e.target.classList.contains('task-text')) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        showNotification(task.completed ? 'Completed' : 'Pending');
    } else if (e.target.classList.contains('start-btn')) {
        if (task.timer.isRunning) pauseTimer(task); else startTimer(task);
        saveTasks();
        renderTasks();
    } else if (e.target.classList.contains('reset-btn')) {
        resetTimer(task);
        saveTasks();
        renderTasks();
    }
});

taskList.addEventListener('dblclick', (e) => {
    if (e.target.classList.contains('task-text')) {
        const li = e.target.closest('li');
        const id = +li.dataset.id;
        const task = tasks.find(t => t.id === id);
        const input = document.createElement('input');
        input.value = task.text;
        input.addEventListener('blur', () => {
            task.text = input.value.trim() || task.text;
            saveTasks();
            renderTasks();
        });
        input.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') input.blur();
            if (ev.key === 'Escape') renderTasks();
        });
        e.target.replaceWith(input);
        input.focus();
    }
});

searchInput.addEventListener('input', debounce(renderTasks, 300));
filterSelect.addEventListener('change', renderTasks);

darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', document.body.classList.contains('dark'));
});

exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(tasks)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Exported');
});

loadTasks();
initializeCategories();
renderTasks();