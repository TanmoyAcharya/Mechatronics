/**
 * User Authentication and Learning Progress System
 * Secure localStorage-based authentication with OTP verification
 */

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.pendingRegistration = null;
        this.otpExpiry = 5 * 60 * 1000; // 5 minutes
        this.maxLoginAttempts = 5;
        this.lockoutTime = 15 * 60 * 1000; // 15 minutes
        this.init();
    }
    
    // Security: Input sanitization
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim();
    }
    
    // Security: Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Security: Check password strength (simplified)
    checkPasswordStrength(password) {
        let strength = 0;
        const feedback = [];
        
        if (password.length < 4) {
            feedback.push('At least 4 characters');
        } else {
            strength += 1;
        }
        
        if (/[a-zA-Z]/.test(password)) strength += 1;
        else feedback.push('letter');
        
        if (/[0-9]/.test(password)) strength += 1;
        else feedback.push('number');
        
        return { strength, feedback };
    }
    
    // Security: Generate OTP
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    // Security: Check if account is locked
    isLockedOut() {
        const lockoutEnd = localStorage.getItem('emlab_lockout_end');
        if (lockoutEnd && Date.now() < parseInt(lockoutEnd)) {
            return true;
        }
        return false;
    }
    
    // Security: Record failed attempt
    recordFailedAttempt() {
        let attempts = parseInt(localStorage.getItem('emlab_failed_attempts') || '0');
        attempts++;
        localStorage.setItem('emlab_failed_attempts', attempts.toString());
        
        if (attempts >= this.maxLoginAttempts) {
            localStorage.setItem('emlab_lockout_end', (Date.now() + this.lockoutTime).toString());
            this.showMessage('Too many failed attempts. Please try again in 15 minutes.', 'error');
        }
    }
    
    // Security: Clear failed attempts on successful login
    clearFailedAttempts() {
        localStorage.removeItem('emlab_failed_attempts');
        localStorage.removeItem('emlab_lockout_end');
    }
    
    init() {
        // Check for existing session
        const savedUser = localStorage.getItem('emlab_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.updateUI();
                this.updateDashboard();
            } catch (e) {
                localStorage.removeItem('emlab_user');
            }
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
            registerBtn.addEventListener('click', () => this.startRegistration());
        }
        
        // OTP verification
        const verifyOtpBtn = document.getElementById('verify-otp-btn');
        if (verifyOtpBtn) {
            verifyOtpBtn.addEventListener('click', () => this.verifyOTP());
        }
        
        // Resend OTP
        const resendOtpBtn = document.getElementById('resend-otp-btn');
        if (resendOtpBtn) {
            resendOtpBtn.addEventListener('click', () => this.resendOTP());
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
                if (input) {
                    input.type = input.type === 'password' ? 'text' : 'password';
                }
            });
        }
    }
    
    login() {
        // Check lockout
        if (this.isLockedOut()) {
            this.showMessage('Account is temporarily locked. Please try again later.', 'error');
            return;
        }
        
        const username = this.sanitizeInput(document.getElementById('username-input')?.value || document.getElementById('home-username')?.value || '');
        const password = document.getElementById('password-input')?.value || document.getElementById('home-password')?.value || '';
        
        if (!username || !password) {
            this.showMessage('Please enter username and password', 'error');
            return;
        }
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('emlab_users') || '[]');
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.clearFailedAttempts();
            this.currentUser = user;
            localStorage.setItem('emlab_user', JSON.stringify(user));
            this.updateUI();
            this.updateDashboard();
            this.showMessage('Login successful!', 'success');
            this.closeModal('login-modal');
        } else {
            this.recordFailedAttempt();
            const remainingAttempts = this.maxLoginAttempts - parseInt(localStorage.getItem('emlab_failed_attempts') || '0');
            this.showMessage(`Invalid username or password. ${remainingAttempts} attempts remaining.`, 'error');
        }
    }
    
    startRegistration() {
        const username = this.sanitizeInput(document.getElementById('reg-username')?.value || document.getElementById('home-reg-username')?.value || '');
        const email = this.sanitizeInput(document.getElementById('reg-email')?.value || document.getElementById('home-reg-email')?.value || '');
        const password = document.getElementById('reg-password')?.value || document.getElementById('home-reg-password')?.value || '';
        const confirmPassword = document.getElementById('reg-confirm-password')?.value || '';
        
        // Validation
        if (!username || !email || !password) {
            this.showMessage('Please fill all fields', 'error');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }
        
        // Simple password validation (at least 4 characters)
        if (password.length < 4) {
            this.showMessage('Password must be at least 4 characters', 'error');
            return;
        }
        
        // Get existing users
        const users = JSON.parse(localStorage.getItem('emlab_users') || '[]');
        
        // Check if username or email exists
        if (users.find(u => u.username === username)) {
            this.showMessage('Username already exists', 'error');
            return;
        }
        
        if (users.find(u => u.email === email)) {
            this.showMessage('Email already registered', 'error');
            return;
        }
        
        // Generate OTP and store pending registration
        const otp = this.generateOTP();
        this.pendingRegistration = {
            username,
            email,
            password,
            otp,
            otpExpiry: Date.now() + this.otpExpiry
        };
        
        // Store OTP for verification
        localStorage.setItem('emlab_pending_otp', JSON.stringify({
            otp,
            email,
            expiry: Date.now() + this.otpExpiry
        }));
        
        // Show OTP modal
        this.closeModal('register-modal');
        this.showOTPModal(email, otp);
    }
    
    showOTPModal(email, otp) {
        // Create OTP modal if it doesn't exist
        let otpModal = document.getElementById('otp-modal');
        if (!otpModal) {
            otpModal = document.createElement('div');
            otpModal.id = 'otp-modal';
            otpModal.className = 'modal';
            otpModal.innerHTML = `
                <div class="modal-content">
                    <span class="modal-close" onclick="authSystem.closeModal('otp-modal')">&times;</span>
                    <h2>📧 Verify Your Email</h2>
                    <p class="otp-info">We've sent a verification code to <strong id="otp-email"></strong></p>
                    <div class="form-group">
                        <label>Enter 6-digit OTP</label>
                        <input type="text" id="otp-input" maxlength="6" placeholder="123456" autocomplete="one-time-code">
                    </div>
                    <button id="verify-otp-btn" class="btn-primary">Verify & Create Account</button>
                    <p class="otp-resend">Didn't receive code? <button id="resend-otp-btn" class="link-btn">Resend OTP</button></p>
                    <p class="otp-note">For demo: OTP is <strong id="demo-otp"></strong></p>
                </div>
            `;
            document.body.appendChild(otpModal);
            
            // Add event listeners
            document.getElementById('verify-otp-btn').addEventListener('click', () => this.verifyOTP());
            document.getElementById('resend-otp-btn').addEventListener('click', () => this.resendOTP());
        }
        
        document.getElementById('otp-email').textContent = email;
        document.getElementById('demo-otp').textContent = otp;
        document.getElementById('otp-input').value = '';
        otpModal.style.display = 'flex';
    }
    
    verifyOTP() {
        const otpInput = document.getElementById('otp-input')?.value.trim() || '';
        const pendingData = JSON.parse(localStorage.getItem('emlab_pending_otp') || '{}');
        
        if (!pendingData.otp) {
            this.showMessage('Registration session expired. Please try again.', 'error');
            return;
        }
        
        // Check expiry
        if (Date.now() > pendingData.expiry) {
            localStorage.removeItem('emlab_pending_otp');
            this.showMessage('OTP expired. Please request a new one.', 'error');
            return;
        }
        
        // Verify OTP
        if (otpInput !== pendingData.otp) {
            this.showMessage('Invalid OTP. Please try again.', 'error');
            return;
        }
        
        // Complete registration
        this.completeRegistration(pendingData.email);
    }
    
    resendOTP() {
        const pendingData = JSON.parse(localStorage.getItem('emlab_pending_otp') || '{}');
        if (!pendingData.email) {
            this.showMessage('No pending registration found.', 'error');
            return;
        }
        
        // Generate new OTP
        const newOtp = this.generateOTP();
        const newExpiry = Date.now() + this.otpExpiry;
        
        localStorage.setItem('emlab_pending_otp', JSON.stringify({
            otp: newOtp,
            email: pendingData.email,
            expiry: newExpiry
        }));
        
        document.getElementById('demo-otp').textContent = newOtp;
        document.getElementById('otp-input').value = '';
        this.showMessage('New OTP sent!', 'success');
    }
    
    completeRegistration(email) {
        const users = JSON.parse(localStorage.getItem('emlab_users') || '[]');
        
        // Create new user
        const newUser = {
            username: this.pendingRegistration.username,
            email: this.pendingRegistration.email,
            password: this.pendingRegistration.password,
            emailVerified: true,
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
                powerElec: false,
                widebandgap: false,
                communication: false,
                learn: false
            },
            quizScore: 0,
            completedLessons: [],
            lastVisit: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('emlab_users', JSON.stringify(users));
        
        // Clear pending OTP
        localStorage.removeItem('emlab_pending_otp');
        this.pendingRegistration = null;
        
        // Auto login
        this.currentUser = newUser;
        localStorage.setItem('emlab_user', JSON.stringify(newUser));
        
        this.closeModal('otp-modal');
        this.updateUI();
        this.updateDashboard();
        this.showMessage('Account created and verified successfully!', 'success');
    }
    
    register() {
        // Legacy method - redirect to OTP flow
        this.startRegistration();
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
            
            // Ensure progress object has all keys
            if (!this.currentUser.progress) {
                this.currentUser.progress = {};
            }
            const allKeys = ['synchronous', 'induction', 'dcMotor', 'transformer', 'pmsm', 
                            'construction', 'windTurbine', 'solarPanel', 'v2g', 'powerElec', 
                            'widebandgap', 'communication', 'learn'];
            allKeys.forEach(key => {
                if (this.currentUser.progress[key] === undefined) {
                    this.currentUser.progress[key] = false;
                }
            });
            
            // Update progress stats
            const progress = this.currentUser.progress;
            const completedCount = Object.values(progress).filter(v => v).length;
            const totalCount = allKeys.length;
            
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
                    v2g: 'V2G System',
                    powerElec: 'Power Electronics',
                    widebandgap: 'Widebandgap Semiconductors',
                    communication: 'Communication Systems',
                    learn: 'Learning Center'
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
        
        // Ensure progress object has all keys
        if (!this.currentUser.progress) {
            this.currentUser.progress = {};
        }
        
        // Initialize all progress keys if not present
        const allKeys = ['synchronous', 'induction', 'dcMotor', 'transformer', 'pmsm', 
                        'construction', 'windTurbine', 'solarPanel', 'v2g', 'powerElec', 
                        'widebandgap', 'communication', 'learn'];
        allKeys.forEach(key => {
            if (this.currentUser.progress[key] === undefined) {
                this.currentUser.progress[key] = false;
            }
        });
        
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
        
        // Update dashboard display
        this.updateDashboard();
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

// Make Google callback global so it can be called from the HTML
window.handleGoogleLogin = handleGoogleLogin;

// Google OAuth Login Handler
function handleGoogleLogin(response) {
    if (response && response.credential) {
        // Decode the JWT token to get user info
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        
        const googleUser = {
            username: payload.name || payload.email.split('@')[0],
            email: payload.email,
            password: 'google_oauth_' + payload.sub, // Placeholder for OAuth users
            isGoogleUser: true,
            googleId: payload.sub,
            picture: payload.picture,
            emailVerified: true, // Google already verifies email
            progress: {},
            createdAt: new Date().toISOString()
        };
        
        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('emlab_users') || '[]');
        let existingUser = users.find(u => u.email === googleUser.email);
        
        if (!existingUser) {
            // Create new user
            users.push(googleUser);
            localStorage.setItem('emlab_users', JSON.stringify(users));
            existingUser = googleUser;
        }
        
        // Set as current user
        window.authSystem.currentUser = existingUser;
        localStorage.setItem('emlab_user', JSON.stringify(existingUser));
        window.authSystem.updateUI();
        window.authSystem.updateDashboard();
        window.authSystem.closeModal('login-modal');
        showContactMessage('Welcome! Signed in with Google successfully.', 'success');
    } else {
        showContactMessage('Google sign-in failed. Please try again.', 'error');
    }
}

// Initialize auth system
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});
