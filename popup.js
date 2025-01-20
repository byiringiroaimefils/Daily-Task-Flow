// Main function that runs when popup opens
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    loadDailyView();
    updateSummary();
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
        const result = await chrome.storage.local.get(['visitedSites']);
        const sites = result.visitedSites || [];
        const today = new Date().toLocaleDateString();
        
        // Get today's visits
        const todayVisits = sites.filter(site => 
            new Date(site.timestamp).toLocaleDateString() === today
        );

        // Update total visits
        document.getElementById('total-visits').textContent = todayVisits.length;
    } catch (error) {
        console.error('Error updating summary:', error);
    }
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
