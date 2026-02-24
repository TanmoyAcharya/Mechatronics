/**
 * Animated Cat Cursor Follower
 * A fun character that follows the cursor around the homepage
 */

class CatFollower {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.velX = 0;
        this.velY = 0;
        this.rotation = 0;
        this.isWalking = false;
        this.walkCycle = 0;
        this.isLookingAtCursor = true;
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.tailWag = 0;
        
        this.createCat();
        this.setupMouseTracking();
        this.animate();
    }
    
    createCat() {
        // Create the cat container
        this.container = document.createElement('div');
        this.container.id = 'cat-follower';
        this.container.innerHTML = `
            <svg class="cat-body" viewBox="0 0 120 100" width="80" height="67">
                <!-- Tail -->
                <path class="cat-tail" d="M20,75 Q5,65 10,45 Q15,30 25,40" 
                      fill="none" stroke="#4a4a5a" stroke-width="6" stroke-linecap="round"/>
                
                <!-- Back legs -->
                <ellipse cx="30" cy="85" rx="12" ry="8" fill="#5a5a6a"/>
                <ellipse cx="50" cy="85" rx="12" ry="8" fill="#5a5a6a"/>
                
                <!-- Body -->
                <ellipse cx="60" cy="70" rx="35" ry="22" fill="#6a6a7a"/>
                <ellipse cx="60" cy="68" rx="30" ry="18" fill="#7a7a8a"/>
                
                <!-- Front legs -->
                <ellipse cx="75" cy="85" rx="10" ry="7" fill="#5a5a6a"/>
                <ellipse cx="95" cy="85" rx="10" ry="7" fill="#5a5a6a"/>
                
                <!-- Paws -->
                <ellipse cx="30" cy="90" rx="8" ry="5" fill="#4a4a5a"/>
                <ellipse cx="50" cy="90" rx="8" ry="5" fill="#4a4a5a"/>
                <ellipse cx="75" cy="90" rx="7" ry="4" fill="#4a4a5a"/>
                <ellipse cx="95" cy="90" rx="7" ry="4" fill="#4a4a5a"/>
                
                <!-- Head -->
                <ellipse cx="90" cy="45" rx="25" ry="22" fill="#6a6a7a"/>
                <ellipse cx="90" cy="43" rx="22" ry="18" fill="#7a7a8a"/>
                
                <!-- Ears -->
                <polygon points="70,28 78,45 62,45" fill="#6a6a7a"/>
                <polygon points="70,28 78,45 62,45" fill="#ffb6c1" opacity="0.5"/>
                <polygon points="105,28 113,45 97,45" fill="#6a6a7a"/>
                <polygon points="105,28 113,45 97,45" fill="#ffb6c1" opacity="0.5"/>
                
                <!-- Eyes -->
                <ellipse class="eye-left" cx="82" cy="40" rx="6" ry="7" fill="white"/>
                <ellipse class="eye-right" cx="102" cy="40" rx="6" ry="7" fill="white"/>
                
                <!-- Pupils -->
                <ellipse class="pupil-left" cx="84" cy="41" rx="3" ry="5" fill="#2a2a3a"/>
                <ellipse class="pupil-right" cx="104" cy="41" rx="3" ry="5" fill="#2a2a3a"/>
                
                <!-- Eye shine -->
                <circle class="eye-shine-left" cx="85" cy="39" r="1.5" fill="white"/>
                <circle class="eye-shine-right" cx="105" cy="39" r="1.5" fill="white"/>
                
                <!-- Eyelids (for blinking) -->
                <ellipse class="eyelid-left" cx="82" cy="40" rx="7" ry="0" fill="#6a6a7a"/>
                <ellipse class="eyelid-right" cx="102" cy="40" rx="7" ry="0" fill="#6a6a7a"/>
                
                <!-- Nose -->
                <polygon points="93,50 90,54 96,54" fill="#ffb6c1"/>
                
                <!-- Mouth -->
                <path d="M93,54 Q90,58 87,56" fill="none" stroke="#4a4a5a" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M93,54 Q96,58 99,56" fill="none" stroke="#4a4a5a" stroke-width="1.5" stroke-linecap="round"/>
                
                <!-- Whiskers -->
                <line x1="75" y1="48" x2="60" y2="45" stroke="#aaa" stroke-width="1"/>
                <line x1="75" y1="52" x2="60" y2="53" stroke="#aaa" stroke-width="1"/>
                <line x1="75" y1="56" x2="62" y2="60" stroke="#aaa" stroke-width="1"/>
                <line x1="108" y1="48" x2="123" y2="45" stroke="#aaa" stroke-width="1"/>
                <line x1="108" y1="52" x2="123" y2="53" stroke="#aaa" stroke-width="1"/>
                <line x1="108" y1="56" x2="121" y2="60" stroke="#aaa" stroke-width="1"/>
                
                <!-- Collar -->
                <rect x="70" y="60" width="25" height="6" rx="2" fill="#ff6b6b"/>
                <circle cx="82" cy="66" r="4" fill="#ffd700"/>
            </svg>
            <div class="cat-speech">Meow! 🐱</div>
        `;
        
        this.container.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 10000;
            transition: transform 0.1s ease-out;
            filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3));
            cursor: none;
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
        this.speech = this.container.querySelector('.cat-speech');
    }
    
    setupMouseTracking() {
        document.addEventListener('mousemove', (e) => {
            this.targetX = e.clientX;
            this.targetY = e.clientY;
            this.isWalking = true;
        });
        
        document.addEventListener('mouseenter', () => {
            this.container.style.opacity = '1';
            this.showSpeech("Hi there! 👋");
        });
        
        document.addEventListener('mouseleave', () => {
            this.container.style.opacity = '0';
        });
    }
    
    showSpeech(text) {
        this.speech.textContent = text;
        this.speech.style.opacity = '1';
        setTimeout(() => {
            this.speech.style.opacity = '0';
        }, 2000);
    }
    
    animate() {
        // Smooth follow with physics
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        
        this.velX += dx * 0.05;
        this.velY += dy * 0.05;
        this.velX *= 0.85;
        this.velY *= 0.85;
        
        this.x += this.velX;
        this.y += this.velY;
        
        // Calculate rotation based on movement
        const speed = Math.sqrt(this.velX * this.velX + this.velY * this.velY);
        const targetRotation = Math.atan2(this.velY, this.velX) * 180 / Math.PI;
        
        if (speed > 1) {
            this.rotation = this.rotation * 0.8 + targetRotation * 0.2;
        }
        
        // Walk animation
        this.walkCycle += speed * 0.3;
        
        // Tail wag
        this.tailWag += 0.15;
        
        // Blinking
        this.blinkTimer++;
        if (this.blinkTimer > 200 + Math.random() * 100) {
            this.isBlinking = true;
            if (this.blinkTimer > 210) {
                this.isBlinking = false;
                this.blinkTimer = 0;
            }
        }
        
        // Update visuals
        this.updateVisuals();
        
        requestAnimationFrame(() => this.animate());
    }
    
    updateVisuals() {
        // Position the cat (offset so cursor is near its front)
        const offsetX = -30;
        const offsetY = -20;
        
        this.container.style.transform = 
            `translate(${this.x + offsetX}px, ${this.y + offsetY}px) 
             rotate(${this.rotation * 0.1}deg)`;
        
        // Tail animation
        const tailWagAngle = Math.sin(this.tailWag) * 20;
        if (this.tail) {
            this.tail.style.transform = `rotate(${tailWagAngle}deg)`;
            this.tail.style.transformOrigin = '20px 75px';
        }
        
        // Blinking
        if (this.isBlinking) {
            this.eyelidLeft.setAttribute('ry', '7');
            this.eyelidRight.setAttribute('ry', '7');
        } else {
            this.eyelidLeft.setAttribute('ry', '0');
            this.eyelidRight.setAttribute('ry', '0');
        }
        
        // Pupils follow cursor direction
        const lookX = (this.targetX - this.x) * 0.02;
        const lookY = (this.targetY - this.y) * 0.02;
        const clampedX = Math.max(-2, Math.min(2, lookX));
        const clampedY = Math.max(-2, Math.min(2, lookY));
        
        if (this.pupilLeft) {
            this.pupilLeft.setAttribute('cx', 84 + clampedX);
            this.pupilLeft.setAttribute('cy', 41 + clampedY);
        }
        if (this.pupilRight) {
            this.pupilRight.setAttribute('cx', 104 + clampedX);
            this.pupilRight.setAttribute('cy', 41 + clampedY);
        }
    }
}

// Add CSS for speech bubble
const style = document.createElement('style');
style.textContent = `
    #cat-follower .cat-speech {
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        color: #333;
        padding: 5px 12px;
        border-radius: 15px;
        font-size: 12px;
        font-weight: bold;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.3s;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    
    #cat-follower .cat-speech::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: white;
    }
    
    #cat-follower .eye-shine-left,
    #cat-follower .eye-shine-right {
        animation: eyeShine 2s infinite;
    }
    
    @keyframes eyeShine {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    /* Hide default cursor on homepage when cat is active */
    body.home-page {
        cursor: none !important;
    }
    
    body.home-page * {
        cursor: none !important;
    }
    
    body.home-page button,
    body.home-page a,
    body.home-page input {
        cursor: none !important;
    }
`;
document.head.appendChild(style);

// Initialize cat when DOM is ready
let catFollower;
document.addEventListener('DOMContentLoaded', () => {
    // Only show on homepage
    const homePage = document.querySelector('[data-page="home"], #home-page');
    if (homePage) {
        document.body.classList.add('home-page');
        catFollower = new CatFollower();
    }
});

// Also try to initialize after a short delay
setTimeout(() => {
    if (!catFollower) {
        const homePage = document.querySelector('.page.active') || document.querySelector('#home-page');
        if (homePage && homePage.id === 'home-page') {
            document.body.classList.add('home-page');
            catFollower = new CatFollower();
        }
    }
}, 1000);

// Export for use
window.CatFollower = CatFollower;
