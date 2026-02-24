/**
 * Lift/Elevator Simulator
 * Interactive demonstration of elevator control systems
 */

class LiftSimulator {
    constructor() {
        this.currentFloor = 1;
        this.targetFloor = 5;
        this.speed = 1.0;  // m/s
        this.load = 50;    // percentage
        this.isMoving = false;
        this.cabinPosition = 0;  // 0 = at floor
        this.travelTime = 0;
        this.motorPower = 5;
        this.doorOpen = true;
        this.time = 0;
        this.animationId = null;
        
        // Floor positions (in pixels)
        this.floorHeight = 40;
        this.numFloors = 10;
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('lift-canvas');
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
        const floorSlider = document.getElementById('lift-floor-slider');
        const floorValue = document.getElementById('lift-floor-value');
        if (floorSlider && floorValue) {
            floorSlider.addEventListener('input', (e) => {
                this.currentFloor = parseInt(e.target.value);
                floorValue.textContent = this.currentFloor;
                this.calculate();
            });
        }
        
        const targetSlider = document.getElementById('lift-target-slider');
        const targetValue = document.getElementById('lift-target-value');
        if (targetSlider && targetValue) {
            targetSlider.addEventListener('input', (e) => {
                this.targetFloor = parseInt(e.target.value);
                targetValue.textContent = this.targetFloor;
                this.calculate();
            });
        }
        
        const speedSlider = document.getElementById('lift-speed-slider');
        const speedValue = document.getElementById('lift-speed-value');
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                this.speed = parseFloat(e.target.value);
                speedValue.textContent = this.speed.toFixed(1);
                this.calculate();
            });
        }
        
        const loadSlider = document.getElementById('lift-load-slider');
        const loadValue = document.getElementById('lift-load-value');
        if (loadSlider && loadValue) {
            loadSlider.addEventListener('input', (e) => {
                this.load = parseInt(e.target.value);
                loadValue.textContent = this.load;
                this.calculate();
            });
        }
        
        const goBtn = document.getElementById('lift-go-btn');
        if (goBtn) {
            goBtn.addEventListener('click', () => {
                this.startJourney();
            });
        }
    }
    
    calculate() {
        // Calculate travel time
        const floorDiff = Math.abs(this.targetFloor - this.currentFloor);
        const travelDistance = floorDiff * 3.5;  // meters between floors
        this.travelTime = travelDistance / this.speed;
        
        // Motor power based on load and speed
        this.motorPower = 3 + (this.load / 100) * 7 + (this.speed - 0.5) * 2;
        
        // Update readings
        const statusReading = document.getElementById('lift-status-reading');
        const timeReading = document.getElementById('lift-time-reading');
        const powerReading = document.getElementById('lift-power-reading');
        
        if (statusReading) {
            statusReading.textContent = this.isMoving ? (this.targetFloor > this.currentFloor ? '⬆️ Going Up' : '⬇️ Going Down') : (this.doorOpen ? '🚪 Doors Open' : 'Idle');
            statusReading.style.color = this.isMoving ? '#ffa502' : '#2ed573';
        }
        
        if (timeReading) {
            timeReading.textContent = this.isMoving ? this.travelTime.toFixed(1) + 's' : (this.travelTime.toFixed(1) + 's');
        }
        
        if (powerReading) {
            powerReading.textContent = this.motorPower.toFixed(1) + ' kW';
        }
        
        this.draw();
    }
    
    startJourney() {
        if (this.currentFloor === this.targetFloor) return;
        
        this.isMoving = true;
        this.doorOpen = false;
        this.calculate();
        
        // Animate the journey
        const startFloor = this.currentFloor;
        const endFloor = this.targetFloor;
        const startTime = Date.now();
        const duration = this.travelTime * 1000;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            
            // Ease in-out
            const eased = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            this.currentFloor = startFloor + (endFloor - startFloor) * eased;
            this.calculate();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.currentFloor = endFloor;
                this.targetFloor = endFloor;
                this.isMoving = false;
                this.doorOpen = true;
                
                // Update slider values
                const floorSlider = document.getElementById('lift-floor-slider');
                const targetSlider = document.getElementById('lift-target-slider');
                if (floorSlider) floorSlider.value = this.currentFloor;
                if (targetSlider) targetSlider.value = this.targetFloor;
                
                this.calculate();
            }
        };
        
        animate();
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // Background - building shaft
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#2d3436');
        bgGrad.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        
        // Draw shaft
        this.drawShaft(ctx, w, h);
        
        // Draw floors
        this.drawFloors(ctx, w, h);
        
        // Draw elevator cabin
        this.drawCabin(ctx, w, h);
        
        // Draw motor
        this.drawMotor(ctx, w, h);
        
        // Draw counterweight
        this.drawCounterweight(ctx, w, h);
        
        // Draw cables
        this.drawCables(ctx, w, h);
        
        // Draw control panel
        this.drawControlPanel(ctx, w, h);
        
        // Draw info panel
        this.drawInfoPanel(ctx, w, h);
        
        this.time += 0.016;
    }
    
    drawShaft(ctx, w, h) {
        const shaftX = 150;
        const shaftW = 200;
        
        // Shaft walls
        ctx.fillStyle = '#3d3d4d';
        ctx.fillRect(shaftX - 10, 0, 10, h);
        ctx.fillRect(shaftX + shaftW, 0, 10, h);
        
        // Shaft background
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(shaftX, 0, shaftW, h);
        
        // Guide rails
        ctx.strokeStyle = '#5a5a6a';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(shaftX + 20, 0);
        ctx.lineTo(shaftX + 20, h);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(shaftX + shaftW - 20, 0);
        ctx.lineTo(shaftX + shaftW - 20, h);
        ctx.stroke();
    }
    
    drawFloors(ctx, w, h) {
        const shaftX = 150;
        const shaftW = 200;
        const floorHeight = (h - 100) / this.numFloors;
        
        for (let i = 0; i < this.numFloors; i++) {
            const floorY = 50 + i * floorHeight;
            
            // Floor line
            ctx.strokeStyle = '#4a4a5a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(shaftX, floorY);
            ctx.lineTo(shaftX + shaftW, floorY);
            ctx.stroke();
            
            // Floor number
            ctx.fillStyle = this.currentFloor === i + 1 ? '#00d4ff' : '#888';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'right';
            ctx.fillText((i + 1).toString(), shaftX - 20, floorY + 5);
            
            // Floor indicator lights
            if (this.currentFloor === i + 1 || this.targetFloor === i + 1) {
                ctx.fillStyle = this.targetFloor === i + 1 && this.isMoving ? '#ffa502' : '#00d4ff';
                ctx.beginPath();
                ctx.arc(shaftX + shaftW + 25, floorY, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    drawCabin(ctx, w, h) {
        const shaftX = 150;
        const shaftW = 200;
        const floorHeight = (h - 100) / this.numFloors;
        
        // Calculate cabin Y position based on current floor
        const cabinY = 50 + (this.currentFloor - 1) * floorHeight;
        
        // Cabin body
        const cabinX = shaftX + 30;
        const cabinW = shaftW - 60;
        const cabinH = floorHeight * 0.9;
        
        // Cabin shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(cabinX + 5, cabinY + 5, cabinW, cabinH);
        
        // Cabin
        const cabinGrad = ctx.createLinearGradient(cabinX, cabinY, cabinX + cabinW, cabinY);
        cabinGrad.addColorStop(0, '#5a5a6a');
        cabinGrad.addColorStop(0.5, '#6a6a7a');
        cabinGrad.addColorStop(1, '#5a5a6a');
        
        ctx.fillStyle = cabinGrad;
        ctx.beginPath();
        ctx.roundRect(cabinX, cabinY, cabinW, cabinH, 5);
        ctx.fill();
        
        // Cabin border
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Door
        const doorOpenWidth = this.doorOpen ? 20 : 2;
        ctx.fillStyle = '#4a4a5a';
        ctx.fillRect(cabinX + cabinW/2 - doorOpenWidth, cabinY + 5, doorOpenWidth * 2, cabinH - 10);
        
        // Window
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(cabinX + 20, cabinY + cabinH * 0.3, cabinW - 40, cabinH * 0.35);
        
        // People inside (simple silhouettes)
        if (this.load > 10) {
            const numPeople = Math.ceil(this.load / 25);
            for (let i = 0; i < numPeople; i++) {
                ctx.fillStyle = `rgba(100, 150, 200, ${0.3 + i * 0.2})`;
                ctx.beginPath();
                ctx.arc(cabinX + 40 + i * 30, cabinY + cabinH * 0.6, 10, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Capacity indicator
        ctx.fillStyle = this.load > 80 ? '#ff6b6b' : this.load > 50 ? '#ffa502' : '#2ed573';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Load: ${this.load}%`, cabinX + cabinW/2, cabinY + cabinH - 10);
    }
    
    drawMotor(ctx, w, h) {
        const motorX = 400;
        const motorY = 40;
        
        // Motor housing
        ctx.fillStyle = '#4a4a5a';
        ctx.beginPath();
        ctx.roundRect(motorX - 30, motorY - 20, 60, 50, 5);
        ctx.fill();
        
        // Motor
        ctx.fillStyle = '#5a5a6a';
        ctx.beginPath();
        ctx.arc(motorX, motorY + 5, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Motor detail
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.arc(motorX, motorY + 5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Motor', motorX, motorY + 45);
    }
    
    drawCounterweight(ctx, w, h) {
        const shaftX = 150;
        const shaftW = 200;
        const cwX = shaftX + shaftW - 50;
        
        // Calculate counterweight Y (opposite to cabin)
        const floorHeight = (h - 100) / this.numFloors;
        const cabinY = 50 + (this.currentFloor - 1) * floorHeight;
        const cwY = h - 80 - (cabinY - 50) - 60;
        
        // Counterweight
        ctx.fillStyle = '#6a6a7a';
        ctx.fillRect(cwX, cwY, 30, 60);
        
        // Weight segments
        ctx.strokeStyle = '#5a5a6a';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(cwX, cwY + 20 + i * 20);
            ctx.lineTo(cwX + 30, cwY + 20 + i * 20);
            ctx.stroke();
        }
    }
    
    drawCables(ctx, w, h) {
        const shaftX = 150;
        const shaftW = 200;
        const motorX = 400;
        const floorHeight = (h - 100) / this.numFloors;
        
        const cabinX = shaftX + 30 + shaftW/2 - 10;
        const cabinY = 50 + (this.currentFloor - 1) * floorHeight;
        
        // Main cable to motor
        ctx.strokeStyle = '#7a7a8a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cabinX + 10, cabinY);
        ctx.lineTo(motorX, 40);
        ctx.stroke();
        
        // Safety cable
        ctx.strokeStyle = '#5a5a6a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cabinX + 30, cabinY);
        ctx.lineTo(cabinX + 30, h - 80);
        ctx.stroke();
    }
    
    drawControlPanel(ctx, w, h) {
        const panelX = 50;
        const panelY = h - 150;
        
        // Panel background
        ctx.fillStyle = '#2a2a3a';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, 80, 120, 8);
        ctx.fill();
        ctx.stroke();
        
        // Floor buttons
        const buttonColors = {
            'up': '#2ed573',
            'down': '#ffa502',
            'stop': '#ff6b6b'
        };
        
        // Up button
        ctx.fillStyle = buttonColors.up;
        ctx.beginPath();
        ctx.arc(panelX + 40, panelY + 30, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('▲', panelX + 40, panelY + 35);
        
        // Down button
        ctx.fillStyle = buttonColors.down;
        ctx.beginPath();
        ctx.arc(panelX + 40, panelY + 70, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText('▼', panelX + 40, panelY + 75);
        
        // Stop button
        ctx.fillStyle = buttonColors.stop;
        ctx.beginPath();
        ctx.arc(panelX + 40, panelY + 110, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.fillText('■', panelX + 40, panelY + 114);
    }
    
    drawInfoPanel(ctx, w, h) {
        const panelX = w - 200;
        const panelY = 20;
        
        ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, 180, 120, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Elevator Status', panelX + 15, panelY + 20);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(`Current: Floor ${Math.round(this.currentFloor)}`, panelX + 15, panelY + 45);
        ctx.fillText(`Target: Floor ${this.targetFloor}`, panelX + 15, panelY + 60);
        ctx.fillText(`Speed: ${this.speed} m/s`, panelX + 15, panelX + 15, panelY + 75);
        
        ctx.fillStyle = '#2ed573';
        ctx.fillText(`Load: ${this.load}%`, panelX + 15, panelY + 95);
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
    window.liftSimulator = new LiftSimulator();
});
