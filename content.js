// Content script for Roblox Community Wealth Tracker
// This script runs on Roblox pages to assist with data extraction

console.log('Roblox Community Wealth Tracker: Content script loaded');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractCommunityData') {
        const communityData = extractCommunityDataFromPage();
        sendResponse(communityData);
    }
});

// Function to extract community data from the current page
function extractCommunityDataFromPage() {
    const data = {
        communityId: null,
        memberCount: 0,
        members: []
    };
    
    try {
        // Extract community ID from URL
        const url = window.location.href;
        const communityMatch = url.match(/\/communities\/(\d+)/);
        if (communityMatch) {
            data.communityId = communityMatch[1];
        }
        
        // Try to extract member count from the page
        const memberCountElements = document.querySelectorAll('*');
        for (const element of memberCountElements) {
            const text = element.textContent;
            const memberMatch = text.match(/(\d+(?:,\d+)*)\s+members?/i);
            if (memberMatch) {
                data.memberCount = parseInt(memberMatch[1].replace(/,/g, ''));
                break;
            }
        }
        
        // Try to extract member usernames if on a members page
        if (url.includes('/members')) {
            const usernameElements = document.querySelectorAll('[data-username], .username, .member-name');
            for (const element of usernameElements) {
                const username = element.getAttribute('data-username') || element.textContent.trim();
                if (username && username.length > 0 && username.length < 30) {
                    data.members.push(username);
                }
            }
        }
        
    } catch (error) {
        console.error('Error extracting community data:', error);
    }
    
    return data;
}

// Function to help with faster member fetching
function getMembersFromPage() {
    const members = [];
    
    try {
        // Look for various username patterns in the DOM
        const selectors = [
            '[data-username]',
            '.username',
            '.member-name',
            '.user-name',
            'a[href*="/users/"]'
        ];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                let username = '';
                
                if (element.hasAttribute('data-username')) {
                    username = element.getAttribute('data-username');
                } else if (element.href && element.href.includes('/users/')) {
                    const match = element.href.match(/\/users\/([^\/]+)/);
                    if (match) username = match[1];
                } else {
                    username = element.textContent.trim();
                }
                
                if (username && username.length > 0 && username.length < 30 && !members.includes(username)) {
                    members.push(username);
                }
            }
        }
        
    } catch (error) {
        console.error('Error getting members from page:', error);
    }
    
    return members;
}

// Expose functions to the popup
window.robloxTracker = {
    extractCommunityData: extractCommunityDataFromPage,
    getMembersFromPage: getMembersFromPage
};

// Auto-detect if we're on a community page and notify the popup
if (window.location.href.includes('/communities/')) {
    chrome.runtime.sendMessage({
        action: 'communityPageDetected',
        data: extractCommunityDataFromPage()
    });
}