/**
 * User Authentication and Learning Progress System
 * Simple localStorage-based authentication
 */

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }
    
    init() {
        // Check for existing session
        const savedUser = localStorage.getItem('emlab_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUI();
        }
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Login form
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.login());
        }
        
        // Register form
        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.register());
        }
        
        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Show/hide password
        const togglePassword = document.querySelector('.toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const input = document.getElementById('password-input');
                input.type = input.type === 'password' ? 'text' : 'password';
            });
        }
    }
    
    login() {
        const username = document.getElementById('username-input')?.value;
        const password = document.getElementById('password-input')?.value;
        
        if (!username || !password) {
            this.showMessage('Please enter username and password', 'error');
            return;
        }
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('emlab_users') || '[]');
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('emlab_user', JSON.stringify(user));
            this.updateUI();
            this.showMessage('Login successful!', 'success');
            this.closeModal('login-modal');
        } else {
            this.showMessage('Invalid username or password', 'error');
        }
    }
    
    register() {
        const username = document.getElementById('reg-username')?.value;
        const email = document.getElementById('reg-email')?.value;
        const password = document.getElementById('reg-password')?.value;
        const confirmPassword = document.getElementById('reg-confirm-password')?.value;
        
        if (!username || !email || !password || !confirmPassword) {
            this.showMessage('Please fill all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        
        // Get existing users
        const users = JSON.parse(localStorage.getItem('emlab_users') || '[]');
        
        // Check if username exists
        if (users.find(u => u.username === username)) {
            this.showMessage('Username already exists', 'error');
            return;
        }
        
        // Create new user
        const newUser = {
            username,
            email,
            password,
            createdAt: new Date().toISOString(),
            progress: {
                synchronous: false,
                induction: false,
                dcMotor: false,
                transformer: false,
                pmsm: false,
                construction: false,
                windTurbine: false,
                solarPanel: false,
                learn: false
            },
            completedLessons: [],
            lastVisit: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('emlab_users', JSON.stringify(users));
        
        // Auto login
        this.currentUser = newUser;
        localStorage.setItem('emlab_user', JSON.stringify(newUser));
        this.updateUI();
        this.showMessage('Registration successful!', 'success');
        this.closeModal('login-modal');
    }
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('emlab_user');
        this.updateUI();
        this.showMessage('Logged out successfully', 'success');
    }
    
    updateUI() {
        const authButtons = document.getElementById('auth-buttons');
        const userInfo = document.getElementById('user-info');
        
        if (this.currentUser) {
            if (authButtons) authButtons.style.display = 'none';
            if (userInfo) {
                userInfo.style.display = 'flex';
                const usernameEl = document.getElementById('display-username');
                if (usernameEl) usernameEl.textContent = this.currentUser.username;
            }
        } else {
            if (authButtons) authButtons.style.display = 'flex';
            if (userInfo) userInfo.style.display = 'none';
        }
    }
    
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            background: ${type === 'error' ? '#ff4757' : '#2ed573'};
            color: white;
            font-weight: 500;
        `;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'flex';
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    }
    
    // Learning progress tracking
    markComplete(section) {
        if (!this.currentUser) return;
        
        this.currentUser.progress[section] = true;
        this.currentUser.lastVisit = new Date().toISOString();
        
        // Update localStorage
        const users = JSON.parse(localStorage.getItem('emlab_users') || '[]');
        const userIndex = users.findIndex(u => u.username === this.currentUser.username);
        if (userIndex >= 0) {
            users[userIndex] = this.currentUser;
            localStorage.setItem('emlab_users', JSON.stringify(users));
            localStorage.setItem('emlab_user', JSON.stringify(this.currentUser));
        }
    }
    
    getProgress() {
        if (!this.currentUser) return null;
        
        const total = Object.keys(this.currentUser.progress).length;
        const completed = Object.values(this.currentUser.progress).filter(v => v).length;
        return {
            completed,
            total,
            percentage: Math.round((completed / total) * 100)
        };
    }
    
    resetPassword(username, email) {
        const users = JSON.parse(localStorage.getItem('emlab_users') || '[]');
        const user = users.find(u => u.username === username && u.email === email);
        
        if (user) {
            // Generate temp password
            const tempPassword = Math.random().toString(36).slice(-8);
            user.password = tempPassword;
            localStorage.setItem('emlab_users', JSON.stringify(users));
            this.showMessage(`Temporary password: ${tempPassword}`, 'success');
            return true;
        }
        this.showMessage('User not found', 'error');
        return false;
    }
}

// Initialize auth system
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});
