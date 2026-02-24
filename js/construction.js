/**
 * Construction Viewer
 * Interactive exploration of electrical machine components
 */

class ConstructionViewer {
    constructor() {
        this.currentComponent = 'stator';
        this.assemblyProgress = 0.7; // Start with assembled machine
        this.autoRotate = false;
        this.rotation = 0;
        
        this.components = {
            stator: {
                name: 'Stator Core',
                description: 'The stationary part of the machine consisting of laminated silicon steel sheets. Provides a path for the rotating magnetic field. Typically made of 0.35-0.5mm thick laminations to reduce eddy current losses.',
                color: '#35353f'
            },
            'stator-winding': {
                name: 'Stator Winding',
                description: 'Three-phase distributed winding usually placed in slots. Double-layer winding for better harmonic distribution. 60° or 120° phase spread to reduce space harmonics.',
                color: '#00d4ff'
            },
            'rotor-synchronous': {
                name: 'Salient Pole Rotor',
                description: 'Used in low-speed synchronous machines (hydro generators). Poles are projecting from the rotor surface with field windings. Requires damper windings for starting.',
                color: '#8b5cf6'
            },
            'rotor-induction': {
                name: 'Squirrel Cage Rotor',
                description: 'Consists of copper or aluminum bars shorted by end rings. Robust, simple construction. No external connections needed. Current induced by transformer action.',
                color: '#f97316'
            },
            shaft: {
                name: 'Shaft',
                description: 'Transmits mechanical power between rotor and external load. Made of high-strength steel. Precision machined for bearing seats. May include keyway or splines.',
                color: '#606070'
            },
            bearings: {
                name: 'Bearings',
                description: 'Support the rotor and allow rotation with minimal friction. Can be sleeve bearings (oil-lubricated) or rolling element bearings (ball/roller). Critical for long life.',
                color: '#10b981'
            },
            housing: {
                name: 'Housing/Frame',
                description: 'Provides mechanical protection and mounting. Cast iron or fabricated steel. Includes cooling fins for surface-cooled machines. Enclosure type depends on application.',
                color: '#2a2a3a'
            },
            cooling: {
                name: 'Cooling System',
                description: 'Removes heat losses (I²R losses, core losses). Methods: air-cooled (self-induced or forced), hydrogen-cooled, or water-cooled. Critical for thermal life.',
                color: '#3b82f6'
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('ConstructionViewer init called');
        
        this.canvas = document.getElementById('construction-canvas');
        console.log('Canvas found:', !!this.canvas);
        
        if (!this.canvas) {
            console.error('Construction canvas not found in DOM');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        console.log('Context created:', !!this.ctx);
        
        if (!this.ctx) {
            console.error('Could not get 2d context');
            return;
        }
        
        this.crossSectionCanvas = document.getElementById('cross-section-sync');
        this.crossSectionCtx = this.crossSectionCanvas ? this.crossSectionCanvas.getContext('2d') : null;
        
        this.inductionCrossCanvas = document.getElementById('cross-section-induction');
        this.inductionCrossCtx = this.inductionCrossCanvas ? this.inductionCrossCanvas.getContext('2d') : null;
        
        this.magneticFieldCanvas = document.getElementById('magnetic-field-viz');
        this.magneticFieldCtx = this.magneticFieldCanvas ? this.magneticFieldCanvas.getContext('2d') : null;
        
        // Set default canvas sizes if not set
        if (this.canvas) {
            if (this.canvas.width < 100) this.canvas.width = 800;
            if (this.canvas.height < 100) this.canvas.height = 500;
            console.log('Canvas size set:', this.canvas.width, 'x', this.canvas.height);
        }
        if (this.crossSectionCanvas) {
            if (this.crossSectionCanvas.width < 100) this.crossSectionCanvas.width = 400;
            if (this.crossSectionCanvas.height < 100) this.crossSectionCanvas.height = 400;
        }
        if (this.inductionCrossCanvas) {
            if (this.inductionCrossCanvas.width < 100) this.inductionCrossCanvas.width = 400;
            if (this.inductionCrossCanvas.height < 100) this.inductionCrossCanvas.height = 400;
        }
        if (this.magneticFieldCanvas) {
            if (this.magneticFieldCanvas.width < 100) this.magneticFieldCanvas.width = 400;
            if (this.magneticFieldCanvas.height < 100) this.magneticFieldCanvas.height = 300;
        }
        
        this.setupControls();
        
        // Wait for page to be visible before starting animations
        this.tryResizeAndDraw();
    }
    
    tryResizeAndDraw() {
        // Check if page is visible
        const page = document.getElementById('construction-page');
        if (!page) {
            console.error('Construction page not found');
            return;
        }
        
        const isVisible = page.style.display !== 'none';
        console.log('Construction page visible:', isVisible);
        
        if (!isVisible) {
            // Retry after a short delay
            setTimeout(() => this.tryResizeAndDraw(), 100);
            return;
        }
        
        // Now page is visible, do resize and draw
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Start animation by default
        this.autoRotate = true;
        this.animateRotation();
        this.drawCrossSections();
        this.drawMagneticField();
        this.draw();
        console.log('Initial draw complete');
    }
    
    resize() {
        const containers = [
            { canvas: this.canvas, container: this.canvas.parentElement },
            { canvas: this.crossSectionCanvas, container: this.crossSectionCanvas.parentElement },
            { canvas: this.inductionCrossCanvas, container: this.inductionCrossCanvas.parentElement },
            { canvas: this.magneticFieldCanvas, container: this.magneticFieldCanvas.parentElement }
        ];
        
        containers.forEach(({ canvas, container }) => {
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight - 10;
            }
        });
        
        this.draw();
        this.drawCrossSections();
        this.drawMagneticField();
    }
    
    setupControls() {
        // Component buttons
        const componentButtons = document.querySelectorAll('.component-btn');
        componentButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                componentButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentComponent = btn.dataset.component;
                this.updateComponentInfo();
                this.draw();
            });
        });
        
        // Animation buttons
        document.getElementById('anim-assembly')?.addEventListener('click', () => {
            this.animateAssembly(100);
        });
        
        document.getElementById('anim-disassemble')?.addEventListener('click', () => {
            this.animateAssembly(0);
        });
        
        document.getElementById('anim-rotate')?.addEventListener('click', () => {
            this.autoRotate = !this.autoRotate;
            if (this.autoRotate) {
                this.animateRotation();
            }
        });
        
        // Assembly progress slider
        const progressSlider = document.getElementById('assembly-progress');
        progressSlider?.addEventListener('input', (e) => {
            this.assemblyProgress = parseFloat(e.target.value) / 100;
            this.draw();
        });
    }
    
    updateComponentInfo() {
        const component = this.components[this.currentComponent];
        document.getElementById('component-name').textContent = component.name;
        document.getElementById('component-desc').textContent = component.description;
    }
    
    start() {
        this.updateComponentInfo();
        // Start animation when page is shown
        this.autoRotate = true;
        this.animateRotation();
        this.drawCrossSections();
        this.drawMagneticField();
        this.draw();
    }
    
    animateAssembly(targetProgress) {
        const startProgress = this.assemblyProgress;
        const duration = 1000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const t = Math.min(1, elapsed / duration);
            const eased = 1 - Math.pow(1 - t, 3); // Ease out cubic
            
            this.assemblyProgress = startProgress + (targetProgress - startProgress) * eased;
            
            document.getElementById('assembly-progress').value = this.assemblyProgress * 100;
            
            this.draw();
            
            if (t < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    animateRotation() {
        if (!this.autoRotate) return;
        
        this.rotation += 0.02;
        this.draw();
        
        requestAnimationFrame(() => this.animateRotation());
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;
        const centerX = w / 2;
        const centerY = h / 2;
        
        ctx.clearRect(0, 0, w, h);
        
        // Apply rotation for 3D effect
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        ctx.translate(-centerX, -centerY);
        
        const scale = Math.min(w, h) * 0.35;
        
        // Draw based on assembly progress
        const housingOffset = (1 - this.assemblyProgress) * 100;
        
        // Housing (frame)
        if (this.assemblyProgress > 0.1) {
            const housingAlpha = Math.min(1, (this.assemblyProgress - 0.1) * 2);
            ctx.globalAlpha = housingAlpha;
            
            ctx.beginPath();
            ctx.roundRect(centerX - scale * 1.3, centerY - scale * 1.3, scale * 2.6, scale * 2.6, 20);
            ctx.fillStyle = this.components.housing.color;
            ctx.fill();
            ctx.strokeStyle = '#3a3a4a';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Cooling fins
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + this.rotation;
                ctx.beginPath();
                ctx.moveTo(
                    centerX + Math.cos(angle) * scale * 1.15,
                    centerY + Math.sin(angle) * scale * 1.15
                );
                ctx.lineTo(
                    centerX + Math.cos(angle) * scale * 1.35,
                    centerY + Math.sin(angle) * scale * 1.35
                );
                ctx.strokeStyle = '#3a3a4a';
                ctx.lineWidth = 4;
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1;
        }
        
        // Stator
        if (this.assemblyProgress > 0.3) {
            const statorAlpha = Math.min(1, (this.assemblyProgress - 0.3) * 2);
            ctx.globalAlpha = statorAlpha;
            
            const statorY = centerY - (1 - this.assemblyProgress) * 50;
            
            // Stator core
            ctx.beginPath();
            ctx.arc(centerX, statorY, scale, 0, Math.PI * 2);
            ctx.fillStyle = this.components.stator.color;
            ctx.fill();
            ctx.strokeStyle = '#454555';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Stator teeth/slots
            const numTeeth = 36;
            for (let i = 0; i < numTeeth; i++) {
                const angle = (i / numTeeth) * Math.PI * 2;
                const innerR = scale * 0.7;
                const outerR = scale * 0.95;
                
                ctx.beginPath();
                ctx.moveTo(
                    centerX + Math.cos(angle) * innerR,
                    statorY + Math.sin(angle) * innerR
                );
                ctx.lineTo(
                    centerX + Math.cos(angle) * outerR,
                    statorY + Math.sin(angle) * outerR
                );
                ctx.strokeStyle = '#404050';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            // Highlight if selected
            if (this.currentComponent === 'stator') {
                ctx.beginPath();
                ctx.arc(centerX, statorY, scale + 5, 0, Math.PI * 2);
                ctx.strokeStyle = '#00d4ff';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1;
        }
        
        // Stator winding
        if (this.assemblyProgress > 0.5) {
            const windingAlpha = Math.min(1, (this.assemblyProgress - 0.5) * 3);
            ctx.globalAlpha = windingAlpha;
            
            // Draw winding coils
            const coilColors = ['#ff4444', '#44ff44', '#4444ff'];
            for (let phase = 0; phase < 3; phase++) {
                for (let i = 0; i < 6; i++) {
                    const startAngle = (phase * 2 * Math.PI / 3) + (i * Math.PI / 9) - Math.PI / 18;
                    const endAngle = startAngle + Math.PI / 9;
                    
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, scale * 0.85, startAngle, endAngle);
                    ctx.strokeStyle = coilColors[phase];
                    ctx.lineWidth = 4;
                    ctx.stroke();
                }
            }
            
            // Highlight if selected
            if (this.currentComponent === 'stator-winding') {
                ctx.beginPath();
                ctx.arc(centerX, centerY, scale * 0.9, 0, Math.PI * 2);
                ctx.strokeStyle = '#00d4ff';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1;
        }
        
        // Rotor
        if (this.assemblyProgress > 0.7) {
            const rotorAlpha = Math.min(1, (this.assemblyProgress - 0.7) * 3);
            ctx.globalAlpha = rotorAlpha;
            
            const rotorScale = scale * 0.6;
            
            // Draw different rotor types
            if (this.currentComponent === 'rotor-synchronous' || 
                (this.currentComponent !== 'rotor-induction' && this.assemblyProgress > 0.75)) {
                
                // Salient pole rotor
                ctx.beginPath();
                ctx.arc(centerX, centerY, rotorScale, 0, Math.PI * 2);
                ctx.fillStyle = this.components['rotor-synchronous'].color;
                ctx.fill();
                
                // Poles
                const numPoles = 4;
                for (let i = 0; i < numPoles; i++) {
                    const poleAngle = (i / numPoles) * Math.PI * 2;
                    
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate(poleAngle);
                    
                    // Pole
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(rotorScale * 0.15, -rotorScale * 0.8);
                    ctx.lineTo(rotorScale * 0.15, rotorScale * 0.8);
                    ctx.closePath();
                    ctx.fillStyle = '#6b5cb0';
                    ctx.fill();
                    
                    // Field winding
                    ctx.beginPath();
                    ctx.ellipse(0, 0, rotorScale * 0.3, rotorScale * 0.65, 0, 0, Math.PI * 2);
                    ctx.strokeStyle = '#00d4ff';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([4, 4]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    
                    ctx.restore();
                }
                
                if (this.currentComponent === 'rotor-synchronous') {
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, rotorScale + 5, 0, Math.PI * 2);
                    ctx.strokeStyle = '#00d4ff';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            } else if (this.currentComponent === 'rotor-induction') {
                // Squirrel cage rotor
                ctx.beginPath();
                ctx.arc(centerX, centerY, rotorScale, 0, Math.PI * 2);
                ctx.fillStyle = this.components['rotor-induction'].color;
                ctx.fill();
                
                // Bars
                const numBars = 20;
                for (let i = 0; i < numBars; i++) {
                    const barAngle = (i / numBars) * Math.PI * 2;
                    
                    ctx.beginPath();
                    ctx.rect(
                        Math.cos(barAngle) * rotorScale * 0.2 - rotorScale * 0.08,
                        Math.sin(barAngle) * rotorScale * 0.2 - rotorScale * 0.08,
                        rotorScale * 0.16,
                        rotorScale * 0.75
                    );
                    ctx.fillStyle = '#ffa040';
                    ctx.fill();
                }
                
                // End rings
                ctx.beginPath();
                ctx.arc(centerX, centerY, rotorScale * 0.85, 0, Math.PI * 2);
                ctx.strokeStyle = '#c08030';
                ctx.lineWidth = 5;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, rotorScale * 0.25, 0, Math.PI * 2);
                ctx.strokeStyle = '#c08030';
                ctx.lineWidth = 5;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, rotorScale + 5, 0, Math.PI * 2);
                ctx.strokeStyle = '#00d4ff';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1;
        }
        
        // Shaft
        if (this.assemblyProgress > 0.9) {
            const shaftAlpha = Math.min(1, (this.assemblyProgress - 0.9) * 10);
            ctx.globalAlpha = shaftAlpha;
            
            // Shaft
            ctx.fillStyle = this.components.shaft.color;
            ctx.fillRect(centerX - 8, centerY - scale * 1.5, 16, scale * 3);
            
            // Keyway
            ctx.fillStyle = '#505060';
            ctx.fillRect(centerX - 3, centerY - scale * 0.2, 6, scale * 0.4);
            
            // Highlight if selected
            if (this.currentComponent === 'shaft') {
                ctx.strokeStyle = '#00d4ff';
                ctx.lineWidth = 3;
                ctx.strokeRect(centerX - 10, centerY - scale * 1.55, 20, scale * 3.1);
            }
            
            ctx.globalAlpha = 1;
        }
        
        // Bearings (shown on sides)
        if (this.assemblyProgress > 0.85) {
            const bearingAlpha = Math.min(1, (this.assemblyProgress - 0.85) * 5);
            ctx.globalAlpha = bearingAlpha;
            
            // Front bearing
            ctx.beginPath();
            ctx.arc(centerX, centerY, scale * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = this.components.bearings.color;
            ctx.fill();
            ctx.strokeStyle = '#20c997';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Bearing details
            ctx.beginPath();
            ctx.arc(centerX, centerY, scale * 0.15, 0, Math.PI * 2);
            ctx.strokeStyle = '#606070';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            if (this.currentComponent === 'bearings') {
                ctx.beginPath();
                ctx.arc(centerX, centerY, scale * 0.22, 0, Math.PI * 2);
                ctx.strokeStyle = '#00d4ff';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1;
        }
        
        ctx.restore();
        
        // Labels
        this.drawLabels(ctx, centerX, centerY, scale);
    }
    
    drawLabels(ctx, centerX, centerY, scale) {
        if (this.assemblyProgress < 0.5) return;
        
        ctx.font = '10px JetBrains Mono';
        ctx.fillStyle = '#9898a8';
        ctx.textAlign = 'center';
        
        const labels = [
            { text: 'Housing', y: centerY - scale * 1.25 },
            { text: 'Stator', y: centerY - scale * 0.7 },
            { text: 'Rotor', y: centerY + scale * 0.1 },
            { text: 'Shaft', y: centerY + scale * 1.35 }
        ];
        
        labels.forEach(label => {
            ctx.fillText(label.text, centerX + scale * 1.4, label.y);
        });
    }
    
    drawCrossSections() {
        // Synchronous machine cross-section
        const ctx = this.crossSectionCtx;
        const canvas = this.crossSectionCanvas;
        const w = canvas.width;
        const h = canvas.height;
        const centerX = w / 2;
        const centerY = h / 2;
        const radius = Math.min(w, h) * 0.4;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        ctx.fillStyle = '#0f0f15';
        ctx.fillRect(0, 0, w, h);
        
        // Stator
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#252530';
        ctx.fill();
        ctx.strokeStyle = '#353540';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Stator slots
        for (let i = 0; i < 36; i++) {
            const angle = (i / 36) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius - 8, angle - 0.05, angle + 0.05);
            ctx.strokeStyle = '#1a1a25';
            ctx.lineWidth = 4;
            ctx.stroke();
        }
        
        // Air gap
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a10';
        ctx.fill();
        
        // Rotor with salient poles
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#353545';
        ctx.fill();
        
        // Salient poles
        const numPoles = 4;
        for (let i = 0; i < numPoles; i++) {
            const poleAngle = (i / numPoles) * Math.PI * 2;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(poleAngle);
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(radius * 0.1, -radius * 0.55);
            ctx.lineTo(radius * 0.1, radius * 0.55);
            ctx.closePath();
            ctx.fillStyle = '#404050';
            ctx.fill();
            
            // Pole winding
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * 0.2, radius * 0.45, 0, 0, Math.PI * 2);
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.restore();
        }
        
        // Shaft
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = '#606070';
        ctx.fill();
        
        // Labels
        ctx.font = '11px JetBrains Mono';
        ctx.fillStyle = '#606070';
        ctx.textAlign = 'center';
        ctx.fillText('Stator', centerX, centerY - radius - 15);
        ctx.fillText('Salient Pole Rotor', centerX, centerY + radius + 20);
        
        // Induction machine cross-section
        const ictx = this.inductionCrossCtx;
        const icanvas = this.inductionCrossCanvas;
        const iw = icanvas.width;
        const ih = icanvas.height;
        const icX = iw / 2;
        const icY = ih / 2;
        const iR = Math.min(iw, ih) * 0.4;
        
        ictx.clearRect(0, 0, iw, ih);
        
        // Background
        ictx.fillStyle = '#0f0f15';
        ictx.fillRect(0, 0, iw, ih);
        
        // Stator
        ictx.beginPath();
        ictx.arc(icX, icY, iR, 0, Math.PI * 2);
        ictx.fillStyle = '#252530';
        ictx.fill();
        ictx.strokeStyle = '#353540';
        ictx.lineWidth = 3;
        ictx.stroke();
        
        // Stator winding phases (3 colors)
        const phaseColors = ['#ff4444', '#44ff44', '#4444ff'];
        for (let phase = 0; phase < 3; phase++) {
            for (let i = 0; i < 4; i++) {
                const angle = (phase * 2 * Math.PI / 3) + (i * Math.PI / 12) - Math.PI / 24;
                
                ictx.beginPath();
                ictx.arc(icX, icY, iR - 15, angle, angle + Math.PI / 12);
                ictx.strokeStyle = phaseColors[phase];
                ictx.lineWidth = 5;
                ictx.stroke();
            }
        }
        
        // Air gap
        ictx.beginPath();
        ictx.arc(icX, icY, iR * 0.7, 0, Math.PI * 2);
        ictx.fillStyle = '#0a0a10';
        ictx.fill();
        
        // Squirrel cage rotor
        ictx.beginPath();
        ictx.arc(icX, icY, iR * 0.65, 0, Math.PI * 2);
        ictx.fillStyle = '#353545';
        ictx.fill();
        
        // Rotor bars
        for (let i = 0; i < 20; i++) {
            const barAngle = (i / 20) * Math.PI * 2;
            const x1 = icX + Math.cos(barAngle) * iR * 0.2;
            const y1 = icY + Math.sin(barAngle) * iR * 0.2;
            const x2 = icX + Math.cos(barAngle) * iR * 0.6;
            const y2 = icY + Math.sin(barAngle) * iR * 0.6;
            
            ictx.beginPath();
            ictx.moveTo(x1, y1);
            ictx.lineTo(x2, y2);
            ictx.strokeStyle = '#f97316';
            ictx.lineWidth = 4;
            ictx.stroke();
        }
        
        // End rings
        ictx.beginPath();
        ictx.arc(icX, icY, iR * 0.6, 0, Math.PI * 2);
        ictx.strokeStyle = '#c08030';
        ictx.lineWidth = 4;
        ictx.stroke();
        
        // Shaft
        ictx.beginPath();
        ictx.arc(icX, icY, iR * 0.1, 0, Math.PI * 2);
        ictx.fillStyle = '#606070';
        ictx.fill();
        
        // Labels
        ictx.font = '11px JetBrains Mono';
        ictx.fillStyle = '#606070';
        ictx.textAlign = 'center';
        ictx.fillText('3-Phase Stator', icX, icY - iR - 15);
        ictx.fillText('Squirrel Cage Rotor', icX, icY + iR + 20);
    }
    
    drawMagneticField() {
        const ctx = this.magneticFieldCtx;
        const canvas = this.magneticFieldCanvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        ctx.fillStyle = '#0a0a10';
        ctx.fillRect(0, 0, w, h);
        
        const centerX = w / 2;
        const centerY = h / 2;
        const time = Date.now() / 1000;
        
        // Draw rotating magnetic field
        const numPoles = 4;
        const fieldAngle = time * 3;
        
        // Draw field lines
        for (let pole = 0; pole < numPoles; pole++) {
            const angle = fieldAngle + (pole * Math.PI * 2 / numPoles);
            const isNorth = pole % 2 === 0;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            
            // Field lines from pole
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.35);
            
            if (isNorth) {
                gradient.addColorStop(0, 'rgba(255, 80, 80, 0.6)');
                gradient.addColorStop(1, 'rgba(255, 80, 80, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(80, 80, 255, 0.6)');
                gradient.addColorStop(1, 'rgba(80, 80, 255, 0)');
            }
            
            // Draw pole face
            ctx.beginPath();
            ctx.arc(0, 0, w * 0.15, -Math.PI/4, Math.PI/4);
            ctx.arc(0, 0, w * 0.35, Math.PI/4, -Math.PI/4, true);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Pole outline
            ctx.beginPath();
            ctx.arc(0, 0, w * 0.15, -Math.PI/4, Math.PI/4);
            ctx.strokeStyle = isNorth ? '#ff5050' : '#5050ff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Field lines
            for (let i = 0; i < 5; i++) {
                const lineAngle = -Math.PI/4 + (i * Math.PI/10);
                const startR = w * 0.15;
                const endR = w * 0.38;
                
                ctx.beginPath();
                ctx.moveTo(Math.cos(lineAngle) * startR, Math.sin(lineAngle) * startR);
                ctx.lineTo(Math.cos(lineAngle) * endR, Math.sin(lineAngle) * endR);
                ctx.strokeStyle = isNorth ? 'rgba(255, 80, 80, 0.3)' : 'rgba(80, 80, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            
            ctx.restore();
        }
        
        // Draw air gap flux
        const airGapGradient = ctx.createRadialGradient(
            centerX, centerY, w * 0.2,
            centerX, centerY, w * 0.4
        );
        airGapGradient.addColorStop(0, 'rgba(0, 212, 255, 0.1)');
        airGapGradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, w * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = airGapGradient;
        ctx.fill();
        
        // Legend
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'left';
        
        ctx.fillStyle = '#ff5050';
        ctx.fillText('North Pole (N)', 10, 20);
        
        ctx.fillStyle = '#5050ff';
        ctx.fillText('South Pole (S)', 10, 35);
        
        ctx.fillStyle = '#00d4ff';
        ctx.fillText('Rotating Field', 10, 50);
        
        // Speed indicator
        ctx.textAlign = 'right';
        ctx.fillStyle = '#9898a8';
        ctx.fillText('1500 RPM @ 50Hz', w - 10, 20);
    }
}

// Note: ConstructionViewer is initialized by app.js
// Remove auto-initialization to avoid duplicate instances
