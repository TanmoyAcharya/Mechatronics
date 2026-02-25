/**
 * EVTOL (Electric Vertical Takeoff and Landing) Simulator
 * Advanced Electric Aviation Simulator with realistic graphics
 * Features multiple EVTOL configurations and flight physics
 */

class EVTOLSimulator {
    constructor() {
        // Aircraft Configuration
        this.evtolType = 'multirotor';  // multirotor, vectored, lift+cruise
        this.aircraftName = 'AeroCity eVTOL';
        
        // Battery Parameters
        this.batteryCapacity = 300;      // kWh
        this.batterySOC = 80;           // State of Charge %
        this.batteryHealth = 98;        // Battery health %
        this.maxChargePower = 150;      // kW (fast charging)
        this.chargeEfficiency = 94;     // %
        
        // Flight Parameters
        this.altitude = 0;              // meters
        this.targetAltitude = 500;       // meters
        this.speed = 0;                 // km/h
        this.targetSpeed = 150;          // km/h (cruise speed)
        this.maxSpeed = 250;             // km/h
        this.maxAltitude = 3000;         // meters (service ceiling)
        this.maxRange = 200;            // km
        
        // Flight State
        this.flightMode = 'ground';      // ground, takeoff, hover, cruise, descend, landing
        this.isCharging = false;
        this.motorsRunning = false;
        
        // Energy Consumption
        this.energyConsumed = 0;         // kWh
        this.currentPower = 0;            // kW
        this.hoverPower = 120;           // kW (power for hover)
        this.cruisePower = 80;           // kW (power for cruise)
        
        // Environmental Parameters
        this.temperature = 20;            // Celsius
        this.airDensity = 1.225;         // kg/m^3
        this.windSpeed = 0;              // km/h
        this.windDirection = 0;           // degrees
        
        // Flight Envelope
        this.takeoffTime = 30;           // seconds
        this.landingTime = 45;           // seconds
        
        // Simulation
        this.time = 0;
        this.flightTime = 0;             // seconds
        this.animationId = null;
        this.particles = [];
        
        // Historical data
        this.altitudeHistory = [];
        this.speedHistory = [];
        this.powerHistory = [];
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('evtol-canvas');
        if (!this.canvas) {
            console.log('EVTOL canvas not found');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.graphCanvas = document.getElementById('evtol-graph');
        if (this.graphCanvas) {
            this.graphCtx = this.graphCanvas.getContext('2d');
        }
        
        this.setupControls();
        
        if (this.canvas.width === 0) {
            this.canvas.width = 800;
            this.canvas.height = 450;
        }
        if (this.graphCanvas && this.graphCanvas.width === 0) {
            this.graphCanvas.width = 380;
            this.graphCanvas.height = 200;
        }
        
        this.calculate();
    }
    
    setupControls() {
        // EVTOL Type Selector
        const typeButtons = document.querySelectorAll('.evtol-type-btn');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.evtolType = e.target.dataset.type;
                typeButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateAircraftName();
                this.calculate();
            });
        });
        
        // Battery SOC Slider
        const socSlider = document.getElementById('evtol-soc-slider');
        const socValue = document.getElementById('evtol-soc-value');
        if (socSlider && socValue) {
            socSlider.addEventListener('input', (e) => {
                this.batterySOC = parseFloat(e.target.value);
                socValue.textContent = this.batterySOC.toFixed(0);
                this.calculate();
            });
        }
        
        // Target Altitude Slider
        const altSlider = document.getElementById('evtol-alt-slider');
        const altValue = document.getElementById('evtol-alt-value');
        if (altSlider && altValue) {
            altSlider.addEventListener('input', (e) => {
                this.targetAltitude = parseFloat(e.target.value);
                altValue.textContent = this.targetAltitude.toFixed(0);
                this.calculate();
            });
        }
        
        // Target Speed Slider
        const speedSlider = document.getElementById('evtol-speed-slider');
        const speedValue = document.getElementById('evtol-speed-value');
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                this.targetSpeed = parseFloat(e.target.value);
                speedValue.textContent = this.targetSpeed.toFixed(0);
                this.calculate();
            });
        }
        
        // Temperature Slider
        const tempSlider = document.getElementById('evtol-temp-slider');
        const tempValue = document.getElementById('evtol-temp-value');
        if (tempSlider && tempValue) {
            tempSlider.addEventListener('input', (e) => {
                this.temperature = parseFloat(e.target.value);
                tempValue.textContent = this.temperature.toFixed(0);
                this.updateAirDensity();
                this.calculate();
            });
        }
        
        // Wind Speed Slider
        const windSlider = document.getElementById('evtol-wind-slider');
        const windValue = document.getElementById('evtol-wind-value');
        if (windSlider && windValue) {
            windSlider.addEventListener('input', (e) => {
                this.windSpeed = parseFloat(e.target.value);
                windValue.textContent = this.windSpeed.toFixed(0);
                this.calculate();
            });
        }
        
        // Battery Capacity Slider (Advanced)
        const capacitySlider = document.getElementById('evtol-capacity-slider');
        const capacityValue = document.getElementById('evtol-capacity-value');
        if (capacitySlider && capacityValue) {
            capacitySlider.addEventListener('input', (e) => {
                this.batteryCapacity = parseFloat(e.target.value);
                capacityValue.textContent = this.batteryCapacity.toFixed(0);
                this.calculate();
            });
        }
        
        // Flight Control Buttons
        const takeoffBtn = document.getElementById('evtol-takeoff-btn');
        if (takeoffBtn) {
            takeoffBtn.addEventListener('click', () => {
                this.startTakeoff();
            });
        }
        
        const cruiseBtn = document.getElementById('evtol-cruise-btn');
        if (cruiseBtn) {
            cruiseBtn.addEventListener('click', () => {
                this.startCruise();
            });
        }
        
        const descendBtn = document.getElementById('evtol-descend-btn');
        if (descendBtn) {
            descendBtn.addEventListener('click', () => {
                this.startDescent();
            });
        }
        
        const landBtn = document.getElementById('evtol-land-btn');
        if (landBtn) {
            landBtn.addEventListener('click', () => {
                this.startLanding();
            });
        }
        
        const chargeBtn = document.getElementById('evtol-charge-btn');
        if (chargeBtn) {
            chargeBtn.addEventListener('click', () => {
                this.isCharging = !this.isCharging;
                chargeBtn.classList.toggle('active', this.isCharging);
                this.calculate();
            });
        }
        
        const stopBtn = document.getElementById('evtol-stop-btn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.emergencyStop();
            });
        }
        
        const resetBtn = document.getElementById('evtol-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSimulation();
            });
        }
    }
    
    updateAircraftName() {
        switch(this.evtolType) {
            case 'multirotor':
                this.aircraftName = 'AeroCity eVTOL';
                this.hoverPower = 120;
                this.cruisePower = 80;
                this.maxSpeed = 250;
                break;
            case 'vectored':
                this.aircraftName = 'VectorThrust X1';
                this.hoverPower = 100;
                this.cruisePower = 60;
                this.maxSpeed = 300;
                break;
            case 'lift+cruise':
                this.aircraftName = 'LiftCruise E-Jet';
                this.hoverPower = 150;
                this.cruisePower = 70;
                this.maxSpeed = 280;
                break;
        }
    }
    
    updateAirDensity() {
        // Calculate air density based on temperature
        // Standard sea level: 1.225 kg/m^3 at 15C
        this.airDensity = 1.225 * (288.15 / (273.15 + this.temperature));
    }
    
    startTakeoff() {
        if (this.flightMode !== 'ground' || this.batterySOC < 20) return;
        this.flightMode = 'takeoff';
        this.motorsRunning = true;
        document.getElementById('evtol-takeoff-btn')?.classList.add('active');
    }
    
    startCruise() {
        if (this.flightMode !== 'hover' && this.flightMode !== 'takeoff') return;
        this.flightMode = 'cruise';
        document.getElementById('evtol-cruise-btn')?.classList.add('active');
    }
    
    startDescent() {
        if (this.flightMode !== 'cruise' && this.flightMode !== 'hover') return;
        this.flightMode = 'descend';
        document.getElementById('evtol-descend-btn')?.classList.add('active');
    }
    
    startLanding() {
        if (this.flightMode !== 'descend' && this.flightMode !== 'cruise') return;
        this.flightMode = 'landing';
        document.getElementById('evtol-land-btn')?.classList.add('active');
    }
    
    emergencyStop() {
        this.flightMode = 'ground';
        this.motorsRunning = false;
        this.altitude = 0;
        this.speed = 0;
        
        // Remove active states from buttons
        document.querySelectorAll('.evtol-control-btn').forEach(btn => btn.classList.remove('active'));
    }
    
    resetSimulation() {
        this.altitude = 0;
        this.speed = 0;
        this.flightMode = 'ground';
        this.motorsRunning = false;
        this.energyConsumed = 0;
        this.flightTime = 0;
        this.isCharging = false;
        this.altitudeHistory = [];
        this.speedHistory = [];
        this.powerHistory = [];
        
        document.querySelectorAll('.evtol-control-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.evtol-mode-btn').forEach(btn => btn.classList.remove('active'));
        
        this.calculate();
    }
    
    calculate() {
        // Calculate power based on flight mode
        if (this.isCharging) {
            this.currentPower = this.maxChargePower;
            // Simulate charging
            this.batterySOC = Math.min(100, this.batterySOC + 0.5);
        } else if (this.motorsRunning) {
            switch(this.flightMode) {
                case 'takeoff':
                    // High power for takeoff
                    this.currentPower = this.hoverPower * 1.5;
                    this.altitude = Math.min(this.targetAltitude, this.altitude + 2);
                    this.speed = Math.min(this.targetSpeed * 0.3, this.speed + 3);
                    if (this.altitude >= this.targetAltitude * 0.8) {
                        this.flightMode = 'hover';
                    }
                    break;
                    
                case 'hover':
                    this.currentPower = this.hoverPower;
                    this.altitude = Math.min(this.maxAltitude, this.altitude + 0.5);
                    this.speed = Math.min(this.targetSpeed * 0.5, this.speed + 1);
                    break;
                    
                case 'cruise':
                    // Optimized power for cruise
                    const speedFactor = this.speed / this.maxSpeed;
                    this.currentPower = this.cruisePower * (0.5 + speedFactor * 0.5);
                    // Wind effect
                    this.speed = Math.max(0, this.speed - this.windSpeed * 0.01);
                    this.speed = Math.min(this.targetSpeed, this.speed + 1);
                    break;
                    
                case 'descend':
                    // Lower power during descent
                    this.currentPower = this.cruisePower * 0.3;
                    this.altitude = Math.max(0, this.altitude - 1.5);
                    this.speed = Math.max(0, this.speed - 2);
                    if (this.altitude < 50) {
                        this.flightMode = 'landing';
                    }
                    break;
                    
                case 'landing':
                    this.currentPower = this.hoverPower * 0.5;
                    this.altitude = Math.max(0, this.altitude - 2);
                    this.speed = Math.max(0, this.speed - 3);
                    if (this.altitude <= 0) {
                        this.flightMode = 'ground';
                        this.motorsRunning = false;
                    }
                    break;
                    
                default:
                    this.currentPower = 0;
            }
            
            // Calculate energy consumption
            if (this.currentPower > 0) {
                this.energyConsumed += this.currentPower * 0.001; // kWh per tick
                this.flightTime += 0.1;
                
                // Update SOC based on consumption
                const dischargeRate = this.energyConsumed / this.batteryCapacity * 100;
                this.batterySOC = Math.max(0, this.batterySOC - dischargeRate * 0.001);
            }
        } else {
            this.currentPower = 0;
        }
        
        // Update readings
        this.updateReadings();
        
        // Record history
        this.recordHistory();
        
        this.draw();
        if (this.graphCanvas) this.drawGraph();
    }
    
    updateReadings() {
        // Altitude reading
        const altReading = document.getElementById('evtol-alt-reading');
        if (altReading) altReading.textContent = this.altitude.toFixed(0) + ' m';
        
        // Speed reading
        const speedReading = document.getElementById('evtol-speed-reading');
        if (speedReading) speedReading.textContent = this.speed.toFixed(0) + ' km/h';
        
        // Power reading
        const powerReading = document.getElementById('evtol-power-reading');
        if (powerReading) powerReading.textContent = this.currentPower.toFixed(1) + ' kW';
        
        // SOC reading
        const socReading = document.getElementById('evtol-soc-reading');
        if (socReading) socReading.textContent = this.batterySOC.toFixed(0) + '%';
        
        // Battery capacity reading
        const capReading = document.getElementById('evtol-capacity-reading');
        if (capReading) {
            const kWh = this.batteryCapacity * this.batterySOC / 100;
            capReading.textContent = kWh.toFixed(0) + ' / ' + this.batteryCapacity.toFixed(0) + ' kWh';
        }
        
        // Range reading
        const rangeReading = document.getElementById('evtol-range-reading');
        if (rangeReading) {
            const remainingEnergy = this.batteryCapacity * this.batterySOC / 100;
            const avgConsumption = this.flightMode === 'cruise' ? this.cruisePower : this.hoverPower;
            const range = avgConsumption > 0 ? (remainingEnergy / avgConsumption) * this.speed : 0;
            rangeReading.textContent = Math.min(this.maxRange, range).toFixed(0) + ' km';
        }
        
        // Flight time reading
        const timeReading = document.getElementById('evtol-time-reading');
        if (timeReading) {
            const hours = Math.floor(this.flightTime / 3600);
            const minutes = Math.floor((this.flightTime % 3600) / 60);
            timeReading.textContent = hours + 'h ' + minutes + 'm';
        }
        
        // Energy consumed
        const energyReading = document.getElementById('evtol-energy-reading');
        if (energyReading) energyReading.textContent = this.energyConsumed.toFixed(1) + ' kWh';
        
        // Temperature
        const tempReading = document.getElementById('evtol-temp-reading');
        if (tempReading) tempReading.textContent = this.temperature.toFixed(0) + ' C';
        
        // Wind
        const windReading = document.getElementById('evtol-wind-reading');
        if (windReading) windReading.textContent = this.windSpeed.toFixed(0) + ' km/h';
        
        // Flight mode
        const modeReading = document.getElementById('evtol-mode-reading');
        if (modeReading) {
            let modeText = 'GROUND';
            switch(this.flightMode) {
                case 'takeoff': modeText = 'TAKEOFF'; break;
                case 'hover': modeText = 'HOVER'; break;
                case 'cruise': modeText = 'CRUISE'; break;
                case 'descend': modeText = 'DESCEND'; break;
                case 'landing': modeText = 'LANDING'; break;
            }
            modeReading.textContent = modeText;
        }
    }
    
    recordHistory() {
        this.altitudeHistory.push(this.altitude);
        this.speedHistory.push(this.speed);
        this.powerHistory.push(this.currentPower);
        
        if (this.altitudeHistory.length > 100) {
            this.altitudeHistory.shift();
            this.speedHistory.shift();
            this.powerHistory.shift();
        }
    }
    
    start() {
        if (this.animationId || !this.canvas) return;
        this.animate();
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    animate() {
        this.time += 0.016;
        
        // Update particles for rotor wash
        this.updateParticles();
        
        this.calculate();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateParticles() {
        if (this.motorsRunning) {
            if (Math.random() < 0.4) {
                this.particles.push({
                    x: 400 + (Math.random() - 0.5) * 100,
                    y: 350,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 3 - 1,
                    size: Math.random() * 4 + 2,
                    life: 1
                });
            }
        }
        
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            p.size *= 0.98;
            return p.life > 0 && p.y > 0;
        });
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // Sky gradient (time of day effect)
        const isNight = this.time % 60 < 30;
        let skyGradient = ctx.createLinearGradient(0, 0, 0, h);
        
        if (isNight) {
            skyGradient.addColorStop(0, '#0a0a2a');
            skyGradient.addColorStop(0.5, '#1a1a4a');
            skyGradient.addColorStop(1, '#2a2a5a');
        } else {
            skyGradient.addColorStop(0, '#1a4a8a');
            skyGradient.addColorStop(0.5, '#4a7aaa');
            skyGradient.addColorStop(1, '#8aaaCC');
        }
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, w, h);
        
        // Stars (if night)
        if (isNight) {
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 80; i++) {
                const sx = (i * 137) % w;
                const sy = (i * 89) % (h * 0.6);
                const size = (i % 3) * 0.3 + 0.3;
                ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
                ctx.beginPath();
                ctx.arc(sx, sy, size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            
            // Moon
            ctx.fillStyle = '#f0f0f0';
            ctx.beginPath();
            ctx.arc(700, 60, 25, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Clouds
        this.drawClouds(ctx, w, h);
        
        // Ground/cityscape
        this.drawCityscape(ctx, w, h);
        
        // Draw aircraft
        this.drawAircraft(ctx, w, h);
        
        // Draw particles (rotor wash)
        this.drawParticles(ctx);
        
        // Draw HUD
        this.drawHUD(ctx, w, h);
    }
    
    drawClouds(ctx, w, h) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        
        // Cloud positions based on time for animation
        const cloudOffsets = [
            { x: (this.time * 10) % (w + 200) - 100, y: 80, scale: 1.2 },
            { x: (this.time * 7 + 300) % (w + 200) - 100, y: 120, scale: 0.8 },
            { x: (this.time * 5 + 600) % (w + 200) - 100, y: 60, scale: 1.0 },
            { x: (this.time * 8 + 900) % (w + 200) - 100, y: 150, scale: 0.6 }
        ];
        
        cloudOffsets.forEach(cloud => {
            this.drawCloud(ctx, cloud.x, cloud.y, cloud.scale);
        });
    }
    
    drawCloud(ctx, x, y, scale) {
        ctx.beginPath();
        ctx.arc(x, y, 25 * scale, 0, Math.PI * 2);
        ctx.arc(x + 25 * scale, y - 10 * scale, 30 * scale, 0, Math.PI * 2);
        ctx.arc(x + 50 * scale, y, 25 * scale, 0, Math.PI * 2);
        ctx.arc(x + 25 * scale, y + 10 * scale, 20 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawCityscape(ctx, w, h) {
        const groundY = h - 80;
        
        // Ground
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(0, groundY, w, 80);
        
        // Buildings
        const buildings = [
            { x: 30, w: 60, h: 120, color: '#3a3a4a' },
            { x: 100, w: 40, h: 80, color: '#4a4a5a' },
            { x: 150, w: 80, h: 150, color: '#2a2a3a' },
            { x: 240, w: 50, h: 100, color: '#3a3a4a' },
            { x: 500, w: 70, h: 130, color: '#4a4a5a' },
            { x: 580, w: 45, h: 90, color: '#3a3a4a' },
            { x: 650, w: 90, h: 140, color: '#2a2a3a' }
        ];
        
        buildings.forEach(b => {
            // Building body
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
            
            // Windows
            ctx.fillStyle = '#ffaa44';
            for (let wy = groundY - b.h + 10; wy < groundY - 10; wy += 15) {
                for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 12) {
                    if (Math.random() > 0.3) {
                        ctx.fillRect(wx, wy, 6, 8);
                    }
                }
            }
        });
        
        // Runway/takeoff pad
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(300, groundY, 200, 60);
        
        // Runway markings
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(320 + i * 40, groundY + 25, 20, 4);
        }
        
        // H for helipad
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(380, groundY + 15, 4, 30);
        ctx.fillRect(380, groundY + 15, 20, 4);
        ctx.fillRect(396, groundY + 15, 4, 30);
    }
    
    drawAircraft(ctx, w, h) {
        // Calculate aircraft position based on altitude
        const baseY = h - 160;
        const altScale = this.altitude / this.maxAltitude;
        const aircraftY = baseY - (altScale * (h - 200));
        
        // Aircraft shadow on ground
        const shadowScale = 1 - altScale * 0.5;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(400, h - 90, 50 * shadowScale, 15 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.translate(400, aircraftY);
        
        // Apply slight tilt based on speed/wind
        const tilt = (this.speed - this.targetSpeed) * 0.01;
        ctx.rotate(tilt);
        
        // Draw based on EVTOL type
        switch(this.evtolType) {
            case 'multirotor':
                this.drawMultirotor(ctx);
                break;
            case 'vectored':
                this.drawVectored(ctx);
                break;
            case 'lift+cruise':
                this.drawLiftCruise(ctx);
                break;
        }
        
        ctx.restore();
    }
    
    drawMultirotor(ctx) {
        // Arms
        ctx.strokeStyle = '#4a4a5a';
        ctx.lineWidth = 8;
        
        // Four arms in X configuration
        const armLength = 70;
        ctx.beginPath();
        ctx.moveTo(-armLength, -armLength);
        ctx.lineTo(armLength, armLength);
        ctx.moveTo(armLength, -armLength);
        ctx.lineTo(-armLength, armLength);
        ctx.stroke();
        
        // Motor pods
        const podPositions = [
            { x: -armLength, y: -armLength },
            { x: armLength, y: -armLength },
            { x: -armLength, y: armLength },
            { x: armLength, y: armLength }
        ];
        
        podPositions.forEach(pos => {
            // Motor housing
            ctx.fillStyle = '#2a2a3a';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
            ctx.fill();
            
            // Rotor (spinning)
            if (this.motorsRunning) {
                ctx.strokeStyle = '#666666';
                ctx.lineWidth = 2;
                const rotorAngle = this.time * 20;
                ctx.beginPath();
                ctx.ellipse(pos.x, pos.y, 15, 2, rotorAngle, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(pos.x, pos.y, 15, 2, rotorAngle + Math.PI/2, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Rotor guard
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        // Fuselage (central body)
        ctx.fillStyle = '#3a5a8a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 35, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cockpit
        ctx.fillStyle = '#1a3a5a';
        ctx.beginPath();
        ctx.ellipse(10, -5, 20, 12, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Cockpit glass reflection
        ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
        ctx.beginPath();
        ctx.ellipse(8, -8, 12, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Landing gear
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-20, 20);
        ctx.lineTo(-25, 35);
        ctx.moveTo(20, 20);
        ctx.lineTo(25, 35);
        ctx.stroke();
        
        // Landing pads
        ctx.fillStyle = '#5a5a5a';
        ctx.beginPath();
        ctx.arc(-25, 35, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(25, 35, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawVectored(ctx) {
        // Main wing
        ctx.fillStyle = '#3a5a8a';
        ctx.beginPath();
        ctx.moveTo(-90, 0);
        ctx.lineTo(-60, -15);
        ctx.lineTo(60, -15);
        ctx.lineTo(90, 0);
        ctx.lineTo(60, 10);
        ctx.lineTo(-60, 10);
        ctx.closePath();
        ctx.fill();
        
        // Tilting propellers on wingtips
        const tiltAngle = this.flightMode === 'hover' || this.flightMode === 'takeoff' || this.flightMode === 'landing' ? 
            Math.PI / 4 : 0;
        
        // Left propeller assembly
        ctx.save();
        ctx.translate(-75, 0);
        ctx.rotate(-tiltAngle);
        this.drawPropeller(ctx);
        ctx.restore();
        
        // Right propeller assembly
        ctx.save();
        ctx.translate(75, 0);
        ctx.rotate(tiltAngle);
        this.drawPropeller(ctx);
        ctx.restore();
        
        // Fuselage
        ctx.fillStyle = '#2a4a6a';
        ctx.beginPath();
        ctx.ellipse(0, 5, 45, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cockpit
        ctx.fillStyle = '#1a3a5a';
        ctx.beginPath();
        ctx.ellipse(25, 0, 18, 10, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Rear propeller (pusher)
        ctx.save();
        ctx.translate(45, 5);
        this.drawPropeller(ctx, 0.7);
        ctx.restore();
        
        // Landing gear
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-25, 15);
        ctx.lineTo(-30, 30);
        ctx.moveTo(25, 15);
        ctx.lineTo(30, 30);
        ctx.stroke();
    }
    
    drawLiftCruise(ctx) {
        // Fixed wings
        ctx.fillStyle = '#3a5a8a';
        ctx.beginPath();
        ctx.moveTo(-100, 5);
        ctx.lineTo(-70, -10);
        ctx.lineTo(70, -10);
        ctx.lineTo(100, 5);
        ctx.lineTo(70, 15);
        ctx.lineTo(-70, 15);
        ctx.closePath();
        ctx.fill();
        
        // Lift rotors (vertical on wing)
        const liftRotorPositions = [
            { x: -80, y: 0 },
            { x: -40, y: 0 },
            { x: 40, y: 0 },
            { x: 80, y: 0 }
        ];
        
        liftRotorPositions.forEach(pos => {
            const showVertical = this.flightMode === 'hover' || this.flightMode === 'takeoff' || 
                                this.flightMode === 'landing' || this.flightMode === 'ground';
            
            ctx.save();
            ctx.translate(pos.x, pos.y);
            if (!showVertical) ctx.rotate(Math.PI / 2);
            
            // Rotor mast
            ctx.fillStyle = '#2a2a3a';
            ctx.fillRect(-3, -20, 6, 20);
            
            // Rotor blades
            if (this.motorsRunning || !showVertical) {
                ctx.strokeStyle = '#666666';
                ctx.lineWidth = 2;
                const rotorAngle = this.time * 25;
                ctx.beginPath();
                ctx.ellipse(0, -20, 20, 2, rotorAngle, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(0, -20, 20, 2, rotorAngle + Math.PI/2, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.restore();
        });
        
        // Fuselage
        ctx.fillStyle = '#2a4a6a';
        ctx.beginPath();
        ctx.ellipse(0, 10, 50, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose
        ctx.beginPath();
        ctx.ellipse(45, 10, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cockpit
        ctx.fillStyle = '#1a3a5a';
        ctx.beginPath();
        ctx.ellipse(30, 5, 15, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Rear propulsion
        ctx.save();
        ctx.translate(-50, 10);
        this.drawPropeller(ctx, 0.8);
        ctx.restore();
        
        // Landing gear
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-30, 20);
        ctx.lineTo(-35, 38);
        ctx.moveTo(30, 20);
        ctx.lineTo(35, 38);
        ctx.stroke();
    }
    
    drawPropeller(ctx, scale = 1) {
        // Motor housing
        ctx.fillStyle = '#2a2a3a';
        ctx.beginPath();
        ctx.arc(0, 0, 10 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Spinning blades
        if (this.motorsRunning) {
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 2;
            const rotorAngle = this.time * 20;
            
            for (let i = 0; i < 3; i++) {
                const angle = rotorAngle + (i * Math.PI * 2 / 3);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * 20 * scale, Math.sin(angle) * 20 * scale);
                ctx.stroke();
            }
        }
    }
    
    drawParticles(ctx) {
        this.particles.forEach(p => {
            ctx.fillStyle = 'rgba(200, 200, 200, ' + p.life * 0.5 + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawHUD(ctx, w, h) {
        // HUD background
        ctx.fillStyle = 'rgba(0, 20, 40, 0.8)';
        ctx.fillRect(20, 20, 220, 180);
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, 220, 180);
        
        // Aircraft name
        ctx.fillStyle = '#00aaff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(this.aircraftName, 35, 45);
        
        // Flight mode
        let modeColor = '#888888';
        switch(this.flightMode) {
            case 'takeoff': modeColor = '#ffaa00'; break;
            case 'hover': modeColor = '#00ff00'; break;
            case 'cruise': modeColor = '#00aaff'; break;
            case 'descend': modeColor = '#ffaa00'; break;
            case 'landing': modeColor = '#ff4444'; break;
        }
        ctx.fillStyle = modeColor;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(this.flightMode.toUpperCase(), 35, 65);
        
        // Altitude indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText('ALT: ' + this.altitude.toFixed(0) + ' m', 35, 90);
        
        // Altitude bar
        ctx.fillStyle = '#1a3a4a';
        ctx.fillRect(130, 78, 80, 12);
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(130, 78, (this.altitude / this.maxAltitude) * 80, 12);
        
        // Speed indicator
        ctx.fillStyle = '#ffffff';
        ctx.fillText('SPD: ' + this.speed.toFixed(0) + ' km/h', 35, 110);
        
        // Speed bar
        ctx.fillStyle = '#1a3a4a';
        ctx.fillRect(130, 98, 80, 12);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(130, 98, (this.speed / this.maxSpeed) * 80, 12);
        
        // Battery SOC
        let socColor = this.batterySOC > 50 ? '#00ff00' : (this.batterySOC > 20 ? '#ffff00' : '#ff0000');
        ctx.fillStyle = socColor;
        ctx.fillText('BAT: ' + this.batterySOC.toFixed(0) + '%', 35, 130);
        
        // SOC bar
        ctx.fillStyle = '#1a3a4a';
        ctx.fillRect(130, 118, 80, 12);
        ctx.fillStyle = socColor;
        ctx.fillRect(130, 118, (this.batterySOC / 100) * 80, 12);
        
        // Power
        ctx.fillStyle = '#ff8800';
        ctx.fillText('PWR: ' + this.currentPower.toFixed(0) + ' kW', 35, 150);
        
        // Range
        ctx.fillStyle = '#888888';
        ctx.fillText('RNG: ' + (this.batteryCapacity * this.batterySOC / 100 / this.cruisePower * this.speed).toFixed(0) + ' km', 35, 170);
        
        // Flight instruments (right side)
        ctx.fillStyle = 'rgba(0, 20, 40, 0.8)';
        ctx.fillRect(w - 150, 20, 130, 180);
        ctx.strokeStyle = '#00aaff';
        ctx.strokeRect(w - 150, 20, 130, 180);
        
        // Artificial horizon
        const horizonY = 80;
        const pitchOffset = (this.altitude / this.maxAltitude - 0.5) * 40;
        
        ctx.fillStyle = '#4a6a8a';
        ctx.fillRect(w - 140, horizonY - 20 + pitchOffset, 110, 40);
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w - 135, horizonY + pitchOffset);
        ctx.lineTo(w - 95, horizonY + pitchOffset);
        ctx.stroke();
        
        // Center marker
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(w - 115, horizonY);
        ctx.lineTo(w - 120, horizonY - 8);
        ctx.lineTo(w - 110, horizonY - 8);
        ctx.closePath();
        ctx.fill();
        
        // Compass
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText('COMPASS', w - 140, 150);
        
        const compassDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const dirIndex = Math.floor((this.time * 2) % 8);
        ctx.fillText(compassDirections[dirIndex], w - 70, 165);
    }
    
    drawGraph() {
        const ctx = this.graphCtx;
        const canvas = this.graphCanvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        // Title
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        ctx.fillText('Flight Data', 10, 15);
        
        // Altitude history
        if (this.altitudeHistory.length > 1) {
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            
            for (let i = 0; i < this.altitudeHistory.length; i++) {
                const x = (i / this.altitudeHistory.length) * (w - 20) + 10;
                const y = h - 20 - (this.altitudeHistory[i] / this.maxAltitude) * (h - 40);
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        // Speed history
        if (this.speedHistory.length > 1) {
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            
            for (let i = 0; i < this.speedHistory.length; i++) {
                const x = (i / this.speedHistory.length) * (w - 20) + 10;
                const y = h - 20 - (this.speedHistory[i] / this.maxSpeed) * (h - 40);
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        // Legend
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(10, h - 45, 20, 3);
        ctx.fillStyle = '#888';
        ctx.font = '8px monospace';
        ctx.fillText('Alt', 35, h - 42);
        
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(60, h - 45, 20, 3);
        ctx.fillStyle = '#888';
        ctx.fillText('Speed', 85, h - 42);
        
        // Scale labels
        ctx.fillStyle = '#666';
        ctx.fillText(this.maxAltitude + 'm', w - 35, 20);
        ctx.fillText('0m', w - 20, h - 25);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.evtolSimulator = new EVTOLSimulator();
});
