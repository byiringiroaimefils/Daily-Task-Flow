const tabActivity = [];

// Add these new variables at the top
let activeTabId = null;
let activeTabStartTime = null;
const timeTracking = new Map();

// Function to get the start of the current week (Monday)
function getStartOfWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

// Function to clean up old data
function cleanupOldData() {
    chrome.storage.local.get(['visitedSites'], (result) => {
        const visitedSites = result.visitedSites || [];
        const weekStart = getStartOfWeek();

        // Keep only this week's data (Monday to Sunday)
        const thisWeekSites = visitedSites.filter(site => {
            const siteDate = new Date(site.timestamp);
            return siteDate >= weekStart;
        });

        chrome.storage.local.set({ visitedSites: thisWeekSites });
    });
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ 
        tabActivity: [],
        visitedSites: []
    });
    // Run cleanup immediately on install
    cleanupOldData();
});

// Run cleanup daily at midnight
chrome.alarms.create('cleanupAlarm', {
    periodInMinutes: 1440,  // 24 hours
    when: getNextMidnight() // Start at next midnight
});

// Get timestamp for next midnight
function getNextMidnight() {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime();
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanupAlarm') {
        cleanupOldData();
    }
});

// Add time tracking functionality
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const previousTabId = activeTabId;
    activeTabId = activeInfo.tabId;
    
    if (previousTabId) {
        updateTimeTracking(previousTabId);
    }
    
    activeTabStartTime = Date.now();
});

chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        if (activeTabId) {
            updateTimeTracking(activeTabId);
            activeTabId = null;
        }
    } else {
        chrome.tabs.query({ active: true, windowId }, (tabs) => {
            if (tabs[0]) {
                activeTabId = tabs[0].id;
                activeTabStartTime = Date.now();
            }
        });
    }
});

function updateTimeTracking(tabId) {
    if (!activeTabStartTime) return;
    
    chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError || !tab.url) return;
        
        try {
            const url = new URL(tab.url);
            if (!url.protocol.startsWith('chrome') && 
                !url.protocol.startsWith('edge') && 
                !url.protocol.startsWith('about')) {
                
                const duration = Math.round((Date.now() - activeTabStartTime) / 1000);
                const domain = url.hostname;
                
                const currentTime = timeTracking.get(domain) || 0;
                timeTracking.set(domain, currentTime + duration);
                
                // Store the updated time data
                chrome.storage.local.get(['siteTimeData'], (result) => {
                    const siteTimeData = result.siteTimeData || {};
                    const today = new Date().toLocaleDateString();
                    
                    if (!siteTimeData[today]) {
                        siteTimeData[today] = {};
                    }
                    
                    siteTimeData[today][domain] = (siteTimeData[today][domain] || 0) + duration;
                    chrome.storage.local.set({ siteTimeData });
                });
            }
        } catch (e) {
            console.error('Error updating time tracking:', e);
        }
    });
    
    activeTabStartTime = Date.now();
}

// Modify the existing tab tracking code
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        try {
            const url = new URL(tab.url);
            if (!url.protocol.startsWith('chrome') && 
                !url.protocol.startsWith('edge') && 
                !url.protocol.startsWith('about') &&
                url.hostname !== 'newtab') {
                
                const timestamp = new Date().toISOString();
                
                chrome.storage.local.get(['visitedSites'], (result) => {
                    const visitedSites = result.visitedSites || [];
                    visitedSites.push({
                        url: tab.url,
                        title: tab.title,
                        timestamp: timestamp,
                        domain: url.hostname,
                        category: getCategoryForSite(url.hostname)
                    });
                    chrome.storage.local.set({ visitedSites });
                });
            }
        } catch (e) {
            console.error('Error tracking tab:', e);
        }
    }
});

// Check tasks periodically
chrome.alarms.create('checkTasks', {
    periodInMinutes: 30 // Check every 30 minutes
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkTasks') {
        checkIncompleteTasksNotification();
    }
});

async function checkIncompleteTasksNotification() {
    const result = await chrome.storage.local.get(['tasks']);
    const tasks = result.tasks || [];
    const today = new Date().toLocaleDateString();
    
    const incompleteTasks = tasks.filter(task => 
        new Date(task.createdAt).toLocaleDateString() === today && !task.completed
    );

    if (incompleteTasks.length > 0) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Incomplete Tasks Reminder',
            message: `You have ${incompleteTasks.length} incomplete tasks for today`
        });
    }
}
