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
                if (typeof PMSMSimulator === 'function') {
                    window.pmsmSimulator = new PMSMSimulator();
                    console.log('PMSMSimulator created');
                }
                if (typeof WindTurbineSimulator === 'function') {
                    window.windTurbineSimulator = new WindTurbineSimulator();
                    console.log('WindTurbineSimulator created');
                }
                if (typeof SolarPanelSimulator === 'function') {
                    window.solarPanelSimulator = new SolarPanelSimulator();
                    console.log('SolarPanelSimulator created');
                }
                if (typeof V2GSimulator === 'function') {
                    window.v2gSimulator = new V2GSimulator();
                    console.log('V2GSimulator created');
                }
                if (typeof EVTOLSimulator === 'function') {
                    window.evtolSimulator = new EVTOLSimulator();
                    console.log('EVTOLSimulator created');
                }
                if (typeof PowerElectronicsSimulator === 'function') {
                    window.powerElecSimulator = new PowerElectronicsSimulator();
                    console.log('PowerElectronicsSimulator created');
                }
                if (typeof ConstructionViewer === 'function') {
                    window.constructionViewer = new ConstructionViewer();
                    console.log('ConstructionViewer created');
                }
                if (typeof WidebandgapSimulator === 'function') {
                    window.widebandgapSimulator = new WidebandgapSimulator();
                    console.log('WidebandgapSimulator created');
                }
                if (typeof CommunicationSimulator === 'function') {
                    window.communicationSimulator = new CommunicationSimulator();
                    console.log('CommunicationSimulator created');
                }
                if (typeof LEDLightingSimulator === 'function') {
                    window.ledLightingSimulator = new LEDLightingSimulator();
                    console.log('LEDLightingSimulator created');
                }
                if (typeof CircuitBreakerSimulator === 'function') {
                    window.circuitBreakerSimulator = new CircuitBreakerSimulator();
                    console.log('CircuitBreakerSimulator created');
                }
                if (typeof BLDCFanSimulator === 'function') {
                    window.bldcFanSimulator = new BLDCFanSimulator();
                    console.log('BLDCFanSimulator created');
                }
                if (typeof CompressorSimulator === 'function') {
                    window.compressorSimulator = new CompressorSimulator();
                    console.log('CompressorSimulator created');
                }
                if (typeof LiftSimulator === 'function') {
                    window.liftSimulator = new LiftSimulator();
                    console.log('LiftSimulator created');
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
            btn.addEventListener('click', (e) => {
                // Skip navigation for dropdown toggles and buttons without data-page
                if (!btn.dataset.page || btn.classList.contains('dropdown-toggle')) {
                    return;
                }
                const page = btn.dataset.page;
                this.navigateTo(page);
            });
        });
    }
    
    navigateTo(page) {
        // Skip if no page specified
        if (!page) return;
        
        console.log('Navigating to:', page);
        
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
        
        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        
        const targetPage = document.getElementById(`${page}-page`);
        console.log('Target page element:', targetPage);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;
            
            // Trigger page-specific initialization
            this.onPageChange(page);
        } else {
            console.warn(`Page '${page}' not found. Expected element with id '${page}-page'`);
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
            } else if (this.currentPage === 'pmsm' && window.pmsmSimulator) {
                window.pmsmSimulator.stop();
            } else if (this.currentPage === 'windturbine' && window.windTurbineSimulator) {
                window.windTurbineSimulator.stop();
            } else if (this.currentPage === 'solarpanel' && window.solarPanelSimulator) {
                window.solarPanelSimulator.stop();
            } else if (this.currentPage === 'v2g' && window.v2gSimulator) {
                window.v2gSimulator.stop();
            } else if (this.currentPage === 'evtol' && window.evtolSimulator) {
                window.evtolSimulator.stop();
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
                        if (window.authSystem) window.authSystem.markComplete('synchronous');
                    }
                    break;
                case 'induction':
                    if (window.inductionSimulator) {
                        window.inductionSimulator.resize();
                        window.inductionSimulator.start();
                        if (window.authSystem) window.authSystem.markComplete('induction');
                    }
                    break;
                case 'dc-motor':
                    if (window.dcMotorSimulator) {
                        window.dcMotorSimulator.calculate();
                        window.dcMotorSimulator.start();
                        if (window.authSystem) window.authSystem.markComplete('dcMotor');
                    }
                    break;
                case 'transformer':
                    if (window.transformerSimulator) {
                        window.transformerSimulator.calculate();
                        window.transformerSimulator.start();
                        if (window.authSystem) window.authSystem.markComplete('transformer');
                    }
                    break;
                case 'pmsm':
                    if (window.pmsmSimulator) {
                        window.pmsmSimulator.calculate();
                        window.pmsmSimulator.start();
                        if (window.authSystem) window.authSystem.markComplete('pmsm');
                    }
                    break;
                case 'windturbine':
                    if (window.windTurbineSimulator) {
                        window.windTurbineSimulator.calculate();
                        window.windTurbineSimulator.start();
                        if (window.authSystem) window.authSystem.markComplete('windTurbine');
                    }
                    break;
                case 'solarpanel':
                    if (window.solarPanelSimulator) {
                        window.solarPanelSimulator.calculate();
                        window.solarPanelSimulator.start();
                        if (window.authSystem) window.authSystem.markComplete('solarPanel');
                    }
                    break;
                case 'v2g':
                    if (window.v2gSimulator) {
                        window.v2gSimulator.calculate();
                        window.v2gSimulator.start();
                        if (window.authSystem) window.authSystem.markComplete('v2g');
                    }
                    break;
                case 'evtol':
                    if (window.evtolSimulator) {
                        window.evtolSimulator.calculate();
                        window.evtolSimulator.start();
                        if (window.authSystem) window.authSystem.markComplete('evtol');
                    }
                    break;
                case 'powerelec':
                    if (window.powerElecSimulator) {
                        window.powerElecSimulator.resize();
                        window.powerElecSimulator.start();
                        if (window.authSystem) window.authSystem.markComplete('powerElec');
                    }
                    break;
                case 'construction':
                    if (window.constructionViewer) {
                        window.constructionViewer.resize();
                        window.constructionViewer.start();
                        if (window.authSystem) window.authSystem.markComplete('construction');
                    }
                    break;
                case 'learn':
                    if (window.authSystem) window.authSystem.markComplete('learn');
                    break;
                case 'ledlighting':
                    if (window.ledLightingSimulator) {
                        window.ledLightingSimulator.ensureInitialized();
                        window.ledLightingSimulator.resize();
                        window.ledLightingSimulator.start();
                        if (window.authSystem) window.authSystem.markComplete('ledlighting');
                    }
                    break;
                case 'circuitbreaker':
                    if (window.circuitBreakerSimulator) {
                        window.circuitBreakerSimulator.calculate();
                        window.circuitBreakerSimulator.start();
                        if (window.authSystem) window.authSystem.markComplete('circuitbreaker');
                    }
                    break;
                case 'bldcfan':
                    if (window.bldcFanSimulator) {
                        window.bldcFanSimulator.calculate();
                        window.bldcFanSimulator.start();
                        if (window.authSystem) window.authSystem.markComplete('bldcfan');
                    }
                    break;
                case 'compressor':
                    if (window.compressorSimulator) {
                        window.compressorSimulator.calculate();
                        window.compressorSimulator.start();
                        if (window.authSystem) window.authSystem.markComplete('compressor');
                    }
                    break;
                case 'lift':
                    if (window.liftSimulator) {
                        window.liftSimulator.calculate();
                        window.liftSimulator.start();
                        if (window.authSystem) window.authSystem.markComplete('lift');
                    }
                    break;
            }
            // Update dashboard after marking complete
            if (window.authSystem) {
                window.authSystem.updateDashboard();
            }
        }, 50);
    }
    
    setupFeatureCards() {
        const cards = document.querySelectorAll('.feature-card');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const page = card.dataset.page;
                if (page) this.navigateTo(page);
            });
        });
    }
    
    setupCTAButtons() {
        const buttons = document.querySelectorAll('.cta-btn[data-goto]');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.goto;
                if (page) this.navigateTo(page);
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
        
        // Animation variables
        let time = 0;
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const w = canvas.width;
            const h = canvas.height;
            const centerY = h / 2;
            
            // ============== LEFT SIDE: Permanent Magnet ==============
            const leftCenterX = w * 0.3;
            const magnetWidth = 70;
            const magnetHeight = 45;
            const gap = 50;
            
            // Draw magnetic field lines (curved between N and S)
            for (let i = -4; i <= 4; i++) {
                const offset = i * 10;
                const alpha = 1 - Math.abs(i) / 5;
                
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0, 212, 255, ${alpha * 0.4})`;
                ctx.lineWidth = 1.5;
                
                const startX = leftCenterX - magnetWidth/2 - gap/2;
                const endX = leftCenterX + magnetWidth/2 + gap/2;
                const curveHeight = 50 + Math.sin(time * 2) * 8;
                
                ctx.moveTo(startX + magnetWidth, centerY + offset);
                ctx.bezierCurveTo(
                    startX + magnetWidth + gap * 0.5, centerY + offset - curveHeight,
                    endX - magnetWidth - gap * 0.5, centerY + offset + curveHeight,
                    endX - magnetWidth, centerY + offset
                );
                ctx.stroke();
            }
            
            // N pole (North - Red)
            const northX = leftCenterX - magnetWidth/2 - gap/2;
            const northGrad = ctx.createLinearGradient(
                northX - magnetWidth/2, centerY - magnetHeight/2,
                northX + magnetWidth/2, centerY + magnetHeight/2
            );
            northGrad.addColorStop(0, '#ff4444');
            northGrad.addColorStop(0.5, '#ff6666');
            northGrad.addColorStop(1, '#cc2222');
            
            ctx.fillStyle = northGrad;
            ctx.beginPath();
            ctx.roundRect(northX - magnetWidth/2, centerY - magnetHeight/2, magnetWidth, magnetHeight, 6);
            ctx.fill();
            
            ctx.strokeStyle = '#ff8888';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('N', northX, centerY);
            
            // S pole (South - Blue)
            const southX = leftCenterX + magnetWidth/2 + gap/2;
            const southGrad = ctx.createLinearGradient(
                southX - magnetWidth/2, centerY - magnetHeight/2,
                southX + magnetWidth/2, centerY + magnetHeight/2
            );
            southGrad.addColorStop(0, '#2222cc');
            southGrad.addColorStop(0.5, '#4444ff');
            southGrad.addColorStop(1, '#2222aa');
            
            ctx.fillStyle = southGrad;
            ctx.beginPath();
            ctx.roundRect(southX - magnetWidth/2, centerY - magnetHeight/2, magnetWidth, magnetHeight, 6);
            ctx.fill();
            
            ctx.strokeStyle = '#6666ff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.fillText('S', southX, centerY);
            
            // Label for left side
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = 'bold 14px Outfit, sans-serif';
            ctx.fillText('Permanent Magnet', leftCenterX, centerY + magnetHeight + 25);
            
            // ============== RIGHT SIDE: Rotating Field ==============
            const rightCenterX = w * 0.7;
            const maxRadius = Math.min(w * 0.2, h * 0.35);
            
            // Draw rotating vectors
            const numVectors = 6;
            for (let i = 0; i < numVectors; i++) {
                const vectorAngle = time * 1.5 + (i * Math.PI / 3);
                const innerRadius = maxRadius * 0.3;
                const outerRadius = maxRadius;
                
                const x1 = rightCenterX + Math.cos(vectorAngle) * innerRadius;
                const y1 = centerY + Math.sin(vectorAngle) * innerRadius;
                const x2 = rightCenterX + Math.cos(vectorAngle) * outerRadius;
                const y2 = centerY + Math.sin(vectorAngle) * outerRadius;
                
                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
                gradient.addColorStop(1, 'rgba(139, 92, 246, 0.9)');
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                
                // Arrow head
                const arrowSize = 8;
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
                ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
                ctx.fill();
            }
            
            // Draw center circle (stator representation)
            ctx.beginPath();
            ctx.arc(rightCenterX, centerY, maxRadius * 0.25, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw spinning rotor in center
            const rotorRadius = maxRadius * 0.2;
            const rotorAngle = time * 2;
            
            ctx.save();
            ctx.translate(rightCenterX, centerY);
            ctx.rotate(rotorAngle);
            
            const rotorGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rotorRadius);
            rotorGrad.addColorStop(0, '#444466');
            rotorGrad.addColorStop(1, '#222244');
            ctx.fillStyle = rotorGrad;
            ctx.beginPath();
            ctx.arc(0, 0, rotorRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // Rotor magnetic poles
            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.arc(rotorRadius * 0.7, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ff6666';
            ctx.beginPath();
            ctx.arc(-rotorRadius * 0.7, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
            
            // Label for right side
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = 'bold 14px Outfit, sans-serif';
            ctx.fillText('Rotating Magnetic Field', rightCenterX, centerY + maxRadius + 30);
            
            // Main title
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.font = 'bold 20px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Electrical Machines Simulator', w / 2, 35);
            
            // Subtitle
            ctx.fillStyle = 'rgba(0, 212, 255, 0.8)';
            ctx.font = '13px Outfit, sans-serif';
            ctx.fillText('Click any simulator from menu above to start learning →', w / 2, h - 20);
            
            time += 0.02;
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
// Sidebar Navigation Functions
// ================================================

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
    if (overlay) {
        overlay.classList.toggle('active');
    }
}

function toggleSidebarSection(button) {
    const content = button.nextElementSibling;
    button.classList.toggle('active');
    
    if (content && content.classList.contains('sidebar-section-content')) {
        content.classList.toggle('active');
    }
}

// Setup sidebar link navigation
document.addEventListener('DOMContentLoaded', () => {
    // Add click handlers for sidebar links
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page && window.app) {
                window.app.navigateTo(page);
                // Close sidebar after navigation
                toggleSidebar();
            }
        });
    });
    
    // Close sidebar when clicking overlay
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }
    
    // Add click handlers for dropdown toggles
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = this.parentElement;
            const menu = dropdown.querySelector('.dropdown-menu');
            
            // Close other dropdowns
            document.querySelectorAll('.dropdown-menu').forEach(m => {
                if (m !== menu) m.style.display = '';
            });
            
            // Toggle this dropdown
            if (menu.style.display === 'block') {
                menu.style.display = '';
            } else {
                menu.style.display = 'block';
            }
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        document.querySelectorAll('.dropdown-menu').forEach(m => {
            m.style.display = '';
        });
    });
    
    // Add click handlers for dropdown items
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent document click from closing dropdown
            const page = this.getAttribute('data-page');
            console.log('Dropdown item clicked:', page);
            if (page && window.app) {
                window.app.navigateTo(page);
                // Close any open dropdowns
                document.querySelectorAll('.dropdown-menu').forEach(m => m.style.display = '');
            }
        });
    });
});

// ================================================
// Initialize Application
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
