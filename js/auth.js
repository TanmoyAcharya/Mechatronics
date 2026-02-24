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
            this.updateDashboard();
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
        const username = document.getElementById('username-input')?.value || document.getElementById('home-username')?.value;
        const password = document.getElementById('password-input')?.value || document.getElementById('home-password')?.value;
        
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
            this.updateDashboard();
            this.showMessage('Login successful!', 'success');
            this.closeModal('login-modal');
        } else {
            this.showMessage('Invalid username or password', 'error');
        }
    }
    
    register() {
        const username = document.getElementById('reg-username')?.value || document.getElementById('home-reg-username')?.value;
        const email = document.getElementById('reg-email')?.value || document.getElementById('home-reg-email')?.value;
        const password = document.getElementById('reg-password')?.value || document.getElementById('home-reg-password')?.value;
        const confirmPassword = document.getElementById('reg-confirm-password')?.value;
        
        if (!username || !email || !password) {
            this.showMessage('Please fill all fields', 'error');
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
                v2g: false,
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
        this.updateDashboard();
        this.showMessage('Account created successfully!', 'success');
        this.closeModal('register-modal');
    }
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('emlab_user');
        this.updateUI();
        this.updateDashboard();
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
    
    updateDashboard() {
        const authSection = document.getElementById('home-auth-section');
        const dashboardSection = document.getElementById('home-dashboard-section');
        const dashboardUsername = document.getElementById('dashboard-username');
        
        if (!authSection || !dashboardSection) return;
        
        if (this.currentUser) {
            authSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            
            if (dashboardUsername) {
                dashboardUsername.textContent = this.currentUser.username;
            }
            
            // Update progress stats
            const progress = this.currentUser.progress || {};
            const completedCount = Object.values(progress).filter(v => v).length;
            const totalCount = Object.keys(progress).length;
            
            const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            
            const progressBar = document.getElementById('dashboard-progress-bar');
            const progressText = document.getElementById('dashboard-progress-text');
            const completedList = document.getElementById('dashboard-completed-list');
            
            if (progressBar) progressBar.style.width = progressPercent + '%';
            if (progressText) progressText.textContent = `${completedCount}/${totalCount} Simulations (${progressPercent}%)`;
            
            if (completedList) {
                const machineNames = {
                    synchronous: 'Synchronous Machine',
                    induction: 'Induction Machine',
                    dcMotor: 'DC Motor',
                    transformer: 'Transformer',
                    pmsm: 'PMSM',
                    construction: 'Machine Construction',
                    windTurbine: 'Wind Turbine',
                    solarPanel: 'Solar Panel',
                    v2g: 'V2G System'
                };
                
                completedList.innerHTML = Object.entries(progress)
                    .filter(([_, completed]) => completed)
                    .map(([key, _]) => `<li>✅ ${machineNames[key] || key}</li>`)
                    .join('') || '<li>No simulations completed yet. Start exploring!</li>';
            }
        } else {
            authSection.style.display = 'block';
            dashboardSection.style.display = 'none';
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

// Contact form submission handler
function submitContactForm() {
    const name = document.getElementById('contact-name')?.value?.trim();
    const email = document.getElementById('contact-email')?.value?.trim();
    const message = document.getElementById('contact-message')?.value?.trim();
    
    if (!name || !email) {
        showContactMessage('Please enter your name and email', 'error');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showContactMessage('Please enter a valid email address', 'error');
        return;
    }
    
    // Get existing contacts
    const contacts = JSON.parse(localStorage.getItem('emlab_contacts') || '[]');
    
    // Check if email already exists
    if (contacts.find(c => c.email === email)) {
        showContactMessage('This email is already subscribed!', 'info');
        return;
    }
    
    // Add new contact
    const newContact = {
        name,
        email,
        message: message || '',
        subscribed: true,
        date: new Date().toISOString()
    };
    
    contacts.push(newContact);
    localStorage.setItem('emlab_contacts', JSON.stringify(contacts));
    
    // Clear form
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-email').value = '';
    document.getElementById('contact-message').value = '';
    
    showContactMessage('Thank you! You\'ll receive updates about new features and simulators.', 'success');
}

function showContactMessage(message, type) {
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
        background: ${type === 'error' ? '#ff4757' : type === 'info' ? '#ffa502' : '#2ed573'};
        color: white;
        font-weight: 500;
    `;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 4000);
}

// Initialize auth system
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});
