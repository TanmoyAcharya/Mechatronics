/**
 * V2G (Vehicle-to-Grid) Simulator
 * Electric vehicle charging and grid integration
 */

class V2GSimulator {
    constructor() {
        // Vehicle parameters
        this.batteryCapacity = 75;     // kWh (typical EV battery)
        this.maxChargePower = 11;      // kW (home charging)
        this.maxDischargePower = 10;   // kW (V2G discharge)
        this.batterySOC = 50;          // State of Charge (%)
        
        // Grid parameters
        this.gridPrice = 0.12;         // $/kWh buy price
        this.sellPrice = 0.08;         // $/kWh sell price
        this.gridDemand = 5;           // kW demand
        
        // Charger settings
        this.chargeCurrent = 32;       // Amps
        this.voltage = 240;            // Volts
        this.charging = false;
        this.discharging = false;
        
        // Time simulation
        this.timeOfDay = 12;           // Hour (0-24)
        this.simulationSpeed = 1;       // Real-time factor
        
        // Output
        this.currentPower = 0;          // kW (+ charging, - discharging)
        this.energyTransferred = 0;     // kWh
        this.cost = 0;                  // $
        this.profit = 0;               // $
        
        // Animation
        this.time = 0;
        this.animationId = null;
        
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
            this.canvas.height = 400;
        }
        if (this.graphCanvas && this.graphCanvas.width === 0) {
            this.graphCanvas.width = 380;
            this.graphCanvas.height = 200;
        }
        
        this.calculate();
    }
    
    setupControls() {
        const socSlider = document.getElementById('v2g-soc-slider');
        const socValue = document.getElementById('v2g-soc-value');
        if (socSlider && socValue) {
            socSlider.addEventListener('input', (e) => {
                this.batterySOC = parseFloat(e.target.value);
                socValue.textContent = this.batterySOC.toFixed(0);
                this.calculate();
            });
        }
        
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
        
        const gridSlider = document.getElementById('v2g-grid-slider');
        const gridValue = document.getElementById('v2g-grid-value');
        if (gridSlider && gridValue) {
            gridSlider.addEventListener('input', (e) => {
                this.gridDemand = parseFloat(e.target.value);
                gridValue.textContent = this.gridDemand.toFixed(1);
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
    }
    
    updateGridPrice() {
        // Time-of-use pricing
        if (this.timeOfDay >= 16 && this.timeOfDay < 21) {
            // Peak hours
            this.gridPrice = 0.25;
            this.sellPrice = 0.15;
        } else if (this.timeOfDay >= 7 && this.timeOfDay < 10) {
            // Morning peak
            this.gridPrice = 0.20;
            this.sellPrice = 0.12;
        } else if (this.timeOfDay >= 21 || this.timeOfDay < 7) {
            // Off-peak (night)
            this.gridPrice = 0.08;
            this.sellPrice = 0.05;
        } else {
            // Mid-day
            this.gridPrice = 0.12;
            this.sellPrice = 0.08;
        }
    }
    
    formatTime(hour) {
        const h = Math.floor(hour);
        const m = Math.round((hour - h) * 60);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    }
    
    calculate() {
        this.updateGridPrice();
        
        // Calculate power
        if (this.charging) {
            // Charging - limited by SOC and max power
            const availableCapacity = this.batteryCapacity * (100 - this.batterySOC) / 100;
            this.currentPower = Math.min(this.maxChargePower, availableCapacity * 2);
            this.currentPower = Math.min(this.currentPower, (this.chargeCurrent * this.voltage / 1000));
        } else if (this.discharging) {
            // Discharging - limited by SOC and max discharge
            const availableEnergy = this.batteryCapacity * this.batterySOC / 100;
            this.currentPower = -Math.min(this.maxDischargePower, availableEnergy * 2);
        } else {
            this.currentPower = 0;
        }
        
        // Update readings
        const powerReading = document.getElementById('v2g-power-reading');
        if (powerReading) {
            const powerText = this.currentPower > 0 ? 
                `+${this.currentPower.toFixed(1)} kW (Charging)` :
                this.currentPower < 0 ? 
                    `${this.currentPower.toFixed(1)} kW (Discharging)` :
                    '0 kW (Idle)';
            powerReading.textContent = powerText;
        }
        
        const socReading = document.getElementById('v2g-soc-reading');
        if (socReading) socReading.textContent = `${this.batterySOC.toFixed(0)}%`;
        
        const capacityReading = document.getElementById('v2g-capacity-reading');
        if (capacityReading) {
            const kWh = this.batteryCapacity * this.batterySOC / 100;
            capacityReading.textContent = `${kWh.toFixed(1)} kWh`;
        }
        
        const priceReading = document.getElementById('v2g-price-reading');
        if (priceReading) priceReading.textContent = `$${this.gridPrice.toFixed(2)}/kWh`;
        
        const gridReading = document.getElementById('v2g-grid-demand-reading');
        if (gridReading) gridReading.textContent = `${this.gridDemand.toFixed(1)} kW`;
        
        // Calculate cost/profit for this hour
        if (this.currentPower !== 0) {
            const energy = Math.abs(this.currentPower);
            if (this.currentPower > 0) {
                // Charging - cost
                this.cost += energy * this.gridPrice;
            } else {
                // Discharging - profit
                this.profit += energy * this.sellPrice;
            }
        }
        
        const costReading = document.getElementById('v2g-cost-reading');
        if (costReading) costReading.textContent = `$${this.cost.toFixed(2)}`;
        
        const profitReading = document.getElementById('v2g-profit-reading');
        if (profitReading) profitReading.textContent = `$${this.profit.toFixed(2)}`;
        
        this.draw();
        if (this.graphCanvas) this.drawGraph();
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
        
        // Auto update time
        if (Math.floor(this.time) % 1 === 0 && this.time > 1) {
            // Simulate time passing - advance every few seconds
        }
        
        this.draw();
        if (this.graphCanvas) this.drawGraph();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // Background - grid/parking
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        
        // Draw parking lot
        ctx.fillStyle = '#2d2d3d';
        ctx.fillRect(50, h - 150, w - 100, 100);
        
        // Parking lines
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(50 + i * 200, h - 150);
            ctx.lineTo(50 + i * 200, h - 50);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        
        // Draw EV Charger
        const chargerX = w / 2;
        const chargerY = h - 100;
        
        // Charger body
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(chargerX - 30, chargerY - 60, 60, 80);
        
        // Screen
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(chargerX - 20, chargerY - 50, 40, 25);
        
        // Screen text
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillText(`${this.currentPower.toFixed(1)}kW`, chargerX - 15, chargerY - 35);
        
        // Connector
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(chargerX, chargerY - 60);
        ctx.lineTo(chargerX, chargerY - 100);
        ctx.stroke();
        
        // Draw EV
        const carX = chargerX;
        const carY = chargerY - 130;
        
        // Car body
        ctx.fillStyle = this.charging ? '#ff4444' : (this.discharging ? '#44ff44' : '#4488ff');
        ctx.fillRect(carX - 80, carY - 30, 160, 50);
        
        // Car roof
        ctx.beginPath();
        ctx.moveTo(carX - 50, carY - 30);
        ctx.lineTo(carX - 30, carY - 60);
        ctx.lineTo(carX + 30, carY - 60);
        ctx.lineTo(carX + 50, carY - 30);
        ctx.closePath();
        ctx.fillStyle = this.charging ? '#cc3333' : (this.discharging ? '#33cc33' : '#3366cc');
        ctx.fill();
        
        // Windows
        ctx.fillStyle = '#88ccff';
        ctx.beginPath();
        ctx.moveTo(carX - 45, carY - 30);
        ctx.lineTo(carX - 28, carY - 52);
        ctx.lineTo(carX + 28, carY - 52);
        ctx.lineTo(carX + 45, carY - 30);
        ctx.closePath();
        ctx.fill();
        
        // Wheels
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(carX - 50, carY + 20, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(carX + 50, carY + 20, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Battery indicator
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(20, 30, 150, 60);
        
        // Battery outline
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 30, 150, 60);
        
        // SOC bar
        const socWidth = (this.batterySOC / 100) * 146;
        const socColor = this.batterySOC > 50 ? '#44ff44' : (this.batterySOC > 20 ? '#ffff44' : '#ff4444');
        ctx.fillStyle = socColor;
        ctx.fillRect(22, 32, socWidth, 56);
        
        // Battery text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px JetBrains Mono';
        ctx.fillText(`${this.batterySOC.toFixed(0)}%`, 70, 65);
        
        // Draw grid connection
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w - 50, 100);
        ctx.lineTo(w - 50, h - 80);
        ctx.lineTo(chargerX + 30, h - 80);
        ctx.stroke();
        
        // Power flow animation
        if (this.currentPower !== 0) {
            const flowDir = this.currentPower > 0 ? 1 : -1;
            const flowColor = flowDir > 0 ? '#44ff44' : '#ffaa00';
            
            for (let i = 0; i < 5; i++) {
                const particlePos = ((this.time * 50 * flowDir + i * 30) % 200) / 200;
                let px, py;
                
                if (flowDir > 0) {
                    // Charging - grid to car
                    px = w - 50 - particlePos * (w - 50 - carX);
                    py = 100 + (h - 80 - 100) * particlePos;
                } else {
                    // Discharging - car to grid
                    px = carX + particlePos * (w - 50 - carX);
                    py = h - 80 + (100 - (h - 80)) * particlePos;
                }
                
                ctx.fillStyle = flowColor;
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Grid icon
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 20px JetBrains Mono';
        ctx.fillText('⚡ GRID', w - 130, 90);
        
        // Time display
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 24px JetBrains Mono';
        ctx.fillText(this.formatTime(this.timeOfDay), 30, 140);
        
        // Status
        ctx.font = '16px JetBrains Mono';
        if (this.charging) {
            ctx.fillStyle = '#44ff44';
            ctx.fillText('⚡ CHARGING', 30, 170);
        } else if (this.discharging) {
            ctx.fillStyle = '#ffaa00';
            ctx.fillText('🔋 V2G DISCHARGING', 30, 170);
        } else {
            ctx.fillStyle = '#888';
            ctx.fillText('⏸️ IDLE', 30, 170);
        }
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
        ctx.font = '12px JetBrains Mono';
        ctx.fillText('24-Hour Energy Price', 10, 20);
        
        // Draw price curve
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let hour = 0; hour <= 24; hour++) {
            let price;
            if (hour >= 16 && hour < 21) price = 0.25;
            else if (hour >= 7 && hour < 10) price = 0.20;
            else if (hour >= 21 || hour < 7) price = 0.08;
            else price = 0.12;
            
            const x = (hour / 24) * (w - 40) + 20;
            const y = h - 20 - (price / 0.30) * (h - 40);
            
            if (hour === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Current time marker
        const timeX = (this.timeOfDay / 24) * (w - 40) + 20;
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(timeX, 30);
        ctx.lineTo(timeX, h - 10);
        ctx.stroke();
        
        // Time labels
        ctx.fillStyle = '#666';
        ctx.font = '8px JetBrains Mono';
        for (let hour = 0; hour <= 24; hour += 6) {
            const x = (hour / 24) * (w - 40) + 20;
            ctx.fillText(`${hour}:00`, x - 10, h - 5);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.v2gSimulator = new V2GSimulator();
});
