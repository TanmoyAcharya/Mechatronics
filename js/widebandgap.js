/**
 * ElectroMachines Lab - Widebandgap (SiC/GaN) Semiconductor Simulator
 * Interactive simulator for WBG semiconductors in power electronics
 */

class WidebandgapSimulator {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.animationId = null;
        
        // Material properties
        this.material = 'sic'; // 'sic' or 'gan'
        this.temperature = 25; // Celsius
        this.voltage = 600; // Volts
        this.current = 10; // Amperes
        this.frequency = 100000; // 100 kHz
        
        // Semiconductor parameters
        this.params = {
            sic: {
                name: 'Silicon Carbide (SiC)',
                bandgap: 3.26, // eV
                breakdown: 1700, // V
                maxTemp: 200, // C
                rdsOn: 0.05, // Ohm
                switchingLoss: 0.5, // mJ
                color: '#00d4ff'
            },
            gan: {
                name: 'Gallium Nitride (GaN)',
                bandgap: 3.4, // eV
                breakdown: 650, // V
                maxTemp: 150, // C
                rdsOn: 0.025, // Ohm
                switchingLoss: 0.2, // mJ
                color: '#8b5cf6'
            }
        };
        
        // Particle system for visualization
        this.particles = [];
        this.electronFlow = [];
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('widebandgap-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.setupEventListeners();
            this.createParticles();
            this.start();
        }
    }
    
    setupEventListeners() {
        // Material selector
        const materialBtns = document.querySelectorAll('.material-btn');
        materialBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                materialBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.material = btn.dataset.material;
                this.updateDisplay();
            });
        });
        
        // Temperature slider
        const tempSlider = document.getElementById('temperature-slider');
        const tempValue = document.getElementById('temperature-value');
        if (tempSlider) {
            tempSlider.addEventListener('input', (e) => {
                this.temperature = parseInt(e.target.value);
                if (tempValue) tempValue.textContent = this.temperature + '°C';
                this.updateDisplay();
            });
        }
        
        // Voltage slider
        const voltageSlider = document.getElementById('voltage-slider');
        const voltageValue = document.getElementById('voltage-value');
        if (voltageSlider) {
            voltageSlider.addEventListener('input', (e) => {
                this.voltage = parseInt(e.target.value);
                if (voltageValue) voltageValue.textContent = this.voltage + 'V';
                this.updateDisplay();
            });
        }
        
        // Current slider
        const currentSlider = document.getElementById('current-slider');
        const currentValue = document.getElementById('current-value');
        if (currentSlider) {
            currentSlider.addEventListener('input', (e) => {
                this.current = parseInt(e.target.value);
                if (currentValue) currentValue.textContent = this.current + 'A';
                this.updateDisplay();
            });
        }
        
        // Frequency slider
        const freqSlider = document.getElementById('frequency-slider');
        const freqValue = document.getElementById('frequency-value');
        if (freqSlider) {
            freqSlider.addEventListener('input', (e) => {
                this.frequency = parseInt(e.target.value);
                if (freqValue) freqValue.textContent = (this.frequency / 1000) + 'kHz';
                this.updateDisplay();
            });
        }
    }
    
    createParticles() {
        this.particles = [];
        this.electronFlow = [];
        
        // Create electrons
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * 400,
                y: Math.random() * 300,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: 3 + Math.random() * 2,
                color: this.params[this.material].color,
                alpha: 0.6 + Math.random() * 0.4
            });
        }
        
        // Create electron flow arrows
        for (let i = 0; i < 8; i++) {
            this.electronFlow.push({
                x: Math.random() * 400,
                y: 100 + Math.random() * 100,
                speed: 2 + Math.random() * 2,
                size: 10 + Math.random() * 5
            });
        }
    }
    
    calculateEfficiency() {
        const mat = this.params[this.material];
        
        // Base conduction loss
        const conductionLoss = this.current * this.current * mat.rdsOn;
        
        // Temperature effect on resistance
        const tempFactor = 1 + (this.temperature - 25) * 0.005;
        const adjustedConductionLoss = conductionLoss * tempFactor;
        
        // Switching loss calculation
        const switchingLoss = mat.switchingLoss * (this.frequency / 100000) * this.voltage / 600;
        
        // Total loss
        const totalLoss = adjustedConductionLoss + switchingLoss;
        
        // Input power
        const inputPower = this.voltage * this.current;
        
        // Efficiency
        const efficiency = ((inputPower - totalLoss) / inputPower) * 100;
        
        return {
            conductionLoss: adjustedConductionLoss,
            switchingLoss: switchingLoss,
            totalLoss: totalLoss,
            efficiency: Math.max(0, Math.min(99.9, efficiency)),
            temperature: this.temperature,
            safeOperating: this.temperature < mat.maxTemp
        };
    }
    
    updateDisplay() {
        const metrics = this.calculateEfficiency();
        
        const effDisplay = document.getElementById('efficiency-display');
        if (effDisplay) {
            effDisplay.textContent = metrics.efficiency.toFixed(1) + '%';
            effDisplay.style.color = metrics.efficiency > 95 ? '#22c55e' : 
                                     metrics.efficiency > 90 ? '#eab308' : '#ef4444';
        }
        
        const lossDisplay = document.getElementById('loss-display');
        if (lossDisplay) {
            lossDisplay.textContent = metrics.totalLoss.toFixed(1) + 'W';
        }
        
        const tempDisplay = document.getElementById('temp-display');
        if (tempDisplay) {
            tempDisplay.textContent = metrics.temperature + '°C';
            tempDisplay.style.color = metrics.safeOperating ? '#22c55e' : '#ef4444';
        }
        
        const safeDisplay = document.getElementById('safe-display');
        if (safeDisplay) {
            safeDisplay.textContent = metrics.safeOperating ? '✓ Safe' : '⚠ Over Temperature';
            safeDisplay.style.color = metrics.safeOperating ? '#22c55e' : '#ef4444';
        }
        
        // Update conduction loss
        const condLossDisplay = document.getElementById('cond-loss-display');
        if (condLossDisplay) {
            condLossDisplay.textContent = metrics.conductionLoss.toFixed(2) + 'W';
        }
        
        // Update switching loss
        const swLossDisplay = document.getElementById('sw-loss-display');
        if (swLossDisplay) {
            swLossDisplay.textContent = metrics.switchingLoss.toFixed(2) + 'W';
        }
        
        // Update particle colors based on material
        this.particles.forEach(p => {
            p.color = this.params[this.material].color;
        });
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
        this.updateDisplay();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Clear canvas
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw background grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 30;
        
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Draw semiconductor die representation
        this.drawSemiconductorDie(ctx, canvas);
        
        // Draw electron flow
        this.drawElectronFlow(ctx, canvas);
        
        // Draw particles
        this.drawParticles(ctx, canvas);
        
        // Draw info overlay
        this.drawInfoOverlay(ctx, canvas);
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    drawSemiconductorDie(ctx, canvas) {
        const mat = this.params[this.material];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Draw package
        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = mat.color;
        ctx.lineWidth = 2;
        
        // Main die substrate
        const dieWidth = 200;
        const dieHeight = 120;
        ctx.beginPath();
        ctx.roundRect(centerX - dieWidth/2, centerY - dieHeight/2, dieWidth, dieHeight, 10);
        ctx.fill();
        ctx.stroke();
        
        // Draw die internal structure
        const gradient = ctx.createLinearGradient(
            centerX - dieWidth/2, centerY - dieHeight/2,
            centerX + dieWidth/2, centerY + dieHeight/2
        );
        gradient.addColorStop(0, mat.color + '40');
        gradient.addColorStop(0.5, mat.color + '80');
        gradient.addColorStop(1, mat.color + '40');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(centerX - dieWidth/2 + 10, centerY - dieHeight/2 + 10, 
                     dieWidth - 20, dieHeight - 20, 5);
        ctx.fill();
        
        // Draw gate/source/drain terminals
        const termWidth = 40;
        const termHeight = 15;
        
        // Source
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(centerX - dieWidth/2 - termWidth/2, centerY - 30, termWidth, termHeight);
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('S', centerX - dieWidth/2, centerY - 18);
        
        // Drain  
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(centerX - dieWidth/2 - termWidth/2, centerY + 15, termWidth, termHeight);
        ctx.fillStyle = '#fff';
        ctx.fillText('D', centerX - dieWidth/2, centerY + 27);
        
        // Gate
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(centerX + dieWidth/2 - termWidth/2, centerY - 7, termWidth, termHeight);
        ctx.fillStyle = '#fff';
        ctx.fillText('G', centerX + dieWidth/2, centerY + 5);
        
        // Draw heat visualization
        const tempRatio = this.temperature / 200;
        if (tempRatio > 0.5) {
            const heatColor = `rgba(255, ${Math.floor(100 * (1 - tempRatio))}, 0, ${tempRatio * 0.3})`;
            ctx.fillStyle = heatColor;
            ctx.beginPath();
            ctx.roundRect(centerX - dieWidth/2 - 5, centerY - dieHeight/2 - 5, 
                         dieWidth + 10, dieHeight + 10, 15);
            ctx.fill();
        }
        
        // Material label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(mat.name, centerX, centerY + dieHeight/2 + 25);
    }
    
    drawElectronFlow(ctx, canvas) {
        const mat = this.params[this.material];
        
        this.electronFlow.forEach(e => {
            // Update position
            e.x += e.speed;
            if (e.x > canvas.width) e.x = 0;
            
            // Draw electron arrow
            ctx.fillStyle = mat.color;
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.x - e.size, e.y - e.size/3);
            ctx.lineTo(e.x - e.size, e.y + e.size/3);
            ctx.closePath();
            ctx.fill();
            
            // Draw trail
            ctx.strokeStyle = mat.color + '40';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.x - e.size * 3, e.y);
            ctx.stroke();
        });
    }
    
    drawParticles(ctx, canvas) {
        this.particles.forEach(p => {
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Bounce off walls
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }
    
    drawInfoOverlay(ctx, canvas) {
        // Draw frequency wave
        const time = Date.now() / 1000;
        const freq = this.frequency / 10000;
        
        ctx.strokeStyle = this.params[this.material].color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let x = 0; x < canvas.width - 300; x++) {
            const y = 50 + Math.sin(x * freq + time * 10) * 20;
            if (x === 0) {
                ctx.moveTo(x + 300, y);
            } else {
                ctx.lineTo(x + 300, y);
            }
        }
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Switching Waveform', 320, 40);
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // The simulator will be initialized by the main app
});
