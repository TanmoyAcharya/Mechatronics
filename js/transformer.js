/**
 * Transformer Simulator
 * Interactive transformer simulation with realistic animations
 */

class TransformerSimulator {
    constructor() {
        // Transformer parameters
        this.V1 = 230;          // Primary voltage (V)
        this.V2 = 115;          // Secondary voltage (V)
        this.f = 50;            // Frequency (Hz)
        this.N1 = 1000;         // Primary turns
        this.N2 = 500;          // Secondary turns
        this.R1 = 2;            // Primary resistance (Ohm)
        this.R2 = 0.5;          // Secondary resistance (Ohm)
        this.X1 = 5;            // Primary reactance (Ohm)
        this.X2 = 1.25;         // Secondary reactance (Ohm)
        this.Rc = 2000;         // Core loss resistance (Ohm)
        this.Xm = 1000;         // Magnetizing reactance (Ohm)
        
        // Load parameters
        this.loadResistance = 10; // Load resistance (Ohm)
        this.loadType = 'resistive';
        
        // Calculated values
        this.I1 = 0;            // Primary current (A)
        this.I2 = 0;            // Secondary current (A)
        this.efficiency = 0;    // Efficiency (%)
        this.power = 0;         // Power (VA)
        
        // Animation
        this.time = 0;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('transformer-canvas');
        if (!this.canvas) {
            console.log('Transformer canvas not found');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.waveCanvas = document.getElementById('transformer-wave-viz');
        if (this.waveCanvas) {
            this.waveCtx = this.waveCanvas.getContext('2d');
        }
        
        this.phasorCanvas = document.getElementById('transformer-phasor-viz');
        if (this.phasorCanvas) {
            this.phasorCtx = this.phasorCanvas.getContext('2d');
        }
        
        this.setupControls();
        
        // Set canvas size
        if (this.canvas.width === 0) {
            this.canvas.width = 800;
            this.canvas.height = 400;
        }
        if (this.waveCanvas && this.waveCanvas.width === 0) {
            this.waveCanvas.width = 350;
            this.waveCanvas.height = 180;
        }
        if (this.phasorCanvas && this.phasorCanvas.width === 0) {
            this.phasorCanvas.width = 350;
            this.phasorCanvas.height = 180;
        }
        
        this.calculate();
    }
    
    setupControls() {
        const v1Slider = document.getElementById('trans-v1-slider');
        const v1Value = document.getElementById('trans-v1-value');
        if (v1Slider && v1Value) {
            v1Slider.addEventListener('input', (e) => {
                this.V1 = parseFloat(e.target.value);
                this.V2 = this.V1 * (this.N2 / this.N1);
                v1Value.textContent = this.V1;
                this.calculate();
            });
        }
        
        const loadSlider = document.getElementById('trans-load-slider');
        const loadValue = document.getElementById('trans-load-value');
        if (loadSlider && loadValue) {
            loadSlider.addEventListener('input', (e) => {
                this.loadResistance = parseFloat(e.target.value);
                loadValue.textContent = this.loadResistance;
                this.calculate();
            });
        }
        
        const typeButtons = document.querySelectorAll('#transformer-page .load-type-btn');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                typeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadType = btn.dataset.type;
                this.calculate();
            });
        });
    }
    
    calculate() {
        // Turns ratio
        const a = this.N1 / this.N2;
        
        // Secondary voltage (approximate)
        this.V2 = this.V1 / a;
        
        // Load current
        this.I2 = this.V2 / this.loadResistance;
        
        // Primary current (approximate, neglecting losses)
        this.I1 = this.I2 / a;
        
        // Power
        this.power = this.V2 * this.I2;
        
        // Copper losses
        const P_cu = this.I1 * this.I1 * this.R1 + this.I2 * this.I2 * this.R2;
        
        // Core losses (approximate)
        const P_core = (this.V1 * this.V1) / this.Rc;
        
        // Total loss
        const P_loss = P_cu + P_core;
        
        // Efficiency
        this.efficiency = (this.power / (this.power + P_loss)) * 100;
        this.efficiency = Math.max(0, Math.min(100, this.efficiency));
        
        // Update readings
        const v2Reading = document.getElementById('trans-v2-reading');
        if (v2Reading) v2Reading.textContent = this.V2.toFixed(1) + ' V';
        
        const i1Reading = document.getElementById('trans-i1-reading');
        if (i1Reading) i1Reading.textContent = this.I1.toFixed(2) + ' A';
        
        const i2Reading = document.getElementById('trans-i2-reading');
        if (i2Reading) i2Reading.textContent = this.I2.toFixed(2) + ' A';
        
        const effReading = document.getElementById('trans-eff-reading');
        if (effReading) effReading.textContent = this.efficiency.toFixed(1) + '%';
        
        const powerReading = document.getElementById('trans-power-reading');
        if (powerReading) powerReading.textContent = this.power.toFixed(1) + ' VA';
        
        this.draw();
        if (this.waveCanvas) this.drawWaveforms();
        if (this.phasorCanvas) this.drawPhasors();
    }
    
    start() {
        if (this.animationId || !this.canvas) return;
        console.log('Starting Transformer simulator');
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
        
        if (this.waveCanvas) this.drawWaveforms();
        if (this.phasorCanvas) this.drawPhasors();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        const centerX = w / 2;
        const centerY = h / 2;
        
        // Draw transformer core (E-I shape)
        const coreWidth = 120;
        const coreHeight = 180;
        const limbWidth = 40;
        
        // Core color
        const coreColor = '#454550';
        const coreDark = '#353540';
        
        // Top yoke
        ctx.fillStyle = coreColor;
        ctx.fillRect(centerX - coreWidth/2, centerY - coreHeight/2 - 30, coreWidth, 40);
        
        // Left limb
        ctx.fillRect(centerX - coreWidth/2, centerY - coreHeight/2, limbWidth, coreHeight);
        
        // Middle limb
        ctx.fillRect(centerX - limbWidth/2, centerY - coreHeight/2, limbWidth, coreHeight);
        
        // Right limb
        ctx.fillRect(centerX + coreWidth/2 - limbWidth, centerY - coreHeight/2, limbWidth, coreHeight);
        
        // Bottom yoke
        ctx.fillRect(centerX - coreWidth/2, centerY + coreHeight/2 - 10, coreWidth, 40);
        
        // Primary winding (left)
        ctx.fillStyle = '#ff4444';
        for (let i = 0; i < 8; i++) {
            const y = centerY - coreHeight/2 + 10 + i * 18;
            ctx.beginPath();
            ctx.ellipse(centerX - coreWidth/2 + limbWidth/2, y, 25, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Secondary winding (right)
        ctx.fillStyle = '#44ff44';
        for (let i = 0; i < 6; i++) {
            const y = centerY - coreHeight/2 + 20 + i * 18;
            ctx.beginPath();
            ctx.ellipse(centerX + coreWidth/2 - limbWidth/2, y, 20, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Primary terminals
        ctx.fillStyle = '#ff6666';
        ctx.font = 'bold 14px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('V1', centerX - coreWidth/2 - 40, centerY - 40);
        ctx.fillText(`${this.V1.toFixed(0)}V`, centerX - coreWidth/2 - 40, centerY - 20);
        
        // Secondary terminals
        ctx.fillStyle = '#66ff66';
        ctx.fillText('V2', centerX + coreWidth/2 + 40, centerY - 40);
        ctx.fillText(`${this.V2.toFixed(0)}V`, centerX + coreWidth/2 + 40, centerY - 20);
        
        // Core flux animation
        const fluxIntensity = (Math.sin(this.time * 2 * Math.PI * this.f) + 1) / 2;
        
        // Flux in core
        ctx.strokeStyle = `rgba(0, 150, 255, ${fluxIntensity * 0.8})`;
        ctx.lineWidth = 3;
        
        // Left flux path
        ctx.beginPath();
        ctx.moveTo(centerX - coreWidth/2 + limbWidth, centerY - coreHeight/2 + 20);
        ctx.lineTo(centerX - coreWidth/2 + limbWidth, centerY + coreHeight/2 - 20);
        ctx.stroke();
        
        // Right flux path
        ctx.beginPath();
        ctx.moveTo(centerX + coreWidth/2 - limbWidth, centerY - coreHeight/2 + 20);
        ctx.lineTo(centerX + coreWidth/2 - limbWidth, centerY + coreHeight/2 - 20);
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#9898a8';
        ctx.font = '12px JetBrains Mono';
        ctx.fillText('Primary', centerX - coreWidth/2 - 40, centerY + 50);
        ctx.fillText('Secondary', centerX + coreWidth/2 + 40, centerY + 50);
        ctx.fillText(`N1:N2 = ${this.N1}:${this.N2}`, centerX, h - 20);
    }
    
    drawWaveforms() {
        const ctx = this.waveCtx;
        const canvas = this.waveCanvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        const centerY = h / 2;
        
        // Draw sine waves
        ctx.lineWidth = 2;
        
        // Primary voltage (red)
        ctx.strokeStyle = '#ff4444';
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const t = x / w * 0.04 + this.time;
            const y = centerY + 50 * Math.sin(2 * Math.PI * this.f * t);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Secondary voltage (green)
        ctx.strokeStyle = '#44ff44';
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const t = x / w * 0.04 + this.time;
            const y = centerY + 30 * Math.sin(2 * Math.PI * this.f * t - Math.PI);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#ff4444';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('V1', 10, 15);
        ctx.fillStyle = '#44ff44';
        ctx.fillText('V2', 10, 35);
    }
    
    drawPhasors() {
        const ctx = this.phasorCtx;
        const canvas = this.phasorCanvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        const centerX = w / 2;
        const centerY = h / 2;
        
        // Reference circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.stroke();
        
        // V1 phasor
        const v1Mag = 60;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + v1Mag, centerY);
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // V2 phasor (180° out of phase)
        const v2Mag = 30;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX - v2Mag, centerY);
        ctx.strokeStyle = '#44ff44';
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#ff4444';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('V1', centerX + v1Mag + 5, centerY - 5);
        ctx.fillStyle = '#44ff44';
        ctx.fillText('V2', centerX - v2Mag - 15, centerY - 5);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.transformerSimulator = new TransformerSimulator();
});
