/**
 * ElectroMachines Lab - Main Application
 * Interactive Electrical Machines Simulator
 */

// ================================================
// Navigation & Page Management
// ================================================

class App {
    constructor() {
        this.currentPage = 'home';
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        this.setupNavigation();
        this.setupFeatureCards();
        this.setupCTAButtons();
        this.setupTheoryTabs();
        this.initHeroCanvas();
        
        // Initialize simulators after a short delay to ensure DOM is ready
        setTimeout(() => this.initAllSimulators(), 100);
        
        this.isInitialized = true;
        console.log('ElectroMachines Lab initialized');
    }
    
    initAllSimulators() {
        // Wait a bit to ensure all class definitions are loaded
        setTimeout(() => {
            try {
                // Initialize all simulators if classes exist
                if (typeof SynchronousSimulator === 'function') {
                    window.syncSimulator = new SynchronousSimulator();
                    console.log('SynchronousSimulator created');
                }
                if (typeof InductionSimulator === 'function') {
                    window.inductionSimulator = new InductionSimulator();
                    console.log('InductionSimulator created');
                }
                if (typeof DCMotorSimulator === 'function') {
                    window.dcMotorSimulator = new DCMotorSimulator();
                    console.log('DCMotorSimulator created');
                }
                if (typeof TransformerSimulator === 'function') {
                    window.transformerSimulator = new TransformerSimulator();
                    console.log('TransformerSimulator created');
                }
                if (typeof ConstructionViewer === 'function') {
                    window.constructionViewer = new ConstructionViewer();
                    console.log('ConstructionViewer created');
                }
                
                // Start the simulation for the current page
                this.onPageChange(this.currentPage);
                
                console.log('Simulators initialized');
            } catch (e) {
                console.error('Error initializing simulators:', e);
            }
        }, 500);
    }
    
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.navigateTo(page);
            });
        });
    }
    
    navigateTo(page) {
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
        
        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;
            
            // Trigger page-specific initialization
            this.onPageChange(page);
        }
    }
    
    onPageChange(page) {
        // Stop previous simulator animations
        if (this.currentPage !== 'home') {
            if (this.currentPage === 'synchronous' && window.syncSimulator) {
                window.syncSimulator.stop();
            } else if (this.currentPage === 'induction' && window.inductionSimulator) {
                window.inductionSimulator.stop();
            } else if (this.currentPage === 'dc-motor' && window.dcMotorSimulator) {
                window.dcMotorSimulator.stop();
            } else if (this.currentPage === 'transformer' && window.transformerSimulator) {
                window.transformerSimulator.stop();
            } else if (this.currentPage === 'construction' && window.constructionViewer) {
                // Don't stop construction viewer
            }
        }
        
        // Small delay to ensure page is visible before resizing canvases
        setTimeout(() => {
            switch(page) {
                case 'synchronous':
                    if (window.syncSimulator) {
                        window.syncSimulator.resize();
                        window.syncSimulator.start();
                    }
                    break;
                case 'induction':
                    if (window.inductionSimulator) {
                        window.inductionSimulator.resize();
                        window.inductionSimulator.start();
                    }
                    break;
                case 'dc-motor':
                    if (window.dcMotorSimulator) {
                        window.dcMotorSimulator.calculate();
                        window.dcMotorSimulator.start();
                    }
                    break;
                case 'transformer':
                    if (window.transformerSimulator) {
                        window.transformerSimulator.calculate();
                        window.transformerSimulator.start();
                    }
                    break;
                case 'construction':
                    if (window.constructionViewer) {
                        window.constructionViewer.resize();
                        window.constructionViewer.start();
                    }
                    break;
            }
        }, 50);
    }
    
    setupFeatureCards() {
        const cards = document.querySelectorAll('.feature-card');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const page = card.dataset.page;
                this.navigateTo(page);
            });
        });
    }
    
    setupCTAButtons() {
        const buttons = document.querySelectorAll('.cta-btn[data-goto]');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.goto;
                this.navigateTo(page);
            });
        });
    }
    
    setupTheoryTabs() {
        // Synchronous machine theory tabs
        const syncTabs = document.querySelectorAll('#synchronous-page .theory-tab');
        syncTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const content = tab.dataset.theory;
                this.switchTheoryTab('sync-theory', content);
            });
        });
        
        // Induction machine theory tabs
        const indTabs = document.querySelectorAll('#induction-page .theory-tab');
        indTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const content = tab.dataset.theory;
                this.switchTheoryTab('ind-theory', content);
            });
        });
    }
    
    switchTheoryTab(panelId, content) {
        const panel = document.getElementById(panelId);
        
        // Update tabs
        panel.parentElement.querySelectorAll('.theory-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.theory === content);
        });
        
        // Update content
        panel.querySelectorAll('.theory-panel-content').forEach(contentEl => {
            contentEl.classList.toggle('active', contentEl.dataset.content === content);
        });
    }
    
    initHeroCanvas() {
        const canvas = document.getElementById('hero-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        const resize = () => {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };
        resize();
        window.addEventListener('resize', resize);
        
        // Animation particles
        const particles = [];
        const numParticles = 50;
        
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: Math.random() * 3 + 1,
                alpha: Math.random() * 0.5 + 0.2,
                color: Math.random() > 0.5 ? '#00d4ff' : '#8b5cf6'
            });
        }
        
        // Draw rotating field visualization
        let angle = 0;
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw background grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            const gridSize = 40;
            
            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            
            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
            
            // Draw rotating magnetic field representation
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const maxRadius = Math.min(canvas.width, canvas.height) * 0.35;
            
            // Draw rotating vectors
            const numVectors = 6;
            for (let i = 0; i < numVectors; i++) {
                const vectorAngle = angle + (i * Math.PI / 3);
                const innerRadius = maxRadius * 0.3;
                const outerRadius = maxRadius;
                
                const x1 = centerX + Math.cos(vectorAngle) * innerRadius;
                const y1 = centerY + Math.sin(vectorAngle) * innerRadius;
                const x2 = centerX + Math.cos(vectorAngle) * outerRadius;
                const y2 = centerY + Math.sin(vectorAngle) * outerRadius;
                
                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, 'rgba(0, 212, 255, 0.2)');
                gradient.addColorStop(1, 'rgba(0, 212, 255, 0.8)');
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                
                // Arrow head
                const arrowSize = 10;
                const arrowAngle = Math.atan2(y2 - y1, x2 - x1);
                ctx.beginPath();
                ctx.moveTo(x2, y2);
                ctx.lineTo(
                    x2 - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
                    y2 - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
                );
                ctx.lineTo(
                    x2 - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
                    y2 - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fillStyle = 'rgba(0, 212, 255, 0.8)';
                ctx.fill();
            }
            
            // Draw center circle (stator representation)
            ctx.beginPath();
            ctx.arc(centerX, centerY, maxRadius * 0.25, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw particles
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                
                // Bounce off walls
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.fill();
                ctx.globalAlpha = 1;
            });
            
            angle += 0.02;
            requestAnimationFrame(animate);
        };
        
        animate();
    }
}

// ================================================
// Utility Functions
// ================================================

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function map(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function radToDeg(radians) {
    return radians * 180 / Math.PI;
}

// Format number with fixed decimal places
function formatNumber(num, decimals = 2) {
    return num.toFixed(decimals);
}

// ================================================
// Initialize Application
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
