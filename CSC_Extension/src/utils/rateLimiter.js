const RATE_LIMIT_KEY = 'csc_scan_rate_limit';
const MAX_SCANS_PER_PROFILE_PER_HOUR = 400;
const COOLDOWN_MINUTES = 60;

export const RateLimiter = {
    async getAllScans() {
        const data = localStorage.getItem(RATE_LIMIT_KEY);
        if (!data) return {};
        
        try {
            const history = JSON.parse(data);
            const oneHourAgo = Date.now() - (COOLDOWN_MINUTES * 60 * 1000);
            
            const cleanedHistory = {};
            for (const [profile, timestamps] of Object.entries(history)) {
                const validTimestamps = timestamps.filter(ts => ts > oneHourAgo);
                if (validTimestamps.length > 0) {
                    cleanedHistory[profile] = validTimestamps;
                }
            }
            return cleanedHistory;
        } catch {
            return {};
        }
    },

    async getScanHistoryForProfile(profileUsername) {
        const allScans = await this.getAllScans();
        return allScans[profileUsername] || [];
    },

    async recordScan(profileUsername) {
        const allScans = await this.getAllScans();
        if (!allScans[profileUsername]) {
            allScans[profileUsername] = [];
        }
        allScans[profileUsername].push(Date.now());
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(allScans));
    },

    async canScan(profileUsername) {
        const history = await this.getScanHistoryForProfile(profileUsername);
        return history.length < MAX_SCANS_PER_PROFILE_PER_HOUR;
    },

    async getRemainingScans(profileUsername) {
        const history = await this.getScanHistoryForProfile(profileUsername);
        return Math.max(0, MAX_SCANS_PER_PROFILE_PER_HOUR - history.length);
    },

    async getTimeUntilNextScan(profileUsername) {
        const history = await this.getScanHistoryForProfile(profileUsername);
        
        if (history.length < MAX_SCANS_PER_PROFILE_PER_HOUR) {
            return 0;
        }

        const oldestScan = Math.min(...history);
        const resetTime = oldestScan + (COOLDOWN_MINUTES * 60 * 1000);
        const timeRemaining = resetTime - Date.now();
        
        return Math.max(0, Math.ceil(timeRemaining / 1000 / 60));
    },

    formatTimeRemaining(minutes) {
        if (minutes <= 0) return 'now';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
};
