// Background service worker for Roblox Community Wealth Tracker

console.log('Roblox Community Wealth Tracker: Background service worker loaded');

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Roblox Community Wealth Tracker extension installed');
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'communityPageDetected') {
        console.log('Community page detected:', request.data);
        // Store the detected community data for quick access
        chrome.storage.local.set({
            detectedCommunity: request.data
        });
    }
    
    if (request.action === 'getDetectedCommunity') {
        chrome.storage.local.get(['detectedCommunity'], (result) => {
            sendResponse(result.detectedCommunity || null);
        });
        return true; // Indicates async response
    }
});

// Handle tab updates to detect when user navigates to Roblox community pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('roblox.com/communities/')) {
        console.log('Tab updated to Roblox community page:', tab.url);
        
        // Inject content script if not already injected
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        }).catch(err => {
            console.log('Content script already injected or failed to inject');
        });
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    if (tab.url && tab.url.includes('roblox.com/communities/')) {
        // If on a community page, open popup with pre-filled data
        chrome.action.setPopup({
            tabId: tab.id,
            popup: 'popup.html'
        });
    }
});