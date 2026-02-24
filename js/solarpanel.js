/**
 * Solar Panel Simulator
 * Interactive simulation of solar PV system power generation
 */

class SolarPanelSimulator {
    constructor() {
        // Panel parameters
        this.panelArea = 2;           // Area per panel (m²)
        this.panelEfficiency = 18;     // Panel efficiency (%)
        this.numPanels = 10;          // Number of panels
        this.systemCapacity = 3;      // System capacity (kWp)
        
        // Environmental conditions
        this.solarIrradiance = 1000;  // Irradiance (W/m²)
        this.temperature = 25;         // Cell temperature (°C)
        this.sunAngle = 45;            // Sun elevation angle (degrees)
        this.panelTilt = 30;           // Panel tilt angle (degrees)
        
        // Output
        this.power = 0;               // Generated power (kW)
        this.current = 0;             // Current (A)
        this.voltage = 0;              // Voltage (V)
        this.dailyEnergy = 0;         // Daily energy (kWh)
        
        // Animation
        this.time = 0;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('solar-canvas');
        if (!this.canvas) {
            console.log('Solar canvas not found');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.ivCanvas = document.getElementById('solar-iv-curve');
        if (this.ivCanvas) {
            this.ivCtx = this.ivCanvas.getContext('2d');
        }
        
        this.setupControls();
        
        if (this.canvas.width === 0) {
            this.canvas.width = 800;
            this.canvas.height = 400;
        }
        if (this.ivCanvas && this.ivCanvas.width === 0) {
            this.ivCanvas.width = 380;
            this.ivCanvas.height = 200;
        }
        
        this.calculate();
    }
    
    setupControls() {
        const irradianceSlider = document.getElementById('solar-irradiance-slider');
        const irradianceValue = document.getElementById('solar-irradiance-value');
        if (irradianceSlider && irradianceValue) {
            irradianceSlider.addEventListener('input', (e) => {
                this.solarIrradiance = parseFloat(e.target.value);
                irradianceValue.textContent = this.solarIrradiance.toFixed(0);
                this.calculate();
            });
        }
        
        const tempSlider = document.getElementById('solar-temp-slider');
        const tempValue = document.getElementById('solar-temp-value');
        if (tempSlider && tempValue) {
            tempSlider.addEventListener('input', (e) => {
                this.temperature = parseFloat(e.target.value);
                tempValue.textContent = this.temperature.toFixed(0);
                this.calculate();
            });
        }
        
        const tiltSlider = document.getElementById('solar-tilt-slider');
        const tiltValue = document.getElementById('solar-tilt-value');
        if (tiltSlider && tiltValue) {
            tiltSlider.addEventListener('input', (e) => {
                this.panelTilt = parseFloat(e.target.value);
                tiltValue.textContent = this.panelTilt.toFixed(0);
                this.calculate();
            });
        }
        
        const sunSlider = document.getElementById('solar-sun-slider');
        const sunValue = document.getElementById('solar-sun-value');
        if (sunSlider && sunValue) {
            sunSlider.addEventListener('input', (e) => {
                this.sunAngle = parseFloat(e.target.value);
                sunValue.textContent = this.sunAngle.toFixed(0);
                this.calculate();
            });
        }
    }
    
    calculate() {
        // Calculate effective irradiance based on panel angle
        const sunRad = this.sunAngle * Math.PI / 180;
        const tiltRad = this.panelTilt * Math.PI / 180;
        
        // Incidence angle modifier (simple model)
        const incidenceAngle = Math.abs(sunRad - tiltRad);
        const iam = Math.max(0.5, Math.cos(incidenceAngle));
        
        // Effective irradiance
        const effectiveIrradiance = this.solarIrradiance * iam;
        
        // Temperature coefficient (typically -0.4% per °C)
        const tempCoeff = -0.004;
        const refTemp = 25;
        const tempDiff = this.temperature - refTemp;
        
        // Efficiency at operating temperature
        const tempEfficiency = this.panelEfficiency * (1 + tempCoeff * tempDiff);
        
        // Total panel area
        const totalArea = this.panelArea * this.numPanels;
        
        // DC power output
        const dcPower = (effectiveIrradiance / 1000) * totalArea * (tempEfficiency / 100);
        
        // System losses (inverter, wiring) - assume 90% efficiency
        const systemEfficiency = 0.90;
        this.power = dcPower * systemEfficiency;
        
        // Calculate voltage and current (simplified)
        // Vmp ≈ 0.8 * Voc, Imp ≈ 0.9 * Isc
        const voc = 40; // Open circuit voltage per panel
        const isc = 8;  // Short circuit current per panel
        
        this.voltage = voc * this.numPanels * 0.8;
        this.current = isc * this.numPanels * (effectiveIrradiance / 1000) * 0.9;
        
        // Daily energy estimate (assuming 6 hours of equivalent sunlight)
        this.dailyEnergy = this.power * 6;
        
        // Update readings
        const powerReading = document.getElementById('solar-power-reading');
        if (powerReading) powerReading.textContent = this.power.toFixed(2) + ' kW';
        
        const voltageReading = document.getElementById('solar-voltage-reading');
        if (voltageReading) voltageReading.textContent = this.voltage.toFixed(1) + ' V';
        
        const currentReading = document.getElementById('solar-current-reading');
        if (currentReading) currentReading.textContent = this.current.toFixed(2) + ' A';
        
        const energyReading = document.getElementById('solar-energy-reading');
        if (energyReading) energyReading.textContent = this.dailyEnergy.toFixed(1) + ' kWh';
        
        const effReading = document.getElementById('solar-eff-reading');
        if (effReading) effReading.textContent = tempEfficiency.toFixed(1) + '%';
        
        this.draw();
        if (this.ivCanvas) this.drawIVCurve();
    }
    
    start() {
        if (this.animationId || !this.canvas) return;
        console.log('Starting Solar Panel simulator');
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
        
        this.draw();
        if (this.ivCanvas) this.drawIVCurve();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // Sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
        
        // Determine sky color based on sun angle
        if (this.sunAngle < 10) {
            // Dawn/dusk - orange/pink
            skyGradient.addColorStop(0, '#1a0a2e');
            skyGradient.addColorStop(0.5, '#ff6b35');
            skyGradient.addColorStop(1, '#f7c59f');
        } else if (this.sunAngle < 30) {
            // Morning/evening - yellow/orange
            skyGradient.addColorStop(0, '#87ceeb');
            skyGradient.addColorStop(0.5, '#ffd700');
            skyGradient.addColorStop(1, '#ff8c00');
        } else {
            // Midday - blue
            skyGradient.addColorStop(0, '#1e90ff');
            skyGradient.addColorStop(0.5, '#87ceeb');
            skyGradient.addColorStop(1, '#e0f7fa');
        }
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, w, h);
        
        // Draw ground
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(0, h - 100, w, 100);
        
        // Draw sun
        const sunX = w / 2;
        const sunY = h - 100 - (this.sunAngle / 90) * (h - 150);
        
        const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 60);
        sunGradient.addColorStop(0, '#fff9c4');
        sunGradient.addColorStop(0.5, '#ffeb3b');
        sunGradient.addColorStop(1, 'rgba(255, 235, 59, 0)');
        
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw sun rays
        ctx.strokeStyle = 'rgba(255, 235, 59, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + this.time;
            ctx.beginPath();
            ctx.moveTo(sunX + Math.cos(angle) * 40, sunY + Math.sin(angle) * 40);
            ctx.lineTo(sunX + Math.cos(angle) * 70, sunY + Math.sin(angle) * 70);
            ctx.stroke();
        }
        
        // Draw panel rack
        const rackX = w / 2 - 150;
        const rackY = h - 100;
        
        // Support posts
        ctx.fillStyle = '#555566';
        ctx.fillRect(rackX, rackY - 80, 10, 80);
        ctx.fillRect(rackX + 290, rackY - 80, 10, 80);
        
        // Panel frames
        const tiltRad = this.panelTilt * Math.PI / 180;
        const panelHeight = 80 * Math.cos(tiltRad);
        const panelOffset = 80 * Math.sin(tiltRad);
        
        // Draw panels
        const panelWidth = 60;
        const panelGap = 5;
        
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 5; col++) {
                const panelX = rackX + 20 + col * (panelWidth + panelGap);
                const panelY = rackY - 80 - row * 40;
                
                // Panel shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(panelX + 3, panelY - panelOffset + 3, panelWidth, panelHeight);
                
                // Panel (blue gradient)
                const panelGrad = ctx.createLinearGradient(panelX, panelY - panelOffset, panelX, panelY);
                panelGrad.addColorStop(0, '#1565c0');
                panelGrad.addColorStop(0.5, '#1976d2');
                panelGrad.addColorStop(1, '#0d47a1');
                
                ctx.fillStyle = panelGrad;
                ctx.fillRect(panelX, panelY - panelOffset, panelWidth, panelHeight);
                
                // Grid lines (cells)
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                for (let i = 1; i < 6; i++) {
                    ctx.beginPath();
                    ctx.moveTo(panelX + i * 10, panelY - panelOffset);
                    ctx.lineTo(panelX + i * 10, panelY - panelOffset + panelHeight);
                    ctx.stroke();
                }
                
                // Reflection
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.beginPath();
                ctx.moveTo(panelX, panelY - panelOffset);
                ctx.lineTo(panelX + panelWidth * 0.3, panelY - panelOffset + panelHeight);
                ctx.lineTo(panelX, panelY - panelOffset + panelHeight);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        // Draw sunlight particles
        ctx.fillStyle = 'rgba(255, 235, 59, 0.4)';
        for (let i = 0; i < 15; i++) {
            const particleX = (this.time * 50 + i * 60) % w;
            const particleY = (h - 100 - this.sunAngle) + Math.sin(this.time * 2 + i) * 30;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Power display
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 24px JetBrains Mono';
        ctx.fillText(`${this.power.toFixed(2)} kW`, 30, 50);
        
        ctx.fillStyle = '#888899';
        ctx.font = '14px JetBrains Mono';
        ctx.fillText(`Irradiance: ${this.solarIrradiance} W/m²`, 30, 80);
        ctx.fillText(`Temp: ${this.temperature}°C`, 30, 100);
        ctx.fillText(`Efficiency: ${(this.panelEfficiency * (1 - 0.004 * (this.temperature - 25))).toFixed(1)}%`, 30, 120);
        ctx.fillText(`Daily Energy: ${this.dailyEnergy.toFixed(1)} kWh`, 30, 140);
    }
    
    drawIVCurve() {
        const ctx = this.ivCtx;
        const canvas = this.ivCanvas;
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
        ctx.fillText('Current (A)', w / 2 - 25, h - 8);
        
        ctx.save();
        ctx.translate(15, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Voltage (V)', -25, 0);
        ctx.restore();
        
        // Draw IV curve
        const voc = 40 * this.numPanels;  // Open circuit voltage
        const isc = 8 * this.numPanels * (this.solarIrradiance / 1000);  // Short circuit current
        const pmax = this.power * 1000 / (this.voltage * this.current); // At max power point
        
        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Simplified IV curve
        for (let i = 0; i <= 50; i++) {
            const v = (i / 50) * voc;
            // I = Isc * (1 - V/Voc)^0.5 (simplified)
            const i_val = isc * Math.sqrt(Math.max(0, 1 - v / voc));
            
            const x = 40 + (i / 50) * (w - 60);
            const y = h - 30 - (i_val / isc) * (h - 50);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Mark MPP
        const mppX = 40 + (this.voltage / voc) * (w - 60);
        const mppY = h - 30 - (this.current / isc) * (h - 50);
        
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(mppX, mppY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // MPP label
        ctx.fillStyle = '#ff4444';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText('MPP', mppX + 8, mppY - 5);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.solarPanelSimulator = new SolarPanelSimulator();
});
