/**
 * Donation System with Stripe Integration
 */

// Stripe configuration - REPLACE with your actual Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY';

// Initialize Stripe
let stripe;

try {
    if (typeof Stripe !== 'undefined') {
        stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
    }
} catch (e) {
    console.log('Stripe not initialized - add your key');
}

// Show custom amount input
function showCustomAmount() {
    const customInput = document.getElementById('custom-amount-input');
    if (customInput) {
        customInput.style.display = 'flex';
    }
}

// Process donation
async function processDonation(amount) {
    // Validate amount
    const donationAmount = parseFloat(amount);
    if (!donationAmount || donationAmount < 1) {
        showMessage('Please enter a valid donation amount', 'error');
        return;
    }

    // If no Stripe key configured, show demo message
    if (STRIPE_PUBLISHABLE_KEY === 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY') {
        // For demo purposes, show a message
        showDonationDemoMessage(donationAmount);
        return;
    }

    try {
        // Create checkout session (requires backend)
        // For client-only integration, you can use Stripe Checkout
        const response = await fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount: donationAmount }),
        });

        if (response.ok) {
            const session = await response.json();
            // Redirect to Stripe Checkout
            const result = await stripe.redirectToCheckout({
                sessionId: session.id,
            });

            if (result.error) {
                showMessage(result.error.message, 'error');
            }
        } else {
            showDonationDemoMessage(donationAmount);
        }
    } catch (error) {
        console.error('Donation error:', error);
        showDonationDemoMessage(donationAmount);
    }
}

// Demo message when Stripe is not configured
function showDonationDemoMessage(amount) {
    const message = `Thank you for your interest in donating $${amount}! \n\nTo enable donations, please configure your Stripe API key in the donation.js file.\n\nContact: tanmoyacharya@example.com`;
    
    alert(message);
    showMessage('Donation system needs configuration. Please contact the administrator.', 'info');
}

// Show message function (global)
function showMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message ${type}`;
    messageDiv.textContent = text;
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
        max-width: 300px;
    `;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}
