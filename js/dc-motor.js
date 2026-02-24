/**
 * DC Motor Simulator
 * Interactive DC motor simulation with realistic animations
 */

class DCMotorSimulator {
    constructor() {
        // Motor parameters
        this.V = 220;           // Supply voltage (V)
        this.Ia = 0;            // Armature current (A)
        this.If = 0.5;          // Field current (A)
        this.T_load = 0;        // Load torque (Nm)
        this.Ra = 0.5;          // Armature resistance (Ohm)
        this.Rf = 200;          // Field resistance (Ohm)
        this.La = 0.01;         // Armature inductance (H)
        this.K = 0.5;           // Motor constant
        this.J = 0.05;          // Moment of inertia
        this.B = 0.01;          // Friction coefficient
        
        // Operating state
        this.n = 0;             // Speed (RPM)
        this.omega = 0;         // Angular velocity (rad/s)
        this.Ea = 0;            // Back EMF (V)
        this.P_mech = 0;        // Mechanical power (W)
        this.efficiency = 0;    // Efficiency
        
        // Motor type
        this.motorType = 'shunt'; // shunt, series, compound
        
        // Animation
        this.rotorAngle = 0;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('dc-motor-canvas');
        if (!this.canvas) {
            console.log('DC Motor canvas not found');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.speedCanvas = document.getElementById('dc-speed-viz');
        if (this.speedCanvas) {
            this.speedCtx = this.speedCanvas.getContext('2d');
        }
        
        this.torqueCanvas = document.getElementById('dc-torque-viz');
        if (this.torqueCanvas) {
            this.torqueCtx = this.torqueCanvas.getContext('2d');
        }
        
        this.setupControls();
        
        // Set canvas size
        if (this.canvas.width === 0) {
            this.canvas.width = 800;
            this.canvas.height = 450;
        }
        if (this.speedCanvas && this.speedCanvas.width === 0) {
            this.speedCanvas.width = 350;
            this.speedCanvas.height = 180;
        }
        if (this.torqueCanvas && this.torqueCanvas.width === 0) {
            this.torqueCanvas.width = 350;
            this.torqueCanvas.height = 180;
        }
        
        this.calculate();
    }
    
    setupControls() {
        const vtSlider = document.getElementById('dc-vt-slider');
        const vtValue = document.getElementById('dc-vt-value');
        if (vtSlider && vtValue) {
            vtSlider.addEventListener('input', (e) => {
                this.V = parseFloat(e.target.value);
                vtValue.textContent = this.V;
                this.calculate();
            });
        }
        
        const ifSlider = document.getElementById('dc-if-slider');
        const ifValue = document.getElementById('dc-if-value');
        if (ifSlider && ifValue) {
            ifSlider.addEventListener('input', (e) => {
                this.If = parseFloat(e.target.value);
                ifValue.textContent = this.If;
                this.calculate();
            });
        }
        
        const torqueSlider = document.getElementById('dc-torque-slider');
        const torqueValue = document.getElementById('dc-torque-value');
        if (torqueSlider && torqueValue) {
            torqueSlider.addEventListener('input', (e) => {
                this.T_load = parseFloat(e.target.value);
                torqueValue.textContent = this.T_load;
                this.calculate();
            });
        }
        
        const typeButtons = document.querySelectorAll('#dc-motor-page .motor-type-btn');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                typeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.motorType = btn.dataset.type;
                this.calculate();
            });
        });
    }
    
    calculate() {
        // Calculate field current
        const Vf = this.V;
        this.If = Vf / this.Rf;
        
        // Calculate back EMF
        const flux = this.K * this.If;
        this.Ea = flux * this.omega;
        
        // Armature current from torque equation
        // T = K * phi * Ia => Ia = T / (K * phi)
        const phi = this.K * this.If;
        this.Ia = this.T_load / (phi + 0.001);
        
        // Voltage equation: V = Ea + Ia*Ra
        const ArmatureVoltage = this.V - this.Ia * this.Ra;
        this.omega = ArmatureVoltage / (phi + 0.001);
        
        // Speed in RPM
        this.n = (this.omega * 60) / (2 * Math.PI);
        this.n = Math.max(0, Math.min(5000, this.n));
        
        // Mechanical power
        this.P_mech = this.T_load * this.omega;
        
        // Input power
        const P_input = this.V * (this.Ia + this.If);
        
        // Efficiency
        this.efficiency = P_input > 0 ? (this.P_mech / P_input) * 100 : 0;
        this.efficiency = Math.max(0, Math.min(100, this.efficiency));
        
        // Update readings
        const iaReading = document.getElementById('dc-ia-reading');
        if (iaReading) iaReading.textContent = this.Ia.toFixed(1) + ' A';
        
        const speedReading = document.getElementById('dc-n-reading');
        if (speedReading) speedReading.textContent = Math.round(this.n) + ' RPM';
        
        const effReading = document.getElementById('dc-eff-reading');
        if (effReading) effReading.textContent = this.efficiency.toFixed(1) + '%';
        
        const emfReading = document.getElementById('dc-emf-reading');
        if (emfReading) emfReading.textContent = this.Ea.toFixed(1) + ' V';
        
        this.draw();
        if (this.speedCanvas) this.drawSpeedChart();
        if (this.torqueCanvas) this.drawTorqueChart();
    }
    
    start() {
        if (this.animationId || !this.canvas) return;
        console.log('Starting DC Motor simulator');
        this.animate();
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    animate() {
        this.rotorAngle += this.omega * 0.016;
        this.draw();
        
        if (this.speedCanvas) this.drawSpeedChart();
        if (this.torqueCanvas) this.drawTorqueChart();
        
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
        const scale = Math.min(w, h) * 0.35;
        
        // Motor housing
        ctx.beginPath();
        ctx.arc(centerX, centerY, scale + 15, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a25';
        ctx.fill();
        
        // Stator (field poles)
        // North pole
        ctx.beginPath();
        ctx.arc(centerX, centerY - scale * 0.7, scale * 0.35, Math.PI, 0);
        ctx.fillStyle = '#353540';
        ctx.fill();
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 20px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('N', centerX, centerY - scale * 0.7);
        
        // South pole
        ctx.beginPath();
        ctx.arc(centerX, centerY + scale * 0.7, scale * 0.35, 0, Math.PI);
        ctx.fillStyle = '#353540';
        ctx.fill();
        ctx.fillStyle = '#4488ff';
        ctx.fillText('S', centerX, centerY + scale * 0.7);
        
        // Field windings
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
            const y = centerY - scale * 0.7 + i * scale * 0.12;
            ctx.beginPath();
            ctx.moveTo(centerX - scale * 0.2, y);
            ctx.lineTo(centerX + scale * 0.2, y);
            ctx.stroke();
        }
        for (let i = 0; i < 6; i++) {
            const y = centerY + scale * 0.3 + i * scale * 0.12;
            ctx.beginPath();
            ctx.moveTo(centerX - scale * 0.2, y);
            ctx.lineTo(centerX + scale * 0.2, y);
            ctx.stroke();
        }
        
        // Rotor (armature)
        const rotorRadius = scale * 0.45;
        ctx.beginPath();
        ctx.arc(centerX, centerY, rotorRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#454555';
        ctx.fill();
        
        // Armature slots
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(
                centerX + Math.cos(angle) * rotorRadius * 0.3,
                centerY + Math.sin(angle) * rotorRadius * 0.3
            );
            ctx.lineTo(
                centerX + Math.cos(angle) * rotorRadius * 0.9,
                centerY + Math.sin(angle) * rotorRadius * 0.9
            );
            ctx.strokeStyle = '#303040';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        // Commutator
        ctx.beginPath();
        ctx.arc(centerX, centerY, rotorRadius * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = '#c08030';
        ctx.fill();
        
        // Commutator segments
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + this.rotorAngle;
            ctx.beginPath();
            ctx.arc(
                centerX + Math.cos(angle) * rotorRadius * 0.15,
                centerY + Math.sin(angle) * rotorRadius * 0.15,
                rotorRadius * 0.12, 0, Math.PI * 2
            );
            ctx.fillStyle = i % 2 === 0 ? '#806030' : '#c0a060';
            ctx.fill();
        }
        
        // Shaft
        ctx.beginPath();
        ctx.arc(centerX, centerY, rotorRadius * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = '#606070';
        ctx.fill();
        
        // Brushes
        ctx.fillStyle = '#404040';
        ctx.fillRect(centerX - rotorRadius * 0.4, centerY - 8, 15, 16);
        ctx.fillRect(centerX + rotorRadius * 0.4 - 15, centerY - 8, 15, 16);
        
        // Current direction arrows
        ctx.fillStyle = '#00ff00';
        ctx.font = '12px JetBrains Mono';
        ctx.fillText('+', centerX - scale * 0.5, centerY - 20);
        ctx.fillText('-', centerX + scale * 0.5, centerY - 20);
        
        // Speed display
        const speedDisplay = document.getElementById('dc-motor-speed-display');
        if (speedDisplay) speedDisplay.textContent = Math.round(this.n) + ' RPM';
    }
    
    drawSpeedChart() {
        const ctx = this.speedCtx;
        const canvas = this.speedCanvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = '#9898a8';
        ctx.font = '12px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`Speed: ${Math.round(this.n)} RPM`, w/2, h/2);
    }
    
    drawTorqueChart() {
        const ctx = this.torqueCtx;
        const canvas = this.torqueCanvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = '#9898a8';
        ctx.font = '12px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`Torque: ${this.T_load.toFixed(1)} Nm`, w/2, h/2);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.dcMotorSimulator = new DCMotorSimulator();
});
