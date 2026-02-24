/**
 * BLDC Fan Simulator
 * Brushless DC fan with electronic commutation visualization
 */

class BLDCFanSimulator {
    constructor() {
        this.speedPercent = 50;
        this.voltage = 12;
        this.propellerSize = 4;
        this.rpm = 1500;
        this.airflow = 50;
        this.power = 5;
        this.angle = 0;
        this.animationId = null;
        
        // Colors
        this.bladeColor = '#3d3d4d';
        this.bladeHighlight = '#5a5a6a';
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('bldcfan-canvas');
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
        const speedSlider = document.getElementById('bldc-speed-slider');
        const speedValue = document.getElementById('bldc-speed-value');
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                this.speedPercent = parseFloat(e.target.value);
                speedValue.textContent = this.speedPercent.toFixed(0);
                this.calculate();
            });
        }
        
        const voltageSlider = document.getElementById('bldc-voltage-slider');
        const voltageValue = document.getElementById('bldc-voltage-value');
        if (voltageSlider && voltageValue) {
            voltageSlider.addEventListener('input', (e) => {
                this.voltage = parseFloat(e.target.value);
                voltageValue.textContent = this.voltage.toFixed(0);
                this.calculate();
            });
        }
        
        const sizeSlider = document.getElementById('bldc-size-slider');
        const sizeValue = document.getElementById('bldc-size-value');
        if (sizeSlider && sizeValue) {
            sizeSlider.addEventListener('input', (e) => {
                this.propellerSize = parseFloat(e.target.value);
                sizeValue.textContent = this.propellerSize.toFixed(0);
                this.calculate();
            });
        }
    }
    
    calculate() {
        // RPM calculation (BLDC typically 3000-10000 RPM for small fans)
        this.rpm = Math.round((this.speedPercent / 100) * (3000 + (this.voltage - 5) * 100));
        
        // Airflow (CFM) - proportional to RPM and size
        const sizeFactor = Math.pow(this.propellerSize / 4, 1.5);
        this.airflow = Math.round(this.rpm / 30 * sizeFactor * (this.speedPercent / 100));
        
        // Power consumption (watts)
        this.power = Math.round((this.voltage / 12) * (this.speedPercent / 100) * 10 * sizeFactor);
        
        // Update readings
        const rpmReading = document.getElementById('bldc-rpm-reading');
        const airflowReading = document.getElementById('bldc-airflow-reading');
        const powerReading = document.getElementById('bldc-power-reading');
        
        if (rpmReading) rpmReading.textContent = this.rpm.toString();
        if (airflowReading) airflowReading.textContent = this.airflow + ' CFM';
        if (powerReading) powerReading.textContent = this.power + ' W';
        
        this.draw();
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // Background - modern workshop/room
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#2d3436');
        bgGrad.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        
        // Grid
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, h);
            ctx.stroke();
        }
        
        // Draw the fan
        const centerX = w / 2;
        const centerY = h / 2 - 30;
        
        // Draw fan housing/mount
        this.drawFanHousing(ctx, centerX, centerY);
        
        // Draw propeller blades
        this.drawPropeller(ctx, centerX, centerY);
        
        // Draw motor hub
        this.drawMotorHub(ctx, centerX, centerY);
        
        // Draw electronic control board
        this.drawControlBoard(ctx, w, h);
        
        // Draw airflow visualization
        this.drawAirflow(ctx, centerX, centerY, w, h);
        
        // Draw info panel
        this.drawInfoPanel(ctx, w, h);
        
        // Update angle for animation
        if (this.speedPercent > 0) {
            this.angle += (this.speedPercent / 100) * 0.3;
        }
    }
    
    drawFanHousing(ctx, x, y) {
        const radius = 80 + this.propellerSize * 10;
        
        // Outer ring
        ctx.strokeStyle = '#4a4a5a';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(x, y, radius + 15, 0, Math.PI * 2);
        ctx.stroke();
        
        // Ring gradient
        const ringGrad = ctx.createRadialGradient(x, y, radius, x, y, radius + 20);
        ringGrad.addColorStop(0, '#5a5a6a');
        ringGrad.addColorStop(1, '#3a3a4a');
        ctx.strokeStyle = ringGrad;
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.arc(x, y, radius + 10, 0, Math.PI * 2);
        ctx.stroke();
        
        // Center motor housing
        const motorGrad = ctx.createRadialGradient(x, y - 20, 0, x, y, 50);
        motorGrad.addColorStop(0, '#5a5a6a');
        motorGrad.addColorStop(1, '#2a2a3a');
        ctx.fillStyle = motorGrad;
        ctx.beginPath();
        ctx.arc(x, y, 45, 0, Math.PI * 2);
        ctx.fill();
        
        // Motor label
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BLDC MOTOR', x, y + 5);
    }
    
    drawPropeller(ctx, x, y) {
        const bladeLength = 60 + this.propellerSize * 12;
        const numBlades = 3;
        const speed = this.speedPercent / 100;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.angle);
        
        // Draw blades
        for (let i = 0; i < numBlades; i++) {
            ctx.save();
            ctx.rotate((i / numBlades) * Math.PI * 2);
            
            // Blade gradient
            const bladeGrad = ctx.createLinearGradient(0, 0, bladeLength, 0);
            bladeGrad.addColorStop(0, '#5a5a6a');
            bladeGrad.addColorStop(0.3, '#6a6a7a');
            bladeGrad.addColorStop(1, '#4a4a5a');
            
            ctx.fillStyle = bladeGrad;
            ctx.beginPath();
            ctx.moveTo(35, -8);
            ctx.quadraticCurveTo(bladeLength * 0.5, -15, bladeLength, -3);
            ctx.lineTo(bladeLength, 3);
            ctx.quadraticCurveTo(bladeLength * 0.5, 15, 35, 8);
            ctx.closePath();
            ctx.fill();
            
            // Blade edge highlight
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.restore();
        }
        
        ctx.restore();
        
        // Motion blur effect when spinning fast
        if (speed > 0.5) {
            ctx.save();
            ctx.globalAlpha = 0.1 * speed;
            for (let i = 0; i < 3; i++) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(this.angle + (i + 1) * 0.2);
                ctx.beginPath();
                ctx.arc(x, y, bladeLength + 30, 0, Math.PI * 2);
                ctx.strokeStyle = '#00d4ff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
        }
    }
    
    drawMotorHub(ctx, x, y) {
        // Center hub
        const hubGrad = ctx.createRadialGradient(x, y - 10, 0, x, y, 30);
        hubGrad.addColorStop(0, '#6a6a7a');
        hubGrad.addColorStop(1, '#3a3a4a');
        ctx.fillStyle = hubGrad;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Hub detail
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // RPM indicator on hub
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.rpm}`, x, y + 40);
    }
    
    drawControlBoard(ctx, w, h) {
        // Electronic controller box
        const boardX = 50;
        const boardY = h - 120;
        
        ctx.fillStyle = '#2a2a3a';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(boardX, boardY, 150, 100, 8);
        ctx.fill();
        ctx.stroke();
        
        // Board title
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ESC Controller', boardX + 75, boardY + 20);
        
        // Components
        ctx.fillStyle = '#3d3d4d';
        // MOSFETs
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(boardX + 20 + i * 40, boardY + 35, 25, 15);
        }
        
        // Capacitor
        ctx.fillStyle = '#5a5a6a';
        ctx.beginPath();
        ctx.arc(boardX + 120, boardY + 50, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // LEDs
        const ledColors = ['#2ed573', '#ffa502', '#ff4757'];
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = ledColors[i];
            ctx.beginPath();
            ctx.arc(boardX + 30 + i * 35, boardY + 75, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Wiring to fan
        ctx.strokeStyle = '#ffa502';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(boardX + 75, boardY);
        ctx.lineTo(boardX + 75, boardY - 50);
        ctx.lineTo(w/2, boardY - 50);
        ctx.lineTo(w/2, h/2 - 30 - 60);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    drawAirflow(ctx, x, y, w, h) {
        const speed = this.speedPercent / 100;
        if (speed < 0.1) return;
        
        // Draw wind lines
        ctx.strokeStyle = `rgba(0, 212, 255, ${0.3 * speed})`;
        ctx.lineWidth = 2;
        
        const bladeLength = 60 + this.propellerSize * 12;
        
        for (let i = 0; i < 8; i++) {
            const startY = y + bladeLength + 20 + i * 25;
            const offset = (this.time * 100 * speed + i * 50) % 300;
            
            ctx.beginPath();
            ctx.moveTo(x - 50, startY + offset);
            ctx.bezierCurveTo(
                x - 30, startY + offset + 20,
                x + 30, startY + offset + 20,
                x + 50, startY + offset + 60
            );
            ctx.stroke();
        }
        
        // Airflow particles
        for (let i = 0; i < 15; i++) {
            const px = x + (Math.random() - 0.5) * 200;
            const py = y + bladeLength + 50 + ((this.time * 200 * speed + i * 40) % 200);
            
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * speed})`;
            ctx.beginPath();
            ctx.arc(px, py, 2 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawInfoPanel(ctx, w, h) {
        const panelX = w - 220;
        const panelY = 20;
        
        ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, 200, 130, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('BLDC Fan Data', panelX + 15, panelY + 20);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(`Speed: ${this.speedPercent}%`, panelX + 15, panelY + 45);
        ctx.fillText(`Voltage: ${this.voltage}V`, panelX + 15, panelY + 60);
        ctx.fillText(`Size: ${this.propellerSize}"`, panelX + 15, panelY + 75);
        ctx.fillText(`RPM: ${this.rpm}`, panelX + 15, panelY + 90);
        
        ctx.fillStyle = '#2ed573';
        ctx.fillText(`Airflow: ${this.airflow} CFM`, panelX + 15, panelY + 110);
    }
    
    start() {
        if (this.animationId) return;
        const animate = () => {
            this.time = this.time || 0;
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
    window.bldcFanSimulator = new BLDCFanSimulator();
});
