/**
 * Animated Cat Widget
 * A cute cat character that stays in the corner with eyes following the cursor
 */

class CatWidget {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.tailWag = 0;
        
        this.createCat();
    }
    
    createCat() {
        // Create the cat container - fixed position in corner
        this.container = document.createElement('div');
        this.container.id = 'cat-widget';
        this.container.innerHTML = `
            <svg class="cat-body" viewBox="0 0 120 100" width="100" height="83">
                <!-- Tail -->
                <path class="cat-tail" d="M20,75 Q5,65 10,45 Q15,30 25,40" 
                      fill="none" stroke="#4a4a5a" stroke-width="6" stroke-linecap="round"/>
                
                <!-- Back legs sitting -->
                <ellipse cx="35" cy="80" rx="12" ry="8" fill="#5a5a6a"/>
                <ellipse cx="55" cy="80" rx="12" ry="8" fill="#5a5a6a"/>
                
                <!-- Body - sitting pose -->
                <ellipse cx="60" cy="70" rx="35" ry="28" fill="#6a6a7a"/>
                <ellipse cx="60" cy="68" rx="30" ry="24" fill="#7a7a8a"/>
                
                <!-- Front paws -->
                <ellipse cx="75" cy="82" rx="10" ry="7" fill="#5a5a6a"/>
                <ellipse cx="95" cy="82" rx="10" ry="7" fill="#5a5a6a"/>
                
                <!-- Head -->
                <ellipse cx="90" cy="45" rx="28" ry="24" fill="#6a6a7a"/>
                <ellipse cx="90" cy="43" rx="24" ry="20" fill="#7a7a8a"/>
                
                <!-- Ears -->
                <polygon points="68,26 76,45 60,45" fill="#6a6a7a"/>
                <polygon points="68,26 76,45 60,45" fill="#ffb6c1" opacity="0.4"/>
                <polygon points="108,26 116,45 100,45" fill="#6a6a7a"/>
                <polygon points="108,26 116,45 100,45" fill="#ffb6c1" opacity="0.4"/>
                
                <!-- Eyes -->
                <ellipse class="eye-left" cx="80" cy="40" rx="8" ry="9" fill="white"/>
                <ellipse class="eye-right" cx="104" cy="40" rx="8" ry="9" fill="white"/>
                
                <!-- Pupils -->
                <ellipse class="pupil-left" cx="82" cy="42" rx="4" ry="6" fill="#2a2a3a"/>
                <ellipse class="pupil-right" cx="106" cy="42" rx="4" ry="6" fill="#2a2a3a"/>
                
                <!-- Eye shine -->
                <circle class="eye-shine-left" cx="84" cy="38" r="2" fill="white"/>
                <circle class="eye-shine-right" cx="108" cy="38" r="2" fill="white"/>
                
                <!-- Eyelids (for blinking) -->
                <ellipse class="eyelid-left" cx="80" cy="40" rx="9" ry="0" fill="#6a6a7a"/>
                <ellipse class="eyelid-right" cx="104" cy="40" rx="9" ry="0" fill="#6a6a7a"/>
                
                <!-- Nose -->
                <polygon points="93,52 90,56 96,56" fill="#ffb6c1"/>
                
                <!-- Mouth -->
                <path d="M93,56 Q90,60 87,58" fill="none" stroke="#4a4a5a" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M93,56 Q96,60 99,58" fill="none" stroke="#4a4a5a" stroke-width="1.5" stroke-linecap="round"/>
                
                <!-- Whiskers -->
                <line x1="72" y1="50" x2="55" y2="47" stroke="#aaa" stroke-width="1"/>
                <line x1="72" y1="54" x2="55" y2="55" stroke="#aaa" stroke-width="1"/>
                <line x1="72" y1="58" x2="57" y2="62" stroke="#aaa" stroke-width="1"/>
                <line x1="110" y1="50" x2="127" y2="47" stroke="#aaa" stroke-width="1"/>
                <line x1="110" y1="54" x2="127" y2="55" stroke="#aaa" stroke-width="1"/>
                <line x1="110" y1="58" x2="125" y2="62" stroke="#aaa" stroke-width="1"/>
                
                <!-- Collar with bell -->
                <rect x="72" y="62" width="22" height="5" rx="2" fill="#ff6b6b"/>
                <circle cx="83" cy="69" r="5" fill="#ffd700"/>
            </svg>
        `;
        
        // Fixed position in bottom-right corner, don't block cursor
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            cursor: default;
            filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3));
            transition: transform 0.1s ease-out;
            pointer-events: none;
            animation: catBounce 2s ease-in-out infinite;
        `;
        
        document.body.appendChild(this.container);
        
        // Store element references
        this.tail = this.container.querySelector('.cat-tail');
        this.eyeLeft = this.container.querySelector('.eye-left');
        this.eyeRight = this.container.querySelector('.eye-right');
        this.pupilLeft = this.container.querySelector('.pupil-left');
        this.pupilRight = this.container.querySelector('.pupil-right');
        this.eyelidLeft = this.container.querySelector('.eyelid-left');
        this.eyelidRight = this.container.querySelector('.eyelid-right');
        
        // Setup cursor tracking for eye movement only
        this.setupEyeTracking();
        
        // Start animations
        this.animate();
    }
    
    setupEyeTracking() {
        document.addEventListener('mousemove', (e) => {
            // Track cursor position for eye movement only
            this.cursorX = e.clientX;
            this.cursorY = e.clientY;
        });
    }
    
    animate() {
        // Tail wagging animation
        this.tailWag += 0.1;
        
        // Blinking
        this.blinkTimer++;
        if (this.blinkTimer > 300 + Math.random() * 200) {
            this.isBlinking = true;
            if (this.blinkTimer > 315) {
                this.isBlinking = false;
                this.blinkTimer = 0;
            }
        }
        
        // Update visuals
        this.updateVisuals();
        
        requestAnimationFrame(() => this.animate());
    }
    
    updateVisuals() {
        // Tail animation
        if (this.tail) {
            const tailWagAngle = Math.sin(this.tailWag) * 15;
            this.tail.style.transform = `rotate(${tailWagAngle}deg)`;
            this.tail.style.transformOrigin = '20px 75px';
        }
        
        // Blinking
        if (this.isBlinking) {
            this.eyelidLeft.setAttribute('ry', '9');
            this.eyelidRight.setAttribute('ry', '9');
        } else {
            this.eyelidLeft.setAttribute('ry', '0');
            this.eyelidRight.setAttribute('ry', '0');
        }
        
        // Pupils follow cursor (only if cursor position is tracked)
        if (this.cursorX !== undefined && this.cursorY !== undefined) {
            // Get cat position
            const catRect = this.container.getBoundingClientRect();
            const catCenterX = catRect.left + catRect.width / 2;
            const catCenterY = catRect.top + catRect.height / 2;
            
            // Calculate direction to cursor
            const dx = this.cursorX - catCenterX;
            const dy = this.cursorY - catCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Limit pupil movement
            const maxMove = 3;
            const moveX = (dx / distance) * maxMove || 0;
            const moveY = (dy / distance) * maxMove || 0;
            
            if (this.pupilLeft) {
                this.pupilLeft.setAttribute('cx', 82 + moveX);
                this.pupilLeft.setAttribute('cy', 42 + moveY);
            }
            if (this.pupilRight) {
                this.pupilRight.setAttribute('cx', 106 + moveX);
                this.pupilRight.setAttribute('cy', 42 + moveY);
            }
        }
    }
}

// Add CSS for bounce animation
const style = document.createElement('style');
style.textContent = `
    @keyframes catBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
    }
    
    #cat-widget:hover {
        animation-play-state: paused;
    }
`;
document.head.appendChild(style);

// Initialize cat widget
document.addEventListener('DOMContentLoaded', () => {
    window.catWidget = new CatWidget();
});

// Also initialize after a delay in case DOM already loaded
setTimeout(() => {
    if (!window.catWidget) {
        window.catWidget = new CatWidget();
    }
}, 500);

// Export for use
window.CatWidget = CatWidget;
