class RobloxCommunityTracker {
    constructor() {
        this.currentCommunityId = null;
        this.members = [];
        this.isFetching = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadStoredData();
    }
    
    initializeElements() {
        this.communityLinkInput = document.getElementById('communityLink');
        this.searchBtn = document.getElementById('searchBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.status = document.getElementById('status');
        this.progress = document.getElementById('progress');
        this.progressFill = document.querySelector('.progress-fill');
        this.progressText = document.querySelector('.progress-text');
        this.resultsList = document.getElementById('resultsList');
        this.memberCount = document.getElementById('memberCount');
        this.totalValue = document.getElementById('totalValue');
    }
    
    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.refreshBtn.addEventListener('click', () => this.handleRefresh());
        this.communityLinkInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
    }
    
    loadStoredData() {
        chrome.storage.local.get(['communityId', 'members'], (result) => {
            if (result.communityId && result.members) {
                this.currentCommunityId = result.communityId;
                this.members = result.members;
                this.displayResults();
                this.refreshBtn.disabled = false;
            }
        });
    }
    
    extractCommunityId(url) {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            
            // Look for the communities pattern: /communities/{id}/
            const communitiesIndex = pathParts.indexOf('communities');
            if (communitiesIndex !== -1 && pathParts[communitiesIndex + 1]) {
                const communityId = pathParts[communitiesIndex + 1];
                
                // Validate that it's a numeric ID
                if (/^\d+$/.test(communityId)) {
                    return communityId;
                }
            }
            
            throw new Error('Invalid community link format');
        } catch (error) {
            throw new Error('Please enter a valid Roblox community link');
        }
    }
    
    async handleSearch() {
        const link = this.communityLinkInput.value.trim();
        
        if (!link) {
            this.showStatus('Please enter a community link', 'error');
            return;
        }
        
        try {
            const communityId = this.extractCommunityId(link);
            this.currentCommunityId = communityId;
            
            this.showStatus(`Extracted Community ID: ${communityId}`, 'success');
            this.searchBtn.disabled = true;
            this.refreshBtn.disabled = true;
            
            await this.fetchCommunityMembers(communityId);
            
        } catch (error) {
            this.showStatus(error.message, 'error');
        }
    }
    
    async handleRefresh() {
        if (this.currentCommunityId && !this.isFetching) {
            await this.fetchCommunityMembers(this.currentCommunityId);
        }
    }
    
    async fetchCommunityMembers(communityId) {
        this.isFetching = true;
        this.showProgress();
        this.showStatus('Fetching community members...', 'info');
        
        try {
            // First, get the total member count
            const memberCount = await this.getCommunityMemberCount(communityId);
            
            if (memberCount === 0) {
                throw new Error('No members found in this community');
            }
            
            this.showStatus(`Found ${memberCount.toLocaleString()} members. Fetching profiles...`, 'info');
            
            // Fetch all members in parallel batches for speed
            const members = await this.fetchAllMembers(communityId, memberCount);
            
            // Calculate wealth for each member
            this.showStatus('Calculating wealth for members...', 'info');
            const membersWithWealth = await this.calculateMemberWealth(members);
            
            // Sort by wealth (highest first)
            this.members = membersWithWealth.sort((a, b) => b.rapValue - a.rapValue);
            
            // Store data
            chrome.storage.local.set({
                communityId: communityId,
                members: this.members
            });
            
            this.displayResults();
            this.showStatus(`Successfully processed ${this.members.length} members!`, 'success');
            this.refreshBtn.disabled = false;
            
        } catch (error) {
            this.showStatus(`Error: ${error.message}`, 'error');
        } finally {
            this.isFetching = false;
            this.hideProgress();
            this.searchBtn.disabled = false;
        }
    }
    
    async getCommunityMemberCount(communityId) {
        try {
            const response = await fetch(`https://www.roblox.com/communities/${communityId}/members`);
            const html = await response.text();
            
            // Extract member count from the page
            const memberCountMatch = html.match(/(\d+(?:,\d+)*)\s+members?/i);
            if (memberCountMatch) {
                return parseInt(memberCountMatch[1].replace(/,/g, ''));
            }
            
            // Fallback: try to find any number that looks like member count
            const numbers = html.match(/\d{1,3}(?:,\d{3})*/g);
            for (const num of numbers || []) {
                const count = parseInt(num.replace(/,/g, ''));
                if (count > 100 && count < 10000000) { // Reasonable range for community size
                    return count;
                }
            }
            
            return 1000; // Default fallback
        } catch (error) {
            console.error('Error getting member count:', error);
            return 1000; // Default fallback
        }
    }
    
    async fetchAllMembers(communityId, totalMembers) {
        const members = [];
        const batchSize = 100; // Fetch 100 members at a time
        const totalBatches = Math.ceil(totalMembers / batchSize);
        
        for (let batch = 0; batch < totalBatches; batch++) {
            const startIndex = batch * batchSize;
            const endIndex = Math.min(startIndex + batchSize, totalMembers);
            
            try {
                const batchMembers = await this.fetchMemberBatch(communityId, startIndex, endIndex);
                members.push(...batchMembers);
                
                // Update progress
                const progress = ((batch + 1) / totalBatches) * 100;
                this.updateProgress(progress);
                
                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 50));
                
            } catch (error) {
                console.error(`Error fetching batch ${batch}:`, error);
                // Continue with next batch
            }
        }
        
        return members;
    }
    
    async fetchMemberBatch(communityId, startIndex, endIndex) {
        try {
            const response = await fetch(`https://www.roblox.com/communities/${communityId}/members?startIndex=${startIndex}&maxRows=${endIndex - startIndex}`);
            const html = await response.text();
            
            // Extract usernames from the HTML
            const usernameMatches = html.match(/data-username="([^"]+)"/g);
            if (usernameMatches) {
                return usernameMatches.map(match => {
                    const username = match.match(/data-username="([^"]+)"/)[1];
                    return { username, rapValue: 0 };
                });
            }
            
            // Alternative extraction method
            const altMatches = html.match(/\/users\/([^\/]+)\/profile/g);
            if (altMatches) {
                return altMatches.map(match => {
                    const username = match.match(/\/users\/([^\/]+)\/profile/)[1];
                    return { username, rapValue: 0 };
                });
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching member batch:', error);
            return [];
        }
    }
    
    async calculateMemberWealth(members) {
        const membersWithWealth = [];
        const totalMembers = members.length;
        
        // Process members in parallel batches for speed
        const batchSize = 50;
        const totalBatches = Math.ceil(totalMembers / batchSize);
        
        for (let batch = 0; batch < totalBatches; batch++) {
            const startIndex = batch * batchSize;
            const endIndex = Math.min(startIndex + batchSize, totalMembers);
            const batchMembers = members.slice(startIndex, endIndex);
            
            // Process batch in parallel
            const batchPromises = batchMembers.map(member => this.getUserRAPValue(member.username));
            const batchResults = await Promise.allSettled(batchPromises);
            
            for (let i = 0; i < batchMembers.length; i++) {
                const member = batchMembers[i];
                const result = batchResults[i];
                
                if (result.status === 'fulfilled') {
                    member.rapValue = result.value;
                } else {
                    member.rapValue = 0;
                }
                
                membersWithWealth.push(member);
            }
            
            // Update progress
            const progress = ((batch + 1) / totalBatches) * 100;
            this.updateProgress(progress);
        }
        
        return membersWithWealth;
    }
    
    async getUserRAPValue(username) {
        try {
            // Try to get RAP value from Roblox economy API
            const response = await fetch(`https://economy.roblox.com/v1/users/${username}/assets/collectibles?limit=100&sortOrder=Asc`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch user assets');
            }
            
            const data = await response.json();
            let totalRAP = 0;
            
            if (data.data) {
                for (const item of data.data) {
                    // Only count limited items with value > 10,000 Robux
                    if (item.assetType === 'Limited' && item.recentAveragePrice > 10000) {
                        totalRAP += item.recentAveragePrice;
                    }
                }
            }
            
            return totalRAP;
            
        } catch (error) {
            console.error(`Error getting RAP for ${username}:`, error);
            return 0;
        }
    }
    
    displayResults() {
        if (!this.members || this.members.length === 0) {
            this.resultsList.innerHTML = '<div class="empty-state"><p>No members found</p></div>';
            this.memberCount.textContent = '0 members';
            this.totalValue.textContent = 'Total RAP: 0';
            return;
        }
        
        // Calculate total RAP
        const totalRAP = this.members.reduce((sum, member) => sum + member.rapValue, 0);
        
        // Update info
        this.memberCount.textContent = `${this.members.length.toLocaleString()} members`;
        this.totalValue.textContent = `Total RAP: ${totalRAP.toLocaleString()}`;
        
        // Display members
        const membersHTML = this.members.map((member, index) => `
            <div class="member-item">
                <div class="member-info">
                    <span class="rank">#${index + 1}</span>
                    <span class="username">${member.username}</span>
                </div>
                <span class="rap-value">${member.rapValue.toLocaleString()} RAP</span>
            </div>
        `).join('');
        
        this.resultsList.innerHTML = membersHTML;
    }
    
    showStatus(message, type = 'info') {
        this.status.textContent = message;
        this.status.className = `status ${type}`;
        this.status.classList.remove('hidden');
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.status.classList.add('hidden');
            }, 5000);
        }
    }
    
    showProgress() {
        this.progress.classList.remove('hidden');
        this.updateProgress(0);
    }
    
    hideProgress() {
        this.progress.classList.add('hidden');
    }
    
    updateProgress(percentage) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `${Math.round(percentage)}%`;
    }
}

// Initialize the tracker when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    new RobloxCommunityTracker();
});