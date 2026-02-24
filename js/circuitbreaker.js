/**
 * Circuit Breaker Simulator
 * Interactive demonstration of circuit breaker operation and protection
 */

class CircuitBreakerSimulator {
    constructor() {
        // Circuit parameters
        this.current = 10;       // Actual current (A)
        this.voltage = 230;      // Voltage (V)
        this.breakerRating = 20; // Breaker rating (A)
        this.faultType = 'none'; // Fault type
        this.isTripped = false;
        this.tripTime = 0;
        this.time = 0;
        this.animationId = null;
        
        // Fault current multipliers
        this.faultMultiplier = 1;
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('circuitbreaker-canvas');
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
        const currentSlider = document.getElementById('cb-current-slider');
        const currentValue = document.getElementById('cb-current-value');
        if (currentSlider && currentValue) {
            currentSlider.addEventListener('input', (e) => {
                this.current = parseFloat(e.target.value);
                currentValue.textContent = this.current.toFixed(0);
                this.calculate();
            });
        }
        
        const voltageSlider = document.getElementById('cb-voltage-slider');
        const voltageValue = document.getElementById('cb-voltage-value');
        if (voltageSlider && voltageValue) {
            voltageSlider.addEventListener('input', (e) => {
                this.voltage = parseFloat(e.target.value);
                voltageValue.textContent = this.voltage.toFixed(0);
                this.calculate();
            });
        }
        
        const ratingSlider = document.getElementById('cb-rating-slider');
        const ratingValue = document.getElementById('cb-rating-value');
        if (ratingSlider && ratingValue) {
            ratingSlider.addEventListener('input', (e) => {
                this.breakerRating = parseFloat(e.target.value);
                ratingValue.textContent = this.breakerRating.toFixed(0);
                this.calculate();
            });
        }
        
        const faultSelect = document.getElementById('cb-fault-select');
        if (faultSelect) {
            faultSelect.addEventListener('change', (e) => {
                this.faultType = e.target.value;
                if (this.faultType === 'short') {
                    this.faultMultiplier = 10;
                } else if (this.faultType === 'overload') {
                    this.faultMultiplier = 1.5;
                } else {
                    this.faultMultiplier = 1;
                }
                this.calculate();
            });
        }
        
        const resetBtn = document.getElementById('cb-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.isTripped = false;
                this.tripTime = 0;
                this.calculate();
            });
        }
    }
    
    calculate() {
        const effectiveCurrent = this.current * this.faultMultiplier;
        
        // Check if breaker should trip
        if (effectiveCurrent > this.breakerRating) {
            // Calculate trip time (inverse time breaker)
            const overload = effectiveCurrent / this.breakerRating;
            if (overload > 1.5) {
                this.tripTime = Math.max(0.1, 10 / (overload - 1));
                if (!this.isTripped) {
                    this.isTripped = true;
                }
            }
        }
        
        const statusReading = document.getElementById('cb-status-reading');
        const powerReading = document.getElementById('cb-power-reading');
        const tripReading = document.getElementById('cb-trip-reading');
        
        if (statusReading) {
            statusReading.textContent = this.isTripped ? 'TRIPPED' : 'ON';
            statusReading.style.color = this.isTripped ? '#ff6b6b' : '#2ed573';
        }
        
        if (powerReading) {
            const power = this.isTripped ? 0 : (this.voltage * this.current / 1000);
            powerReading.textContent = power.toFixed(2) + ' kW';
        }
        
        if (tripReading) {
            tripReading.textContent = this.isTripped ? this.tripTime.toFixed(2) + 's' : '--';
        }
        
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
        
        // Draw circuit diagram
        const centerX = w / 2;
        const centerY = h / 2;
        
        // Circuit wire
        ctx.strokeStyle = this.isTripped ? '#ff6b6b' : '#00d4ff';
        ctx.lineWidth = 4;
        
        // Top wire
        ctx.beginPath();
        ctx.moveTo(100, centerY - 80);
        ctx.lineTo(300, centerY - 80);
        ctx.stroke();
        
        // Bottom wire
        ctx.beginPath();
        ctx.moveTo(100, centerY + 80);
        ctx.lineTo(300, centerY + 80);
        ctx.stroke();
        
        // Draw circuit breaker
        this.drawBreaker(ctx, centerX, centerY - 80);
        
        // Draw load
        this.drawLoad(ctx, 550, centerY);
        
        // Draw power source
        this.drawSource(ctx, 80, centerY);
        
        // Fault indicator
        if (this.faultType !== 'none') {
            this.drawFault(ctx, 350, centerY);
        }
        
        // Current flow animation
        if (!this.isTripped) {
            this.drawCurrentFlow(ctx);
        }
        
        // Info panel
        this.drawInfoPanel(ctx, w, h);
        
        this.time += 0.016;
    }
    
    drawBreaker(ctx, x, y) {
        // Breaker body
        ctx.fillStyle = this.isTripped ? '#ff4757' : '#2f3542';
        ctx.strokeStyle = this.isTripped ? '#ff6b6b' : '#57606f';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.roundRect(x - 50, y - 30, 100, 60, 8);
        ctx.fill();
        ctx.stroke();
        
        // Breaker switch
        if (this.isTripped) {
            ctx.fillStyle = '#ff4757';
            ctx.beginPath();
            ctx.arc(x - 25, y, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffa502';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('OFF', x - 25, y + 5);
        } else {
            ctx.fillStyle = '#2ed573';
            ctx.beginPath();
            ctx.arc(x + 25, y, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ON', x + 25, y + 5);
        }
        
        // Rating label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.breakerRating}A`, x, y + 45);
        
        // Trip mechanism
        if (this.isTripped) {
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '12px Arial';
            ctx.fillText('⚠️ TRIPPED', x, y - 45);
        }
    }
    
    drawLoad(ctx, x, y) {
        // Draw a simple motor/load symbol
        ctx.strokeStyle = '#ffa502';
        ctx.lineWidth = 3;
        
        // Circle for motor
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.stroke();
        
        // M label
        ctx.fillStyle = '#ffa502';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', x, y);
        
        // Load label
        ctx.font = '12px Arial';
        ctx.fillText('Load', x, y + 55);
        
        // Power consumption
        const power = this.isTripped ? 0 : (this.voltage * this.current / 1000);
        ctx.fillStyle = '#2ed573';
        ctx.fillText(`${power.toFixed(1)} kW`, x, y + 70);
    }
    
    drawSource(ctx, x, y) {
        // Draw power source (battery/AC source symbol)
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 3;
        
        // Circle
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.stroke();
        
        // + and -
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AC', x, y);
        
        ctx.font = '12px Arial';
        ctx.fillText('Source', x, y + 45);
        ctx.fillText(`${this.voltage}V`, x, y + 60);
    }
    
    drawFault(ctx, x, y) {
        // Draw fault symbol
        ctx.fillStyle = '#ff4757';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (this.faultType === 'short') {
            ctx.fillText('⚡', x, y - 30);
            ctx.font = '12px Arial';
            ctx.fillText('SHORT CIRCUIT', x, y);
            ctx.fillText(`Current: ${(this.current * 10).toFixed(0)}A`, x, y + 20);
        } else {
            ctx.fillText('🔥', x, y - 30);
            ctx.font = '12px Arial';
            ctx.fillText('OVERLOAD', x, y);
            ctx.fillText(`Current: ${(this.current * 1.5).toFixed(0)}A`, x, y + 20);
        }
    }
    
    drawCurrentFlow(ctx) {
        // Animated current flow dots
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const flowSpeed = 3;
        
        ctx.fillStyle = '#00d4ff';
        
        // Top wire flow
        for (let i = 0; i < 5; i++) {
            const x = ((this.time * 50 * flowSpeed + i * 80) % 600) + 120;
            const y = centerY - 80;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Bottom wire flow (opposite direction)
        for (let i = 0; i < 5; i++) {
            const x = 720 - ((this.time * 50 * flowSpeed + i * 80) % 600);
            const y = centerY + 80;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawInfoPanel(ctx, w, h) {
        // Draw info panel
        const panelX = 20;
        const panelY = 20;
        
        ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, 200, 120, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Circuit Status', panelX + 15, panelY + 15);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(`Current: ${this.current}A`, panelX + 15, panelY + 40);
        ctx.fillText(`Voltage: ${this.voltage}V`, panelX + 15, panelY + 55);
        ctx.fillText(`Breaker: ${this.breakerRating}A`, panelX + 15, panelY + 70);
        
        const effCurrent = this.current * this.faultMultiplier;
        ctx.fillStyle = effCurrent > this.breakerRating ? '#ff6b6b' : '#2ed573';
        ctx.fillText(`Load: ${effCurrent.toFixed(1)}A`, panelX + 15, panelY + 85);
    }
    
    start() {
        if (this.animationId) return;
        const animate = () => {
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
    window.circuitBreakerSimulator = new CircuitBreakerSimulator();
});
