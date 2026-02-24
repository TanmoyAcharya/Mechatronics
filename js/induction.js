/**
 * Enhanced Induction (Asynchronous) Machine Simulator
 * Interactive simulation with realistic animations and deep physics
 */

class InductionSimulator {
    constructor() {
        // Machine parameters
        this.Vt = 400;          // Supply voltage (V)
        this.f = 50;            // Frequency (Hz)
        this.R1 = 0.5;           // Stator resistance (Ohm)
        this.R2 = 0.3;           // Rotor resistance (Ohm)
        this.X1 = 1.0;           // Stator leakage reactance (Ohm)
        this.X2 = 0.8;           // Rotor leakage reactance (Ohm)
        this.Xm = 25;            // Magnetizing reactance (Ohm)
        
        // Operating parameters
        this.T_load = 50;        // Load torque (Nm)
        this.R_ext = 0;          // External rotor resistance (Ohm)
        this.rotorType = 'squirrel-cage';
        
        // Additional machine parameters
        this.P = 4;              // Number of poles
        this.Lm = 0.15;          // Magnetizing inductance (mH)
        
        // Calculated values
        this.n_s = 0;            // Synchronous speed (RPM)
        this.n_r = 0;            // Rotor speed (RPM)
        this.s = 0;              // Slip
        this.T_dev = 0;           // Developed torque (Nm)
        this.efficiency = 0;     // Efficiency (%)
        this.P_mech = 0;         // Mechanical power (W)
        
        // Animation
        this.rotorAngle = 0;
        this.animationId = null;
        this.time = 0;
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('induction-machine-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.torqueCanvas = document.getElementById('torque-speed-viz');
        this.torqueCtx = this.torqueCanvas.getContext('2d');
        
        this.setupControls();
        
        // Use canvas attributes as fallback
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        const containers = [
            { canvas: this.canvas, container: this.canvas.parentElement },
            { canvas: this.torqueCanvas, container: this.torqueCanvas.parentElement }
        ];
        
        containers.forEach(({ canvas, container }) => {
            if (container && canvas.width === 0) {
                const rect = container.getBoundingClientRect();
                canvas.width = rect.width || canvas.getAttribute('width') || 750;
                canvas.height = rect.height || canvas.getAttribute('height') || 180;
            }
        });
        
        this.calculate();
    }
    
    setupControls() {
        // Voltage slider
        const vtSlider = document.getElementById('ind-vt-slider');
        const vtValue = document.getElementById('ind-vt-value');
        vtSlider.addEventListener('input', (e) => {
            this.Vt = parseFloat(e.target.value);
            vtValue.textContent = this.Vt;
            this.calculate();
        });
        
        // Frequency slider
        const freqSlider = document.getElementById('ind-freq-slider');
        const freqValue = document.getElementById('ind-freq-value');
        freqSlider.addEventListener('input', (e) => {
            this.f = parseFloat(e.target.value);
            freqValue.textContent = this.f;
            this.calculate();
        });
        
        // Stator resistance slider
        const r1Slider = document.getElementById('r1-slider');
        const r1Value = document.getElementById('r1-value');
        r1Slider.addEventListener('input', (e) => {
            this.R1 = parseFloat(e.target.value);
            r1Value.textContent = this.R1;
            this.calculate();
        });
        
        // Rotor resistance slider
        const r2Slider = document.getElementById('r2-slider');
        const r2Value = document.getElementById('r2-value');
        r2Slider.addEventListener('input', (e) => {
            this.R2 = parseFloat(e.target.value);
            r2Value.textContent = this.R2;
            this.calculate();
        });
        
        // Load torque slider
        const torqueSlider = document.getElementById('ind-torque-slider');
        const torqueValue = document.getElementById('ind-torque-value');
        torqueSlider.addEventListener('input', (e) => {
            this.T_load = parseFloat(e.target.value);
            torqueValue.textContent = this.T_load;
            this.calculate();
        });
        
        // External resistance slider
        const extRSlider = document.getElementById('ext-r-slider');
        const extRValue = document.getElementById('ext-r-value');
        extRSlider.addEventListener('input', (e) => {
            this.R_ext = parseFloat(e.target.value);
            extRValue.textContent = this.R_ext;
            this.calculate();
        });
        
        // Rotor type toggle
        const rotorButtons = document.querySelectorAll('#induction-page .rotor-btn');
        rotorButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                rotorButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.rotorType = btn.dataset.rotor;
                this.calculate();
            });
        });
    }
    
    calculate() {
        // Synchronous speed
        this.n_s = (120 * this.f) / this.P;
        
        // Total rotor resistance
        const R2_total = this.R2 + this.R_ext;
        
        // Find operating slip from torque equation
        this.s = this.findSlipAtTorque(this.T_load, R2_total);
        
        // Rotor speed
        this.n_r = this.n_s * (1 - this.s);
        
        // Developed torque
        this.T_dev = this.T_load;
        
        // Mechanical power
        this.P_mech = (2 * Math.PI * this.n_r * this.T_dev) / 60;
        
        // Input power approximation
        const P_airGap = this.P_mech / (1 - this.s);
        const P_rotorLoss = this.s * P_airGap;
        const P_statorLoss = 3 * Math.pow(this.Vt / (this.Xm + this.X1), 2) * this.R1;
        const P_input = P_airGap + P_statorLoss + P_rotorLoss;
        
        // Efficiency
        this.efficiency = (this.P_mech / P_input) * 100;
        this.efficiency = Math.max(0, Math.min(100, this.efficiency));
        
        // Update readings
        document.getElementById('ns-reading').textContent = Math.round(this.n_s) + ' RPM';
        document.getElementById('nr-reading').textContent = Math.round(this.n_r) + ' RPM';
        document.getElementById('s-reading').textContent = (this.s * 100).toFixed(1) + '%';
        document.getElementById('tdev-reading').textContent = formatNumber(this.T_dev, 1) + ' Nm';
        document.getElementById('eff-reading').textContent = this.efficiency.toFixed(1) + '%';
        
        // Update displays
        document.getElementById('induction-slip-display').textContent = 
            (this.s * 100).toFixed(1) + '%';
        document.getElementById('induction-speed-display').textContent = 
            Math.round(this.n_r) + ' RPM';
        
        this.draw();
        this.drawTorqueSpeed();
    }
    
    findSlipAtTorque(targetTorque, R2_eff) {
        let low = 0.001;
        let high = 1.0;
        let s = 0.1;
        
        for (let i = 0; i < 50; i++) {
            s = (low + high) / 2;
            const torque = this.calculateTorque(s, R2_eff);
            
            if (Math.abs(torque - targetTorque) < 0.1) break;
            
            if (torque > targetTorque) {
                high = s;
            } else {
                low = s;
            }
        }
        
        return s;
    }
    
    calculateTorque(s, R2_eff) {
        if (s < 0.001) s = 0.001;
        
        const omega_s = 2 * Math.PI * this.f / 2;
        const num = 3 * this.Vt * this.Vt * (R2_eff / s);
        const denom = omega_s * (
            Math.pow(this.R1 + R2_eff / s, 2) + 
            Math.pow(this.X1 + this.X2, 2)
        );
        
        return num / denom;
    }
    
    calculateMaxTorque(R2_eff) {
        const s_max = R2_eff / Math.sqrt(
            Math.pow(this.R1 + R2_eff, 2) + 
            Math.pow(this.X1 + this.X2, 2)
        );
        
        return this.calculateTorque(s_max, R2_eff);
    }
    
    start() {
        if (this.animationId) return;
        console.log('Starting enhanced induction simulator');
        try {
            this.animate();
        } catch (e) {
            console.error('Error starting induction simulator:', e);
        }
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    animate() {
        const speedRPM = this.n_r;
        const speedRadPerSec = (2 * Math.PI * speedRPM) / 60;
        this.rotorAngle += speedRadPerSec * 0.016;
        
        this.time += 0.016;
        
        this.draw();
        this.drawTorqueSpeed();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;
        const centerX = w / 2;
        const centerY = h / 2;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        const scale = Math.min(w, h) * 0.38;
        
        // Draw stator housing with cooling fins
        ctx.beginPath();
        ctx.arc(centerX, centerY, scale + 20, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a25';
        ctx.fill();
        
        // Cooling fins
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(
                centerX + Math.cos(angle) * (scale + 15),
                centerY + Math.sin(angle) * (scale + 15)
            );
            ctx.lineTo(
                centerX + Math.cos(angle) * (scale + 30),
                centerY + Math.sin(angle) * (scale + 30)
            );
            ctx.strokeStyle = '#2a2a3a';
            ctx.lineWidth = 5;
            ctx.stroke();
        }
        
        // Stator core
        ctx.beginPath();
        ctx.arc(centerX, centerY, scale, 0, Math.PI * 2);
        const statorGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale);
        statorGrad.addColorStop(0, '#353540');
        statorGrad.addColorStop(0.7, '#252530');
        statorGrad.addColorStop(1, '#1a1a22');
        ctx.fillStyle = statorGrad;
        ctx.fill();
        
        // Stator slots
        const numSlots = 36;
        for (let i = 0; i < numSlots; i++) {
            const angle = (i / numSlots) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, scale - 8, angle - 0.05, angle + 0.05);
            ctx.strokeStyle = '#0a0a10';
            ctx.lineWidth = 6;
            ctx.stroke();
        }
        
        // Three-phase winding visualization
        const coilColors = ['#ff4444', '#44ff44', '#4488ff'];
        for (let phase = 0; phase < 3; phase++) {
            for (let i = 0; i < 4; i++) {
                const startAngle = (phase * 2 * Math.PI / 3) + (i * Math.PI / 12) - Math.PI / 24;
                ctx.beginPath();
                ctx.arc(centerX, centerY, scale - 40, startAngle, startAngle + Math.PI / 24);
                ctx.strokeStyle = coilColors[phase];
                ctx.lineWidth = 5;
                ctx.stroke();
            }
        }
        
        // Rotating magnetic field
        this.drawRotatingField(ctx, centerX, centerY, scale);
        
        // Air gap
        ctx.beginPath();
        ctx.arc(centerX, centerY, scale * 0.68, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a10';
        ctx.fill();
        
        // Rotor
        const rotorRadius = scale * 0.63;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotorAngle);
        
        // Rotor core
        ctx.beginPath();
        ctx.arc(0, 0, rotorRadius, 0, Math.PI * 2);
        const rotorGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rotorRadius);
        rotorGrad.addColorStop(0, '#454555');
        rotorGrad.addColorStop(1, '#303040');
        ctx.fillStyle = rotorGrad;
        ctx.fill();
        
        // Squirrel cage bars
        const numBars = 24;
        const barColors = ['#f97316', '#ff8c42', '#ffb366', '#ffa080'];
        
        for (let i = 0; i < numBars; i++) {
            const barAngle = (i / numBars) * Math.PI * 2;
            const barW = rotorRadius * 0.14;
            
            ctx.beginPath();
            ctx.rect(
                Math.cos(barAngle) * rotorRadius * 0.15 - barW/2,
                Math.sin(barAngle) * rotorRadius * 0.15 - barW/2,
                barW,
                rotorRadius * 0.75
            );
            ctx.fillStyle = barColors[i % 4];
            ctx.fill();
            
            // End rings
            ctx.beginPath();
            ctx.arc(0, 0, rotorRadius * 0.88, barAngle - 0.06, barAngle + 0.06);
            ctx.strokeStyle = '#c08030';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        // Shaft
        ctx.beginPath();
        ctx.arc(0, 0, rotorRadius * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = '#707080';
        ctx.fill();
        
        ctx.restore();
        
        // Slip indicator
        ctx.beginPath();
        ctx.arc(centerX, centerY, scale + 40, -Math.PI/2, -Math.PI/2 + 2 * Math.PI * this.s);
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Slip label
        ctx.fillStyle = '#f97316';
        ctx.font = '12px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`s = ${(this.s * 100).toFixed(1)}%`, centerX, scale + 60);
    }
    
    drawRotatingField(ctx, centerX, centerY, scale) {
        const time = this.time;
        
        for (let i = 0; i < 3; i++) {
            const fieldAngle = time * 3 + (i * 2 * Math.PI / 3);
            
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, scale * 0.6
            );
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, scale * 0.6, fieldAngle - 0.4, fieldAngle + 0.4);
            ctx.arc(centerX, centerY, scale * 0.35, fieldAngle + 0.4, fieldAngle - 0.4, true);
            ctx.closePath();
            
            if (i === 0) {
                gradient.addColorStop(0, 'rgba(255, 80, 80, 0.12)');
                gradient.addColorStop(1, 'rgba(255, 80, 80, 0)');
            } else if (i === 1) {
                gradient.addColorStop(0, 'rgba(80, 255, 80, 0.12)');
                gradient.addColorStop(1, 'rgba(80, 255, 80, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(80, 80, 255, 0.12)');
                gradient.addColorStop(1, 'rgba(80, 80, 255, 0)');
            }
            
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }
    
    drawTorqueSpeed() {
        const ctx = this.torqueCtx;
        const canvas = this.torqueCanvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        // Padding
        const padding = { top: 25, right: 25, bottom: 45, left: 65 };
        const plotW = w - padding.left - padding.right;
        const plotH = h - padding.top - padding.bottom;
        
        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= 10; x++) {
            const px = padding.left + (x / 10) * plotW;
            ctx.beginPath(); ctx.moveTo(px, padding.top); ctx.lineTo(px, h - padding.bottom); ctx.stroke();
        }
        
        for (let y = 0; y <= 10; y++) {
            const py = padding.top + (y / 10) * plotH;
            ctx.beginPath(); ctx.moveTo(padding.left, py); ctx.lineTo(w - padding.right, py); ctx.stroke();
        }
        
        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.moveTo(padding.left, h - padding.bottom);
        ctx.lineTo(w - padding.right, h - padding.bottom);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, h - padding.bottom);
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#9898a8';
        ctx.font = '11px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('Speed (RPM)', w / 2, h - 8);
        
        ctx.save();
        ctx.translate(15, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Torque (Nm)', 0, 0);
        ctx.restore();
        
        // Calculate max torque
        const R2_total = this.R2 + this.R_ext;
        const T_max = this.calculateMaxTorque(R2_total);
        const maxTorque = T_max * 1.2;
        
        // Draw torque-speed curve
        ctx.beginPath();
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3;
        
        for (let i = 0; i <= 100; i++) {
            const s_val = i / 100;
            const n = this.n_s * (1 - s_val);
            const t = this.calculateTorque(s_val, R2_total);
            
            const px = padding.left + (n / this.n_s) * plotW;
            const py = h - padding.bottom - (t / maxTorque) * plotH;
            
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        
        // Operating point
        const opX = padding.left + (this.n_r / this.n_s) * plotW;
        const opY = h - padding.bottom - (this.T_dev / maxTorque) * plotH;
        
        ctx.beginPath();
        ctx.arc(opX, opY, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#00d4ff';
        ctx.fill();
        
        ctx.fillStyle = '#00d4ff';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText(`OP: ${Math.round(this.n_r)} RPM, ${this.T_dev.toFixed(1)} Nm`, opX + 12, opY - 10);
        
        // Slip lines
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
        ctx.setLineDash([5, 5]);
        
        const startX = padding.left;
        ctx.beginPath(); ctx.moveTo(startX, padding.top); ctx.lineTo(startX, h - padding.bottom); ctx.stroke();
        
        const syncX = padding.left + plotW;
        ctx.beginPath(); ctx.moveTo(syncX, padding.top); ctx.lineTo(syncX, h - padding.bottom); ctx.stroke();
        
        ctx.setLineDash([]);
        
        // Scale labels
        ctx.fillStyle = '#606070';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        
        for (let i = 0; i <= 5; i++) {
            const n = (this.n_s * i / 5);
            const px = padding.left + (i / 5) * plotW;
            ctx.fillText(Math.round(n).toString(), px, h - padding.bottom + 15);
        }
        
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const t = (maxTorque * i / 5);
            const py = h - padding.bottom - (i / 5) * plotH;
            ctx.fillText(t.toFixed(0), padding.left - 8, py + 4);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.inductionSimulator = new InductionSimulator();
});
