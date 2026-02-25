/**
 * Visitor Counter Module
 * Tracks unique visitors using localStorage
 */

class VisitorCounter {
    constructor() {
        this.storageKey = 'visitor_count';
        this.sessionKey = 'visitor_session';
        this.init();
    }

    init() {
        // Check if this is a new session
        const sessionId = sessionStorage.getItem(this.sessionKey);
        
        if (!sessionId) {
            // New session - increment visitor count
            const today = new Date().toDateString();
            const lastVisit = localStorage.getItem('last_visit_date');
            
            // Only count as new visitor if last visit was not today
            if (lastVisit !== today) {
                let count = parseInt(localStorage.getItem(this.storageKey) || '0');
                count++;
                localStorage.setItem(this.storageKey, count.toString());
            }
            
            // Store today's date and session ID
            localStorage.setItem('last_visit_date', today);
            sessionStorage.setItem(this.sessionId || 'session_' + Date.now(), 'true');
        }
        
        this.updateDisplay();
    }

    getCount() {
        return parseInt(localStorage.getItem(this.storageKey) || '0');
    }

    getTodayCount() {
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem('last_visit_date');
        return lastVisit === today ? 1 : 0;
    }

    updateDisplay() {
        const countElement = document.getElementById('visitor-count');
        if (countElement) {
            const count = this.getCount();
            // Format number with commas
            countElement.textContent = count.toLocaleString();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.visitorCounter = new VisitorCounter();
});
