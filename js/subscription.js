/**
 * Subscription System
 * Handles Stripe payment integration and content access control
 * 
 * Subscription Plans:
 * - yearly: 10€ for 1 year access
 * - lifetime: 49€ for lifetime access
 */

// Stripe configuration - Replace with your actual Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY';

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
    yearly: {
        id: 'yearly',
        name: 'Yearly Plan',
        price: 10, // euros
        priceId: 'price_yearly_subscription', // Replace with actual Stripe price ID
        duration: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
        features: [
            'Access to all 20+ premium simulators',
            'DC Motor, PMSM, eVTOL, Wind Turbine',
            'Priority support',
            'No advertisements'
        ]
    },
    lifetime: {
        id: 'lifetime',
        name: 'Lifetime Plan',
        price: 49, // euros
        priceId: 'price_lifetime_subscription', // Replace with actual Stripe price ID
        duration: null, // Lifetime (no expiry)
        features: [
            'Everything in Yearly Plan',
            'Lifetime access',
            'All future updates',
            'Exclusive content',
            'Priority support'
        ]
    }
};

// Content access levels
const CONTENT_ACCESS = {
    // Free content - no login required (only home page is free)
    free: ['home'],
    
    // Login required content
    login: [],
    
    // Premium content - subscription required (all topics)
    premium: ['synchronous', 'induction', 'dc-motor', 'transformer', 'pmsm', 'solarpanel', 
              'windturbine', 'v2g', 'evtol', 'powerelectronics', 'widebandgap', 
              'construction', 'communication', 'ledlighting', 'circuitbreaker', 
              'bldcfan', 'compressor', 'lift', 'catfollower', 'learn']
};

class SubscriptionSystem {
    constructor() {
        this.stripe = null;
        this.currentPlan = null;
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        // Load Stripe
        this.loadStripe();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI based on current user subscription status
        this.updateSubscriptionUI();
    }
    
    // Initialize Stripe
    loadStripe() {
        if (typeof Stripe !== 'undefined' && STRIPE_PUBLISHABLE_KEY !== 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY') {
            this.stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
        } else {
            console.log('Stripe not configured - subscriptions unavailable');
        }
    }
    
    setupEventListeners() {
        // Subscription buttons
        const subscribeBtns = document.querySelectorAll('.subscribe-btn');
        subscribeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const plan = e.target.dataset.plan;
                if (plan) {
                    this.initiateSubscription(plan);
                }
            });
        });
        
        // Open subscription modal from locked content
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('locked-content-trigger')) {
                const content = e.target.dataset.content;
                this.showSubscriptionModal(content);
            }
        });
    }
    
    // Check if user has active subscription
    hasActiveSubscription() {
        const user = this.getCurrentUser();
        if (!user || !user.subscription) return false;
        
        const sub = user.subscription;
        
        // Lifetime subscription
        if (sub.plan === 'lifetime') return true;
        
        // Yearly subscription - check expiry
        if (sub.plan === 'yearly' && sub.expiryDate) {
            return Date.now() < sub.expiryDate;
        }
        
        return false;
    }
    
    // Get current user from localStorage
    getCurrentUser() {
        const userData = localStorage.getItem('emlab_user');
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (e) {
                return null;
            }
        }
        return null;
    }
    
    // Update user subscription in localStorage
    updateUserSubscription(subscriptionData) {
        const user = this.getCurrentUser();
        if (user) {
            user.subscription = subscriptionData;
            localStorage.setItem('emlab_user', JSON.stringify(user));
            
            // Also update in users array
            const users = JSON.parse(localStorage.getItem('emlab_users') || '[]');
            const userIndex = users.findIndex(u => u.username === user.username);
            if (userIndex !== -1) {
                users[userIndex].subscription = subscriptionData;
                localStorage.setItem('emlab_users', JSON.stringify(users));
            }
            
            this.updateSubscriptionUI();
            return true;
        }
        return false;
    }
    
    // Check if user can access specific content
    canAccessContent(pageName) {
        // Free content - always accessible
        if (CONTENT_ACCESS.free.includes(pageName)) {
            return { allowed: true, reason: null };
        }
        
        // Login required content
        if (CONTENT_ACCESS.login.includes(pageName)) {
            const user = this.getCurrentUser();
            if (user) {
                return { allowed: true, reason: null };
            }
            return { 
                allowed: false, 
                reason: 'login_required',
                message: 'Please login to access this content'
            };
        }
        
        // Premium content - subscription required
        if (CONTENT_ACCESS.premium.includes(pageName)) {
            if (this.hasActiveSubscription()) {
                return { allowed: true, reason: null };
            }
            return { 
                allowed: false, 
                reason: 'subscription_required',
                message: 'This is premium content. Subscribe to access.'
            };
        }
        
        // Default - allow access
        return { allowed: true, reason: null };
    }
    
    // Initiate subscription process
    async initiateSubscription(planId) {
        const user = this.getCurrentUser();
        
        if (!user) {
            this.showMessage('Please login first', 'error');
            // Show login modal first, then subscription after login
            if (window.authSystem) {
                window.authSystem.openModal('login-modal');
            }
            return;
        }
        
        const plan = SUBSCRIPTION_PLANS[planId];
        if (!plan) {
            this.showMessage('Invalid subscription plan', 'error');
            return;
        }
        
        // Stripe must be configured for subscriptions to work
        if (!this.stripe) {
            this.showMessage('Payment system not configured. Please contact support.', 'error');
            return;
        }
        
        // Real Stripe integration
        this.isLoading = true;
        this.showMessage('Redirecting to payment...', 'info');
        
        try {
            // In a real implementation, you would call your backend to create a checkout session
            // const response = await fetch('/api/create-checkout-session', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ planId, userId: user.username })
            // });
            // const session = await response.json();
            // const { sessionId } = session;
            
            // Note: Backend must implement checkout session creation
            // Without backend, subscriptions cannot be processed
            this.showMessage('Payment system error. Please try again later.', 'error');
            this.isLoading = false;
            return;
            
            /*
            const result = await this.stripe.redirectToCheckout({
                sessionId: sessionId
            });
            
            if (result.error) {
                this.showMessage(result.error.message, 'error');
            }
            */
        } catch (error) {
            console.error('Subscription error:', error);
            this.showMessage('Payment failed. Please try again.', 'error');
        } finally {
            this.isLoading = false;
        }
    }
    
    // Demo subscription activation (DEPRECATED - only for internal testing with explicit flag)
    // Premium content now requires actual payment through Stripe
    activateDemoSubscription(planId, isInternalTesting = false) {
        // This method is disabled - subscriptions require payment
        this.showMessage('Payment required. Please configure Stripe to enable subscriptions.', 'error');
        return;
        
        /* Legacy demo code removed - was allowing free access to premium content */
        /* This was a security issue as it allowed bypassing payment */
        /*
        const plan = SUBSCRIPTION_PLANS[planId];
        const user = this.getCurrentUser();
        
        if (!user) {
            this.showMessage('Please login first', 'error');
            return;
        }
        
        const expiryDate = plan.duration ? Date.now() + plan.duration : null;
        
        const subscriptionData = {
            plan: planId,
            price: plan.price,
            purchaseDate: Date.now(),
            expiryDate: expiryDate,
            status: 'active'
        };
        
        this.updateUserSubscription(subscriptionData);
        
        this.showMessage(`${plan.name} activated! (Demo Mode)`, 'success');
        this.closeModal('subscription-modal');
        
        // Trigger custom event for UI update
        window.dispatchEvent(new CustomEvent('subscriptionUpdated', { detail: subscriptionData }));
        */
    }
    
    // Process webhook (for real Stripe implementation)
    processWebhook(event) {
        // In a real implementation, you would verify the webhook signature
        // and process events like 'checkout.session.completed', 'customer.subscription.updated', etc.
        
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                // Activate subscription for user
                this.activateSubscriptionFromSession(session);
                break;
                
            case 'customer.subscription.updated':
                // Handle subscription updates (cancellation, renewal, etc.)
                break;
                
            case 'customer.subscription.deleted':
                // Handle subscription cancellation
                break;
        }
    }
    
    // Activate subscription from completed checkout session
    activateSubscriptionFromSession(session) {
        // Extract user info from session metadata
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        
        if (userId && planId) {
            const plan = SUBSCRIPTION_PLANS[planId];
            const expiryDate = plan.duration ? Date.now() + plan.duration : null;
            
            const subscriptionData = {
                plan: planId,
                price: plan.price,
                purchaseDate: Date.now(),
                expiryDate: expiryDate,
                status: 'active',
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription
            };
            
            // Update user subscription
            const users = JSON.parse(localStorage.getItem('emlab_users') || '[]');
            const userIndex = users.findIndex(u => u.username === userId);
            
            if (userIndex !== -1) {
                users[userIndex].subscription = subscriptionData;
                localStorage.setItem('emlab_users', JSON.stringify(users));
                
                // Update current session if logged in
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.username === userId) {
                    localStorage.setItem('emlab_user', JSON.stringify(users[userIndex]));
                    this.updateSubscriptionUI();
                }
            }
        }
    }
    
    // Show subscription modal
    showSubscriptionModal(contentType = null) {
        let modal = document.getElementById('subscription-modal');
        
        if (!modal) {
            this.createSubscriptionModal();
            modal = document.getElementById('subscription-modal');
        }
        
        // If triggered from locked content, show which content is locked
        if (contentType) {
            const lockedInfo = modal.querySelector('.locked-content-info');
            if (lockedInfo) {
                const contentNames = {
                    'synchronous': 'Synchronous Machine Simulator',
                    'induction': 'Induction Motor Simulator',
                    'dc-motor': 'DC Motor Simulator',
                    'transformer': 'Transformer Simulator',
                    'pmsm': 'PMSM Simulator',
                    'solarpanel': 'Solar Panel Simulator',
                    'windturbine': 'Wind Turbine Simulator',
                    'v2g': 'V2G (Vehicle-to-Grid) Simulator',
                    'evtol': 'eVTOL Aircraft Simulator',
                    'powerelectronics': 'Power Electronics Simulator',
                    'widebandgap': 'Widebandgap (SiC/GaN) Simulator',
                    'construction': 'Construction Simulator',
                    'communication': 'Communication System Simulator',
                    'ledlighting': 'LED Lighting Simulator',
                    'circuitbreaker': 'Circuit Breaker Simulator',
                    'bldcfan': 'BLDC Fan Simulator',
                    'compressor': 'Compressor Simulator',
                    'lift': 'Elevator/Lift Simulator',
                    'catfollower': 'CAT Follower Simulator',
                    'learn': 'Learning Module'
                };
                lockedInfo.textContent = `Unlock: ${contentNames[contentType] || contentType}`;
                lockedInfo.style.display = 'block';
            }
        }
        
        modal.style.display = 'block';
    }
    
    // Create subscription modal HTML
    createSubscriptionModal() {
        const modal = document.createElement('div');
        modal.id = 'subscription-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content subscription-modal">
                <span class="modal-close" onclick="subscriptionSystem.closeModal('subscription-modal')">&times;</span>
                <h2>🔓 Premium Subscription</h2>
                <p class="locked-content-info" style="display: none; color: #e74c3c; margin-bottom: 15px;"></p>
                <p>Unlock all premium content and advanced simulators!</p>
                
                <div class="subscription-plans">
                    <div class="plan-card">
                        <div class="plan-header">
                            <h3>📅 Yearly Plan</h3>
                            <div class="plan-price">€10<span>/year</span></div>
                        </div>
                        <ul class="plan-features">
                            <li>✓ Full access to ALL 20+ Simulators</li>
                            <li>✓ DC Motor, PMSM, eVTOL, Wind Turbine & more</li>
                            <li>✓ No advertisements</li>
                            <li>✓ Priority support</li>
                        </ul>
                        <button class="btn-primary subscribe-btn" data-plan="yearly">
                            Subscribe for €10/year
                        </button>
                    </div>
                    
                    <div class="plan-card featured">
                        <div class="plan-badge">Best Value</div>
                        <div class="plan-header">
                            <h3>♾️ Lifetime Plan</h3>
                            <div class="plan-price">€49<span>/lifetime</span></div>
                        </div>
                        <ul class="plan-features">
                            <li>✓ Everything in Yearly Plan</li>
                            <li>✓ Lifetime access</li>
                            <li>✓ All future updates</li>
                            <li>✓ Exclusive content</li>
                            <li>✓ Priority support</li>
                        </ul>
                        <button class="btn-primary subscribe-btn" data-plan="lifetime">
                            Subscribe for €49 - One Time
                        </button>
                    </div>
                </div>
                
                <div class="payment-info">
                    <p>🔒 Secure payment powered by Stripe</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners to dynamically created buttons
        setTimeout(() => {
            const subscribeBtns = modal.querySelectorAll('.subscribe-btn');
            subscribeBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const plan = e.target.dataset.plan;
                    if (plan) {
                        this.initiateSubscription(plan);
                    }
                });
            });
        }, 100);
    }
    
    // Update subscription UI based on user status
    updateSubscriptionUI() {
        const hasSubscription = this.hasActiveSubscription();
        
        // Update subscription-related UI elements
        document.querySelectorAll('.premium-badge').forEach(badge => {
            badge.style.display = hasSubscription ? 'inline' : 'none';
        });
        
        // Update locked content indicators
        this.updateLockedContentIndicators();
        
        // Dispatch event for other components to react
        window.dispatchEvent(new CustomEvent('subscriptionStatusChanged', { 
            detail: { hasSubscription } 
        }));
    }
    
    // Update locked content indicators in navigation
    updateLockedContentIndicators() {
        const user = this.getCurrentUser();
        const hasSubscription = this.hasActiveSubscription();
        
        // Update login-required content indicators
        CONTENT_ACCESS.login.forEach(page => {
            this.updateNavItemLockStatus(page, !user);
        });
        
        // Update premium content indicators
        CONTENT_ACCESS.premium.forEach(page => {
            this.updateNavItemLockStatus(page, !hasSubscription, true);
        });
    }
    
    // Update navigation item lock status
    updateNavItemLockStatus(page, isLocked, isPremium = false) {
        const navItem = document.querySelector(`.nav-btn[data-page="${page}"], .sidebar-link[data-page="${page}"]`);
        if (!navItem) return;
        
        // Remove existing lock indicators
        const existingLock = navItem.querySelector('.lock-icon');
        if (existingLock) existingLock.remove();
        
        if (isLocked) {
            const lockIcon = document.createElement('span');
            lockIcon.className = 'lock-icon';
            lockIcon.innerHTML = isPremium ? '🔒 <small>Premium</small>' : '🔒';
            lockIcon.style.marginLeft = '5px';
            lockIcon.style.fontSize = '0.8em';
            
            // Add click handler to show appropriate modal
            navItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (isPremium) {
                    this.showSubscriptionModal(page);
                } else if (window.authSystem) {
                    window.authSystem.openModal('login-modal');
                }
            }, { once: true });
            
            navItem.appendChild(lockIcon);
            
            // Add visual indicator class
            navItem.classList.add('locked-content');
        } else {
            navItem.classList.remove('locked-content');
        }
    }
    
    // Show message to user
    showMessage(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
            <span class="toast-message">${message}</span>
        `;
        
        // Add toast styles if not already present
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 10000;
                    animation: slideIn 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .toast-success { background: #27ae60; }
                .toast-error { background: #e74c3c; }
                .toast-info { background: #3498db; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .subscription-modal {
                    max-width: 700px;
                    padding: 30px;
                }
                .subscription-plans {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin: 20px 0;
                }
                .plan-card {
                    background: #f8f9fa;
                    border: 2px solid #e9ecef;
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .plan-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                }
                .plan-card.featured {
                    border-color: #3498db;
                    background: linear-gradient(135deg, #ebf5ff 0%, #f0f9ff 100%);
                    position: relative;
                }
                .plan-badge {
                    position: absolute;
                    top: -12px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #3498db;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.8em;
                    font-weight: 600;
                }
                .plan-header h3 {
                    margin: 0 0 10px;
                    color: #2c3e50;
                }
                .plan-price {
                    font-size: 2em;
                    font-weight: 700;
                    color: #2c3e50;
                }
                .plan-price span {
                    font-size: 0.4em;
                    font-weight: 400;
                    color: #7f8c8d;
                }
                .plan-features {
                    list-style: none;
                    padding: 0;
                    margin: 20px 0;
                    text-align: left;
                }
                .plan-features li {
                    padding: 8px 0;
                    color: #555;
                }
                .subscription-modal .btn-primary {
                    width: 100%;
                    padding: 12px;
                    font-size: 1em;
                }
                .payment-info {
                    text-align: center;
                    margin-top: 20px;
                    color: #7f8c8d;
                }
                .payment-info p {
                    margin: 5px 0;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
    
    // Close modal
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // Get subscription status for display
    getSubscriptionStatus() {
        const user = this.getCurrentUser();
        if (!user || !user.subscription) {
            return { active: false, plan: null };
        }
        
        const sub = user.subscription;
        
        if (sub.plan === 'lifetime') {
            return { active: true, plan: 'lifetime', label: 'Lifetime Member' };
        }
        
        if (sub.plan === 'yearly' && sub.expiryDate) {
            const daysLeft = Math.ceil((sub.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
            return { 
                active: true, 
                plan: 'yearly', 
                label: `Yearly (${daysLeft} days left)`,
                expiryDate: new Date(sub.expiryDate).toLocaleDateString()
            };
        }
        
        return { active: false, plan: null };
    }
}

// Initialize subscription system
let subscriptionSystem;

document.addEventListener('DOMContentLoaded', () => {
    subscriptionSystem = new SubscriptionSystem();
    window.subscriptionSystem = subscriptionSystem;
    
    // Update locked content indicators after a short delay to ensure nav is loaded
    setTimeout(() => {
        subscriptionSystem.updateLockedContentIndicators();
    }, 500);
});

// Also initialize immediately if DOM is already loaded
if (document.readyState !== 'loading') {
    subscriptionSystem = new SubscriptionSystem();
    window.subscriptionSystem = subscriptionSystem;
}
