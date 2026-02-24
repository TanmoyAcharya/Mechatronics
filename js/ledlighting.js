// ================================================
// LED Lighting Simulator
// Educational tool for understanding LED lighting concepts
// ================================================

class LEDLightingSimulator {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.isRunning = false;
        
        // LED Parameters
        this.ledPower = 10; // Watts
        this.ledEfficacy = 120; // lumens per watt
        this.ledCCT = 4000; // Kelvin (Correlated Color Temperature)
        this.ledCRI = 80; // Color Rendering Index
        
        // Room Parameters
        this.roomLength = 5; // meters
        this.roomWidth = 4; // meters
        this.roomHeight = 3; // meters
        this.ceilingHeight = 2.5; // meters (light mounting height)
        
        // Light Distribution
        this.ledPositions = [
            { x: 0.25, y: 0.25, name: 'LED 1' },
            { x: 0.75, y: 0.25, name: 'LED 2' },
            { x: 0.25, y: 0.75, name: 'LED 3' },
            { x: 0.75, y: 0.75, name: 'LED 4' }
        ];
        
        // Application mode: 'general', 'horticulture', 'mood'
        this.appMode = 'general';
        
        // horticulture params
        this.dliTarget = 20; // Daily Light Integral (mol/m²/day)
        this.plantType = 'tomato';
        
        // mood lighting params
        this.moodColor = '#ffaa00';
        this.moodIntensity = 50;
    }
    
    init() {
        // Try to find canvas - may not exist yet if page is hidden
        this.canvas = document.getElementById('led-canvas');
        if (!this.canvas) {
            // Will be initialized when page is shown
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.setupControls();
        this.calculate();
        this.resize();
        this.start();
    }
    
    // Call this when page becomes visible
    ensureInitialized() {
        if (!this.canvas) {
            this.canvas = document.getElementById('led-canvas');
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                this.setupControls();
                this.calculate();
                this.resize();
                this.start();
            }
        }
    }
    
    setupControls() {
        // LED Power slider
        const powerSlider = document.getElementById('led-power-slider');
        const powerValue = document.getElementById('led-power-value');
        if (powerSlider && powerValue) {
            powerSlider.addEventListener('input', (e) => {
                this.ledPower = parseFloat(e.target.value);
                powerValue.textContent = this.ledPower + ' W';
                this.calculate();
            });
        }
        
        // Efficacy slider
        const efficacySlider = document.getElementById('led-efficacy-slider');
        const efficacyValue = document.getElementById('led-efficacy-value');
        if (efficacySlider && efficacyValue) {
            efficacySlider.addEventListener('input', (e) => {
                this.ledEfficacy = parseFloat(e.target.value);
                efficacyValue.textContent = this.ledEfficacy + ' lm/W';
                this.calculate();
            });
        }
        
        // CCT slider (Color Temperature)
        const cctSlider = document.getElementById('led-cct-slider');
        const cctValue = document.getElementById('led-cct-value');
        if (cctSlider && cctValue) {
            cctSlider.addEventListener('input', (e) => {
                this.ledCCT = parseInt(e.target.value);
                cctValue.textContent = this.ledCCT + ' K';
                this.calculate();
            });
        }
        
        // CRI slider
        const criSlider = document.getElementById('led-cri-slider');
        const criValue = document.getElementById('led-cri-value');
        if (criSlider && criValue) {
            criSlider.addEventListener('input', (e) => {
                this.ledCRI = parseInt(e.target.value);
                criValue.textContent = this.ledCRI;
                this.calculate();
            });
        }
        
        // Room Length
        const lengthSlider = document.getElementById('room-length-slider');
        const lengthValue = document.getElementById('room-length-value');
        if (lengthSlider && lengthValue) {
            lengthSlider.addEventListener('input', (e) => {
                this.roomLength = parseFloat(e.target.value);
                lengthValue.textContent = this.roomLength + ' m';
                this.calculate();
            });
        }
        
        // Room Width
        const widthSlider = document.getElementById('room-width-slider');
        const widthValue = document.getElementById('room-width-value');
        if (widthSlider && widthValue) {
            widthSlider.addEventListener('input', (e) => {
                this.roomWidth = parseFloat(e.target.value);
                widthValue.textContent = this.roomWidth + ' m';
                this.calculate();
            });
        }
        
        // Mounting Height
        const heightSlider = document.getElementById('mount-height-slider');
        const heightValue = document.getElementById('mount-height-value');
        if (heightSlider && heightValue) {
            heightSlider.addEventListener('input', (e) => {
                this.ceilingHeight = parseFloat(e.target.value);
                heightValue.textContent = this.ceilingHeight + ' m';
                this.calculate();
            });
        }
        
        // Application mode buttons
        const modeButtons = document.querySelectorAll('.led-mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.appMode = btn.dataset.mode;
                
                // Show/hide mode-specific controls
                const horticultureOptions = document.getElementById('horticulture-options');
                const moodOptions = document.getElementById('mood-options');
                const horticultureReadings = document.getElementById('horticulture-readings');
                const dliTargetReadings = document.getElementById('dli-target-readings');
                const dliStatusReadings = document.getElementById('dli-status-readings');
                
                if (this.appMode === 'horticulture') {
                    if (horticultureOptions) horticultureOptions.style.display = 'block';
                    if (moodOptions) moodOptions.style.display = 'none';
                    if (horticultureReadings) horticultureReadings.style.display = 'flex';
                    if (dliTargetReadings) dliTargetReadings.style.display = 'flex';
                    if (dliStatusReadings) dliStatusReadings.style.display = 'flex';
                } else if (this.appMode === 'mood') {
                    if (horticultureOptions) horticultureOptions.style.display = 'none';
                    if (moodOptions) moodOptions.style.display = 'block';
                    if (horticultureReadings) horticultureReadings.style.display = 'none';
                    if (dliTargetReadings) dliTargetReadings.style.display = 'none';
                    if (dliStatusReadings) dliStatusReadings.style.display = 'none';
                } else {
                    if (horticultureOptions) horticultureOptions.style.display = 'none';
                    if (moodOptions) moodOptions.style.display = 'none';
                    if (horticultureReadings) horticultureReadings.style.display = 'none';
                    if (dliTargetReadings) dliTargetReadings.style.display = 'none';
                    if (dliStatusReadings) dliStatusReadings.style.display = 'none';
                }
                
                this.calculate();
            });
        });
        
        // Plant type select
        const plantSelect = document.getElementById('plant-type');
        if (plantSelect) {
            plantSelect.addEventListener('change', (e) => {
                this.plantType = e.target.value;
                this.calculate();
            });
        }
        
        // Mood color slider
        const moodSlider = document.getElementById('mood-intensity-slider');
        const moodValue = document.getElementById('mood-intensity-value');
        if (moodSlider && moodValue) {
            moodSlider.addEventListener('input', (e) => {
                this.moodIntensity = parseInt(e.target.value);
                moodValue.textContent = this.moodIntensity + '%';
                this.calculate();
            });
        }
        
        // Number of LEDs
        const ledCountSlider = document.getElementById('led-count-slider');
        const ledCountValue = document.getElementById('led-count-value');
        if (ledCountSlider && ledCountValue) {
            ledCountSlider.addEventListener('input', (e) => {
                const count = parseInt(e.target.value);
                ledCountValue.textContent = count;
                this.updateLEDPositions(count);
                this.calculate();
            });
        }
    }
    
    updateLEDPositions(count) {
        this.ledPositions = [];
        const grid = Math.ceil(Math.sqrt(count));
        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / grid);
            const col = i % grid;
            this.ledPositions.push({
                x: (col + 0.5) / grid,
                y: (row + 0.5) / grid,
                name: `LED ${i + 1}`
            });
        }
    }
    
    calculate() {
        // Calculate total luminous flux
        const totalLumens = this.ledPower * this.ledEfficacy;
        
        // Calculate area
        const floorArea = this.roomLength * this.roomWidth;
        
        // Calculate average illuminance (lux)
        // Using utilization factor of 0.6 for typical room
        const utilizationFactor = 0.6;
        const maintenanceFactor = 0.8;
        const avgLux = (totalLumens * utilizationFactor * maintenanceFactor) / floorArea;
        
        // Update readings display
        const lumensReading = document.getElementById('led-lumens-reading');
        const luxReading = document.getElementById('led-lux-reading');
        const efficacyReading = document.getElementById('led-efficacy-reading');
        const cctReading = document.getElementById('led-cct-reading');
        const criReading = document.getElementById('led-cri-reading');
        
        if (lumensReading) lumensReading.textContent = totalLumens.toFixed(0) + ' lm';
        if (luxReading) luxReading.textContent = avgLux.toFixed(1) + ' lux';
        if (efficacyReading) efficacyReading.textContent = this.ledEfficacy + ' lm/W';
        if (cctReading) cctReading.textContent = this.ledCCT + ' K';
        if (criReading) criReading.textContent = this.ledCRI;
        
        // Calculate for horticulture mode
        if (this.appMode === 'horticulture') {
            this.calculateHorticulture(totalLumens, avgLux);
        }
        
        // Calculate room recommendations
        this.calculateRecommendations(avgLux, floorArea);
    }
    
    calculateHorticulture(totalLumens, avgLux) {
        // DLI calculation (assuming 12 hours of light)
        const photoperiod = 12; // hours
        const dli = (avgLux * photoperiod * 3600) / 1000000; // mol/m²/day
        
        const dliReading = document.getElementById('led-dli-reading');
        const dliTarget = document.getElementById('led-dli-target');
        const dliStatus = document.getElementById('led-dli-status');
        
        if (dliReading) dliReading.textContent = dli.toFixed(1) + ' mol/m²/day';
        if (dliTarget) dliTarget.textContent = this.getDLITarget() + ' mol/m²/day';
        if (dliStatus) {
            const target = this.getDLITarget();
            if (dli >= target * 0.9 && dli <= target * 1.1) {
                dliStatus.textContent = '✓ Optimal';
                dliStatus.style.color = 'var(--accent-green)';
            } else if (dli < target) {
                dliStatus.textContent = '↑ Too Low';
                dliStatus.style.color = 'var(--accent-orange)';
            } else {
                dliStatus.textContent = '↓ Too High';
                dliStatus.style.color = 'var(--accent-orange)';
            }
        }
    }
    
    getDLITarget() {
        const plantDLI = {
            'tomato': 20,
            'lettuce': 12,
            'pepper': 18,
            'cannabis': 25,
            'herb': 10,
            'flower': 15
        };
        return plantDLI[this.plantType] || 15;
    }
    
    calculateRecommendations(avgLux, floorArea) {
        // Room recommendations based on use
        const recommendations = {
            'general': { min: 300, max: 500, desc: 'General indoor lighting' },
            'horticulture': { min: this.getDLITarget() * 40, max: this.getDLITarget() * 60, desc: 'Plant growth lighting' },
            'mood': { min: 50, max: 150, desc: 'Ambient mood lighting' }
        };
        
        const rec = recommendations[this.appMode];
        const recElement = document.getElementById('led-recommendation');
        
        if (recElement) {
            if (this.appMode === 'horticulture') {
                const dli = (avgLux * 12 * 3600) / 1000000;
                if (dli >= rec.min * 0.9 && dli <= rec.max * 1.1) {
                    recElement.innerHTML = `<span style="color: var(--accent-green)">✓ Good for ${this.plantType}</span>`;
                } else if (dli < rec.min) {
                    recElement.innerHTML = `<span style="color: var(--accent-orange)">↑ Increase lighting for better growth</span>`;
                } else {
                    recElement.innerHTML = `<span style="color: var(--accent-cyan)">✓ High light - good for fruiting plants</span>`;
                }
            } else {
                if (avgLux >= rec.min && avgLux <= rec.max) {
                    recElement.innerHTML = `<span style="color: var(--accent-green)">✓ Optimal lighting level</span>`;
                } else if (avgLux < rec.min) {
                    recElement.innerHTML = `<span style="color: var(--accent-orange)">↑ Consider brighter lighting</span>`;
                } else {
                    recElement.innerHTML = `<span style="color: var(--accent-cyan)">✓ High illumination</span>`;
                }
            }
        }
        
        // Number of LEDs needed
        const neededLumens = rec.min * floorArea / (0.6 * 0.8);
        const neededLEDs = Math.ceil(neededLumens / (this.ledPower * this.ledEfficacy));
        const neededElement = document.getElementById('led-needed');
        if (neededElement) {
            neededElement.textContent = `~${neededLEDs} LED(s) needed`;
        }
    }
    
    resize() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = 400;
        }
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        // Draw room perspective
        this.drawRoom(ctx, w, h);
        
        // Draw light distribution
        this.drawLightDistribution(ctx, w, h);
        
        // Draw LEDs
        this.drawLEDs(ctx, w, h);
        
        // Draw legend/info
        this.drawInfo(ctx, w, h);
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    drawRoom(ctx, w, h) {
        const margin = 40;
        const roomW = w - margin * 2;
        const roomH = h - margin * 2;
        
        // Draw floor grid
        const gridSize = 20;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= roomW; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(margin + x, margin + roomH);
            ctx.lineTo(margin + x + roomH * 0.3, margin);
            ctx.stroke();
        }
        
        for (let y = 0; y <= roomH; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(margin, margin + y);
            ctx.lineTo(margin + roomW, margin + y);
            ctx.stroke();
        }
        
        // Draw room outline
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 2;
        
        // Back wall
        ctx.beginPath();
        ctx.rect(margin, margin, roomW, roomH);
        ctx.stroke();
        
        // Ceiling
        ctx.fillStyle = 'rgba(30, 30, 40, 0.8)';
        ctx.fillRect(margin, margin, roomW, roomH * 0.1);
    }
    
    drawLightDistribution(ctx, w, h) {
        const margin = 40;
        const roomW = w - margin * 2;
        const roomH = h - margin * 2;
        const centerX = margin + roomW / 2;
        const centerY = margin + roomH / 2;
        
        // Draw light cones from each LED
        this.ledPositions.forEach(led => {
            const ledX = margin + led.x * roomW;
            const ledY = margin + led.y * roomH * 0.85;
            
            // Light cone gradient
            const gradient = ctx.createRadialGradient(ledX, ledY, 0, ledX, ledY + 100, 120);
            
            // Color based on CCT
            const color = this.getCCTColor(this.ledCCT);
            gradient.addColorStop(0, color.replace(')', ', 0.4)').replace('rgb', 'rgba'));
            gradient.addColorStop(0.5, color.replace(')', ', 0.15)').replace('rgb', 'rgba'));
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(ledX - 5, ledY);
            ctx.lineTo(ledX - 60, ledY + 120);
            ctx.lineTo(ledX + 60, ledY + 120);
            ctx.lineTo(ledX + 5, ledY);
            ctx.closePath();
            ctx.fill();
        });
    }
    
    drawLEDs(ctx, w, h) {
        const margin = 40;
        const roomW = w - margin * 2;
        const roomH = h - margin * 2;
        
        this.ledPositions.forEach((led, i) => {
            const ledX = margin + led.x * roomW;
            const ledY = margin + led.y * roomH * 0.85;
            
            // LED glow
            const gradient = ctx.createRadialGradient(ledX, ledY, 0, ledX, ledY, 30);
            const color = this.getCCTColor(this.ledCCT);
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.3, color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(ledX, ledY, 30, 0, Math.PI * 2);
            ctx.fill();
            
            // LED center
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ledX, ledY, 5, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawInfo(ctx, w, h) {
        // Title
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`LED Lighting Analysis - ${this.appMode.charAt(0).toUpperCase() + this.appMode.slice(1)} Mode`, 50, 30);
        
        // CCT indicator
        ctx.fillStyle = this.getCCTColor(this.ledCCT);
        ctx.beginPath();
        ctx.arc(350, 25, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px Outfit, sans-serif';
        ctx.fillText(`${this.ledCCT}K`, 370, 30);
        
        // CRI indicator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(`CRI: ${this.ledCRI}`, 430, 30);
    }
    
    getCCTColor(cct) {
        // Approximate RGB color from CCT
        let r, g, b;
        
        if (cct < 4000) {
            // Warm white
            const t = cct / 4000;
            r = 255;
            g = Math.round(180 + t * 75);
            b = Math.round(100 * t);
        } else if (cct < 6500) {
            // Neutral white
            const t = (cct - 4000) / 2500;
            r = Math.round(255 - t * 30);
            g = Math.round(255 - t * 30);
            b = Math.round(155 + t * 100);
        } else {
            // Cool white
            r = Math.round(225 - (cct - 6500) / 6500 * 50);
            g = Math.round(225 - (cct - 6500) / 6500 * 50);
            b = 255;
        }
        
        return `rgb(${r}, ${g}, ${b})`;
    }
}

// Initialize
window.LEDLightingSimulator = LEDLightingSimulator;
