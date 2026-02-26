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
        
        // Thermal Parameters
        this.ledTemperature = 25; // LED junction temperature (°C)
        this.ambientTemperature = 25; // Room ambient temperature (°C)
        this.thermalResistance = 10; // °C/W - heat sink thermal resistance
        this.heatsinkTemp = 35; // Heatsink temperature
        this.maxJunctionTemp = 120; // Maximum LED junction temperature
        this.temperatureUpdateRate = 0.1; // Thermal time constant factor
        
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
        
        // Ambient temperature slider
        const ambientTempSlider = document.getElementById('led-ambient-temp-slider');
        const ambientTempValue = document.getElementById('led-ambient-temp-value');
        if (ambientTempSlider && ambientTempValue) {
            ambientTempSlider.addEventListener('input', (e) => {
                this.ambientTemperature = parseInt(e.target.value);
                ambientTempValue.textContent = this.ambientTemperature + ' °C';
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
        // Thermal calculation - heat generated and temperature rise
        const powerLoss = this.ledPower * (1 - this.ledEfficacy / 200); // Approximate power converted to heat
        const tempRise = powerLoss * this.thermalResistance;
        
        // Thermal time constant - gradual temperature change
        this.heatsinkTemp += (this.ambientTemperature + tempRise - this.heatsinkTemp) * this.temperatureUpdateRate;
        this.ledTemperature = this.heatsinkTemp + tempRise;
        
        // Temperature affects LED efficacy (thermal degradation)
        const tempFactor = Math.max(0.7, 1 - (Math.max(0, this.ledTemperature - 25) / 150));
        const effectiveEfficacy = this.ledEfficacy * tempFactor;
        
        // Temperature affects lifetime
        const lifetimeFactor = Math.max(0.5, 1 - (Math.max(0, this.ledTemperature - 25) / 200));
        
        // Calculate total luminous flux
        const totalLumens = this.ledPower * effectiveEfficacy;
        
        // Calculate area
        const floorArea = this.roomLength * this.roomWidth;
        
        // Calculate average illuminance (lux)
        // Using utilization factor of 0.6 for typical room
        const utilizationFactor = 0.6;
        const maintenanceFactor = 0.8;
        const avgLux = (totalLumens * utilizationFactor * maintenanceFactor) / floorArea;
        
        // Room temperature increase due to LED heat
        const roomTempIncrease = (powerLoss * this.ledPositions.length) / (this.roomLength * this.roomWidth * this.roomHeight * 0.5);
        const roomTemperature = this.ambientTemperature + roomTempIncrease;
        
        // Update readings display
        const lumensReading = document.getElementById('led-lumens-reading');
        const luxReading = document.getElementById('led-lux-reading');
        const efficacyReading = document.getElementById('led-efficacy-reading');
        const cctReading = document.getElementById('led-cct-reading');
        const criReading = document.getElementById('led-cri-reading');
        const tempReading = document.getElementById('led-temp-reading');
        
        if (lumensReading) lumensReading.textContent = totalLumens.toFixed(0) + ' lm';
        if (luxReading) luxReading.textContent = avgLux.toFixed(1) + ' lux';
        if (efficacyReading) efficacyReading.textContent = effectiveEfficacy.toFixed(0) + ' lm/W';
        if (cctReading) cctReading.textContent = this.ledCCT + ' K';
        if (criReading) criReading.textContent = this.ledCRI;
        if (tempReading) tempReading.textContent = this.ledTemperature.toFixed(0) + ' °C';
        
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

// ================================================
// 3D LED Lighting Simulator using Three.js
// Realistic photometrics with inverse square law
// ================================================

class LEDLightingSimulator3D {
    constructor() {
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.isRunning = false;
        this.animationId = null;
        
        // LED Parameters
        this.ledPower = 10; // Watts
        this.ledEfficacy = 120; // lumens per watt
        this.ledCCT = 4000; // Kelvin
        this.ledCRI = 80;
        
        // Room Parameters (in meters)
        this.roomLength = 5;
        this.roomWidth = 4;
        this.roomHeight = 3;
        this.ceilingHeight = 2.5;
        
        // LED positions (normalized 0-1)
        this.ledPositions = [
            { x: 0.25, y: 0.25 },
            { x: 0.75, y: 0.25 },
            { x: 0.25, y: 0.75 },
            { x: 0.75, y: 0.75 }
        ];
        
        // Three.js objects
        this.ledLights = [];
        this.ledFixtures = [];
        this.measurementPoints = [];
        
        // Application mode
        this.appMode = 'general';
        
        this.init();
    }
    
    init() {
        this.container = document.getElementById('led-canvas-3d');
        if (!this.container) {
            // Create container if not exists
            const canvasContainer = document.querySelector('.simulation-view');
            if (canvasContainer && document.getElementById('led-canvas')) {
                this.create3DContainer();
            }
            return;
        }
        
        this.setupScene();
        this.setupLights();
        this.setupRoom();
        this.setupControls();
        this.start();
    }
    
    create3DContainer() {
        // Create a toggle button for 3D view
        const canvasContainer = document.querySelector('.simulation-view');
        if (!canvasContainer) return;
        
        // Add 3D canvas alongside 2D
        const canvas3d = document.createElement('div');
        canvas3d.id = 'led-canvas-3d-container';
        canvas3d.style.cssText = 'display:none; width:100%; height:400px; position:relative;';
        
        const canvas3dInner = document.createElement('div');
        canvas3dInner.id = 'led-canvas-3d';
        canvas3dInner.style.cssText = 'width:100%; height:100%;';
        
        canvas3d.appendChild(canvas3dInner);
        canvasContainer.appendChild(canvas3d);
        
        // Add toggle button
        const controlsArea = document.getElementById('led-controls');
        if (controlsArea) {
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'led-3d-toggle';
            toggleBtn.className = 'btn btn-secondary';
            toggleBtn.textContent = 'Switch to 3D View';
            toggleBtn.style.marginTop = '10px';
            toggleBtn.onclick = () => this.toggle3DView();
            controlsArea.appendChild(toggleBtn);
        }
        
        this.container = canvas3dInner;
        this.init();
    }
    
    toggle3DView() {
        const canvas2d = document.getElementById('led-canvas');
        const canvas3dContainer = document.getElementById('led-canvas-3d-container');
        const toggleBtn = document.getElementById('led-3d-toggle');
        
        if (canvas2d && canvas3dContainer) {
            if (canvas3dContainer.style.display === 'none') {
                canvas2d.style.display = 'none';
                canvas3dContainer.style.display = 'block';
                toggleBtn.textContent = 'Switch to 2D View';
                this.init();
            } else {
                canvas3dContainer.style.display = 'none';
                canvas2d.style.display = 'block';
                toggleBtn.textContent = 'Switch to 3D View';
                this.stop();
            }
        }
    }
    
    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a12);
        
        // Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
        this.camera.position.set(4, 3, 6);
        this.camera.lookAt(0, 1, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.container.appendChild(this.renderer.domElement);
        
        // Orbit Controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 2;
            this.controls.maxDistance = 15;
            this.controls.target.set(0, 1, 0);
        }
        
        // Ambient light (very dim)
        const ambient = new THREE.AmbientLight(0x111122, 0.1);
        this.scene.add(ambient);
        
        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    }
    
    setupRoom() {
        // Room dimensions
        const length = this.roomLength;
        const width = this.roomWidth;
        const height = this.roomHeight;
        
        // Floor
        const floorGeo = new THREE.PlaneGeometry(length, width);
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: 0x404050,
            roughness: 0.8,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Floor grid
        const gridHelper = new THREE.GridHelper(Math.max(length, width), 20, 0x00aaff, 0x222233);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);
        
        // Walls
        const wallMat = new THREE.MeshStandardMaterial({ 
            color: 0x505060,
            roughness: 0.9,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        
        // Back wall
        const backWallGeo = new THREE.PlaneGeometry(length, height);
        const backWall = new THREE.Mesh(backWallGeo, wallMat);
        backWall.position.set(0, height/2, -width/2);
        backWall.receiveShadow = true;
        this.scene.add(backWall);
        
        // Left wall
        const leftWallGeo = new THREE.PlaneGeometry(width, height);
        const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-length/2, height/2, 0);
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);
        
        // Ceiling
        const ceilingGeo = new THREE.PlaneGeometry(length, width);
        const ceilingMat = new THREE.MeshStandardMaterial({ 
            color: 0x303040,
            roughness: 0.9
        });
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = height;
        this.scene.add(ceiling);
        
        // Add measurement grid points on floor
        this.setupMeasurementPoints();
    }
    
    setupMeasurementPoints() {
        // Create small spheres to show measurement points
        const pointGeo = new THREE.SphereGeometry(0.03, 8, 8);
        
        for (let x = 0; x <= 4; x++) {
            for (let z = 0; z <= 4; z++) {
                const pointMat = new THREE.MeshBasicMaterial({ 
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 0.5
                });
                const point = new THREE.Mesh(pointGeo, pointMat);
                
                // Position in room coordinates
                point.position.set(
                    (x / 4 - 0.5) * this.roomLength,
                    0.05,
                    (z / 4 - 0.5) * this.roomWidth
                );
                
                this.scene.add(point);
                this.measurementPoints.push(point);
            }
        }
    }
    
    setupLights() {
        // Clear existing lights
        this.ledLights.forEach(light => this.scene.remove(light));
        this.ledFixtures.forEach(fixture => this.scene.remove(fixture));
        this.ledLights = [];
        this.ledFixtures = [];
        
        const totalLumens = this.ledPower * this.ledEfficacy;
        const lumensPerLed = totalLumens / this.ledPositions.length;
        
        // Color based on CCT
        const color = this.getCCTColorThree(this.ledCCT);
        
        this.ledPositions.forEach((pos, i) => {
            // LED fixture (3D model representation)
            const fixtureGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.05, 16);
            const fixtureMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: color,
                emissiveIntensity: 0.5
            });
            const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
            
            // Position in room
            const ledX = (pos.x - 0.5) * this.roomLength;
            const ledZ = (pos.y - 0.5) * this.roomWidth;
            fixture.position.set(ledX, this.ceilingHeight, ledZ);
            
            this.scene.add(fixture);
            this.ledFixtures.push(fixture);
            
            // Spotlight with realistic physics
            const spotlight = new THREE.SpotLight(color, lumensPerLed / 1000);
            spotlight.position.set(ledX, this.ceilingHeight - 0.05, ledZ);
            spotlight.target.position.set(ledX, 0, ledZ);
            
            // Realistic spotlight parameters
            spotlight.angle = Math.PI / 4; // 45 degree beam
            spotlight.penumbra = 0.3;
            spotlight.decay = 2; // Inverse square law
            spotlight.distance = 10;
            
            spotlight.castShadow = true;
            spotlight.shadow.mapSize.width = 1024;
            spotlight.shadow.mapSize.height = 1024;
            spotlight.shadow.camera.near = 0.1;
            spotlight.shadow.camera.far = 10;
            
            this.scene.add(spotlight);
            this.scene.add(spotlight.target);
            this.ledLights.push(spotlight);
            
            // LED glow sprite
            const glowMat = new THREE.SpriteMaterial({
                map: this.createGlowTexture(color),
                transparent: true,
                blending: THREE.AdditiveBlending
            });
            const glow = new THREE.Sprite(glowMat);
            glow.scale.set(0.5, 0.5, 1);
            glow.position.set(ledX, this.ceilingHeight - 0.03, ledZ);
            this.scene.add(glow);
        });
    }
    
    createGlowTexture(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.3, color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    getCCTColorThree(cct) {
        // Convert CCT to RGB
        let r, g, b;
        
        if (cct < 4000) {
            // Warm white
            const t = cct / 4000;
            r = 255;
            g = Math.round(180 + t * 75);
            b = Math.round(100 + t * 55);
        } else if (cct < 6500) {
            // Neutral white
            const t = (cct - 4000) / 2500;
            r = Math.round(255 - t * 30);
            g = Math.round(255 - t * 30);
            b = Math.round(155 + t * 100);
        } else {
            // Cool white
            const t = (cct - 6500) / 6500;
            r = Math.round(225 - t * 50);
            g = Math.round(225 - t * 50);
            b = 255;
        }
        
        return new THREE.Color(r/255, g/255, b/255);
    }
    
    setupControls() {
        // Hook into the 2D simulator's controls
        const originalCalculate = window.LEDLightingSimulator?.prototype?.calculate;
        if (originalCalculate) {
            // Listen for changes
            document.addEventListener('ledUpdate', (e) => {
                this.updateParameters(e.detail);
            });
        }
    }
    
    updateParameters(params) {
        if (params.power !== undefined) this.ledPower = params.power;
        if (params.efficacy !== undefined) this.ledEfficacy = params.efficacy;
        if (params.cct !== undefined) this.ledCCT = params.cct;
        if (params.cri !== undefined) this.ledCRI = params.cri;
        if (params.ledCount !== undefined) this.updateLEDCount(params.ledCount);
        
        this.setupLights();
    }
    
    updateLEDCount(count) {
        this.ledPositions = [];
        const grid = Math.ceil(Math.sqrt(count));
        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / grid);
            const col = i % grid;
            this.ledPositions.push({
                x: (col + 0.5) / grid,
                y: (row + 0.5) / grid
            });
        }
        this.setupLights();
    }
    
    onResize() {
        if (!this.container || !this.camera || !this.renderer) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
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
        
        // Update controls
        if (this.controls) this.controls.update();
        
        // Render
        this.renderer.render(this.scene, this.camera);
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    // Realistic illuminance calculation using inverse square law
    calculateIlluminanceAt(point) {
        let totalLux = 0;
        
        this.ledLights.forEach(light => {
            const dx = point.x - light.position.x;
            const dy = point.y - light.position.y;
            const dz = point.z - light.position.z;
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            if (distance > 0.1) {
                // Inverse square law with cosine correction
                const cosAngle = Math.abs(dy) / distance;
                const luminousIntensity = light.intensity * 1000; // Convert back to lumens
                const illuminance = (luminousIntensity * cosAngle) / (distance * distance);
                totalLux += illuminance;
            }
        });
        
        return totalLux;
    }
}

// Auto-initialize 3D view when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof THREE !== 'undefined') {
            window.ledSimulator3D = new LEDLightingSimulator3D();
        }
    }, 1000);
});
