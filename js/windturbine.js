/**
 * Wind Turbine Simulator
 * Interactive simulation of wind turbine power generation
 */

class WindTurbineSimulator {
    constructor() {
        // Turbine parameters
        this.bladeRadius = 50;       // Rotor radius (m)
        this.ratedPower = 2000;     // Rated power (kW)
        this.cutInSpeed = 3;        // Cut-in wind speed (m/s)
        this.cutOutSpeed = 25;      // Cut-out wind speed (m/s)
        this.ratedSpeed = 12;        // Rated wind speed (m/s)
        
        // Current conditions
        this.windSpeed = 8;         // Current wind speed (m/s)
        this.windDirection = 0;     // Wind direction (degrees)
        this.turbineAngle = 0;       // Turbine yaw angle
        this.bladeAngle = 0;         // Blade pitch angle
        
        // Output
        this.power = 0;              // Generated power (kW)
        this.rotorSpeed = 0;         // Rotor speed (RPM)
        this.tipSpeedRatio = 0;      // Tip speed ratio
        this.powerCoefficient = 0;   // Power coefficient (Cp)
        this.torque = 0;             // Rotor torque (kNm)
        
        // Animation
        this.time = 0;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('wind-canvas');
        if (!this.canvas) {
            console.log('Wind canvas not found');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.curveCanvas = document.getElementById('wind-power-curve');
        if (this.curveCanvas) {
            this.curveCtx = this.curveCanvas.getContext('2d');
        }
        
        this.setupControls();
        
        if (this.canvas.width === 0) {
            this.canvas.width = 800;
            this.canvas.height = 400;
        }
        if (this.curveCanvas && this.curveCanvas.width === 0) {
            this.curveCanvas.width = 380;
            this.curveCanvas.height = 200;
        }
        
        this.calculate();
    }
    
    setupControls() {
        const windSlider = document.getElementById('wind-speed-slider');
        const windValue = document.getElementById('wind-speed-value');
        if (windSlider && windValue) {
            windSlider.addEventListener('input', (e) => {
                this.windSpeed = parseFloat(e.target.value);
                windValue.textContent = this.windSpeed.toFixed(1);
                this.calculate();
            });
        }
        
        const bladeSlider = document.getElementById('blade-pitch-slider');
        const bladeValue = document.getElementById('blade-pitch-value');
        if (bladeSlider && bladeValue) {
            bladeSlider.addEventListener('input', (e) => {
                this.bladeAngle = parseFloat(e.target.value);
                bladeValue.textContent = this.bladeAngle.toFixed(1);
                this.calculate();
            });
        }
        
        const directionSlider = document.getElementById('wind-dir-slider');
        const directionValue = document.getElementById('wind-dir-value');
        if (directionSlider && directionValue) {
            directionSlider.addEventListener('input', (e) => {
                this.windDirection = parseFloat(e.target.value);
                directionValue.textContent = this.windDirection.toFixed(0);
            });
        }
    }
    
    calculate() {
        // Power calculation using Betz limit and power coefficient
        const airDensity = 1.225; // kg/m³
        
        // Calculate tip speed ratio
        const lambda = (this.rotorSpeed * Math.PI * this.bladeRadius / 60) / Math.max(this.windSpeed, 0.1);
        this.tipSpeedRatio = lambda;
        
        // Calculate power coefficient (simplified Cp curve)
        // Cp peaks around 0.59 (Betz limit) at lambda around 8
        const bladePitchRad = this.bladeAngle * Math.PI / 180;
        this.powerCoefficient = this.calculateCp(lambda, bladePitchRad);
        
        // Rotor swept area
        const sweptArea = Math.PI * this.bladeRadius * this.bladeRadius;
        
        // Power available in wind
        const powerAvailable = 0.5 * airDensity * sweptArea * Math.pow(this.windSpeed, 3);
        
        // Actual power generated
        if (this.windSpeed < this.cutInSpeed || this.windSpeed > this.cutOutSpeed) {
            this.power = 0;
            this.rotorSpeed = 0;
        } else if (this.windSpeed >= this.ratedSpeed) {
            this.power = this.ratedPower;
            // At rated speed, rotor runs at constant RPM
            this.rotorSpeed = 20; // Typical 20 RPM for large turbines
        } else {
            this.power = powerAvailable * this.powerCoefficient / 1000; // Convert to kW
            // Calculate rotor speed from tip speed ratio
            this.rotorSpeed = (lambda * this.windSpeed * 60) / (Math.PI * this.bladeRadius);
        }
        
        // Calculate torque
        if (this.rotorSpeed > 0) {
            this.torque = (this.power * 1000) / (2 * Math.PI * this.rotorSpeed / 60);
        } else {
            this.torque = 0;
        }
        
        // Update readings
        const powerReading = document.getElementById('wind-power-reading');
        if (powerReading) powerReading.textContent = this.power.toFixed(0) + ' kW';
        
        const speedReading = document.getElementById('wind-rotor-reading');
        if (speedReading) speedReading.textContent = this.rotorSpeed.toFixed(1) + ' RPM';
        
        const cpReading = document.getElementById('wind-cp-reading');
        if (cpReading) cpReading.textContent = (this.powerCoefficient * 100).toFixed(1) + '%';
        
        const tsrReading = document.getElementById('wind-tsr-reading');
        if (tsrReading) tsrReading.textContent = this.tipSpeedRatio.toFixed(2);
        
        this.draw();
        if (this.curveCanvas) this.drawPowerCurve();
    }
    
    calculateCp(lambda, pitch) {
        // Simplified power coefficient calculation
        // Cp is maximum (~0.59) at tip speed ratio around 8 with zero pitch
        const cpMax = 0.59;
        const lambdaOpt = 8;
        
        // Reduce Cp with blade pitch
        const pitchFactor = Math.max(0, 1 - pitch / 30);
        
        // Gaussian curve around optimal TSR
        const cp = cpMax * Math.exp(-Math.pow(lambda - lambdaOpt, 2) / 20) * pitchFactor;
        
        return Math.max(0, Math.min(cpMax, cp));
    }
    
    start() {
        if (this.animationId || !this.canvas) return;
        console.log('Starting Wind Turbine simulator');
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
        
        // Rotate blades based on wind speed
        if (this.rotorSpeed > 0) {
            this.bladeAngle += this.rotorSpeed * 0.06;
        }
        
        this.draw();
        if (this.curveCanvas) this.drawPowerCurve();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        
        // Draw ground
        ctx.fillStyle = '#2d4a3e';
        ctx.fillRect(0, h - 80, w, 80);
        
        // Draw wind direction indicator
        const windX = w - 80;
        const windY = 80;
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(windX, windY, 40, 0, Math.PI * 2);
        ctx.stroke();
        
        // Wind arrow
        const windRad = this.windDirection * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(windX + Math.cos(windRad) * 50, windY + Math.sin(windRad) * 50);
        ctx.lineTo(windX + Math.cos(windRad) * 30, windY + Math.sin(windRad) * 30);
        ctx.stroke();
        ctx.fillStyle = '#4a9eff';
        ctx.font = '12px JetBrains Mono';
        ctx.fillText('Wind', windX - 15, windY + 55);
        
        // Draw tower
        const towerX = w / 2 - 50;
        const towerTop = h - 300;
        
        ctx.fillStyle = '#888899';
        ctx.fillRect(towerX, towerTop, 100, 300);
        
        // Tower details
        ctx.strokeStyle = '#666677';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            const y = towerTop + i * 30;
            ctx.beginPath();
            ctx.moveTo(towerX + 5, y);
            ctx.lineTo(towerX + 95, y);
            ctx.stroke();
        }
        
        // Draw nacelle
        const nacelleX = towerX + 50;
        const nacelleY = towerTop;
        
        ctx.fillStyle = '#ccccdd';
        ctx.fillRect(nacelleX - 40, nacelleY - 25, 80, 40);
        
        // Draw rotor hub
        ctx.fillStyle = '#444455';
        ctx.beginPath();
        ctx.arc(nacelleX, nacelleY, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw blades
        const bladeLength = 100;
        const numBlades = 3;
        
        for (let i = 0; i < numBlades; i++) {
            const bladeAngle = this.bladeAngle + (i * 2 * Math.PI / numBlades);
            
            const tipX = nacelleX + Math.cos(bladeAngle) * bladeLength;
            const tipY = nacelleY + Math.sin(bladeAngle) * bladeLength;
            
            // Blade shadow
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(nacelleX + 3, nacelleY + 3);
            ctx.lineTo(tipX + 3, tipY + 3);
            ctx.stroke();
            
            // Blade
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(nacelleX, nacelleY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
            
            // Blade tip
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw wind particles
        ctx.fillStyle = 'rgba(100, 150, 255, 0.5)';
        for (let i = 0; i < 20; i++) {
            const particleX = ((this.time * this.windSpeed * 20 + i * 50) % (w - 100)) + 50;
            const particleY = 100 + Math.sin(this.time * 2 + i) * 50;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Power output display
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 24px JetBrains Mono';
        ctx.fillText(`${this.power.toFixed(0)} kW`, 30, 50);
        
        ctx.fillStyle = '#888899';
        ctx.font = '14px JetBrains Mono';
        ctx.fillText(`Wind: ${this.windSpeed.toFixed(1)} m/s`, 30, 80);
        ctx.fillText(`Rotor: ${this.rotorSpeed.toFixed(1)} RPM`, 30, 100);
        ctx.fillText(`Cp: ${(this.powerCoefficient * 100).toFixed(1)}%`, 30, 120);
    }
    
    drawPowerCurve() {
        const ctx = this.curveCtx;
        const canvas = this.curveCanvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        // Axes
        ctx.strokeStyle = '#888899';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 20);
        ctx.lineTo(40, h - 30);
        ctx.lineTo(w - 20, h - 30);
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#888899';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('0', 25, h - 25);
        ctx.fillText('Wind Speed (m/s)', w / 2 - 40, h - 8);
        
        ctx.save();
        ctx.translate(15, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Power (kW)', -30, 0);
        ctx.restore();
        
        // Draw power curve
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let v = 0; v <= 30; v++) {
            const x = 40 + (v / 30) * (w - 60);
            let p = 0;
            
            if (v >= this.cutInSpeed && v <= this.cutOutSpeed) {
                const lambda = 8; // Assume optimal TSR
                const cp = this.calculateCp(lambda, 0);
                const sweptArea = Math.PI * this.bladeRadius * this.bladeRadius;
                p = 0.5 * 1.225 * sweptArea * Math.pow(v, 3) * cp / 1000;
                
                if (v >= this.ratedSpeed) {
                    p = this.ratedPower;
                }
            }
            
            const y = h - 30 - (p / this.ratedPower) * (h - 50);
            
            if (v === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Mark current operating point
        if (this.windSpeed > 0) {
            const opX = 40 + (this.windSpeed / 30) * (w - 60);
            const opY = h - 30 - (this.power / this.ratedPower) * (h - 50);
            
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(opX, opY, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.windTurbineSimulator = new WindTurbineSimulator();
});
