/**
 * Power Electronics Simulator
 * Interactive simulation of DC-DC converters and inverters
 */

class PowerElectronicsSimulator {
    constructor() {
        // Converter type
        this.converterType = 'buck'; // buck, boost, buck-boost, inverter
        
        // Input parameters
        this.inputVoltage = 24;      // V
        this.switchingFreq = 20;      // kHz
        this.dutyCycle = 50;         // %
        this.loadResistance = 10;     // Ohms
        this.inductance = 1;          // mH
        this.capacitance = 100;       // uF
        
        // Output
        this.outputVoltage = 0;
        this.outputCurrent = 0;
        this.ripple = 0;
        this.efficiency = 0;
        
        // Animation
        this.time = 0;
        this.animationId = null;
        
        // Waveform data
        this.waveformData = [];
        this.maxPoints = 500;
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('powerelec-canvas');
        if (!this.canvas) {
            console.log('PowerElec canvas not found');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.waveCanvas = document.getElementById('powerelec-waveform');
        if (this.waveCanvas) {
            this.waveCtx = this.waveCanvas.getContext('2d');
        }
        
        this.circuitCanvas = document.getElementById('powerelec-circuit');
        if (this.circuitCanvas) {
            this.circuitCtx = this.circuitCanvas.getContext('2d');
        }
        
        this.setupControls();
        
        if (this.canvas.width === 0) {
            this.canvas.width = 800;
            this.canvas.height = 400;
        }
        if (this.waveCanvas && this.waveCanvas.width === 0) {
            this.waveCanvas.width = 800;
            this.waveCanvas.height = 200;
        }
        if (this.circuitCanvas && this.circuitCanvas.width === 0) {
            this.circuitCanvas.width = 400;
            this.circuitCanvas.height = 300;
        }
        
        this.calculate();
    }
    
    setupControls() {
        // Converter type buttons
        document.querySelectorAll('.converter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.converter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.converterType = btn.dataset.converter;
                this.calculate();
                this.drawCircuit();
            });
        });
        
        // Input voltage
        const vinSlider = document.getElementById('powerelec-vin-slider');
        const vinValue = document.getElementById('powerelec-vin-value');
        if (vinSlider && vinValue) {
            vinSlider.addEventListener('input', (e) => {
                this.inputVoltage = parseFloat(e.target.value);
                vinValue.textContent = this.inputVoltage.toFixed(0);
                this.calculate();
            });
        }
        
        // Duty cycle
        const dutySlider = document.getElementById('powerelec-duty-slider');
        const dutyValue = document.getElementById('powerelec-duty-value');
        if (dutySlider && dutyValue) {
            dutySlider.addEventListener('input', (e) => {
                this.dutyCycle = parseFloat(e.target.value);
                dutyValue.textContent = this.dutyCycle.toFixed(1);
                this.calculate();
            });
        }
        
        // Frequency
        const freqSlider = document.getElementById('powerelec-freq-slider');
        const freqValue = document.getElementById('powerelec-freq-value');
        if (freqSlider && freqValue) {
            freqSlider.addEventListener('input', (e) => {
                this.switchingFreq = parseFloat(e.target.value);
                freqValue.textContent = this.switchingFreq.toFixed(0);
                this.calculate();
            });
        }
        
        // Load resistance
        const loadSlider = document.getElementById('powerelec-load-slider');
        const loadValue = document.getElementById('powerelec-load-value');
        if (loadSlider && loadValue) {
            loadSlider.addEventListener('input', (e) => {
                this.loadResistance = parseFloat(e.target.value);
                loadValue.textContent = this.loadResistance.toFixed(1);
                this.calculate();
            });
        }
        
        // Inductance
        const indSlider = document.getElementById('powerelec-ind-slider');
        const indValue = document.getElementById('powerelec-ind-value');
        if (indSlider && indValue) {
            indSlider.addEventListener('input', (e) => {
                this.inductance = parseFloat(e.target.value);
                indValue.textContent = this.inductance.toFixed(1);
                this.calculate();
            });
        }
        
        // Capacitance
        const capSlider = document.getElementById('powerelec-cap-slider');
        const capValue = document.getElementById('powerelec-cap-value');
        if (capSlider && capValue) {
            capSlider.addEventListener('input', (e) => {
                this.capacitance = parseFloat(e.target.value);
                capValue.textContent = this.capacitance.toFixed(0);
                this.calculate();
            });
        }
    }
    
    getConverterName() {
        switch(this.converterType) {
            case 'buck': return 'Buck Converter (Step-Down)';
            case 'boost': return 'Boost Converter (Step-Up)';
            case 'buck-boost': return 'Buck-Boost Converter';
            case 'inverter': return 'Full-Bridge Inverter';
            default: return 'DC-DC Converter';
        }
    }
    
    calculate() {
        const D = this.dutyCycle / 100;
        const R = this.loadResistance;
        const L = this.inductance / 1000; // mH to H
        const C = this.capacitance / 1000000; // uF to F
        const fs = this.switchingFreq * 1000; // kHz to Hz
        const Vin = this.inputVoltage;
        
        // Calculate output voltage based on converter type
        switch(this.converterType) {
            case 'buck':
                this.outputVoltage = Vin * D;
                break;
            case 'boost':
                this.outputVoltage = Vin / (1 - D);
                break;
            case 'buck-boost':
                this.outputVoltage = Vin * D / (1 - D);
                break;
            case 'inverter':
                this.outputVoltage = Vin * (2 * D - 1);
                break;
        }
        
        // Calculate output current
        this.outputCurrent = R > 0 ? this.outputVoltage / R : 0;
        
        // Calculate ripple (simplified)
        const T = 1 / fs;
        if (this.converterType === 'buck') {
            const IL_ripple = (Vin - this.outputVoltage) * D / (L * fs);
            this.ripple = this.outputCurrent > 0 ? IL_ripple * 100 / this.outputCurrent : 0;
        } else if (this.converterType === 'boost') {
            const IL_ripple = Vin * D / (L * fs);
            this.ripple = this.outputCurrent > 0 ? IL_ripple * 100 / this.outputCurrent : 0;
        } else {
            this.ripple = 2;
        }
        
        // Efficiency (simplified model)
        const conductionLoss = this.outputCurrent * this.outputCurrent * R * 0.05;
        const switchingLoss = this.outputVoltage * this.outputCurrent * 0.02;
        const inputPower = this.outputVoltage * this.outputCurrent + conductionLoss + switchingLoss;
        this.efficiency = inputPower > 0 ? (this.outputVoltage * this.outputCurrent / inputPower) * 100 : 0;
        
        // Update readings
        const voutReading = document.getElementById('powerelec-vout-reading');
        const ioutReading = document.getElementById('powerelec-iout-reading');
        const rippleReading = document.getElementById('powerelec-ripple-reading');
        const effReading = document.getElementById('powerelec-eff-reading');
        
        if (voutReading) voutReading.textContent = this.outputVoltage.toFixed(2) + ' V';
        if (ioutReading) ioutReading.textContent = this.outputCurrent.toFixed(2) + ' A';
        if (rippleReading) rippleReading.textContent = this.ripple.toFixed(2) + ' %';
        if (effReading) effReading.textContent = this.efficiency.toFixed(1) + ' %';
        
        // Generate waveform data
        this.generateWaveform();
        
        this.draw();
        this.drawWaveform();
        this.drawCircuit();
    }
    
    generateWaveform() {
        this.waveformData = [];
        const numCycles = 4;
        const pointsPerCycle = this.maxPoints / numCycles;
        const T = 1 / (this.switchingFreq * 1000);
        const D = this.dutyCycle / 100;
        
        for (let i = 0; i < this.maxPoints; i++) {
            const t = (i / this.maxPoints) * numCycles * T;
            const cycleTime = t % T;
            const isOn = cycleTime < D * T;
            
            let vg, vo, il;
            
            switch(this.converterType) {
                case 'buck':
                    vg = isOn ? this.inputVoltage : 0;
                    vo = isOn ? this.outputVoltage : this.outputVoltage * 0.95;
                    il = this.outputCurrent * (0.8 + 0.4 * (cycleTime / (D * T)));
                    break;
                case 'boost':
                    vg = isOn ? this.inputVoltage : 0;
                    vo = isOn ? this.outputVoltage * 0.9 : this.outputVoltage;
                    il = this.outputCurrent * (0.7 + 0.6 * (cycleTime / (D * T)));
                    break;
                case 'buck-boost':
                    vg = isOn ? this.inputVoltage : 0;
                    vo = isOn ? -this.outputVoltage * 0.9 : -this.outputVoltage;
                    il = this.outputCurrent * (0.6 + 0.8 * (cycleTime / (D * T)));
                    break;
                case 'inverter':
                    vg = isOn ? this.inputVoltage : -this.inputVoltage;
                    vo = isOn ? this.outputVoltage : -this.outputVoltage;
                    il = this.outputCurrent * (0.8 + 0.4 * Math.sin(2 * Math.PI * t * this.switchingFreq * 1000));
                    break;
            }
            
            this.waveformData.push({ vg, vo, il, t });
        }
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#0a0a1a');
        bgGrad.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        
        // Draw converter schematic representation
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.getConverterName(), w/2, 40);
        
        // Draw animated blocks
        const D = this.dutyCycle / 100;
        const period = 1 / (this.switchingFreq * 1000);
        const switchState = (this.time % period) < D * period;
        
        // Input source
        ctx.fillStyle = '#2ed573';
        ctx.beginPath();
        ctx.arc(100, h/2, 30, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#0a0a1a';
        ctx.font = '14px Arial';
        ctx.fillText('Vin', 100, h/2 + 5);
        ctx.fillStyle = '#fff';
        ctx.fillText(this.inputVoltage + 'V', 100, h/2 + 50);
        
        // Switch (IGBT/MOSFET representation)
        const switchColor = switchState ? '#ff6b6b' : '#4a4a6a';
        ctx.fillStyle = switchColor;
        ctx.fillRect(w/2 - 40, h/2 - 15, 80, 30);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(switchState ? 'ON' : 'OFF', w/2, h/2 + 5);
        
        // Inductor
        ctx.strokeStyle = '#ffd93d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const indX = w/2 + 80;
        for(let i = 0; i < 6; i++) {
            ctx.arc(indX + i*10, h/2, 8, Math.PI, 0);
        }
        ctx.stroke();
        ctx.fillStyle = '#ffd93d';
        ctx.font = '14px Arial';
        ctx.fillText('L', indX + 25, h/2 + 30);
        
        // Capacitor
        ctx.strokeStyle = '#6c5ce7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w - 150, h/2 - 30);
        ctx.lineTo(w - 50, h/2 - 30);
        ctx.moveTo(w - 150, h/2);
        ctx.lineTo(w - 50, h/2);
        ctx.stroke();
        ctx.fillStyle = '#6c5ce7';
        ctx.fillText('C', w - 100, h/2 + 25);
        
        // Load
        ctx.fillStyle = '#00d4ff';
        ctx.fillRect(w - 80, h/2 - 25, 60, 50);
        ctx.fillStyle = '#0a0a1a';
        ctx.font = '14px Arial';
        ctx.fillText('R', w - 50, h/2 + 5);
        
        // Connecting wires
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        
        // Input to switch
        ctx.beginPath();
        ctx.moveTo(130, h/2);
        ctx.lineTo(w/2 - 40, h/2);
        ctx.stroke();
        
        // Switch to inductor
        ctx.beginPath();
        ctx.moveTo(w/2 + 40, h/2);
        ctx.lineTo(indX - 10, h/2);
        ctx.stroke();
        
        // Inductor to output
        ctx.beginPath();
        ctx.moveTo(indX + 50, h/2);
        ctx.lineTo(w - 80, h/2);
        ctx.stroke();
        
        // Ground symbols
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        [100, w - 100].forEach(x => {
            ctx.beginPath();
            ctx.moveTo(x - 15, h/2 + 60);
            ctx.lineTo(x + 15, h/2 + 60);
            ctx.moveTo(x - 10, h/2 + 65);
            ctx.lineTo(x + 10, h/2 + 65);
            ctx.moveTo(x - 5, h/2 + 70);
            ctx.lineTo(x + 5, h/2 + 70);
            ctx.stroke();
        });
        
        // Output readings
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Vout: ' + this.outputVoltage.toFixed(2) + ' V', 50, h - 50);
        ctx.fillText('Iout: ' + this.outputCurrent.toFixed(2) + ' A', 250, h - 50);
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('Efficiency: ' + this.efficiency.toFixed(1) + '%', 450, h - 50);
        
        this.time += 0.01;
    }
    
    drawWaveform() {
        if (!this.waveCanvas) return;
        
        const ctx = this.waveCtx;
        const w = this.waveCanvas.width;
        const h = this.waveCanvas.height;
        
        // Background
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, w, h);
        
        // Grid
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(i * w/10, 0);
            ctx.lineTo(i * w/10, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * h/5);
            ctx.lineTo(w, i * h/5);
            ctx.stroke();
        }
        
        if (this.waveformData.length < 2) return;
        
        const maxV = this.inputVoltage * 1.5;
        
        // Draw Vg (gate signal)
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.waveformData.forEach((point, i) => {
            const x = (i / this.maxPoints) * w;
            const y = h - (point.vg / maxV) * h * 0.8 - h * 0.1;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Draw output voltage
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.waveformData.forEach((point, i) => {
            const x = (i / this.maxPoints) * w;
            const y = h - (Math.abs(point.vo) / maxV) * h * 0.8 - h * 0.1;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '12px Arial';
        ctx.fillText('Switch Signal', 60, 20);
        ctx.fillStyle = '#00d4ff';
        ctx.fillText('Output Voltage', 60, 40);
    }
    
    drawCircuit() {
        if (!this.circuitCanvas) return;
        
        const ctx = this.circuitCtx;
        const w = this.circuitCanvas.width;
        const h = this.circuitCanvas.height;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, w, h);
        
        // Draw circuit diagram based on type
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#00d4ff';
        
        const cx = w / 2;
        const cy = h / 2;
        
        // Simplified circuit representation
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        
        switch(this.converterType) {
            case 'buck':
                ctx.fillText('Buck Circuit', cx, 25);
                // Draw buck topology
                ctx.strokeStyle = '#666';
                ctx.beginPath();
                // Input
                ctx.moveTo(50, cy - 40);
                ctx.lineTo(80, cy - 40);
                // Switch
                ctx.moveTo(90, cy - 50);
                ctx.lineTo(90, cy - 30);
                ctx.lineTo(100, cy - 40);
                ctx.moveTo(100, cy - 40);
                ctx.lineTo(110, cy - 30);
                ctx.lineTo(110, cy - 50);
                ctx.closePath();
                ctx.stroke();
                // Diode
                ctx.beginPath();
                ctx.moveTo(130, cy - 50);
                ctx.lineTo(140, cy - 40);
                ctx.lineTo(130, cy - 30);
                ctx.lineTo(130, cy - 50);
                ctx.stroke();
                // Inductor
                ctx.strokeStyle = '#ffd93d';
                for(let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.arc(160 + i*15, cy - 40, 8, Math.PI, 0);
                    ctx.stroke();
                }
                // Capacitor
                ctx.strokeStyle = '#6c5ce7';
                ctx.beginPath();
                ctx.moveTo(230, cy - 60);
                ctx.lineTo(260, cy - 60);
                ctx.moveTo(230, cy - 20);
                ctx.lineTo(260, cy - 20);
                ctx.stroke();
                // Load
                ctx.fillStyle = '#00d4ff';
                ctx.fillRect(270, cy - 50, 40, 30);
                break;
                
            case 'boost':
                ctx.fillText('Boost Circuit', cx, 25);
                ctx.strokeStyle = '#666';
                // Input to inductor
                ctx.beginPath();
                ctx.moveTo(50, cy);
                ctx.lineTo(80, cy);
                ctx.stroke();
                // Inductor
                ctx.strokeStyle = '#ffd93d';
                for(let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.arc(90 + i*15, cy, 8, Math.PI, 0);
                    ctx.stroke();
                }
                // Switch
                ctx.strokeStyle = '#ff6b6b';
                ctx.beginPath();
                ctx.moveTo(160, cy - 10);
                ctx.lineTo(160, cy + 10);
                ctx.lineTo(170, cy);
                ctx.moveTo(170, cy);
                ctx.lineTo(180, cy - 10);
                ctx.lineTo(180, cy + 10);
                ctx.closePath();
                ctx.stroke();
                // Diode
                ctx.strokeStyle = '#666';
                ctx.beginPath();
                ctx.moveTo(200, cy - 20);
                ctx.lineTo(210, cy);
                ctx.lineTo(200, cy + 20);
                ctx.lineTo(200, cy - 20);
                ctx.stroke();
                // Capacitor
                ctx.strokeStyle = '#6c5ce7';
                ctx.beginPath();
                ctx.moveTo(220, cy - 30);
                ctx.lineTo(250, cy - 30);
                ctx.moveTo(220, cy + 10);
                ctx.lineTo(250, cy + 10);
                ctx.stroke();
                // Load
                ctx.fillStyle = '#00d4ff';
                ctx.fillRect(260, cy - 20, 40, 30);
                break;
                
            case 'buck-boost':
                ctx.fillText('Buck-Boost Circuit', cx, 25);
                ctx.fillText('Vout = Vin × D/(1-D)', cx, h - 15);
                break;
                
            case 'inverter':
                ctx.fillText('Full Bridge Inverter', cx, 25);
                // Draw H-bridge
                ctx.strokeStyle = '#666';
                // Top switches
                ctx.fillStyle = '#ff6b6b';
                ctx.fillRect(80, cy - 60, 30, 20);
                ctx.fillRect(190, cy - 60, 30, 20);
                // Bottom switches  
                ctx.fillRect(80, cy + 40, 30, 20);
                ctx.fillRect(190, cy + 40, 30, 20);
                // Load in middle
                ctx.fillStyle = '#00d4ff';
                ctx.fillRect(cx - 20, cy - 15, 40, 30);
                ctx.fillStyle = '#666';
                ctx.font = '10px Arial';
                ctx.fillText('AC Load', cx, cy + 5);
                break;
        }
    }
    
    start() {
        if (this.animationId) return;
        const animate = () => {
            this.draw();
            this.drawWaveform();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    resize() {
        if (this.canvas) {
            this.canvas.width = this.canvas.parentElement.clientWidth;
            this.canvas.height = 400;
        }
        if (this.waveCanvas) {
            this.waveCanvas.width = this.waveCanvas.parentElement.clientWidth;
            this.waveCanvas.height = 200;
        }
        this.calculate();
    }
}
