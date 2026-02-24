/**
 * Enhanced Synchronous Machine Simulator
 * Interactive simulation with realistic animations and deep physics
 */

class SynchronousSimulator {
    constructor() {
        // Machine parameters
        this.Vt = 400;          // Terminal voltage (V)
        this.If = 5;             // Field current (A)
        this.T_load = 50;        // Load torque (Nm)
        
        // Machine constants (typical values for a 400V, 50Hz machine)
        this.Ra = 0.15;           // Armature resistance (Ohm)
        this.Xs = 3.5;           // Synchronous reactance (Ohm)
        this.P = 4;              // Number of poles
        this.P = 4;
        this.f = 50;             // Frequency (Hz)
        this.Xd = 4.0;           // d-axis reactance
        this.Xq = 3.5;           // q-axis reactance
        this.Ld = 0.0127;        // d-axis inductance (H)
        this.Lq = 0.0111;        // q-axis inductance (H)
        this.psi_f = 1.2;        // Field flux linkage (Wb-turns)
        
        // Operating state
        this.mode = 'motor';      // 'motor' or 'generator'
        this.powerFactor = 'lagging';  // 'leading', 'lagging', 'unity'
        
        // Calculated values
        this.Ia = 0;              // Armature current (A)
        this.E = 0;               // Internal EMF (V)
        this.cosPhi = 0.8;        // Power factor
        this.phi = 0;             // Power factor angle
        this.n_s = 0;             // Synchronous speed (RPM)
        this.P_mech = 0;          // Mechanical power (W)
        this.efficiency = 0;      // Efficiency
        this.angularVelocity = 0;  // Angular velocity (rad/s)
        
        // Animation
        this.rotorAngle = 0;
        this.fieldTime = 0;
        this.animationId = null;
        
        // Magnetic field visualization
        this.fieldLines = [];
        this.initFieldLines();
        
        this.init();
    }
    
    initFieldLines() {
        // Create magnetic field lines between poles
        for (let i = 0; i < 8; i++) {
            this.fieldLines.push({
                offset: (i - 4) * 0.15,
                opacity: 0.3 + Math.random() * 0.3
            });
        }
    }
    
    init() {
        this.canvas = document.getElementById('sync-machine-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.voltageCanvas = document.getElementById('sync-voltage-viz');
        this.voltageCtx = this.voltageCanvas.getContext('2d');
        
        this.phasorCanvas = document.getElementById('sync-phasor-viz');
        this.phasorCtx = this.phasorCanvas.getContext('2d');
        
        this.pfCanvas = document.getElementById('sync-pf-viz');
        this.pfCtx = this.pfCanvas.getContext('2d');
        
        this.setupControls();
        
        // Set initial canvas sizes based on attributes
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        const containers = [
            { canvas: this.canvas, container: this.canvas.parentElement },
            { canvas: this.voltageCanvas, container: this.voltageCanvas.parentElement },
            { canvas: this.phasorCanvas, container: this.phasorCanvas.parentElement },
            { canvas: this.pfCanvas, container: this.pfCanvas.parentElement }
        ];
        
        containers.forEach(({ canvas, container }) => {
            if (container && canvas.width === 0) {
                // Use CSS dimensions as fallback
                const rect = container.getBoundingClientRect();
                canvas.width = rect.width || canvas.getAttribute('width') || 350;
                canvas.height = rect.height || canvas.getAttribute('height') || 180;
            }
        });
        
        this.calculate();
    }
    
    setupControls() {
        // Voltage slider
        const vtSlider = document.getElementById('vt-slider');
        const vtValue = document.getElementById('vt-value');
        vtSlider.addEventListener('input', (e) => {
            this.Vt = parseFloat(e.target.value);
            vtValue.textContent = this.Vt;
            this.calculate();
        });
        
        // Field current slider
        const ifSlider = document.getElementById('if-slider');
        const ifValue = document.getElementById('if-value');
        ifSlider.addEventListener('input', (e) => {
            this.If = parseFloat(e.target.value);
            ifValue.textContent = this.If;
            this.calculate();
        });
        
        // Torque slider
        const torqueSlider = document.getElementById('torque-slider');
        const torqueValue = document.getElementById('torque-value');
        torqueSlider.addEventListener('input', (e) => {
            this.T_load = parseFloat(e.target.value);
            torqueValue.textContent = this.T_load;
            this.calculate();
        });
        
        // Mode toggle
        const modeButtons = document.querySelectorAll('#synchronous-page .toggle-btn[data-mode]');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.mode = btn.dataset.mode;
                document.getElementById('sync-mode-display').textContent = 
                    this.mode.charAt(0).toUpperCase() + this.mode.slice(1);
                this.calculate();
            });
        });
        
        // Power factor toggle
        const pfButtons = document.querySelectorAll('#synchronous-page .pf-btn');
        pfButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                pfButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.powerFactor = btn.dataset.pf;
                this.calculate();
            });
        });
    }
    
    calculate() {
        // Calculate synchronous speed
        this.n_s = (120 * this.f) / this.P;
        this.angularVelocity = 2 * Math.PI * this.n_s / 60;
        
        // Internal EMF depends on field current - more realistic model
        // E = kf * If (with saturation effects)
        const kf = 55; // EMF constant
        const saturationFactor = 1 + 0.1 * Math.pow(this.If / 10, 2); // Saturation
        this.E = kf * this.If * saturationFactor;
        
        // Power factor angle
        switch(this.powerFactor) {
            case 'leading':
                this.phi = -Math.acos(0.8);
                this.cosPhi = 0.8;
                break;
            case 'lagging':
                this.phi = Math.acos(0.8);
                this.cosPhi = 0.8;
                break;
            case 'unity':
                this.phi = 0;
                this.cosPhi = 1;
                break;
        }
        
        // Calculate armature current using phasor equation
        // E∠δ = Vt∠0 + Ia∠φ(Ra + jXs)
        // Simplified calculation for steady state
        
        const Zs = Math.sqrt(this.Ra * this.Ra + this.Xs * this.Xs);
        
        if (this.mode === 'motor') {
            // Motor mode
            const V_E_diff = this.E - this.Vt;
            this.Ia = Math.abs(V_E_diff) / Zs;
            
            // Mechanical power (output for motor)
            const electricalPower = Math.sqrt(3) * this.Vt * this.Ia * this.cosPhi;
            const copperLoss = 3 * this.Ia * this.Ia * this.Ra;
            this.P_mech = electricalPower - copperLoss;
            this.efficiency = this.P_mech > 0 ? (this.P_mech / electricalPower) * 100 : 0;
        } else {
            // Generator mode
            this.P_mech = this.T_load * this.angularVelocity;
            const electricalPower = Math.sqrt(3) * this.Vt * this.Ia * this.cosPhi;
            const copperLoss = 3 * this.Ia * this.Ia * this.Ra;
            this.Ia = (this.P_mech + copperLoss) / (Math.sqrt(3) * this.Vt * this.cosPhi);
            this.efficiency = (electricalPower / this.P_mech) * 100;
        }
        
        // Update readings display
        document.getElementById('ia-reading').textContent = formatNumber(this.Ia, 1) + ' A';
        document.getElementById('pf-reading').textContent = this.cosPhi.toFixed(2);
        document.getElementById('pmech-reading').textContent = formatNumber(this.P_mech / 1000, 1) + ' kW';
        document.getElementById('emf-reading').textContent = formatNumber(this.E, 1) + ' V';
        
        this.draw();
    }
    
    start() {
        if (this.animationId) return;
        console.log('Starting enhanced synchronous simulator');
        try {
            this.animate();
        } catch (e) {
            console.error('Error starting synchronous simulator:', e);
        }
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    animate() {
        // Update rotor angle (synchronous speed)
        const speed = this.angularVelocity;
        if (speed > 0) {
            this.rotorAngle += speed * 0.016;
        }
        this.fieldTime += 0.016;
        
        this.draw();
        this.drawVoltage();
        this.drawPhasor();
        this.drawPF();
        
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
        
        // Draw machine background
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        const scale = Math.min(w, h) * 0.4;
        
        // Draw stator (outer frame)
        ctx.beginPath();
        ctx.arc(centerX, centerY, scale + 25, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a25';
        ctx.fill();
        
        // Cooling fins on housing
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(
                centerX + Math.cos(angle) * (scale + 20),
                centerY + Math.sin(angle) * (scale + 20)
            );
            ctx.lineTo(
                centerX + Math.cos(angle) * (scale + 35),
                centerY + Math.sin(angle) * (scale + 35)
            );
            ctx.strokeStyle = '#2a2a3a';
            ctx.lineWidth = 6;
            ctx.stroke();
        }
        
        // Stator core
        ctx.beginPath();
        ctx.arc(centerX, centerY, scale, 0, Math.PI * 2);
        const statorGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale);
        statorGradient.addColorStop(0, '#353540');
        statorGradient.addColorStop(0.7, '#252530');
        statorGradient.addColorStop(1, '#1a1a22');
        ctx.fillStyle = statorGradient;
        ctx.fill();
        
        // Stator teeth and slots
        const numSlots = 36;
        for (let i = 0; i < numSlots; i++) {
            const angle = (i / numSlots) * Math.PI * 2;
            
            // Slot opening
            ctx.beginPath();
            ctx.arc(centerX, centerY, scale - 5, angle - 0.06, angle + 0.06);
            ctx.strokeStyle = '#0a0a10';
            ctx.lineWidth = 8;
            ctx.stroke();
            
            // Tooth
            ctx.beginPath();
            ctx.moveTo(
                centerX + Math.cos(angle - 0.04) * (scale - 30),
                centerY + Math.sin(angle - 0.04) * (scale - 30)
            );
            ctx.lineTo(
                centerX + Math.cos(angle - 0.04) * (scale - 80),
                centerY + Math.sin(angle - 0.04) * (scale - 80)
            );
            ctx.moveTo(
                centerX + Math.cos(angle + 0.04) * (scale - 30),
                centerY + Math.sin(angle + 0.04) * (scale - 30)
            );
            ctx.lineTo(
                centerX + Math.cos(angle + 0.04) * (scale - 80),
                centerY + Math.sin(angle + 0.04) * (scale - 80)
            );
            ctx.strokeStyle = '#303040';
            ctx.lineWidth = 4;
            ctx.stroke();
        }
        
        // Draw three-phase winding coils
        const coilColors = ['#ff4444', '#44ff44', '#4488ff'];
        for (let phase = 0; phase < 3; phase++) {
            for (let i = 0; i < 6; i++) {
                const startAngle = (phase * 2 * Math.PI / 3) + (i * Math.PI / 9) - Math.PI / 36;
                const endAngle = startAngle + Math.PI / 18;
                
                // Winding in slot
                ctx.beginPath();
                ctx.arc(centerX, centerY, scale - 45, startAngle, endAngle);
                ctx.strokeStyle = coilColors[phase];
                ctx.lineWidth = 6;
                ctx.stroke();
                
                // Coil end (simplified visualization)
                ctx.beginPath();
                ctx.arc(centerX, centerY, scale - 65, startAngle + 0.02, endAngle - 0.02);
                ctx.strokeStyle = coilColors[phase];
                ctx.lineWidth = 4;
                ctx.stroke();
            }
        }
        
        // Draw rotating magnetic field visualization
        this.drawRotatingField(ctx, centerX, centerY, scale);
        
        // Draw rotor
        this.drawRotor(ctx, centerX, centerY, scale);
        
        // Draw air gap
        ctx.beginPath();
        ctx.arc(centerX, centerY, scale * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a10';
        ctx.fill();
        
        // Speed display
        document.getElementById('sync-speed-display').textContent = 
            Math.round(this.n_s) + ' RPM';
    }
    
    drawRotatingField(ctx, centerX, centerY, scale) {
        const time = this.fieldTime;
        
        // Draw rotating field vectors (RMF)
        for (let i = 0; i < 3; i++) {
            const fieldAngle = time * 2 + (i * 2 * Math.PI / 3);
            
            // Create field gradient
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, scale * 0.7
            );
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, scale * 0.7, fieldAngle - 0.5, fieldAngle + 0.5);
            ctx.arc(centerX, centerY, scale * 0.4, fieldAngle + 0.5, fieldAngle - 0.5, true);
            ctx.closePath();
            
            if (i === 0) {
                gradient.addColorStop(0, 'rgba(255, 60, 60, 0.15)');
                gradient.addColorStop(1, 'rgba(255, 60, 60, 0)');
            } else if (i === 1) {
                gradient.addColorStop(0, 'rgba(60, 255, 60, 0.15)');
                gradient.addColorStop(1, 'rgba(60, 255, 60, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(60, 60, 255, 0.15)');
                gradient.addColorStop(1, 'rgba(60, 60, 255, 0)');
            }
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Draw field direction arrows
            const arrowR = scale * 0.5;
            const ax = centerX + Math.cos(fieldAngle) * arrowR;
            const ay = centerY + Math.sin(fieldAngle) * arrowR;
            
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(
                ax - 8 * Math.cos(fieldAngle - Math.PI / 6),
                ay - 8 * Math.sin(fieldAngle - Math.PI / 6)
            );
            ctx.lineTo(
                ax - 8 * Math.cos(fieldAngle + Math.PI / 6),
                ay - 8 * Math.sin(fieldAngle + Math.PI / 6)
            );
            ctx.closePath();
            
            if (i === 0) ctx.fillStyle = '#ff6060';
            else if (i === 1) ctx.fillStyle = '#60ff60';
            else ctx.fillStyle = '#6060ff';
            ctx.fill();
        }
    }
    
    drawRotor(ctx, centerX, centerY, scale) {
        const rotorRadius = scale * 0.55;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotorAngle);
        
        // Rotor core
        ctx.beginPath();
        ctx.arc(0, 0, rotorRadius, 0, Math.PI * 2);
        const rotorGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, rotorRadius);
        rotorGradient.addColorStop(0, '#454555');
        rotorGradient.addColorStop(1, '#303040');
        ctx.fillStyle = rotorGradient;
        ctx.fill();
        
        // Shaft
        ctx.beginPath();
        ctx.arc(0, 0, rotorRadius * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = '#606070';
        ctx.fill();
        
        // Keyway
        ctx.fillStyle = '#505060';
        ctx.fillRect(-3, rotorRadius * 0.15, 6, rotorRadius * 0.3);
        
        // Salient poles
        const numPoles = 4;
        for (let i = 0; i < numPoles; i++) {
            const poleAngle = (i / numPoles) * Math.PI * 2;
            const isNorth = i % 2 === 0;
            
            ctx.save();
            ctx.rotate(poleAngle);
            
            // Pole body (pole shoe)
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(rotorRadius * 0.12, -rotorRadius * 0.85);
            ctx.arc(0, 0, rotorRadius * 0.85, -Math.PI/2 + 0.15, -Math.PI/2 - 0.15, true);
            ctx.lineTo(rotorRadius * 0.12, 0);
            ctx.closePath();
            ctx.fillStyle = isNorth ? '#4a4060' : '#604a4a';
            ctx.fill();
            ctx.strokeStyle = isNorth ? '#6a5a80' : '#805a5a';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Pole winding (field winding)
            const windings = isNorth ? 8 : 8;
            for (let w = 0; w < windings; w++) {
                const wAngle = -Math.PI/2 + (w - windings/2 + 0.5) * 0.12;
                ctx.beginPath();
                ctx.arc(0, 0, rotorRadius * 0.75, wAngle - 0.03, wAngle + 0.03);
                ctx.strokeStyle = isNorth ? '#00d4ff' : '#ffaa00';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            // Pole label
            ctx.fillStyle = isNorth ? '#ff6060' : '#6060ff';
            ctx.font = 'bold 10px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText(isNorth ? 'N' : 'S', 0, -rotorRadius * 0.9);
            
            ctx.restore();
        }
        
        // Damper windings (amortisseur windings)
        ctx.strokeStyle = '#707080';
        ctx.lineWidth = 2;
        for (let i = 0; i < numPoles; i++) {
            const poleAngle = (i / numPoles) * Math.PI * 2;
            for (let j = 0; j < 3; j++) {
                const r = rotorRadius * (0.3 + j * 0.25);
                ctx.beginPath();
                ctx.arc(0, 0, r, poleAngle - 0.08, poleAngle + 0.08);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
    
    drawVoltage() {
        const ctx = this.voltageCtx;
        const canvas = this.voltageCanvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 20) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += 20) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        
        // Time axis
        const time = this.fieldTime;
        const amplitude = this.Vt * 0.7;
        const centerY = h / 2;
        
        // Draw three-phase voltages
        const phases = [
            { color: '#ff4444', offset: 0, label: 'V_R' },
            { color: '#44ff44', offset: -2 * Math.PI / 3, label: 'V_Y' },
            { color: '#4488ff', offset: 2 * Math.PI / 3, label: 'V_B' }
        ];
        
        phases.forEach(phase => {
            ctx.beginPath();
            ctx.strokeStyle = phase.color;
            ctx.lineWidth = 2;
            
            for (let x = 0; x < w; x++) {
                const t = (x / w) * 0.04 + time;
                const y = centerY + amplitude * Math.sin(2 * Math.PI * this.f * t + phase.offset) * (h / 350);
                
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            
            ctx.stroke();
            
            // Label
            ctx.fillStyle = phase.color;
            ctx.font = '10px JetBrains Mono';
            ctx.fillText(phase.label, 10, phases.indexOf(phase) * 14 + 12);
        });
        
        // RMS value
        ctx.fillStyle = '#9898a8';
        ctx.font = '11px JetBrains Mono';
        ctx.fillText(`V_LL = ${this.Vt}V  |  V_Ph = ${(this.Vt/Math.sqrt(3)).toFixed(0)}V`, w - 150, 15);
    }
    
    drawPhasor() {
        const ctx = this.phasorCtx;
        const canvas = this.phasorCanvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        const centerX = w / 2;
        const centerY = h / 2;
        const scale = Math.min(w, h) * 0.35;
        
        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 20) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += 20) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        
        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(centerX - scale * 1.2, centerY);
        ctx.lineTo(centerX + scale * 1.2, centerY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - scale * 1.2);
        ctx.lineTo(centerX, centerY + scale * 1.2);
        ctx.stroke();
        
        // Unit circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, scale, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.stroke();
        
        // Phasor lengths
        const E_mag = Math.min(this.E / this.Vt, 1.2) * scale;
        const V_mag = scale;
        const I_mag = Math.min(this.Ia / 30, 1) * scale;
        
        // V phasor (reference - along x-axis)
        this.drawPhasorArrow(ctx, centerX, centerY, V_mag, 0, '#00d4ff', 'V');
        
        // E phasor (internal EMF - leads V for leading PF)
        const E_angle = this.powerFactor === 'leading' ? -0.3 : (this.powerFactor === 'lagging' ? 0.3 : 0);
        this.drawPhasorArrow(ctx, centerX, centerY, E_mag, E_angle, '#8b5cf6', 'E');
        
        // I phasor
        const I_angle = -this.phi;
        this.drawPhasorArrow(ctx, centerX, centerY, I_mag, I_angle, '#f97316', 'I');
        
        // Draw power angle δ
        if (Math.abs(E_angle) > 0.05) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, 30, 0, -E_angle, E_angle > 0);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = '#10b981';
            ctx.font = '10px JetBrains Mono';
            ctx.fillText('δ', centerX + 35, centerY - 5);
        }
        
        // Impedance triangle hint
        ctx.fillStyle = '#606070';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(`Ra = ${this.Ra}Ω`, 10, h - 30);
        ctx.fillText(`Xs = ${this.Xs}Ω`, 10, h - 15);
    }
    
    drawPhasorArrow(ctx, centerX, centerY, magnitude, angle, color, label) {
        const endX = centerX + Math.cos(-angle) * magnitude;
        const endY = centerY + Math.sin(-angle) * magnitude;
        
        // Line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // Arrow head
        const arrowSize = 10;
        const arrowAngle = Math.atan2(endY - centerY, endX - centerX);
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
            endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
            endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        
        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 12px JetBrains Mono';
        ctx.fillText(label, endX + 8, endY - 8);
    }
    
    drawPF() {
        const ctx = this.pfCtx;
        const canvas = this.pfCanvas;
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
        
        const centerX = w / 2;
        const centerY = h / 2;
        const radius = Math.min(w, h) * 0.38;
        
        // Unit circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Axes
        ctx.beginPath();
        ctx.moveTo(centerX - radius, centerY);
        ctx.lineTo(centerX + radius, centerY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius);
        ctx.lineTo(centerX, centerY + radius);
        ctx.stroke();
        
        // Power factor angle indicator
        let angle;
        if (this.powerFactor === 'leading') {
            angle = -Math.acos(this.cosPhi);
        } else if (this.powerFactor === 'lagging') {
            angle = Math.acos(this.cosPhi);
        } else {
            angle = 0;
        }
        
        // Angle arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.6, 0, angle, angle < 0);
        ctx.strokeStyle = this.powerFactor === 'leading' ? '#10b981' : 
                         this.powerFactor === 'lagging' ? '#f97316' : '#00d4ff';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // cos(φ) point
        const pointX = centerX + radius * this.cosPhi;
        const pointY = centerY - radius * Math.sin(Math.abs(angle));
        
        ctx.beginPath();
        ctx.arc(pointX, pointY, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#00d4ff';
        ctx.fill();
        
        // PF value
        ctx.fillStyle = '#e8e8ed';
        ctx.font = 'bold 18px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`PF = ${this.cosPhi.toFixed(2)}`, centerX, h - 15);
        
        // Labels
        ctx.font = '10px JetBrains Mono';
        ctx.fillStyle = '#606070';
        ctx.fillText('1.0', centerX + radius + 8, centerY + 4);
        ctx.fillText('0', centerX - 6, centerY + radius + 15);
        ctx.fillText('0.8', centerX + radius * 0.8 + 5, centerY + 4);
        
        // Lagging/Leading indicator
        ctx.font = 'bold 12px JetBrains Mono';
        ctx.fillStyle = this.powerFactor === 'leading' ? '#10b981' : '#f97316';
        ctx.fillText(this.powerFactor === 'leading' ? 'LEADING' : 'LAGGING', centerX, 20);
    }
}

// Create instance when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.syncSimulator = new SynchronousSimulator();
});
