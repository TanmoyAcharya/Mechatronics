/**
 * PMSM Simulator (Permanent Magnet Synchronous Machine)
 * Advanced simulation with torque-speed characteristics, vector control
 */

class PMSMSimulator {
    constructor() {
        // Machine parameters
        this.Vdc = 600;           // DC bus voltage (V)
        this.Poles = 4;           // Number of poles
        this.Rs = 0.5;           // Stator resistance (Ohm)
        this.Ld = 0.008;         // d-axis inductance (H)
        this.Lq = 0.008;         // q-axis inductance (H)
        this.Phi = 0.15;         // Permanent magnet flux (Wb)
        this.J = 0.01;           // Moment of inertia (kg.m²)
        this.B = 0.001;          // Friction coefficient
        
        // Operating conditions
        this.speed = 0;          // Mechanical speed (rad/s)
        this.torque = 0;         // Electromagnetic torque (Nm)
        this.Id = 0;             // d-axis current (A)
        this.Iq = 5;             // q-axis current (A)
        this.frequency = 0;      // Electrical frequency (Hz)
        
        // Load
        this.loadTorque = 10;    // Load torque (Nm)
        this.loadType = 'constant';
        
        // Calculated values
        this.efficiency = 0;
        this.power = 0;
        this.angle = 0;
        
        // Animation
        this.time = 0;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('pmsm-canvas');
        if (!this.canvas) {
            console.log('PMSM canvas not found');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.waveCanvas = document.getElementById('pmsm-wave-viz');
        if (this.waveCanvas) {
            this.waveCtx = this.waveCanvas.getContext('2d');
        }
        
        this.vectorCanvas = document.getElementById('pmsm-vector-viz');
        if (this.vectorCanvas) {
            this.vectorCtx = this.vectorCanvas.getContext('2d');
        }
        
        this.setupControls();
        
        if (this.canvas.width === 0) {
            this.canvas.width = 800;
            this.canvas.height = 400;
        }
        if (this.waveCanvas && this.waveCanvas.width === 0) {
            this.waveCanvas.width = 380;
            this.waveCanvas.height = 200;
        }
        if (this.vectorCanvas && this.vectorCanvas.width === 0) {
            this.vectorCanvas.width = 380;
            this.vectorCanvas.height = 200;
        }
        
        this.calculate();
    }
    
    setupControls() {
        // Speed control
        const speedSlider = document.getElementById('pmsm-speed-slider');
        const speedValue = document.getElementById('pmsm-speed-value');
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                this.setSpeed(parseFloat(e.target.value));
                speedValue.textContent = this.speed.toFixed(0);
            });
        }
        
        // Current control (Iq)
        const iqSlider = document.getElementById('pmsm-iq-slider');
        const iqValue = document.getElementById('pmsm-iq-value');
        if (iqSlider && iqValue) {
            iqSlider.addEventListener('input', (e) => {
                this.Iq = parseFloat(e.target.value);
                iqValue.textContent = this.Iq.toFixed(1);
                this.calculate();
            });
        }
        
        // Id control (field weakening)
        const idSlider = document.getElementById('pmsm-id-slider');
        const idValue = document.getElementById('pmsm-id-value');
        if (idSlider && idValue) {
            idSlider.addEventListener('input', (e) => {
                this.Id = parseFloat(e.target.value);
                idValue.textContent = this.Id.toFixed(1);
                this.calculate();
            });
        }
        
        // Load torque
        const loadSlider = document.getElementById('pmsm-load-slider');
        const loadValue = document.getElementById('pmsm-load-value');
        if (loadSlider && loadValue) {
            loadSlider.addEventListener('input', (e) => {
                this.loadTorque = parseFloat(e.target.value);
                loadValue.textContent = this.loadTorque.toFixed(1);
                this.calculate();
            });
        }
        
        // Control mode
        const modeSelect = document.getElementById('pmsm-mode');
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                this.controlMode = e.target.value;
                if (this.controlMode === 'torque') {
                    this.Iq = 10;
                    this.Id = 0;
                } else if (this.controlMode === 'speed') {
                    this.Iq = Math.min(15, this.loadTorque / 2);
                    this.Id = 0;
                } else if (this.controlMode === 'flux') {
                    this.Id = -3;
                    this.Iq = Math.min(15, this.loadTorque / 2);
                }
                this.calculate();
                // Update sliders
                const iqSlider = document.getElementById('pmsm-iq-slider');
                const idSlider = document.getElementById('pmsm-id-slider');
                if (iqSlider) iqSlider.value = this.Iq;
                if (idSlider) idSlider.value = this.Id;
                const iqValue = document.getElementById('pmsm-iq-value');
                const idValue = document.getElementById('pmsm-id-value');
                if (iqValue) iqValue.textContent = this.Iq.toFixed(1);
                if (idValue) idValue.textContent = this.Id.toFixed(1);
            });
        }
    }
    
    setSpeed(speedRPM) {
        this.speed = speedRPM * 2 * Math.PI / 60;
        this.frequency = this.speed * this.Poles / 4 / Math.PI * 60;
        this.calculate();
    }
    
    calculate() {
        // Synchronous speed
        const ns = 120 * this.frequency / this.Poles; // rpm
        const ws = 2 * Math.PI * ns / 60; // rad/s
        
        // Calculate back EMF
        const E = this.Phi * ws;
        
        // Direct voltage calculation (simplified)
        const Vd = this.Rs * this.Id - ws * this.Lq * this.Iq;
        const Vq = this.Rs * this.Iq + ws * (this.Ld * this.Id + this.Phi);
        const Vs = Math.sqrt(Vd * Vd + Vq * Vq);
        
        // Electromagnetic torque (torque = 1.5 * P * [Phi * Iq + (Ld-Lq) * Id * Iq])
        this.torque = 1.5 * this.Poles / 2 * (this.Phi * this.Iq + (this.Ld - this.Lq) * this.Id * this.Iq);
        
        // Mechanical power
        this.power = this.torque * this.speed;
        
        // Copper losses
        const P_cu = 1.5 * (this.Id * this.Id + this.Iq * this.Iq) * this.Rs;
        
        // Iron losses (simplified)
        const P_core = 0.05 * this.power;
        
        // Mechanical losses
        const P_mech = this.B * this.speed * this.speed;
        
        const P_loss = P_cu + P_core + P_mech;
        
        // Efficiency
        if (this.power > 0) {
            this.efficiency = (this.power / (this.power + P_loss)) * 100;
        } else {
            this.efficiency = 0;
        }
        this.efficiency = Math.max(0, Math.min(100, this.efficiency));
        
        // Update readings
        const torqueReading = document.getElementById('pmsm-torque-reading');
        if (torqueReading) torqueReading.textContent = this.torque.toFixed(2) + ' Nm';
        
        const powerReading = document.getElementById('pmsm-power-reading');
        if (powerReading) powerReading.textContent = Math.abs(this.power).toFixed(0) + ' W';
        
        const effReading = document.getElementById('pmsm-eff-reading');
        if (effReading) effReading.textContent = this.efficiency.toFixed(1) + '%';
        
        const speedReading = document.getElementById('pmsm-speed-reading');
        if (speedReading) speedReading.textContent = (this.speed * 60 / (2 * Math.PI)).toFixed(0) + ' RPM';
        
        const freqReading = document.getElementById('pmsm-freq-reading');
        if (freqReading) freqReading.textContent = this.frequency.toFixed(1) + ' Hz';
        
        const vsReading = document.getElementById('pmsm-vs-reading');
        if (vsReading) vsReading.textContent = Vs.toFixed(1) + ' V';
        
        this.draw();
        if (this.waveCanvas) this.drawWaveforms();
        if (this.vectorCanvas) this.drawVectors();
    }
    
    start() {
        if (this.animationId || !this.canvas) return;
        console.log('Starting PMSM simulator');
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
        this.angle += this.speed * 0.016;
        this.draw();
        
        if (this.waveCanvas) this.drawWaveforms();
        if (this.vectorCanvas) this.drawVectors();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        const centerX = w / 2;
        const centerY = h / 2;
        
        // Draw PMSM cross-section
        const rotorRadius = 80;
        const statorRadius = 140;
        
        // Stator (outer)
        ctx.beginPath();
        ctx.arc(centerX, centerY, statorRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#2a2a3a';
        ctx.fill();
        ctx.strokeStyle = '#3a3a4a';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Stator teeth/slots
        const numSlots = 36;
        ctx.strokeStyle = '#404050';
        ctx.lineWidth = 1;
        for (let i = 0; i < numSlots; i++) {
            const angle = (i / numSlots) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(
                centerX + Math.cos(angle) * rotorRadius * 1.05,
                centerY + Math.sin(angle) * rotorRadius * 1.05
            );
            ctx.lineTo(
                centerX + Math.cos(angle) * statorRadius,
                centerY + Math.sin(angle) * statorRadius
            );
            ctx.stroke();
        }
        
        // Stator windings (3-phase)
        const phaseColors = ['#ff4444', '#44ff44', '#4488ff'];
        const phaseAngles = [0, 2 * Math.PI / 3, 4 * Math.PI / 3];
        const currentTime = this.time * 2 * Math.PI * this.frequency / 60;
        
        for (let phase = 0; phase < 3; phase++) {
            const phaseOffset = phaseAngles[phase] + currentTime;
            const current = phase === 0 ? this.Id : (phase === 1 ? this.Iq * Math.cos(currentTime) : this.Iq * Math.sin(currentTime));
            const intensity = Math.abs(current) / 15;
            
            ctx.strokeStyle = phaseColors[phase];
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.3 + intensity * 0.7;
            
            for (let i = 0; i < 6; i++) {
                const angle = phaseOffset + (i * Math.PI / 9) - Math.PI / 18;
                ctx.beginPath();
                ctx.arc(centerX, centerY, rotorRadius * 1.1, angle, angle + Math.PI / 12);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
        
        // Rotor (inner) with permanent magnets
        ctx.beginPath();
        ctx.arc(centerX, centerY, rotorRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a2a';
        ctx.fill();
        
        // Draw permanent magnets
        const numPoles = this.Poles;
        for (let i = 0; i < numPoles; i++) {
            const angle1 = (i / numPoles) * Math.PI * 2 + this.angle;
            const angle2 = ((i + 0.5) / numPoles) * Math.PI * 2 + this.angle;
            
            // North pole
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, rotorRadius * 0.9, angle1, angle2);
            ctx.closePath();
            ctx.fillStyle = '#ff6b6b';
            ctx.globalAlpha = 0.8;
            ctx.fill();
            
            // South pole
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, rotorRadius * 0.9, angle2, angle1 + Math.PI / numPoles);
            ctx.closePath();
            ctx.fillStyle = '#4dabf7';
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        
        // Rotor center
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#444455';
        ctx.fill();
        ctx.strokeStyle = '#555566';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#888899';
        ctx.font = '12px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('Stator (Stator)', centerX, h - 60);
        ctx.fillText('Rotor with PMs', centerX, centerY + rotorRadius + 25);
        
        // Speed display
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 16px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText(`Speed: ${(this.speed * 60 / (2 * Math.PI)).toFixed(0)} RPM`, 20, 30);
        ctx.fillText(`Torque: ${this.torque.toFixed(2)} Nm`, 20, 55);
        ctx.fillText(`Power: ${Math.abs(this.power).toFixed(0)} W`, 20, 80);
    }
    
    drawWaveforms() {
        const ctx = this.waveCtx;
        const canvas = this.waveCanvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        const centerY = h / 2;
        
        ctx.lineWidth = 2;
        
        // Id waveform (d-axis)
        ctx.strokeStyle = '#ff6b6b';
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const t = x / w * 0.04 + this.time;
            const y = centerY + 30 * Math.sin(2 * Math.PI * 5 * t) * (this.Id / 10);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Iq waveform (q-axis)
        ctx.strokeStyle = '#4dabf7';
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const t = x / w * 0.04 + this.time;
            const y = centerY + 50 * Math.sin(2 * Math.PI * 5 * t) * (this.Iq / 10);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Torque waveform
        ctx.strokeStyle = '#51cf66';
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const t = x / w * 0.04 + this.time;
            const torque = this.torque * Math.abs(Math.sin(2 * Math.PI * 5 * t));
            const y = h - 20 - torque * 3;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Labels
        ctx.font = '10px JetBrains Mono';
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('Id', 10, 15);
        ctx.fillStyle = '#4dabf7';
        ctx.fillText('Iq', 10, 35);
        ctx.fillStyle = '#51cf66';
        ctx.fillText('Torque', 10, h - 5);
    }
    
    drawVectors() {
        const ctx = this.vectorCtx;
        const canvas = this.vectorCanvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        const centerX = w / 2;
        const centerY = h / 2;
        
        // Reference axes
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, h);
        ctx.stroke();
        
        // d-axis (direct axis)
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX - 50, centerY);
        ctx.stroke();
        
        // q-axis (quadrature axis)
        ctx.strokeStyle = '#4dabf7';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY - 60);
        ctx.stroke();
        
        // Id vector
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX - 30 * (this.Id / 5), centerY);
        ctx.stroke();
        
        // Iq vector
        ctx.strokeStyle = '#4dabf7';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY - 40 * (this.Iq / 10));
        ctx.stroke();
        
        // Resultant current vector
        ctx.strokeStyle = '#51cf66';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX - 30 * (this.Id / 5),
            centerY - 40 * (this.Iq / 10)
        );
        ctx.stroke();
        
        // Labels
        ctx.font = '10px JetBrains Mono';
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('d-axis', 20, centerY - 10);
        ctx.fillStyle = '#4dabf7';
        ctx.fillText('q-axis', centerX + 10, 20);
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('Id', centerX - 30 * (this.Id / 5) - 15, centerY - 5);
        ctx.fillStyle = '#4dabf7';
        ctx.fillText('Iq', centerX + 5, centerY - 40 * (this.Iq / 10) - 5);
        ctx.fillStyle = '#51cf66';
        ctx.fillText('Is', centerX - 30 * (this.Id / 5) + 5, centerY - 40 * (this.Iq / 10) - 5);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.pmsmSimulator = new PMSMSimulator();
});
