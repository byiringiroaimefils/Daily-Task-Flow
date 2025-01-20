const tabActivity = [];

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

// Track actual website visits
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only track when URL is complete and it's a real website (not browser pages)
    if (changeInfo.status === 'complete' && tab.url) {
        try {
            const url = new URL(tab.url);
            // Skip chrome:// pages, new tab pages, and other browser URLs
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
                        domain: url.hostname
                    });
                    chrome.storage.local.set({ visitedSites });
                });
            }
        } catch (e) {
            // Invalid URL, skip it
        }
    }
});
