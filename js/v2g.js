/**
 * V2G (Vehicle-to-Grid) Simulator
 * Advanced Electric Vehicle Charging and Grid Integration
 * with realistic graphics and comprehensive parameters
 */

class V2GSimulator {
    constructor() {
        // Vehicle Battery Parameters
        this.batteryCapacity = 75;      // kWh (typical EV battery)
        this.maxChargePower = 11;       // kW (home charging - Level 2)
        this.maxDischargePower = 10;    // kW (V2G discharge)
        this.batterySOC = 50;           // State of Charge (%)
        this.batteryHealth = 95;        // Battery health (%)
        this.batteryType = 'NMC';       // Battery chemistry (NMC, LFP, NCA)
        
        // Charger Parameters
        this.chargeCurrent = 32;        // Amps (Level 2 typical)
        this.voltage = 240;            // Volts
        this.chargerEfficiency = 92;    // Charging efficiency %
        this.dischargeEfficiency = 90;  // V2G discharge efficiency %
        
        // Grid Parameters
        this.gridPrice = 0.12;          // $/kWh buy price
        this.sellPrice = 0.08;          // $/kWh sell price
        this.gridDemand = 5;            // kW demand
        this.gridFrequency = 60;        // Hz
        this.gridVoltage = 120;         // V (single phase)
        
        // Time & Cost Parameters
        this.timeOfDay = 12;            // Hour (0-24)
        this.simulationSpeed = 1;       // Real-time factor
        this.electricityRate = 0.12;   // $/kWh
        
        // Simulation State
        this.charging = false;
        this.discharging = false;
        this.currentPower = 0;           // kW (+ charging, - discharging)
        this.energyTransferred = 0;      // kWh
        this.totalCost = 0;              // $
        this.totalProfit = 0;           // $
        this.sessionCost = 0;            // $ (current session)
        this.sessionProfit = 0;         // $ (current session)
        
        // Animation
        this.time = 0;
        this.animationId = null;
        this.particles = [];
        
        // Historical data for graph
        this.socHistory = [];
        this.powerHistory = [];
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('v2g-canvas');
        if (!this.canvas) {
            console.log('V2G canvas not found');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.graphCanvas = document.getElementById('v2g-graph');
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
        // SOC Slider
        const socSlider = document.getElementById('v2g-soc-slider');
        const socValue = document.getElementById('v2g-soc-value');
        if (socSlider && socValue) {
            socSlider.addEventListener('input', (e) => {
                this.batterySOC = parseFloat(e.target.value);
                socValue.textContent = this.batterySOC.toFixed(0);
                this.calculate();
            });
        }
        
        // Time Slider
        const timeSlider = document.getElementById('v2g-time-slider');
        const timeValue = document.getElementById('v2g-time-value');
        if (timeSlider && timeValue) {
            timeSlider.addEventListener('input', (e) => {
                this.timeOfDay = parseFloat(e.target.value);
                timeValue.textContent = this.formatTime(this.timeOfDay);
                this.updateGridPrice();
                this.calculate();
            });
        }
        
        // Grid Demand Slider
        const gridSlider = document.getElementById('v2g-grid-slider');
        const gridValue = document.getElementById('v2g-grid-value');
        if (gridSlider && gridValue) {
            gridSlider.addEventListener('input', (e) => {
                this.gridDemand = parseFloat(e.target.value);
                gridValue.textContent = this.gridDemand.toFixed(1);
                this.calculate();
            });
        }
        
        // Battery Capacity Slider (Advanced)
        const capacitySlider = document.getElementById('v2g-capacity-slider');
        const capacityValue = document.getElementById('v2g-capacity-value');
        if (capacitySlider && capacityValue) {
            capacitySlider.addEventListener('input', (e) => {
                this.batteryCapacity = parseFloat(e.target.value);
                capacityValue.textContent = this.batteryCapacity.toFixed(0);
                this.calculate();
            });
        }
        
        // Charge Power Slider (Advanced)
        const chargePowerSlider = document.getElementById('v2g-charge-power-slider');
        const chargePowerValue = document.getElementById('v2g-charge-power-value');
        if (chargePowerSlider && chargePowerValue) {
            chargePowerSlider.addEventListener('input', (e) => {
                this.maxChargePower = parseFloat(e.target.value);
                chargePowerValue.textContent = this.maxChargePower.toFixed(1);
                this.calculate();
            });
        }
        
        // Discharge Power Slider (Advanced)
        const dischargePowerSlider = document.getElementById('v2g-discharge-power-slider');
        const dischargePowerValue = document.getElementById('v2g-discharge-power-value');
        if (dischargePowerSlider && dischargePowerValue) {
            dischargePowerSlider.addEventListener('input', (e) => {
                this.maxDischargePower = parseFloat(e.target.value);
                dischargePowerValue.textContent = this.maxDischargePower.toFixed(1);
                this.calculate();
            });
        }
        
        // Charge Current Slider (Advanced)
        const chargeCurrentSlider = document.getElementById('v2g-current-slider');
        const chargeCurrentValue = document.getElementById('v2g-current-value');
        if (chargeCurrentSlider && chargeCurrentValue) {
            chargeCurrentSlider.addEventListener('input', (e) => {
                this.chargeCurrent = parseFloat(e.target.value);
                chargeCurrentValue.textContent = this.chargeCurrent.toFixed(0);
                this.calculate();
            });
        }
        
        // Efficiency Slider (Advanced)
        const efficiencySlider = document.getElementById('v2g-efficiency-slider');
        const efficiencyValue = document.getElementById('v2g-efficiency-value');
        if (efficiencySlider && efficiencyValue) {
            efficiencySlider.addEventListener('input', (e) => {
                this.chargerEfficiency = parseFloat(e.target.value);
                efficiencyValue.textContent = this.chargerEfficiency.toFixed(0);
                this.calculate();
            });
        }
        
        // Battery Health Slider (Advanced)
        const healthSlider = document.getElementById('v2g-health-slider');
        const healthValue = document.getElementById('v2g-health-value');
        if (healthSlider && healthValue) {
            healthSlider.addEventListener('input', (e) => {
                this.batteryHealth = parseFloat(e.target.value);
                healthValue.textContent = this.batteryHealth.toFixed(0);
                this.calculate();
            });
        }
        
        // Mode buttons
        const chargeBtn = document.getElementById('v2g-charge-btn');
        if (chargeBtn) {
            chargeBtn.addEventListener('click', () => {
                this.charging = !this.charging;
                if (this.charging) this.discharging = false;
                chargeBtn.classList.toggle('active', this.charging);
                document.getElementById('v2g-discharge-btn')?.classList.remove('active');
                this.calculate();
            });
        }
        
        const dischargeBtn = document.getElementById('v2g-discharge-btn');
        if (dischargeBtn) {
            dischargeBtn.addEventListener('click', () => {
                this.discharging = !this.discharging;
                if (this.discharging) this.charging = false;
                dischargeBtn.classList.toggle('active', this.discharging);
                document.getElementById('v2g-charge-btn')?.classList.remove('active');
                this.calculate();
            });
        }
        
        const stopBtn = document.getElementById('v2g-stop-btn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.charging = false;
                this.discharging = false;
                document.getElementById('v2g-charge-btn')?.classList.remove('active');
                document.getElementById('v2g-discharge-btn')?.classList.remove('active');
                this.calculate();
            });
        }
        
        const resetBtn = document.getElementById('v2g-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSession();
            });
        }
    }
    
    resetSession() {
        this.sessionCost = 0;
        this.sessionProfit = 0;
        this.energyTransferred = 0;
        this.socHistory = [];
        this.powerHistory = [];
        this.calculate();
    }
    
    updateGridPrice() {
        // Time-of-use pricing with realistic rates
        if (this.timeOfDay >= 16 && this.timeOfDay < 21) {
            // Peak hours (4 PM - 9 PM)
            this.gridPrice = 0.28;
            this.sellPrice = 0.18;
        } else if (this.timeOfDay >= 7 && this.timeOfDay < 10) {
            // Morning peak (7 AM - 10 AM)
            this.gridPrice = 0.22;
            this.sellPrice = 0.14;
        } else if (this.timeOfDay >= 21 || this.timeOfDay < 6) {
            // Off-peak (night - 9 PM - 6 AM)
            this.gridPrice = 0.08;
            this.sellPrice = 0.04;
        } else if (this.timeOfDay >= 10 && this.timeOfDay < 16) {
            // Mid-day solar (10 AM - 4 PM) - lower prices due to solar
            this.gridPrice = 0.10;
            this.sellPrice = 0.06;
        } else {
            // Regular hours
            this.gridPrice = 0.14;
            this.sellPrice = 0.08;
        }
    }
    
    formatTime(hour) {
        const h = Math.floor(hour);
        const m = Math.round((hour - h) * 60);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return h12 + ':' + m.toString().padStart(2, '0') + ' ' + ampm;
    }
    
    calculate() {
        this.updateGridPrice();
        
        // Calculate power based on mode and limits
        if (this.charging) {
            // Charging - limited by SOC, max power, and current
            const availableCapacity = this.batteryCapacity * (100 - this.batterySOC) / 100;
            const powerByCapacity = Math.min(this.maxChargePower, availableCapacity * 2);
            const powerByCurrent = (this.chargeCurrent * this.voltage) / 1000;
            const powerByHealth = 1 - (100 - this.batteryHealth) / 200;
            
            this.currentPower = Math.min(powerByCapacity, powerByCurrent) * powerByHealth;
            this.currentPower = Math.max(0, this.currentPower);
            
            // Update SOC (simulate gradual charging)
            const chargeRate = this.currentPower / this.batteryCapacity * 100;
            this.batterySOC = Math.min(100, this.batterySOC + chargeRate * 0.1);
            
        } else if (this.discharging) {
            // V2G Discharging - limited by SOC and max discharge
            const availableEnergy = this.batteryCapacity * this.batterySOC / 100;
            const powerByCapacity = Math.min(this.maxDischargePower, availableEnergy * 2);
            const powerByHealth = 1 - (100 - this.batteryHealth) / 200;
            
            this.currentPower = -Math.min(powerByCapacity, powerByHealth);
            this.currentPower = Math.max(0, this.currentPower);
            
            // Update SOC (simulate gradual discharging)
            const dischargeRate = Math.abs(this.currentPower) / this.batteryCapacity * 100;
            this.batterySOC = Math.max(10, this.batterySOC - dischargeRate * 0.1);
            
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
        // Power reading
        const powerReading = document.getElementById('v2g-power-reading');
        if (powerReading) {
            const powerText = this.currentPower > 0 ? 
                '+' + this.currentPower.toFixed(1) + ' kW' :
                this.currentPower < 0 ? 
                    Math.abs(this.currentPower).toFixed(1) + ' kW' :
                    '0 kW';
            powerReading.textContent = powerText;
        }
        
        // SOC reading
        const socReading = document.getElementById('v2g-soc-reading');
        if (socReading) socReading.textContent = this.batterySOC.toFixed(0) + '%';
        
        // Capacity reading (kWh in battery)
        const capacityReading = document.getElementById('v2g-capacity-reading');
        if (capacityReading) {
            const kWh = this.batteryCapacity * this.batterySOC / 100;
            capacityReading.textContent = kWh.toFixed(1) + ' / ' + this.batteryCapacity.toFixed(0) + ' kWh';
        }
        
        // Grid Price reading
        const priceReading = document.getElementById('v2g-price-reading');
        if (priceReading) priceReading.textContent = '$' + this.gridPrice.toFixed(2) + '/kWh';
        
        // Grid Demand reading
        const gridReading = document.getElementById('v2g-grid-demand-reading');
        if (gridReading) gridReading.textContent = this.gridDemand.toFixed(1) + ' kW';
        
        // Calculate cost/profit
        if (this.currentPower !== 0) {
            const energy = Math.abs(this.currentPower) * 0.1;
            if (this.currentPower > 0) {
                // Charging - cost (accounting for efficiency)
                const actualEnergy = energy / (this.chargerEfficiency / 100);
                this.sessionCost += actualEnergy * this.gridPrice;
            } else {
                // Discharging - profit (accounting for efficiency)
                const actualEnergy = energy * (this.dischargeEfficiency / 100);
                this.sessionProfit += actualEnergy * this.sellPrice;
            }
        }
        
        // Cost reading
        const costReading = document.getElementById('v2g-cost-reading');
        if (costReading) costReading.textContent = '$' + this.sessionCost.toFixed(2);
        
        // Profit reading
        const profitReading = document.getElementById('v2g-profit-reading');
        if (profitReading) profitReading.textContent = '$' + this.sessionProfit.toFixed(2);
        
        // Efficiency reading (advanced)
        const effReading = document.getElementById('v2g-efficiency-reading');
        if (effReading) {
            effReading.textContent = this.charging ? 
                this.chargerEfficiency + '%' : 
                this.discharging ? this.dischargeEfficiency + '%' : '--';
        }
        
        // Health reading
        const healthReading = document.getElementById('v2g-health-reading');
        if (healthReading) healthReading.textContent = this.batteryHealth.toFixed(0) + '%';
        
        // Power loss reading
        const lossReading = document.getElementById('v2g-loss-reading');
        if (lossReading) {
            if (this.currentPower > 0) {
                const loss = this.currentPower * (1 - this.chargerEfficiency / 100);
                lossReading.textContent = loss.toFixed(2) + ' kW';
            } else if (this.currentPower < 0) {
                const loss = Math.abs(this.currentPower) * (1 - this.dischargeEfficiency / 100);
                lossReading.textContent = loss.toFixed(2) + ' kW';
            } else {
                lossReading.textContent = '0 kW';
            }
        }
    }
    
    recordHistory() {
        this.socHistory.push(this.batterySOC);
        this.powerHistory.push(this.currentPower);
        
        if (this.socHistory.length > 100) {
            this.socHistory.shift();
            this.powerHistory.shift();
        }
    }
    
    start() {
        if (this.animationId || !this.canvas) return;
        console.log('Starting V2G simulator');
        this.animate();
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    animate() {
        this.time += 0.016 * this.simulationSpeed;
        
        this.updateParticles();
        
        this.draw();
        if (this.graphCanvas) this.drawGraph();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateParticles() {
        if (this.currentPower !== 0) {
            if (Math.random() < 0.3) {
                const flowDir = this.currentPower > 0 ? 1 : -1;
                this.particles.push({
                    x: flowDir > 0 ? 750 : 50,
                    y: 80 + Math.random() * 40,
                    speed: 2 + Math.random() * 2,
                    direction: flowDir,
                    size: 3 + Math.random() * 3,
                    color: flowDir > 0 ? '#00ff88' : '#ffaa00'
                });
            }
        }
        
        this.particles = this.particles.filter(p => {
            p.x += p.speed * p.direction;
            p.size *= 0.98;
            return p.x > 0 && p.x < 800 && p.size > 0.5;
        });
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // Sky gradient background (time-based)
        const isNight = this.timeOfDay >= 21 || this.timeOfDay < 6;
        const isEvening = this.timeOfDay >= 17 && this.timeOfDay < 21;
        const isMorning = this.timeOfDay >= 6 && this.timeOfDay < 10;
        
        let skyGradient = ctx.createLinearGradient(0, 0, 0, h);
        if (isNight) {
            skyGradient.addColorStop(0, '#0a0a1a');
            skyGradient.addColorStop(1, '#1a1a3a');
        } else if (isEvening) {
            skyGradient.addColorStop(0, '#1a0a2a');
            skyGradient.addColorStop(1, '#2a1a3a');
        } else if (isMorning) {
            skyGradient.addColorStop(0, '#1a2a3a');
            skyGradient.addColorStop(1, '#2a3a4a');
        } else {
            skyGradient.addColorStop(0, '#1a2a4a');
            skyGradient.addColorStop(1, '#2a3a5a');
        }
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, w, h);
        
        // Stars (if night)
        if (isNight) {
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 50; i++) {
                const sx = (i * 137) % w;
                const sy = (i * 97) % (h * 0.5);
                const size = (i % 3) * 0.5 + 0.5;
                ctx.globalAlpha = 0.3 + (i % 5) * 0.15;
                ctx.beginPath();
                ctx.arc(sx, sy, size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
        
        // Moon (if night)
        if (isNight) {
            ctx.fillStyle = '#f0f0f0';
            ctx.beginPath();
            ctx.arc(700, 60, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#e0e0e0';
            ctx.beginPath();
            ctx.arc(690, 55, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(710, 65, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Ground/pavement
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(0, h - 180, w, 180);
        
        // Parking space
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(150, h - 170, 200, 150);
        
        // Parking lines (yellow)
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(150, h - 170);
        ctx.lineTo(150, h - 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(350, h - 170);
        ctx.lineTo(350, h - 20);
        ctx.stroke();
        
        // Draw EV Charger (Realistic Level 2)
        const chargerX = 250;
        const chargerY = h - 120;
        
        // Charger pole
        const chargerGradient = ctx.createLinearGradient(chargerX - 20, 0, chargerX + 20, 0);
        chargerGradient.addColorStop(0, '#2a2a2a');
        chargerGradient.addColorStop(0.5, '#4a4a4a');
        chargerGradient.addColorStop(1, '#2a2a2a');
        ctx.fillStyle = chargerGradient;
        ctx.fillRect(chargerX - 15, chargerY - 80, 30, 100);
        
        // Charger head
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(chargerX - 25, chargerY - 95, 50, 30);
        
        // Screen (LED display)
        const screenGradient = ctx.createLinearGradient(chargerX - 20, chargerY - 90, chargerX - 20, chargerY - 70);
        screenGradient.addColorStop(0, '#001a00');
        screenGradient.addColorStop(1, '#003300');
        ctx.fillStyle = screenGradient;
        ctx.fillRect(chargerX - 20, chargerY - 90, 40, 20);
        
        // Screen text
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 8px monospace';
        const powerText = this.currentPower > 0 ? this.currentPower.toFixed(1) : '0.0';
        ctx.fillText(powerText + 'kW', chargerX - 18, chargerY - 77);
        
        // Charging indicator LED
        if (this.charging) {
            ctx.fillStyle = '#00ff00';
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 10;
        } else if (this.discharging) {
            ctx.fillStyle = '#ffaa00';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 10;
        } else {
            ctx.fillStyle = '#444444';
            ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(chargerX + 15, chargerY - 82, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Charging cable
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(chargerX, chargerY - 65);
        ctx.quadraticCurveTo(chargerX + 30, chargerY - 50, chargerX + 20, chargerY - 30);
        ctx.stroke();
        
        // Connector handle
        ctx.fillStyle = '#333333';
        ctx.fillRect(chargerX + 12, chargerY - 45, 16, 20);
        
        // Draw Electric Vehicle (Modern EV)
        const carX = 250;
        const carY = h - 140;
        
        // Car shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(carX, carY + 35, 90, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Car body
        let carColor;
        if (this.charging) {
            carColor = '#2d5a8a';
        } else if (this.discharging) {
            carColor = '#8a6a2d';
        } else {
            carColor = '#2a4a6a';
        }
        
        const carGradient = ctx.createLinearGradient(carX - 90, carY, carX + 90, carY);
        carGradient.addColorStop(0, carColor);
        carGradient.addColorStop(0.5, carColor);
        carGradient.addColorStop(1, carColor);
        ctx.fillStyle = carGradient;
        
        // Main body shape
        ctx.beginPath();
        ctx.moveTo(carX - 90, carY + 20);
        ctx.lineTo(carX - 95, carY - 10);
        ctx.lineTo(carX - 80, carY - 30);
        ctx.lineTo(carX - 40, carY - 45);
        ctx.lineTo(carX + 40, carY - 45);
        ctx.lineTo(carX + 80, carY - 30);
        ctx.lineTo(carX + 95, carY - 10);
        ctx.lineTo(carX + 90, carY + 20);
        ctx.closePath();
        ctx.fill();
        
        // Windows
        ctx.fillStyle = '#1a3a5a';
        ctx.beginPath();
        ctx.moveTo(carX - 70, carY - 25);
        ctx.lineTo(carX - 35, carY - 38);
        ctx.lineTo(carX + 35, carY - 38);
        ctx.lineTo(carX + 70, carY - 25);
        ctx.lineTo(carX + 65, carY - 15);
        ctx.lineTo(carX - 65, carY - 15);
        ctx.closePath();
        ctx.fill();
        
        // Headlights
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(carX - 75, carY - 5, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(carX + 75, carY - 5, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // DRL
        ctx.fillStyle = '#aaffff';
        ctx.beginPath();
        ctx.ellipse(carX - 80, carY, 12, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(carX + 80, carY, 12, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Taillights
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 5;
        ctx.fillRect(carX - 85, carY + 5, 15, 6);
        ctx.fillRect(carX + 70, carY + 5, 15, 6);
        ctx.shadowBlur = 0;
        
        // Wheels
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(carX - 55, carY + 25, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(carX + 55, carY + 25, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Wheel rims
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.arc(carX - 55, carY + 25, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(carX + 55, carY + 25, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // EV badge
        ctx.fillStyle = '#00aaff';
        ctx.font = 'bold 8px Arial';
        ctx.fillText('EV', carX - 8, carY + 15);
        
        // Battery indicator on car
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(carX - 30, carY - 20, 60, 15);
        
        // SOC bar
        let socColor;
        if (this.batterySOC > 50) {
            socColor = '#00ff00';
        } else if (this.batterySOC > 20) {
            socColor = '#ffff00';
        } else {
            socColor = '#ff0000';
        }
        const socWidth = (this.batterySOC / 100) * 56;
        ctx.fillStyle = socColor;
        ctx.fillRect(carX - 28, carY - 18, socWidth, 11);
        
        // Battery outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(carX - 30, carY - 20, 60, 15);
        
        // Grid Connection
        const gridX = 700;
        const gridY = 50;
        
        // Power pole
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(gridX - 5, gridY, 10, 120);
        
        // Power lines
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gridX, gridY + 20);
        ctx.lineTo(gridX - 30, gridY + 40);
        ctx.moveTo(gridX, gridY + 20);
        ctx.lineTo(gridX + 30, gridY + 40);
        ctx.stroke();
        
        // Transformer
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(gridX - 25, gridY + 35, 50, 40);
        
        // Transformer coils
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(gridX, gridY + 50, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(gridX, gridY + 62, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Grid icon
        ctx.fillStyle = '#ffaa00';
        ctx.font = '16px Arial';
        ctx.fillText('E', gridX - 30, gridY + 25);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('GRID', gridX + 5, gridY + 25);
        
        // Power flow particles
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.size / 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        // Power flow arrows
        if (this.currentPower !== 0) {
            const flowDir = this.currentPower > 0 ? 1 : -1;
            ctx.fillStyle = flowDir > 0 ? '#00ff88' : '#ffaa00';
            
            for (let i = 0; i < 3; i++) {
                const arrowX = flowDir > 0 ? 
                    400 + ((this.time * 30 + i * 100) % 200) :
                    550 - ((this.time * 30 + i * 100) % 200);
                const arrowY = 180 + Math.sin(arrowX * 0.02) * 20;
                
                ctx.beginPath();
                if (flowDir > 0) {
                    ctx.moveTo(arrowX, arrowY);
                    ctx.lineTo(arrowX - 10, arrowY - 5);
                    ctx.lineTo(arrowX - 10, arrowY + 5);
                } else {
                    ctx.moveTo(arrowX, arrowY);
                    ctx.lineTo(arrowX + 10, arrowY - 5);
                    ctx.lineTo(arrowX + 10, arrowY + 5);
                }
                ctx.closePath();
                ctx.fill();
            }
        }
        
        // Info panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(20, 20, 180, 130);
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, 180, 130);
        
        // Time display
        ctx.fillStyle = '#00aaff';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(this.formatTime(this.timeOfDay), 35, 50);
        
        // Price indicator
        let priceColor;
        if (this.gridPrice > 0.20) {
            priceColor = '#ff4444';
        } else if (this.gridPrice > 0.12) {
            priceColor = '#ffaa00';
        } else {
            priceColor = '#44ff44';
        }
        ctx.fillStyle = priceColor;
        ctx.font = '14px monospace';
        ctx.fillText('Grid: $' + this.gridPrice.toFixed(2) + '/kWh', 35, 75);
        ctx.fillStyle = '#888888';
        ctx.fillText('Sell: $' + this.sellPrice.toFixed(2) + '/kWh', 35, 92);
        
        // Status
        ctx.font = '12px monospace';
        if (this.charging) {
            ctx.fillStyle = '#00ff00';
            ctx.fillText('CHARGING', 35, 115);
        } else if (this.discharging) {
            ctx.fillStyle = '#ffaa00';
            ctx.fillText('V2G DISCHARGING', 35, 115);
        } else {
            ctx.fillStyle = '#666666';
            ctx.fillText('IDLE', 35, 115);
        }
        
        // Efficiency info
        ctx.fillStyle = '#888888';
        ctx.font = '10px monospace';
        ctx.fillText('Efficiency: ' + this.chargerEfficiency + '%', 35, 138);
        
        // Battery health
        let healthColor;
        if (this.batteryHealth > 80) {
            healthColor = '#44ff44';
        } else if (this.batteryHealth > 60) {
            healthColor = '#ffff44';
        } else {
            healthColor = '#ff4444';
        }
        ctx.fillStyle = healthColor;
        ctx.fillText('Health: ' + this.batteryHealth.toFixed(0) + '%', 110, 138);
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
        ctx.font = '11px monospace';
        ctx.fillText('24-Hour Price & SOC', 10, 18);
        
        // Draw price curve
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let hour = 0; hour <= 24; hour++) {
            let price;
            if (hour >= 16 && hour < 21) price = 0.28;
            else if (hour >= 7 && hour < 10) price = 0.22;
            else if (hour >= 21 || hour < 6) price = 0.08;
            else if (hour >= 10 && hour < 16) price = 0.10;
            else price = 0.14;
            
            const x = (hour / 24) * (w - 40) + 20;
            const y = h - 25 - (price / 0.35) * (h - 50);
            
            if (hour === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Fill under curve
        ctx.lineTo(w - 20, h - 25);
        ctx.lineTo(20, h - 25);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 170, 255, 0.1)';
        ctx.fill();
        
        // Current time marker
        const timeX = (this.timeOfDay / 24) * (w - 40) + 20;
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(timeX, 30);
        ctx.lineTo(timeX, h - 15);
        ctx.stroke();
        
        // SOC history
        if (this.socHistory.length > 1) {
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let i = 0; i < this.socHistory.length; i++) {
                const x = (i / this.socHistory.length) * (w - 40) + 20;
                const y = h - 25 - (this.socHistory[i] / 100) * (h - 50);
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        // Legend
        ctx.fillStyle = '#00aaff';
        ctx.fillRect(10, h - 50, 30, 3);
        ctx.fillStyle = '#888';
        ctx.font = '8px monospace';
        ctx.fillText('Price', 45, h - 47);
        
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(80, h - 50, 30, 3);
        ctx.fillStyle = '#888';
        ctx.fillText('SOC', 115, h - 47);
        
        // Time labels
        ctx.fillStyle = '#666';
        for (let hour = 0; hour <= 24; hour += 6) {
            const x = (hour / 24) * (w - 40) + 20;
            ctx.fillText(hour + ':00', x - 10, h - 5);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    window.v2gSimulator = new V2GSimulator();
});
