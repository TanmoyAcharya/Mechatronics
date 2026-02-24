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
        this.XmPercent = 5;     // Magnetizing current as percentage
        
        // Load parameters
        this.loadResistance = 10; // Load resistance (Ohm)
        this.loadType = 'resistive';
        
        // Calculated values
        this.I1 = 0;            // Primary current (A)
        this.I2 = 0;            // Secondary current (A)
        this.efficiency = 0;    // Efficiency (%)
        this.power = 0;         // Power (VA)
        this.voltageRegulation = 0; // Voltage regulation (%)
        
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
        
        this.circuitCanvas = document.getElementById('transformer-circuit-viz');
        if (this.circuitCanvas) {
            this.circuitCtx = this.circuitCanvas.getContext('2d');
        }
        
        this.setupControls();
        
        // Set canvas size
        if (this.canvas.width === 0) {
            this.canvas.width = 800;
            this.canvas.height = 400;
        }
        if (this.waveCanvas && this.waveCanvas.width === 0) {
            this.waveCanvas.width = 380;
            this.waveCanvas.height = 220;
        }
        if (this.phasorCanvas && this.phasorCanvas.width === 0) {
            this.phasorCanvas.width = 380;
            this.phasorCanvas.height = 220;
        }
        if (this.circuitCanvas && this.circuitCanvas.width === 0) {
            this.circuitCanvas.width = 780;
            this.circuitCanvas.height = 280;
        }
        
        this.calculate();
    }
    
    setupControls() {
        // Primary voltage
        const v1Slider = document.getElementById('trans-v1-slider');
        const v1Value = document.getElementById('trans-v1-value');
        if (v1Slider && v1Value) {
            v1Slider.addEventListener('input', (e) => {
                this.V1 = parseFloat(e.target.value);
                v1Value.textContent = this.V1;
                this.calculate();
            });
        }
        
        // Frequency
        const freqSlider = document.getElementById('trans-freq-slider');
        const freqValue = document.getElementById('trans-freq-value');
        if (freqSlider && freqValue) {
            freqSlider.addEventListener('input', (e) => {
                this.f = parseFloat(e.target.value);
                freqValue.textContent = this.f;
                this.calculate();
            });
        }
        
        // Turns ratio
        const ratioSlider = document.getElementById('trans-ratio-slider');
        const ratioValue = document.getElementById('trans-ratio-value');
        if (ratioSlider && ratioValue) {
            ratioSlider.addEventListener('input', (e) => {
                const ratio = parseFloat(e.target.value);
                this.N1 = 1000;
                this.N2 = Math.round(1000 / ratio);
                ratioValue.textContent = `${ratio}:1`;
                this.calculate();
            });
        }
        
        // Load resistance
        const loadSlider = document.getElementById('trans-load-slider');
        const loadValue = document.getElementById('trans-load-value');
        if (loadSlider && loadValue) {
            loadSlider.addEventListener('input', (e) => {
                this.loadResistance = parseFloat(e.target.value);
                loadValue.textContent = this.loadResistance;
                this.calculate();
            });
        }
        
        // Load type
        const loadTypeSelect = document.getElementById('trans-load-type');
        if (loadTypeSelect) {
            loadTypeSelect.addEventListener('change', (e) => {
                this.loadType = e.target.value;
                this.calculate();
            });
        }
        
        // Primary resistance
        const r1Slider = document.getElementById('trans-r1-slider');
        const r1Value = document.getElementById('trans-r1-value');
        if (r1Slider && r1Value) {
            r1Slider.addEventListener('input', (e) => {
                this.R1 = parseFloat(e.target.value);
                r1Value.textContent = this.R1;
                this.calculate();
            });
        }
        
        // Secondary resistance
        const r2Slider = document.getElementById('trans-r2-slider');
        const r2Value = document.getElementById('trans-r2-value');
        if (r2Slider && r2Value) {
            r2Slider.addEventListener('input', (e) => {
                this.R2 = parseFloat(e.target.value);
                r2Value.textContent = this.R2;
                this.calculate();
            });
        }
        
        // Magnetizing reactance
        const xmSlider = document.getElementById('trans-xm-slider');
        const xmValue = document.getElementById('trans-xm-value');
        if (xmSlider && xmValue) {
            xmSlider.addEventListener('input', (e) => {
                this.XmPercent = parseFloat(e.target.value);
                xmValue.textContent = this.XmPercent;
                // Update Xm based on rated impedance
                const Zbase = (this.V1 * this.V1) / 1000; // Assume 1kVA base
                this.Xm = Zbase * (this.XmPercent / 100);
                this.calculate();
            });
        }
    }
    
    calculate() {
        // Turns ratio
        const a = this.N1 / this.N2;
        
        // Load angle based on load type
        let loadAngle = 0;
        if (this.loadType === 'inductive') loadAngle = -Math.PI / 6; // -30 degrees
        if (this.loadType === 'capacitive') loadAngle = Math.PI / 6; // +30 degrees
        
        // Secondary voltage (ideal, no load)
        const V2_ideal = this.V1 / a;
        
        // Calculate load impedance magnitude
        const Z_load = this.loadResistance;
        
        // Simplified voltage regulation calculation
        // VR = (I1*R_eq*cos(φ) + I1*X_eq*sin(φ)) / V2 * 100
        const Req = this.R1 + this.R2 / (a * a);
        const Xeq = this.X1 + this.X2 / (a * a);
        const I1_approx = V2_ideal / (Z_load / (a * a));
        const powerFactor = Math.cos(loadAngle);
        
        // Voltage regulation
        this.voltageRegulation = (I1_approx * (Req * powerFactor + Xeq * Math.sin(Math.abs(loadAngle)))) / V2_ideal * 100;
        this.voltageRegulation = Math.max(-20, Math.min(30, this.voltageRegulation));
        
        // Actual secondary voltage under load
        this.V2 = V2_ideal * (1 - this.voltageRegulation / 100);
        
        // Secondary current
        this.I2 = this.V2 / this.loadResistance;
        
        // Primary current
        this.I1 = this.I2 / a;
        
        // Power
        this.power = this.V2 * this.I2 * Math.cos(loadAngle);
        
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
        
        const vrReading = document.getElementById('trans-vr-reading');
        if (vrReading) vrReading.textContent = this.voltageRegulation.toFixed(1) + '%';
        
        this.draw();
        if (this.waveCanvas) this.drawWaveforms();
        if (this.phasorCanvas) this.drawPhasors();
        if (this.circuitCanvas) this.drawCircuit();
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
        if (this.circuitCanvas) this.drawCircuit();
        
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
        
        // I1 phasor (with angle based on load)
        let loadAngle = 0;
        if (this.loadType === 'inductive') loadAngle = -Math.PI / 6;
        if (this.loadType === 'capacitive') loadAngle = Math.PI / 6;
        
        const i1Mag = 40;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + i1Mag * Math.cos(loadAngle - Math.PI/2),
            centerY + i1Mag * Math.sin(loadAngle - Math.PI/2)
        );
        ctx.strokeStyle = '#4488ff';
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Labels
        ctx.fillStyle = '#ff4444';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('V1', centerX + v1Mag + 5, centerY - 5);
        ctx.fillStyle = '#44ff44';
        ctx.fillText('V2', centerX - v2Mag - 15, centerY - 5);
        ctx.fillStyle = '#4488ff';
        ctx.fillText('I1', centerX + 5, centerY - i1Mag - 5);
    }
    
    drawCircuit() {
        const ctx = this.circuitCtx;
        const canvas = this.circuitCanvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        const a = this.N1 / this.N2;
        
        // Draw equivalent circuit diagram
        ctx.strokeStyle = '#888899';
        ctx.fillStyle = '#ccccdd';
        ctx.lineWidth = 2;
        ctx.font = '12px JetBrains Mono';
        
        // Primary side
        const y = h / 2;
        const x1 = 50;
        const x2 = 200;
        const x3 = 350;
        const x4 = 500;
        const x5 = 650;
        
        // Input terminals
        ctx.beginPath();
        ctx.arc(x1, y - 30, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4444';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x1, y + 30, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4444';
        ctx.fill();
        
        // Primary voltage source
        ctx.fillStyle = '#ff4444';
        ctx.fillText('V1', x1 - 15, y - 45);
        ctx.fillText(`${this.V1.toFixed(0)}V`, x1 - 25, y + 50);
        
        // Primary resistance R1
        ctx.strokeStyle = '#ffaa44';
        ctx.beginPath();
        ctx.moveTo(x1 + 30, y - 30);
        ctx.lineTo(x2 - 20, y - 30);
        ctx.stroke();
        // Zigzag for resistor
        ctx.beginPath();
        ctx.moveTo(x2 - 20, y - 30);
        ctx.lineTo(x2 - 10, y - 35);
        ctx.lineTo(x2 - 10, y - 25);
        ctx.lineTo(x2, y - 30);
        ctx.lineTo(x2 - 10, y - 35);
        ctx.stroke();
        ctx.fillStyle = '#ffaa44';
        ctx.fillText(`R1=${this.R1}Ω`, x1 + 60, y - 40);
        
        // Primary reactance X1
        ctx.strokeStyle = '#44aaff';
        ctx.beginPath();
        ctx.moveTo(x2 + 20, y - 30);
        ctx.lineTo(x3 - 20, y - 30);
        ctx.stroke();
        ctx.fillStyle = '#44aaff';
        ctx.fillText(`X1=${this.X1}Ω`, x2 + 30, y - 45);
        
        // Magnetizing branch (Rc || Xm)
        ctx.strokeStyle = '#aaaa44';
        ctx.beginPath();
        ctx.moveTo(x3, y - 30);
        ctx.lineTo(x3, y - 80);
        ctx.lineTo(x3 + 100, y - 80);
        ctx.lineTo(x3 + 100, y - 30);
        ctx.stroke();
        
        // Rc
        ctx.beginPath();
        ctx.moveTo(x3 + 20, y - 80);
        ctx.lineTo(x3 + 30, y - 85);
        ctx.lineTo(x3 + 30, y - 75);
        ctx.lineTo(x3 + 40, y - 80);
        ctx.stroke();
        ctx.fillStyle = '#aaaa44';
        ctx.fillText(`Rc=${this.Rc}Ω`, x3 + 10, y - 95);
        
        // Xm
        ctx.beginPath();
        ctx.moveTo(x3 + 60, y - 80);
        ctx.lineTo(x3 + 70, y - 85);
        ctx.lineTo(x3 + 70, y - 75);
        ctx.lineTo(x3 + 80, y - 80);
        ctx.stroke();
        ctx.fillStyle = '#44aaaa';
        ctx.fillText(`Xm=${this.Xm.toFixed(0)}Ω`, x3 + 55, y - 95);
        
        // Ideal transformer (circled X)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x3 + 150, y, 25, 40, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Ideal', x3 + 130, y + 55);
        ctx.fillText(`a=${a.toFixed(1)}`, x3 + 135, y - 55);
        
        // Secondary side (referred)
        const x2s = x4;
        
        // R2' (referred)
        ctx.strokeStyle = '#ffaa44';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x4 + 30, y - 30);
        ctx.lineTo(x2s - 20, y - 30);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2s - 20, y - 30);
        ctx.lineTo(x2s - 10, y - 35);
        ctx.lineTo(x2s - 10, y - 25);
        ctx.lineTo(x2s, y - 30);
        ctx.stroke();
        ctx.fillStyle = '#ffaa44';
        ctx.fillText(`R2'=${(this.R2*a*a).toFixed(1)}Ω`, x4 + 35, y - 40);
        
        // X2' (referred)
        ctx.strokeStyle = '#44aaff';
        ctx.beginPath();
        ctx.moveTo(x2s + 20, y - 30);
        ctx.lineTo(x5 - 20, y - 30);
        ctx.stroke();
        ctx.fillStyle = '#44aaff';
        ctx.fillText(`X2'=${(this.X2*a*a).toFixed(1)}Ω`, x2s + 25, y - 45);
        
        // Load
        ctx.strokeStyle = '#44ff44';
        ctx.beginPath();
        ctx.moveTo(x5 + 20, y - 30);
        ctx.lineTo(x5 + 60, y - 30);
        ctx.lineTo(x5 + 60, y + 30);
        ctx.lineTo(x5 + 20, y + 30);
        ctx.stroke();
        ctx.fillStyle = '#44ff44';
        ctx.fillText(`RL=${this.loadResistance}Ω`, x5 + 15, y - 40);
        ctx.fillText(`${this.loadType}`, x5 + 15, y + 50);
        
        // Output terminals
        ctx.beginPath();
        ctx.arc(x5 + 60, y - 30, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#44ff44';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x5 + 60, y + 30, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#44ff44';
        ctx.fillText(`V2=${this.V2.toFixed(1)}V`, x5 + 40, y + 55);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.transformerSimulator = new TransformerSimulator();
});
