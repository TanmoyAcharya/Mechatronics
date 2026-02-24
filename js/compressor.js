/**
 * Compressor Simulator
 * Interactive demonstration of reciprocating and scroll compressors
 */

class CompressorSimulator {
    constructor() {
        this.compressorType = 'reciprocating';
        this.load = 75;
        this.suctionPressure = 100;
        this.dischargePressure = 250;
        this.power = 2.5;
        this.cop = 3.2;
        this.pistonPos = 0;
        this.time = 0;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('compressor-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        
        if (this.canvas.width === 0) {
            this.canvas.width = 800;
            this.canvas.height = 450;
        }
        
        this.setupControls();
        this.calculate();
    }
    
    setupControls() {
        const typeSelect = document.getElementById('comp-type-select');
        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                this.compressorType = e.target.value;
                this.calculate();
            });
        }
        
        const loadSlider = document.getElementById('comp-load-slider');
        const loadValue = document.getElementById('comp-load-value');
        if (loadSlider && loadValue) {
            loadSlider.addEventListener('input', (e) => {
                this.load = parseFloat(e.target.value);
                loadValue.textContent = this.load.toFixed(0);
                this.calculate();
            });
        }
        
        const suctionSlider = document.getElementById('comp-suction-slider');
        const suctionValue = document.getElementById('comp-suction-value');
        if (suctionSlider && suctionValue) {
            suctionSlider.addEventListener('input', (e) => {
                this.suctionPressure = parseFloat(e.target.value);
                suctionValue.textContent = this.suctionPressure.toFixed(0);
                this.calculate();
            });
        }
    }
    
    calculate() {
        // Discharge pressure calculation
        const pressureRatio = 2.5;
        this.dischargePressure = Math.round(this.suctionPressure * pressureRatio * (this.load / 75));
        
        // Power calculation (HP)
        const basePower = 2.5;
        this.power = (basePower * this.load / 75 * (this.dischargePressure / 200));
        
        // COP (Coefficient of Performance) - typical AC range 2.5-4.0
        this.cop = 3.2 - (this.load / 100) * 0.3 - (this.dischargePressure - 250) / 500;
        
        // Update readings
        const dischargeReading = document.getElementById('comp-discharge-reading');
        const powerReading = document.getElementById('comp-power-reading');
        const copReading = document.getElementById('comp-cop-reading');
        
        if (dischargeReading) dischargeReading.textContent = this.dischargePressure + ' PSI';
        if (powerReading) powerReading.textContent = this.power.toFixed(1) + ' HP';
        if (copReading) copReading.textContent = this.cop.toFixed(1);
        
        this.draw();
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#1a1a2e');
        bgGrad.addColorStop(1, '#0f0f1a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        
        // Grid
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, h);
            ctx.stroke();
        }
        for (let i = 0; i < h; i += 40) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(w, i);
            ctx.stroke();
        }
        
        // Draw compressor based on type
        if (this.compressorType === 'reciprocating') {
            this.drawReciprocating(ctx, w, h);
        } else if (this.compressorType === 'scroll') {
            this.drawScroll(ctx, w, h);
        } else {
            this.drawScrew(ctx, w, h);
        }
        
        // Draw pressure gauges
        this.drawGauges(ctx, w, h);
        
        // Draw info panel
        this.drawInfoPanel(ctx, w, h);
    }
    
    drawReciprocating(ctx, w, h) {
        const centerX = w / 2;
        const centerY = h / 2;
        
        // Cylinder
        ctx.fillStyle = '#3d3d4d';
        ctx.strokeStyle = '#5a5a6a';
        ctx.lineWidth = 3;
        
        // Cylinder body
        ctx.beginPath();
        ctx.roundRect(centerX - 80, centerY - 60, 160, 120, 10);
        ctx.fill();
        ctx.stroke();
        
        // Cylinder head
        ctx.fillStyle = '#4a4a5a';
        ctx.beginPath();
        ctx.roundRect(centerX - 60, centerY - 80, 120, 30, 5);
        ctx.fill();
        ctx.stroke();
        
        // Suction valve
        ctx.fillStyle = '#00d4ff';
        ctx.fillRect(centerX - 40, centerY - 85, 25, 15);
        
        // Discharge valve
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(centerX + 15, centerY - 85, 25, 15);
        
        // Piston
        const pistonY = centerY - 20 + Math.sin(this.pistonPos) * 30;
        ctx.fillStyle = '#6a6a7a';
        ctx.beginPath();
        ctx.roundRect(centerX - 50, pistonY - 20, 100, 40, 5);
        ctx.fill();
        
        // Piston rings
        ctx.strokeStyle = '#4a4a5a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 50, pistonY - 10);
        ctx.lineTo(centerX + 50, pistonY - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX - 50, pistonY + 10);
        ctx.lineTo(centerX + 50, pistonY + 10);
        ctx.stroke();
        
        // Connecting rod
        ctx.strokeStyle = '#7a7a8a';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(centerX, pistonY + 20);
        ctx.lineTo(centerX, centerY + 80);
        ctx.stroke();
        
        // Crankshaft
        ctx.fillStyle = '#5a5a6a';
        ctx.beginPath();
        ctx.arc(centerX, centerY + 80, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Animation
        if (this.load > 0) {
            this.pistonPos += 0.1 * (this.load / 75);
        }
        
        // Labels
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Suction', centerX - 27, centerY - 95);
        ctx.fillText('Discharge', centerX + 27, centerY - 95);
        ctx.fillText('Reciprocating Compressor', centerX, centerY + 120);
    }
    
    drawScroll(ctx, w, h) {
        const centerX = w / 2;
        const centerY = h / 2;
        
        // Scroll compressor visualization
        ctx.strokeStyle = '#5a5a6a';
        ctx.lineWidth = 4;
        
        // Fixed scroll
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const angle = i * Math.PI * 2 / 3;
            ctx.ellipse(centerX - 20, centerY, 60, 30, angle, 0, Math.PI * 2);
        }
        ctx.stroke();
        
        // Orbiting scroll
        ctx.save();
        ctx.translate(centerX + 20, centerY);
        ctx.rotate(this.pistonPos);
        ctx.strokeStyle = '#6a6a7a';
        for (let i = 0; i < 3; i++) {
            const angle = i * Math.PI * 2 / 3;
            ctx.beginPath();
            ctx.ellipse(0, 0, 55, 25, angle, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
        
        // Animation
        if (this.load > 0) {
            this.pistonPos += 0.05 * (this.load / 75);
        }
        
        // Labels
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Fixed Scroll', centerX - 20, centerY + 70);
        ctx.fillText('Orbiting Scroll', centerX + 20, centerY + 70);
        ctx.fillText('Scroll Compressor', centerX, centerY - 80);
    }
    
    drawScrew(ctx, w, h) {
        const centerX = w / 2;
        const centerY = h / 2;
        
        // Screw compressor visualization
        ctx.strokeStyle = '#5a5a6a';
        ctx.lineWidth = 3;
        
        // Male rotor
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const x = centerX - 50 + i * 15;
            ctx.moveTo(x, centerY - 40);
            ctx.quadraticCurveTo(x + 7, centerY, x, centerY + 40);
        }
        ctx.stroke();
        
        // Female rotor
        ctx.strokeStyle = '#6a6a7a';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const x = centerX + i * 15;
            ctx.moveTo(x, centerY - 35);
            ctx.quadraticCurveTo(x + 7, centerY, x, centerY + 35);
        }
        ctx.stroke();
        
        // Housing
        ctx.strokeStyle = '#4a4a5a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(centerX - 70, centerY - 60, 140, 120, 10);
        ctx.stroke();
        
        // Animation
        if (this.load > 0) {
            this.pistonPos += 0.08 * (this.load / 75);
        }
        
        // Labels
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Male Rotor', centerX - 30, centerY + 70);
        ctx.fillText('Female Rotor', centerX + 30, centerY + 70);
        ctx.fillText('Screw Compressor', centerX, centerY - 80);
    }
    
    drawGauges(ctx, w, h) {
        // Suction gauge
        this.drawGauge(ctx, 100, h - 80, this.suctionPressure, 0, 200, 'Suction P');
        
        // Discharge gauge
        this.drawGauge(ctx, w - 100, h - 80, this.dischargePressure, 0, 400, 'Discharge P');
    }
    
    drawGauge(ctx, x, y, value, minVal, maxVal, label) {
        const radius = 40;
        
        // Gauge background
        ctx.fillStyle = '#2a2a3a';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Gauge arc
        ctx.strokeStyle = '#3d3d4d';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(x, y, radius - 5, Math.PI * 0.75, Math.PI * 2.25);
        ctx.stroke();
        
        // Value arc
        const valueRatio = (value - minVal) / (maxVal - minVal);
        const endAngle = Math.PI * 0.75 + valueRatio * Math.PI * 1.5;
        
        const gaugeColor = valueRatio > 0.8 ? '#ff6b6b' : valueRatio > 0.5 ? '#ffa502' : '#2ed573';
        ctx.strokeStyle = gaugeColor;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(x, y, radius - 5, Math.PI * 0.75, endAngle);
        ctx.stroke();
        
        // Needle
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(endAngle);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(radius - 15, 0);
        ctx.lineTo(0, 2);
        ctx.fill();
        ctx.restore();
        
        // Center dot
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Value text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(value.toString(), x, y + 8);
        
        // Label
        ctx.fillStyle = '#888';
        ctx.font = '10px Arial';
        ctx.fillText(label, x, y + radius + 15);
    }
    
    drawInfoPanel(ctx, w, h) {
        const panelX = 20;
        const panelY = 20;
        
        ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, 180, 110, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Compressor Data', panelX + 15, panelY + 20);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(`Type: ${this.compressorType}`, panelX + 15, panelY + 45);
        ctx.fillText(`Load: ${this.load}%`, panelX + 15, panelY + 60);
        ctx.fillText(`Ratio: ${(this.dischargePressure/this.suctionPressure).toFixed(1)}:1`, panelX + 15, panelY + 75);
        
        ctx.fillStyle = '#2ed573';
        ctx.fillText(`COP: ${this.cop.toFixed(2)}`, panelX + 15, panelY + 95);
    }
    
    start() {
        if (this.animationId) return;
        const animate = () => {
            this.time += 0.016;
            this.draw();
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
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.compressorSimulator = new CompressorSimulator();
});
