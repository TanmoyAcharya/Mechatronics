/**
 * DC Motor Simulator - Enhanced Version
 * Improved physics model with realistic parameters
 */

class DCMotorSimulator {
    constructor() {
        // Enhanced Motor Parameters
        this.V = 220;           // Supply voltage (V)
        this.Ia = 0;            // Armature current (A)
        this.If = 0.5;          // Field current (A)
        this.T_load = 0;        // Load torque (Nm)
        
        // Motor Circuit Parameters
        this.Ra = 0.5;         // Armature resistance (Ohm)
        this.Rf = 200;          // Field resistance (Ohm)  
        this.La = 0.01;         // Armature inductance (H)
        this.Lf = 10;           // Field inductance (H)
        
        // Motor Construction Parameters
        this.K = 0.5;           // Motor constant (Nm/A/Wb)
        this.J = 0.05;          // Moment of inertia (kg·m²)
        this.B = 0.01;          // Viscous friction coefficient (Nm·s/rad)
        this.PolePairs = 2;     // Number of pole pairs
        
        // Thermal Parameters
        this.Ra_hot = 0.6;     // Hot armature resistance
        this.temperature = 25;  // Motor temperature (°C)
        this.thermalTimeConst = 300; // Thermal time constant (s)
        
        // Operating state
        this.n = 0;            // Speed (RPM)
        this.omega = 0;        // Angular velocity (rad/s)
        this.Ea = 0;           // Back EMF (V)
        this.PowerLoss = 0;    // Total power loss (W)
        this.P_mech = 0;       // Mechanical power (W)
        this.efficiency = 0;     // Efficiency
        
        // Motor type
        this.motorType = 'shunt'; // shunt, series, compound
        
        // Animation
        this.rotorAngle = 0;
        this.animationId = null;
        this.time = 0;
        
        // History for charts
        this.speedHistory = [];
        this.torqueHistory = [];
        this.maxHistoryLength = 200;
        
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
        
        this.calculate();
        this.draw();
    }
    
    setupControls() {
        // Voltage slider
        const vtSlider = document.getElementById('dc-vt-slider');
        const vtValue = document.getElementById('dc-vt-value');
        if (vtSlider && vtValue) {
            vtSlider.addEventListener('input', (e) => {
                this.V = parseFloat(e.target.value);
                vtValue.textContent = this.V;
                this.calculate();
            });
        }
        
        // Field current slider
        const ifSlider = document.getElementById('dc-if-slider');
        const ifValue = document.getElementById('dc-if-value');
        if (ifSlider && ifValue) {
            ifSlider.addEventListener('input', (e) => {
                this.If = parseFloat(e.target.value);
                ifValue.textContent = this.If;
                this.calculate();
            });
        }
        
        // Torque/Load slider
        const torqueSlider = document.getElementById('dc-torque-slider');
        const torqueValue = document.getElementById('dc-torque-value');
        if (torqueSlider && torqueValue) {
            torqueSlider.addEventListener('input', (e) => {
                this.T_load = parseFloat(e.target.value);
                torqueValue.textContent = this.T_load.toFixed(1);
                this.calculate();
            });
        }
        
        // Motor type buttons
        const typeButtons = document.querySelectorAll('#dc-motor-page .motor-type-btn');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                typeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.motorType = btn.dataset.type;
                this.calculate();
            });
        });
        
        // Advanced parameter sliders (if they exist)
        this.setupAdvancedControls();
    }
    
    setupAdvancedControls() {
        // Armature Resistance
        const raSlider = document.getElementById('dc-ra-slider');
        const raValue = document.getElementById('dc-ra-value');
        if (raSlider && raValue) {
            raSlider.addEventListener('input', (e) => {
                this.Ra = parseFloat(e.target.value);
                this.Ra_hot = this.Ra * 1.2; // 20% increase when hot
                raValue.textContent = this.Ra.toFixed(2);
                this.calculate();
            });
        }
        
        // Field Resistance
        const rfSlider = document.getElementById('dc-rf-slider');
        const rfValue = document.getElementById('dc-rf-value');
        if (rfSlider && rfValue) {
            rfSlider.addEventListener('input', (e) => {
                this.Rf = parseFloat(e.target.value);
                rfValue.textContent = this.Rf.toFixed(0);
                this.calculate();
            });
        }
        
        // Moment of Inertia
        const jSlider = document.getElementById('dc-j-slider');
        const jValue = document.getElementById('dc-j-value');
        if (jSlider && jValue) {
            jSlider.addEventListener('input', (e) => {
                this.J = parseFloat(e.target.value);
                jValue.textContent = this.J.toFixed(3);
                this.calculate();
            });
        }
    }
    
    calculate() {
        // Calculate field current based on motor type
        switch (this.motorType) {
            case 'shunt':
                // Shunt: Field connected directly across supply
                this.If = this.V / this.Rf;
                break;
            case 'series':
                // Series: Field in series with armature
                // Need to solve iteratively
                this.If = this.Ia;
                break;
            case 'compound':
                // Compound: Series + Shunt
                this.If = this.V / this.Rf;
                break;
        }
        
        // Magnetic flux (simplified model - proportional to field current with saturation)
        const fluxSaturation = 1 + Math.tanh(this.If * 0.5) * 0.3; // Saturation effect
        const phi = this.K * this.If * fluxSaturation;
        
        // Back EMF: E = K * phi * omega
        this.Ea = this.K * phi * this.omega;
        
        // Armature voltage equation: V = E + Ia*Ra
        const V_armature = this.V - this.Ea;
        
        // Armature current: Ia = (V - E) / Ra
        this.Ia = V_armature / this.Ra;
        
        // For series motor, armature current = field current
        if (this.motorType === 'series') {
            this.If = this.Ia;
        }
        
        // Torque equation: T = K * phi * Ia
        const T_electric = this.K * phi * this.Ia;
        
        // Net torque (electric torque - load torque - friction)
        const T_friction = this.B * this.omega;
        const T_net = T_electric - this.T_load - T_friction;
        
        // Angular acceleration: alpha = T / J
        const alpha = T_net / this.J;
        
        // Update speed
        this.omega += alpha * 0.016; // 16ms time step
        this.omega = Math.max(0, this.omega); // No reverse for DC
        
        // Speed in RPM
        this.n = (this.omega * 60) / (2 * Math.PI);
        this.n = Math.max(0, Math.min(5000, this.n));
        
        // Power calculations
        this.P_mech = this.T_load * this.omega; // Mechanical output power
        
        // Electrical input power
        const P_input = this.V * (this.Ia + this.If);
        
        // Power losses
        const P_copper_armature = this.Ia * this.Ia * this.Ra;
        const P_copper_field = this.If * this.If * this.Rf;
        const P_friction = T_friction * this.omega;
        this.PowerLoss = P_copper_armature + P_copper_field + P_friction;
        
        // Efficiency
        this.efficiency = P_input > 0 ? (this.P_mech / P_input) * 100 : 0;
        this.efficiency = Math.max(0, Math.min(100, this.efficiency));
        
        // Update history for charts
        this.updateHistory();
        
        // Update UI readings
        this.updateReadings();
        
        this.draw();
    }
    
    updateHistory() {
        this.speedHistory.push(this.n);
        this.torqueHistory.push(this.T_load);
        
        if (this.speedHistory.length > this.maxHistoryLength) {
            this.speedHistory.shift();
            this.torqueHistory.shift();
        }
    }
    
    updateReadings() {
        const iaReading = document.getElementById('dc-ia-reading');
        if (iaReading) iaReading.textContent = this.Ia.toFixed(1) + ' A';
        
        const ifReading = document.getElementById('dc-if-reading');
        if (ifReading) ifReading.textContent = this.If.toFixed(1) + ' A';
        
        const speedReading = document.getElementById('dc-n-reading');
        if (speedReading) speedReading.textContent = Math.round(this.n) + ' RPM';
        
        const effReading = document.getElementById('dc-eff-reading');
        if (effReading) effReading.textContent = this.efficiency.toFixed(1) + '%';
        
        const emfReading = document.getElementById('dc-emf-reading');
        if (emfReading) emfReading.textContent = this.Ea.toFixed(1) + ' V';
        
        // Additional readings
        const powerReading = document.getElementById('dc-power-reading');
        if (powerReading) powerReading.textContent = this.P_mech.toFixed(0) + ' W';
        
        const lossReading = document.getElementById('dc-loss-reading');
        if (lossReading) lossReading.textContent = this.PowerLoss.toFixed(0) + ' W';
        
        const torqueReading = document.getElementById('dc-torque-reading');
        if (torqueReading) torqueReading.textContent = this.T_load.toFixed(1) + ' Nm';
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
        this.time += 0.016;
        this.rotorAngle += this.omega * 0.016;
        
        this.calculate();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // Clear and draw background
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        // Draw grid
        this.drawGrid(ctx, w, h);
        
        // Draw motor based on type
        switch (this.motorType) {
            case 'shunt':
                this.drawShuntMotor(ctx, w, h);
                break;
            case 'series':
                this.drawSeriesMotor(ctx, w, h);
                break;
            case 'compound':
                this.drawCompoundMotor(ctx, w, h);
                break;
        }
        
        // Draw circuit diagram
        this.drawCircuit(ctx, w, h);
        
        // Draw labels
        this.drawLabels(ctx, w, h);
        
        // Draw charts
        if (this.speedCanvas) this.drawSpeedChart();
        if (this.torqueCanvas) this.drawTorqueChart();
    }
    
    drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < w; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < h; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }
    
    drawShuntMotor(ctx, w, h) {
        const centerX = w * 0.35;
        const centerY = h * 0.5;
        const rotorRadius = 80;
        
        // Draw motor housing (stator)
        const housingGradient = ctx.createRadialGradient(centerX, centerY, rotorRadius, centerX, centerY, rotorRadius + 40);
        housingGradient.addColorStop(0, '#1a1a2e');
        housingGradient.addColorStop(0.7, '#16213e');
        housingGradient.addColorStop(1, '#0f0f23');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, rotorRadius + 35, 0, Math.PI * 2);
        ctx.fillStyle = housingGradient;
        ctx.fill();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw field windings (shunt)
        const fieldColor = this.If > 0 ? '#ff6b6b' : '#444';
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x1 = centerX + Math.cos(angle) * (rotorRadius + 15);
            const y1 = centerY + Math.sin(angle) * (rotorRadius + 15);
            const x2 = centerX + Math.cos(angle + 0.2) * (rotorRadius + 30);
            const y2 = centerY + Math.sin(angle + 0.2) * (rotorRadius + 30);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = fieldColor;
            ctx.lineWidth = 8;
            ctx.stroke();
        }
        
        // Draw rotor (armature)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotorAngle);
        
        // Rotor core
        const rotorGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, rotorRadius);
        rotorGradient.addColorStop(0, '#2d2d44');
        rotorGradient.addColorStop(1, '#1a1a2e');
        
        ctx.beginPath();
        ctx.arc(0, 0, rotorRadius - 5, 0, Math.PI * 2);
        ctx.fillStyle = rotorGradient;
        ctx.fill();
        
        // Armature windings
        const armatureColor = this.Ia > 0 ? '#ffd93d' : '#666';
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * (rotorRadius - 15), Math.sin(angle) * (rotorRadius - 15));
            ctx.strokeStyle = armatureColor;
            ctx.lineWidth = 6;
            ctx.stroke();
        }
        
        // Shaft
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#888';
        ctx.fill();
        
        ctx.restore();
        
        // Draw commutation marks
        ctx.fillStyle = '#2563eb';
        ctx.font = '12px JetBrains Mono';
        ctx.fillText('N', centerX + rotorRadius + 20, centerY - 10);
        ctx.fillText('S', centerX - rotorRadius - 20, centerY - 10);
        
        // Field terminals
        this.drawTerminal(ctx, centerX + rotorRadius + 60, centerY - 40, 'F+', fieldColor);
        this.drawTerminal(ctx, centerX + rotorRadius + 60, centerY + 40, 'F-', fieldColor);
        
        // Armature terminals  
        this.drawTerminal(ctx, centerX + rotorRadius + 60, centerY, 'A', this.Ia > 0 ? '#ffd93d' : '#666');
    }
    
    drawSeriesMotor(ctx, w, h) {
        // Similar to shunt but with series field
        this.drawShuntMotor(ctx, w, h);
        
        // Add series field indicator
        const centerX = w * 0.35;
        const centerY = h * 0.5;
        
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 14px JetBrains Mono';
        ctx.fillText('SERIES', centerX - 30, centerY + 120);
    }
    
    drawCompoundMotor(ctx, w, h) {
        this.drawShuntMotor(ctx, w, h);
        
        const centerX = w * 0.35;
        const centerY = h * 0.5;
        
        ctx.fillStyle = '#9b59b6';
        ctx.font = 'bold 14px JetBrains Mono';
        ctx.fillText('COMPOUND', centerX - 35, centerY + 120);
    }
    
    drawCircuit(ctx, w, h) {
        const circuitX = w * 0.65;
        const circuitY = h * 0.2;
        const circuitW = 280;
        const circuitH = 180;
        
        // Circuit background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(circuitX, circuitY, circuitW, circuitH);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.strokeRect(circuitX, circuitY, circuitW, circuitH);
        
        // Title
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px JetBrains Mono';
        ctx.fillText('Circuit Diagram', circuitX + 10, circuitY + 20);
        
        // Draw circuit based on type
        if (this.motorType === 'shunt') {
            this.drawShuntCircuit(ctx, circuitX, circuitY, circuitW, circuitH);
        }
        
        // Values
        ctx.font = '12px JetBrains Mono';
        ctx.fillStyle = '#ffd93d';
        ctx.fillText(`V: ${this.V.toFixed(0)}V`, circuitX + 10, circuitY + 50);
        ctx.fillText(`Ia: ${this.Ia.toFixed(1)}A`, circuitX + 10, circuitY + 70);
        ctx.fillText(`If: ${this.If.toFixed(1)}A`, circuitX + 10, circuitY + 90);
        ctx.fillText(`Ea: ${this.Ea.toFixed(1)}V`, circuitX + 10, circuitY + 110);
        
        ctx.fillStyle = '#2ed573';
        ctx.fillText(`Efficiency: ${this.efficiency.toFixed(1)}%`, circuitX + 10, circuitY + 140);
        ctx.fillText(`P_out: ${this.P_mech.toFixed(0)}W`, circuitX + 140, circuitY + 50);
        ctx.fillText(`Loss: ${this.PowerLoss.toFixed(0)}W`, circuitX + 140, circuitY + 70);
    }
    
    drawShuntCircuit(ctx, x, y, w, h) {
        // Supply
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 30, y + 40);
        ctx.lineTo(x + 50, y + 40);
        ctx.lineTo(x + 50, y + 50);
        ctx.lineTo(x + 70, y + 50);
        ctx.stroke();
        
        // Field circuit
        ctx.beginPath();
        ctx.moveTo(x + 70, y + 50);
        ctx.lineTo(x + 70, y + 100);
        ctx.lineTo(x + 120, y + 100);
        // Field coil symbol
        ctx.moveTo(x + 120, y + 100);
        ctx.arc(x + 135, y + 100, 15, Math.PI, 0);
        ctx.moveTo(x + 150, y + 100);
        ctx.arc(x + 165, y + 100, 15, Math.PI, 0);
        ctx.lineTo(x + 180, y + 100);
        ctx.lineTo(x + 180, y + 50);
        ctx.lineTo(x + 30, y + 50);
        ctx.stroke();
    }
    
    drawTerminal(ctx, x, y, label, color) {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px JetBrains Mono';
        ctx.fillText(label, x - 5, y - 15);
    }
    
    drawLabels(ctx, w, h) {
        // Speed indicator
        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold 24px JetBrains Mono';
        ctx.fillText(`${Math.round(this.n)} RPM`, w * 0.35 - 40, 40);
        
        // Motor type
        ctx.fillStyle = '#666';
        ctx.font = '14px JetBrains Mono';
        ctx.fillText(this.motorType.toUpperCase() + ' DC MOTOR', w * 0.35 - 50, h - 20);
        
        // Power flow arrow
        const powerX = w * 0.55;
        const powerY = h * 0.6;
        ctx.fillStyle = '#2ed573';
        ctx.font = '16px JetBrains Mono';
        ctx.fillText('POWER FLOW', powerX, powerY - 30);
        
        // Arrow
        ctx.beginPath();
        ctx.moveTo(powerX + 20, powerY);
        ctx.lineTo(powerX + 80, powerY);
        ctx.lineTo(powerX + 70, powerY - 10);
        ctx.moveTo(powerX + 80, powerY);
        ctx.lineTo(powerX + 70, powerY + 10);
        ctx.strokeStyle = '#2ed573';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    drawSpeedChart() {
        if (!this.speedCanvas || !this.speedCtx) return;
        
        const ctx = this.speedCtx;
        const w = this.speedCanvas.width;
        const h = this.speedCanvas.height;
        
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        // Title
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px JetBrains Mono';
        ctx.fillText('Speed vs Time', 10, 20);
        
        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(0, (h / 5) * i);
            ctx.lineTo(w, (h / 5) * i);
            ctx.stroke();
        }
        
        // Draw speed line
        if (this.speedHistory.length > 1) {
            ctx.beginPath();
            const maxSpeed = 5000;
            
            this.speedHistory.forEach((speed, i) => {
                const x = (i / this.maxHistoryLength) * w;
                const y = h - (speed / maxSpeed) * h;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    drawTorqueChart() {
        if (!this.torqueCanvas || !this.torqueCtx) return;
        
        const ctx = this.torqueCtx;
        const w = this.torqueCanvas.width;
        const h = this.torqueCanvas.height;
        
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        // Title
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px JetBrains Mono';
        ctx.fillText('Torque vs Time', 10, 20);
        
        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(0, (h / 5) * i);
            ctx.lineTo(w, (h / 5) * i);
            ctx.stroke();
        }
        
        // Draw torque line
        if (this.torqueHistory.length > 1) {
            ctx.beginPath();
            const maxTorque = 50;
            
            this.torqueHistory.forEach((torque, i) => {
                const x = (i / this.maxHistoryLength) * w;
                const y = h - (torque / maxTorque) * h;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.dcMotorSimulator = new DCMotorSimulator();
});
