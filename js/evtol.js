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
        // Calculate air density based on temperature and altitude (ISA model)
        const altitudeFactor = Math.exp(-this.altitude / 8500); // Scale height approximation
        this.airDensity = 1.225 * (288.15 / (273.15 + this.temperature)) * altitudeFactor;
        
        // Temperature effects on battery performance
        const tempFactor = this.temperature < 0 ? 0.7 : (this.temperature > 40 ? 0.8 : 1.0);
        const effectiveBatteryCapacity = this.batteryCapacity * (this.batteryHealth / 100) * tempFactor;
        
        // Calculate power based on flight mode
        if (this.isCharging) {
            this.currentPower = this.maxChargePower * tempFactor;
            // Simulate charging
            this.batterySOC = Math.min(100, this.batterySOC + 0.5 * tempFactor);
        } else if (this.motorsRunning) {
            // Thrust required for hover (equal to weight)
            const mass = 2000; // kg
            const weight = mass * this.gravity; // N
            const airDensityRatio = this.airDensity / 1.225;
            
            // Motor efficiency varies with power level
            const motorEfficiency = 0.92; // Typical brushless motor efficiency
            
            switch(this.flightMode) {
                case 'takeoff':
                    // High power for takeoff - requires extra thrust for acceleration
                    const takeoffThrust = weight * 1.3; // 30% extra for climb
                    const powerRequired = (takeoffThrust * 10) / (motorEfficiency * 1000); // kW
                    this.currentPower = Math.min(this.hoverPower * 1.5, powerRequired);
                    
                    // Air density affects climb rate
                    const climbRate = 5 * airDensityRatio; // m/s
                    this.altitude = Math.min(this.targetAltitude, this.altitude + climbRate * 0.5);
                    
                    // Speed increases during climb
                    this.speed = Math.min(this.targetSpeed * 0.3, this.speed + 3 * airDensityRatio);
                    
                    if (this.altitude >= this.targetAltitude * 0.8) {
                        this.flightMode = 'hover';
                    }
                    break;
                    
                case 'hover':
                    // Hover power depends on air density
                    this.currentPower = this.hoverPower * (1 / airDensityRatio) * 0.8;
                    
                    // Slower climb in hover
                    this.altitude = Math.min(this.maxAltitude, this.altitude + 0.5 * airDensityRatio);
                    this.speed = Math.min(this.targetSpeed * 0.5, this.speed + 1);
                    break;
                    
                case 'cruise':
                    // Drag calculation: D = 0.5 * rho * V^2 * Cd * A
                    const velocity = this.speed / 3.6; // m/s
                    const dragArea = 8; // m² frontal area
                    const dragCoeff = 0.25;
                    const drag = 0.5 * this.airDensity * velocity * velocity * dragCoeff * dragArea;
                    
                    // Power to overcome drag
                    const dragPower = (drag * velocity) / (motorEfficiency * 1000); // kW
                    
                    // Induced power for lift
                    const liftPower = (weight * velocity) / (motorEfficiency * 1000 * 15); // efficiency factor
                    
                    // Total cruise power
                    this.currentPower = Math.min(this.cruisePower * 1.5, dragPower + liftPower);
                    
                    // Wind effect - more realistic
                    const headwind = this.windSpeed * Math.cos(this.windDirection * Math.PI / 180);
                    this.speed = Math.max(0, this.speed - Math.abs(headwind) * 0.05);
                    this.speed = Math.min(this.targetSpeed, this.speed + 0.5 * airDensityRatio);
                    break;
                    
                case 'descend':
                    // Lower power during descent - can glide
                    const descentRate = 3 * airDensityRatio;
                    this.currentPower = this.cruisePower * 0.2; // Minimal power for controlled descent
                    this.altitude = Math.max(0, this.altitude - descentRate);
                    this.speed = Math.max(0, this.speed - 1);
                    if (this.altitude < 50) {
                        this.flightMode = 'landing';
                    }
                    break;
                    
                case 'landing':
                    // Need power for soft landing
                    this.currentPower = this.hoverPower * 0.4 * (1 / airDensityRatio);
                    this.altitude = Math.max(0, this.altitude - 2);
                    this.speed = Math.max(0, this.speed - 2);
                    if (this.altitude <= 0) {
                        this.flightMode = 'ground';
                        this.motorsRunning = false;
                    }
                    break;
                    
                default:
                    this.currentPower = 0;
            }
            
            // Calculate energy consumption with proper time step
            if (this.currentPower > 0) {
                const timeStep = 0.1; // seconds (10 Hz update)
                this.energyConsumed += this.currentPower * (timeStep / 3600); // kWh
                this.flightTime += timeStep;
                
                // Update SOC based on actual consumption
                const energyUsedKwh = this.currentPower * (timeStep / 3600);
                this.batterySOC = Math.max(0, this.batterySOC - (energyUsedKwh / effectiveBatteryCapacity * 100));
                
                // Low battery warning
                if (this.batterySOC < 20) {
                    this.batterySOC = Math.max(0, this.batterySOC - 0.01); // Faster drain at low SOC
                }
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

// ================================================
// 3D eVTOL Simulator using Three.js
// Realistic flight physics and 3D visualization
// ================================================

class EVTOLSimulator3D {
    constructor() {
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.isRunning = false;
        
        // Flight parameters (synced with 2D simulator)
        this.evtolType = 'multirotor';
        this.altitude = 0;
        this.speed = 0;
        this.targetAltitude = 500;
        this.targetSpeed = 150;
        this.flightMode = 'ground';
        this.motorsRunning = false;
        
        // Physics constants
        this.gravity = 9.81; // m/s²
        this.airDensity = 1.225; // kg/m³
        this.wingArea = 10; // m²
        this.mass = 2000; // kg (typical eVTOL)
        this.thrustPerMotor = 5000; // N
        this.dragCoefficient = 0.3;
        
        // Three.js objects
        this.evtol = null;
        this.rotors = [];
        this.environment = null;
        this.particles = [];
        
        this.init();
    }
    
    init() {
        this.container = document.getElementById('evtol-canvas-3d');
        if (!this.container) {
            this.create3DContainer();
            return;
        }
        
        this.setupScene();
        this.setupEnvironment();
        this.createEVTOL();
        this.setupControls();
        this.start();
    }
    
    create3DContainer() {
        const canvasContainer = document.querySelector('#evtol-simulation .simulation-view');
        if (!canvasContainer || !document.getElementById('evtol-canvas')) return;
        
        // Create 3D container
        const canvas3d = document.createElement('div');
        canvas3d.id = 'evtol-canvas-3d-container';
        canvas3d.style.cssText = 'display:none; width:100%; height:450px; position:relative;';
        
        const canvas3dInner = document.createElement('div');
        canvas3dInner.id = 'evtol-canvas-3d';
        canvas3dInner.style.cssText = 'width:100%; height:100%;';
        
        canvas3d.appendChild(canvas3dInner);
        canvasContainer.appendChild(canvas3d);
        
        // Add toggle button
        const controlsPanel = document.querySelector('.evtol-controls');
        if (controlsPanel) {
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'evtol-3d-toggle';
            toggleBtn.className = 'btn btn-secondary';
            toggleBtn.textContent = 'Switch to 3D View';
            toggleBtn.style.marginTop = '10px';
            toggleBtn.onclick = () => this.toggle3DView();
            controlsPanel.appendChild(toggleBtn);
        }
        
        this.container = canvas3dInner;
        this.init();
    }
    
    toggle3DView() {
        const canvas2d = document.getElementById('evtol-canvas');
        const canvas3dContainer = document.getElementById('evtol-canvas-3d-container');
        const toggleBtn = document.getElementById('evtol-3d-toggle');
        
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
        this.scene.fog = new THREE.Fog(0x87ceeb, 100, 2000);
        
        // Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 5000);
        this.camera.position.set(-30, 20, 30);
        this.camera.lookAt(0, 10, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.container.appendChild(this.renderer.domElement);
        
        // Orbit Controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 10;
            this.controls.maxDistance = 200;
            this.controls.target.set(0, 10, 0);
        }
        
        // Sky gradient
        const skyGeo = new THREE.SphereGeometry(2000, 32, 32);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 400 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(sky);
        
        // Lighting
        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambient);
        
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(100, 200, 50);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 500;
        sun.shadow.camera.left = -100;
        sun.shadow.camera.right = 100;
        sun.shadow.camera.top = 100;
        sun.shadow.camera.bottom = -100;
        this.scene.add(sun);
        
        window.addEventListener('resize', () => this.onResize());
    }
    
    setupEnvironment() {
        // Ground plane
        const groundGeo = new THREE.PlaneGeometry(2000, 2000);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x2d5a27,
            roughness: 0.9
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add some buildings for reference
        const buildingMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.7 });
        
        const buildings = [
            { x: 50, z: 30, w: 20, h: 80, d: 20 },
            { x: -40, z: 60, w: 30, h: 120, d: 25 },
            { x: 80, z: -50, w: 25, h: 60, d: 25 },
            { x: -60, z: -40, w: 35, h: 100, d: 30 },
            { x: 20, z: -80, w: 20, h: 40, d: 20 }
        ];
        
        buildings.forEach(b => {
            const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
            const building = new THREE.Mesh(geo, buildingMat);
            building.position.set(b.x, b.h / 2, b.z);
            building.castShadow = true;
            building.receiveShadow = true;
            this.scene.add(building);
        });
        
        // Runway
        const runwayGeo = new THREE.PlaneGeometry(300, 30);
        const runwayMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        const runway = new THREE.Mesh(runwayGeo, runwayMat);
        runway.rotation.x = -Math.PI / 2;
        runway.position.y = 0.01;
        runway.receiveShadow = true;
        this.scene.add(runway);
        
        // Runway markings
        const markingGeo = new THREE.PlaneGeometry(5, 2);
        const markingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        for (let i = -120; i < 120; i += 20) {
            const marking = new THREE.Mesh(markingGeo, markingMat);
            marking.rotation.x = -Math.PI / 2;
            marking.position.set(i, 0.02, 0);
            this.scene.add(marking);
        }
    }
    
    createEVTOL() {
        this.evtol = new THREE.Group();
        
        // Fuselage
        const fuselageGeo = new THREE.CapsuleGeometry(1.5, 6, 8, 16);
        const fuselageMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.3,
            metalness: 0.7
        });
        const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
        fuselage.rotation.z = Math.PI / 2;
        fuselage.castShadow = true;
        this.evtol.add(fuselage);
        
        // Cockpit
        const cockpitGeo = new THREE.SphereGeometry(1.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMat = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.7
        });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.position.set(2, 0.5, 0);
        cockpit.rotation.z = -Math.PI / 2;
        this.evtol.add(cockpit);
        
        // Wings
        const wingGeo = new THREE.BoxGeometry(2, 0.3, 12);
        const wingMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.4,
            metalness: 0.5
        });
        const wing = new THREE.Mesh(wingGeo, wingMat);
        wing.position.set(0, 0, 0);
        wing.castShadow = true;
        this.evtol.add(wing);
        
        // Tail
        const tailGeo = new THREE.BoxGeometry(1.5, 0.2, 4);
        const tail = new THREE.Mesh(tailGeo, wingMat);
        tail.position.set(-3, 0.5, 0);
        tail.castShadow = true;
        this.evtol.add(tail);
        
        const vTailGeo = new THREE.BoxGeometry(1, 2, 0.2);
        const vTail1 = new THREE.Mesh(vTailGeo, wingMat);
        vTail1.position.set(-3.5, 1.5, 1);
        vTail1.rotation.x = Math.PI / 6;
        vTail1.castShadow = true;
        this.evtol.add(vTail1);
        
        const vTail2 = new THREE.Mesh(vTailGeo, wingMat);
        vTail2.position.set(-3.5, 1.5, -1);
        vTail2.rotation.x = -Math.PI / 6;
        vTail2.castShadow = true;
        this.evtol.add(vTail2);
        
        // Create rotors based on type
        this.createRotors();
        
        // Position the eVTOL
        this.evtol.position.set(0, 0.5, 0);
        this.scene.add(this.evtol);
    }
    
    createRotors() {
        // Clear existing rotors
        this.rotors.forEach(r => this.evtol.remove(r));
        this.rotors = [];
        
        const rotorPositions = this.getRotorPositions();
        const rotorMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.5,
            metalness: 0.8
        });
        
        rotorPositions.forEach(pos => {
            // Motor housing
            const motorGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16);
            const motor = new THREE.Mesh(motorGeo, rotorMat);
            motor.position.set(pos.x, pos.y, pos.z);
            motor.castShadow = true;
            this.evtol.add(motor);
            
            // Rotor disc (simplified blade representation)
            const discGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.05, 32);
            const discMat = new THREE.MeshStandardMaterial({
                color: 0x222222,
                transparent: true,
                opacity: 0.6
            });
            const disc = new THREE.Mesh(discGeo, discMat);
            disc.position.set(pos.x, pos.y + 0.25, pos.z);
            this.evtol.add(disc);
            this.rotors.push(disc);
            
            // Blade visualization
            const bladeGeo = new THREE.BoxGeometry(0.1, 0.02, 2.2);
            const bladeMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
            
            for (let i = 0; i < 4; i++) {
                const blade = new THREE.Mesh(bladeGeo, bladeMat);
                blade.position.set(pos.x, pos.y + 0.25, pos.z);
                blade.rotation.y = (i * Math.PI) / 2;
                blade.castShadow = true;
                this.evtol.add(blade);
            }
        });
    }
    
    getRotorPositions() {
        switch(this.evtolType) {
            case 'multirotor':
                return [
                    { x: 3, y: 0.5, z: 3 },
                    { x: 3, y: 0.5, z: -3 },
                    { x: -2, y: 0.5, z: 3 },
                    { x: -2, y: 0.5, z: -3 },
                    { x: 0.5, y: 0.5, z: 4 },
                    { x: 0.5, y: 0.5, z: -4 }
                ];
            case 'vectored':
                return [
                    { x: 3, y: 0, z: 2 },
                    { x: 3, y: 0, z: -2 },
                    { x: -2, y: 0, z: 2 },
                    { x: -2, y: 0, z: -2 }
                ];
            case 'lift+cruise':
                return [
                    { x: 3, y: 0.5, z: 2 },
                    { x: 3, y: 0.5, z: -2 },
                    { x: -1, y: 0.5, z: 0 }
                ];
            default:
                return [{ x: 3, y: 0.5, z: 0 }];
        }
    }
    
    setupControls() {
        // Listen for 2D simulator events
        document.addEventListener('evtolUpdate', (e) => {
            this.updateFromSimulator(e.detail);
        });
    }
    
    updateFromSimulator(params) {
        if (params.type !== undefined) {
            this.evtolType = params.type;
            this.createRotors();
        }
        if (params.altitude !== undefined) this.altitude = params.altitude;
        if (params.speed !== undefined) this.speed = params.speed;
        if (params.flightMode !== undefined) this.flightMode = params.flightMode;
        if (params.motorsRunning !== undefined) this.motorsRunning = params.motorsRunning;
    }
    
    // Realistic physics calculations
    calculatePhysics(dt) {
        if (!this.motorsRunning) return;
        
        const numRotors = this.getRotorPositions().length;
        const totalThrust = numRotors * this.thrustPerMotor;
        
        // Forces
        const weight = this.mass * this.gravity;
        const thrust = totalThrust;
        const lift = this.calculateLift();
        const drag = this.calculateDrag();
        
        // Vertical acceleration
        let verticalAccel = 0;
        
        switch(this.flightMode) {
            case 'takeoff':
                verticalAccel = (thrust - weight) / this.mass;
                verticalAccel = Math.max(0, verticalAccel);
                break;
            case 'hover':
                verticalAccel = 0;
                break;
            case 'cruise':
                // Forward acceleration
                const forwardAccel = (thrust * 0.3 - drag) / this.mass;
                this.speed = Math.min(this.maxSpeed, this.speed + forwardAccel * dt);
                verticalAccel = (lift + thrust * 0.7 - weight) / this.mass;
                break;
            case 'descend':
                verticalAccel = -2; // Controlled descent
                break;
            case 'landing':
                verticalAccel = -3;
                break;
        }
        
        // Update altitude
        this.altitude = Math.max(0, this.altitude + verticalAccel * dt);
        
        // Update eVTOL position
        this.evtol.position.y = this.altitude + 0.5;
        
        // Tilt based on movement
        const tiltAngle = this.speed * 0.005;
        this.evtol.rotation.x = Math.sin(tiltAngle);
    }
    
    calculateLift() {
        // L = 0.5 * ρ * v² * S * CL
        const v = this.speed / 3.6; // Convert km/h to m/s
        return 0.5 * this.airDensity * v * v * this.wingArea * 1.0;
    }
    
    calculateDrag() {
        // D = 0.5 * ρ * v² * S * CD
        const v = this.speed / 3.6;
        return 0.5 * this.airDensity * v * v * this.wingArea * this.dragCoefficient;
    }
    
    updateRotors(dt) {
        if (!this.motorsRunning) return;
        
        // Rotor rotation speed based on power
        let rotorSpeed = 0;
        switch(this.flightMode) {
            case 'takeoff':
                rotorSpeed = 50;
                break;
            case 'hover':
                rotorSpeed = 30;
                break;
            case 'cruise':
                rotorSpeed = 40;
                break;
            case 'descend':
            case 'landing':
                rotorSpeed = 20;
                break;
            default:
                rotorSpeed = 0;
        }
        
        this.rotors.forEach(rotor => {
            rotor.rotation.y += rotorSpeed * dt;
        });
    }
    
    createParticle(x, y, z) {
        const geo = new THREE.SphereGeometry(0.1, 4, 4);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.5
        });
        const particle = new THREE.Mesh(geo, mat);
        particle.position.set(x, y, z);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            -Math.random() * 3 - 1,
            (Math.random() - 0.5) * 2
        );
        particle.life = 1;
        
        this.scene.add(particle);
        this.particles.push(particle);
    }
    
    updateParticles(dt) {
        if (!this.motorsRunning || this.flightMode !== 'ground') return;
        
        // Create new particles
        if (Math.random() < 0.3) {
            const pos = this.evtol.position;
            this.createParticle(
                pos.x + (Math.random() - 0.5) * 4,
                pos.y - 0.5,
                pos.z + (Math.random() - 0.5) * 4
            );
        }
        
        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.position.add(p.velocity.clone().multiplyScalar(dt));
            p.life -= dt * 0.5;
            p.material.opacity = p.life * 0.5;
            
            if (p.life <= 0) {
                this.scene.remove(p);
                this.particles.splice(i, 1);
            }
        }
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
        this.lastTime = performance.now();
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        
        // Update physics
        this.calculatePhysics(dt);
        
        // Update rotors
        this.updateRotors(dt);
        
        // Update particles
        this.updateParticles(dt);
        
        // Update controls
        if (this.controls) this.controls.update();
        
        // Render
        this.renderer.render(this.scene, this.camera);
        
        requestAnimationFrame(() => this.animate());
    }
    
    // Sync with 2D simulator
    syncWithSimulator(simulator) {
        this.evtolType = simulator.evtolType;
        this.altitude = simulator.altitude;
        this.speed = simulator.speed;
        this.flightMode = simulator.flightMode;
        this.motorsRunning = simulator.motorsRunning;
        this.targetAltitude = simulator.targetAltitude;
        this.targetSpeed = simulator.targetSpeed;
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof THREE !== 'undefined') {
            window.evtolSimulator3D = new EVTOLSimulator3D();
        }
    }, 1000);
});
