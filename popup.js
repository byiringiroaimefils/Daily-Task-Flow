// Main function that runs when popup opens
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    loadDailyView();
    updateSummary();
    updateProductivityMetrics();
    setupModal();
    setupTaskModal();
    loadTasks();
    
    // Refresh metrics every minute
    setInterval(() => {
        updateSummary();
        updateProductivityMetrics();
    }, 60000);
});

// Set up the tab switching functionality
function setupTabs() {
    const dailyTab = document.getElementById('daily-tab');
    const weeklyTab = document.getElementById('weekly-tab');

    dailyTab.addEventListener('click', () => {
        dailyTab.classList.add('active');
        weeklyTab.classList.remove('active');
        loadDailyView();
    });

    weeklyTab.addEventListener('click', () => {
        weeklyTab.classList.add('active');
        dailyTab.classList.remove('active');
        loadWeeklyView();
    });
}

// Load and display daily activity
async function loadDailyView() {
    const container = document.getElementById('tab-activity');
    container.innerHTML = ''; // Clear existing content

    try {
        const result = await chrome.storage.local.get(['visitedSites']);
        const sites = result.visitedSites || [];
        const today = new Date().toLocaleDateString();
        
        // Filter and sort today's visits
        const todayVisits = sites
            .filter(site => new Date(site.timestamp).toLocaleDateString() === today)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (todayVisits.length === 0) {
            showEmptyState(container);
            return;
        }

        todayVisits.forEach(visit => {
            const category = getCategoryForSite(visit.domain);
            const entry = createActivityEntry(visit, category);
            container.appendChild(entry);
        });
    } catch (error) {
        console.error('Error loading daily view:', error);
        showErrorState(container);
    }
}

// Create activity entry element
function createActivityEntry(visit, category) {
    const entry = document.createElement('div');
    entry.className = 'activity-entry';

    const icon = document.createElement('div');
    icon.className = 'activity-icon';
    icon.textContent = visit.domain.charAt(0).toUpperCase();

    const details = document.createElement('div');
    details.className = 'activity-details';

    const title = document.createElement('div');
    title.className = 'activity-title';
    title.textContent = visit.title;

    const meta = document.createElement('div');
    meta.className = 'activity-meta';

    const domain = document.createElement('div');
    domain.className = 'activity-domain';
    domain.textContent = visit.domain;

    const time = document.createElement('div');
    time.className = 'activity-time';
    time.textContent = formatTimeAgo(new Date(visit.timestamp));

    const categoryTag = document.createElement('span');
    categoryTag.className = `activity-category category-${category.toLowerCase()}`;
    categoryTag.textContent = category;

    meta.appendChild(domain);
    meta.appendChild(time);
    meta.appendChild(categoryTag);

    details.appendChild(title);
    details.appendChild(meta);

    entry.appendChild(icon);
    entry.appendChild(details);

    return entry;
}

// Load and display weekly summary
async function loadWeeklyView() {
    const container = document.getElementById('tab-activity');
    container.innerHTML = ''; // Clear existing content

    try {
        const result = await chrome.storage.local.get(['visitedSites']);
        const sites = result.visitedSites || [];
        
        const weeklyStats = analyzeWeeklyData(sites);
        displayWeeklyStats(container, weeklyStats);
    } catch (error) {
        console.error('Error loading weekly view:', error);
        showErrorState(container);
    }
}

// Update summary section
async function updateSummary() {
    try {
        const result = await chrome.storage.local.get(['visitedSites', 'tasks']);
        const sites = result.visitedSites || [];
        const tasks = result.tasks || [];
        const today = new Date().toLocaleDateString();
        
        // Get today's visits and tasks
        const todayVisits = sites.filter(site => 
            new Date(site.timestamp).toLocaleDateString() === today
        );
        const todayTasks = tasks.filter(task => 
            new Date(task.createdAt).toLocaleDateString() === today
        );

        // Update total visits
        document.getElementById('total-visits').textContent = todayVisits.length;
        
        // Update task completion
        const completedTasks = todayTasks.filter(task => task.completed).length;
        const totalTasks = todayTasks.length;
        const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        document.getElementById('task-completion').textContent = `${taskCompletion}%`;
    } catch (error) {
        console.error('Error updating summary:', error);
    }
}

// Add these functions after the existing updateSummary function
async function updateProductivityMetrics() {
    try {
        const [timeResult, goalsResult] = await Promise.all([
            chrome.storage.local.get(['siteTimeData']),
            chrome.storage.local.get(['goals'])
        ]);

        const today = new Date().toLocaleDateString();
        const timeData = timeResult.siteTimeData?.[today] || {};
        const goals = goalsResult.goals || {
            productiveTime: 4 * 3600,
            learningTime: 1 * 3600
        };

        // Calculate and update metrics
        updateTimeMetrics(timeData);
        updateGoalProgress('productive-time-progress', calculateProductiveTime(timeData), goals.productiveTime);
        updateGoalProgress('learning-time-progress', calculateLearningTime(timeData), goals.learningTime);
        
        // Update chart
        initializeTimeDistributionChart(timeData);
    } catch (error) {
        console.error('Error updating productivity metrics:', error);
    }
}

function updateGoalProgress(elementId, current, target) {
    const percentage = Math.min(Math.round((current / target) * 100), 100);
    const progressBar = document.getElementById(elementId);
    progressBar.style.width = `${percentage}%`;
    
    // Add percentage label
    const label = document.createElement('div');
    label.className = 'progress-label';
    label.textContent = `${percentage}%`;
    
    // Remove existing label if any
    const existingLabel = progressBar.querySelector('.progress-label');
    if (existingLabel) {
        existingLabel.remove();
    }
    progressBar.appendChild(label);
}

function calculateLearningTime(timeData) {
    let learningTime = 0;
    for (const [domain, time] of Object.entries(timeData)) {
        if (isLearningSite(domain)) {
            learningTime += time;
        }
    }
    return learningTime;
}

// Utility functions
function showEmptyState(container) {
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-text">No activity recorded yet</div>
            <div class="empty-state-subtext">Your browsing activity will appear here</div>
        </div>
    `;
}

function showErrorState(container) {
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-text">Something went wrong</div>
            <div class="empty-state-subtext">Please try again later</div>
        </div>
    `;
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
}

function formatTime(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

function getCategoryForSite(domain) {
    if (isWorkSite(domain)) return 'Work';
    if (isLearningSite(domain)) return 'Learning';
    return 'Other';
}

function isProductiveSite(domain) {
    return isWorkSite(domain) || isLearningSite(domain);
}

function isWorkSite(domain) {
    const workDomains = [
        'github.com',
        'gitlab.com',
        'bitbucket.org',
        'jira.com',
        'confluence.com',
        'docs.google.com',
        'drive.google.com',
        'office.com',
        'slack.com',
        'teams.microsoft.com'
    ];
    return workDomains.some(d => domain.includes(d));
}

function isLearningSite(domain) {
    const learningDomains = [
        'stackoverflow.com',
        'developer.mozilla.org',
        'w3schools.com',
        'udemy.com',
        'coursera.org',
        'edx.org',
        'medium.com',
        'dev.to',
        'freecodecamp.org'
    ];
    return learningDomains.some(d => domain.includes(d));
}

function calculateTaskCompletion(visits) {
    const productiveVisits = visits.filter(visit => isProductiveSite(visit.domain)).length;
    const totalVisits = visits.length;
    if (totalVisits === 0) return '0%';
    return Math.round((productiveVisits / totalVisits) * 100) + '%';
}

// Weekly analysis functions
function analyzeWeeklyData(sites) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekSites = sites.filter(site => new Date(site.timestamp) > oneWeekAgo);
    
    return {
        totalVisits: weekSites.length,
        byCategory: groupByCategory(weekSites),
        byDay: groupByDay(weekSites)
    };
}

function displayWeeklyStats(container, stats) {
    container.innerHTML = `
        <div class="analysis-section">
            <div class="section-title">Weekly Summary</div>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-value">${stats.totalVisits}</div>
                    <div class="summary-label">Total Visits</div>
                </div>
            </div>
            ${generateCategoryBreakdown(stats.byCategory)}
            ${generateDailyBreakdown(stats.byDay)}
        </div>
    `;
}

function generateCategoryBreakdown(categories) {
    const total = Object.values(categories).reduce((a, b) => a + b, 0);
    return `
        <div class="section-title">Category Breakdown</div>
        ${Object.entries(categories)
            .map(([category, count]) => {
                const percentage = Math.round((count / total) * 100);
                return `
                    <div class="category-item">
                        <span class="category-name">${category}</span>
                        <div class="category-bar">
                            <div class="category-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span class="category-value">${percentage}%</span>
                    </div>
                `;
            })
            .join('')}
    `;
}

function generateDailyBreakdown(dailyData) {
    return `
        <div class="section-title">Daily Activity</div>
        ${Object.entries(dailyData)
            .map(([date, visits]) => `
                <div class="day-section">
                    <div class="day-header">
                        <h3>${new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                        <span>${visits.length} visits</span>
                    </div>
                </div>
            `)
            .join('')}
    `;
}

function groupByCategory(sites) {
    return sites.reduce((acc, site) => {
        const category = getCategoryForSite(site.domain);
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});
}

function groupByDay(sites) {
    return sites.reduce((acc, site) => {
        const date = new Date(site.timestamp).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(site);
        return acc;
    }, {});
}

// Initialize Chart.js
function initializeTimeDistributionChart(timeData) {
    const ctx = document.getElementById('timeDistributionChart').getContext('2d');
    const categories = ['Work', 'Learning', 'Other'];
    const times = categories.map(category => {
        return Object.entries(timeData)
            .filter(([domain]) => getCategoryForSite(domain) === category)
            .reduce((sum, [, time]) => sum + time, 0);
    });

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: times,
                backgroundColor: ['#4a90e2', '#2ecc71', '#95a5a6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Time Distribution'
                }
            }
        }
    });
}

// Modal functionality
function setupModal() {
    const modal = document.getElementById('goals-modal');
    const btn = document.getElementById('customize-goals');
    const span = document.getElementsByClassName('close')[0];
    const saveBtn = document.getElementById('save-goals');

    btn.onclick = () => modal.style.display = 'block';
    span.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    saveBtn.onclick = saveGoals;
}

async function saveGoals() {
    const productiveTimeGoal = document.getElementById('productive-time-goal').value;
    const learningTimeGoal = document.getElementById('learning-time-goal').value;

    await chrome.storage.local.set({
        goals: {
            productiveTime: productiveTimeGoal * 3600,
            learningTime: learningTimeGoal * 3600
        }
    });

    document.getElementById('goals-modal').style.display = 'none';
    updateProductivityMetrics();
}

function setupTaskModal() {
    const modal = document.getElementById('task-modal');
    const btn = document.getElementById('add-task');
    const span = document.getElementsByClassName('close-task-modal')[0];
    const saveBtn = document.getElementById('save-task');

    btn.onclick = () => modal.style.display = 'block';
    span.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    saveBtn.onclick = saveTask;
}

async function saveTask() {
    const taskName = document.getElementById('task-name').value;
    const taskUrl = document.getElementById('task-url').value;
    const taskCategory = document.getElementById('task-category').value;

    if (!taskName) return;

    const task = {
        id: Date.now(),
        name: taskName,
        url: taskUrl,
        category: taskCategory,
        completed: false,
        createdAt: new Date().toISOString()
    };

    const result = await chrome.storage.local.get(['tasks']);
    const tasks = result.tasks || [];
    tasks.push(task);
    await chrome.storage.local.set({ tasks });

    document.getElementById('task-modal').style.display = 'none';
    document.getElementById('task-name').value = '';
    document.getElementById('task-url').value = '';
    
    loadTasks();
}

async function loadTasks() {
    const container = document.getElementById('task-list');
    const result = await chrome.storage.local.get(['tasks']);
    const tasks = result.tasks || [];
    
    // Filter for today's tasks
    const today = new Date().toLocaleDateString();
    const todayTasks = tasks.filter(task => 
        new Date(task.createdAt).toLocaleDateString() === today
    );

    if (todayTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-text">No tasks for today</div>
                <div class="empty-state-subtext">Add tasks to track your daily goals</div>
            </div>
        `;
        return;
    }

    container.innerHTML = todayTasks
        .sort((a, b) => a.completed - b.completed)
        .map(task => createTaskElement(task))
        .join('');

    // Add click handlers
    container.querySelectorAll('.task-item').forEach(taskElement => {
        taskElement.addEventListener('click', (e) => handleTaskClick(e, taskElement.dataset.taskId));
    });
}

function createTaskElement(task) {
    return `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-title">${task.name}</div>
                ${task.url ? `<div class="task-url">${task.url}</div>` : ''}
            </div>
            <span class="task-category-tag category-${task.category.toLowerCase()}">${task.category}</span>
        </div>
    `;
}

async function handleTaskClick(event, taskId) {
    const result = await chrome.storage.local.get(['tasks']);
    const tasks = result.tasks || [];
    const taskIndex = tasks.findIndex(t => t.id === parseInt(taskId));

    if (taskIndex === -1) return;

    if (event.target.classList.contains('task-checkbox')) {
        // Toggle completion
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        await chrome.storage.local.set({ tasks });
        loadTasks();
    } else if (tasks[taskIndex].url) {
        // Open URL in new tab
        chrome.tabs.create({ url: tasks[taskIndex].url });
    }
}
