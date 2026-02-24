/**
 * Solar Panel Simulator - Ultra Realistic
 * Detailed PV system simulation with realistic visuals and physics
 */

class SolarPanelSimulator {
    constructor() {
        // Panel parameters
        this.panelArea = 2;           // Area per panel (m²)
        this.panelEfficiency = 21;     // Panel efficiency (%) - typical mono-Si
        this.numPanels = 12;          // Number of panels in array
        this.systemCapacity = 5;       // System capacity (kWp)
        
        // Environmental conditions
        this.solarIrradiance = 1000;  // Irradiance (W/m²)
        this.temperature = 25;         // Cell temperature (°C)
        this.sunAngle = 45;            // Sun elevation angle (degrees)
        this.panelTilt = 30;           // Panel tilt angle (degrees)
        this.windSpeed = 5;           // Wind speed (m/s) for cooling
        this.cloudCover = 0;           // Cloud cover (0-100%)
        
        // Cell parameters (detailed model)
        this.Voc = 45.2;              // Open circuit voltage (V)
        this.Isc = 10.3;              // Short circuit current (A)
        this.Vmp = 37.8;              // Voltage at max power (V)
        this.Imp = 9.65;              // Current at max power (A)
        this.alphaIsc = 0.05;         // Temp coeff of Isc (%/°C)
        this.betaVoc = -0.28;         // Temp coeff of Voc (%/°C)
        
        // Output
        this.power = 0;               // Generated power (kW)
        this.current = 0;             // Current (A)
        this.voltage = 0;              // Voltage (V)
        this.dailyEnergy = 0;         // Daily energy (kWh)
        
        // Animation
        this.time = 0;
        this.animationId = null;
        this.particles = [];           // For dust, pollen particles
        this.clouds = [];              // Cloud positions
        this.birds = [];               // Birds in sky
        
        // Initialize clouds
        for(let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * 1200,
                y: 30 + Math.random() * 80,
                size: 50 + Math.random() * 80,
                speed: 0.1 + Math.random() * 0.3
            });
        }
        
        // Initialize particles
        for(let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * 800,
                y: Math.random() * 400,
                size: 1 + Math.random() * 2,
                speedX: 0.2 + Math.random() * 0.5,
                speedY: -0.5 - Math.random() * 1,
                opacity: 0.2 + Math.random() * 0.3
            });
        }
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('solar-canvas');
        if (!this.canvas) {
            console.log('Solar canvas not found');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.ivCanvas = document.getElementById('solar-iv-curve');
        if (this.ivCanvas) {
            this.ivCtx = this.ivCanvas.getContext('2d');
        }
        
        this.powerCanvas = document.getElementById('solar-power-curve');
        if (this.powerCanvas) {
            this.powerCtx = this.powerCanvas.getContext('2d');
        }
        
        this.setupControls();
        
        if (this.canvas.width === 0) {
            this.canvas.width = 800;
            this.canvas.height = 450;
        }
        if (this.ivCanvas && this.ivCanvas.width === 0) {
            this.ivCanvas.width = 380;
            this.ivCanvas.height = 200;
        }
        if (this.powerCanvas && this.powerCanvas.width === 0) {
            this.powerCanvas.width = 380;
            this.powerCanvas.height = 200;
        }
        
        this.calculate();
    }
    
    setupControls() {
        const irradianceSlider = document.getElementById('solar-irradiance-slider');
        const irradianceValue = document.getElementById('solar-irradiance-value');
        if (irradianceSlider && irradianceValue) {
            irradianceSlider.addEventListener('input', (e) => {
                this.solarIrradiance = parseFloat(e.target.value);
                irradianceValue.textContent = this.solarIrradiance.toFixed(0);
                this.calculate();
            });
        }
        
        const tempSlider = document.getElementById('solar-temp-slider');
        const tempValue = document.getElementById('solar-temp-value');
        if (tempSlider && tempValue) {
            tempSlider.addEventListener('input', (e) => {
                this.temperature = parseFloat(e.target.value);
                tempValue.textContent = this.temperature.toFixed(0);
                this.calculate();
            });
        }
        
        const tiltSlider = document.getElementById('solar-tilt-slider');
        const tiltValue = document.getElementById('solar-tilt-value');
        if (tiltSlider && tiltValue) {
            tiltSlider.addEventListener('input', (e) => {
                this.panelTilt = parseFloat(e.target.value);
                tiltValue.textContent = this.panelTilt.toFixed(0);
                this.calculate();
            });
        }
        
        const cloudSlider = document.getElementById('solar-cloud-slider');
        const cloudValue = document.getElementById('solar-cloud-value');
        if (cloudSlider && cloudValue) {
            cloudSlider.addEventListener('input', (e) => {
                this.cloudCover = parseFloat(e.target.value);
                cloudValue.textContent = this.cloudCover.toFixed(0);
                this.calculate();
            });
        }
    }
    
    // Detailed PV physics calculation
    calculate() {
        // Apply temperature corrections
        const deltaT = this.temperature - 25;
        const IscTemp = this.Isc * (1 + (this.alphaIsc / 100) * deltaT);
        const VocTemp = this.Voc * (1 + (this.betaVoc / 100) * deltaT);
        
        // Apply irradiance (proportional to Isc)
        const G = this.solarIrradiance / 1000; // Normalized irradiance
        const effectiveG = G * (1 - this.cloudCover / 100); // Cloud effect
        
        const IscFinal = IscTemp * effectiveG;
        const VocFinal = VocTemp * (1 + 0.025 * Math.log(effectiveG)); // Logarithmic Voc
        
        // Calculate IV curve points
        const ivPoints = [];
        const numPoints = 100;
        
        // Simplified diode model
        const n = 1.2; // Ideality factor
        const Rs = 0.3; // Series resistance (Ohms)
        const Rsh = 500; // Shunt resistance (Ohms)
        const I0 = 1e-10; // Reverse saturation current
        const Vt = 1.38e-23 * (this.temperature + 273.15) / 1.6e-19; // Thermal voltage
        
        for (let i = 0; i <= numPoints; i++) {
            const V = (i / numPoints) * VocFinal;
            // Newton-Raphson iteration for solving diode equation
            let I = IscFinal;
            for (let iter = 0; iter < 20; iter++) {
                const Id = I0 * (Math.exp(V / (n * Vt)) - 1);
                const Ipv = IscFinal;
                const Icalc = Ipv - Id - V / Rsh;
                // Simplified: use ideal diode approximation
                I = IscFinal * (1 - Math.exp((V - VocFinal) / (n * Vt)));
            }
            if (I < 0) I = 0;
            ivPoints.push({ V, I, P: V * I });
        }
        
        // Find MPPT
        let maxP = 0;
        let Vmp = 0;
        let Imp = 0;
        
        ivPoints.forEach(pt => {
            if (pt.P > maxP) {
                maxP = pt.P;
                Vmp = pt.V;
                Imp = pt.I;
            }
        });
        
        // Apply system losses
        const inverterEff = 0.96; // Inverter efficiency
        const wiringLoss = 0.02; // Wiring losses
        const soilingLoss = 0.03; // Soiling losses
        const tempLoss = this.temperature > 25 ? 0.4 * (this.temperature - 25) / 100 : 0;
        
        const grossPower = maxP * this.numPanels;
        const totalLoss = inverterEff * (1 - wiringLoss) * (1 - soilingLoss) * (1 - tempLoss);
        
        this.power = grossPower * totalLoss / 1000; // kW
        this.current = Imp * this.numPanels;
        this.voltage = Vmp * Math.ceil(this.numPanels / 2); // Series-parallel config
        
        // Update readings
        const powerReading = document.getElementById('solar-power-reading');
        const voltageReading = document.getElementById('solar-voltage-reading');
        const currentReading = document.getElementById('solar-current-reading');
        const efficiencyReading = document.getElementById('solar-eff-reading');
        
        if (powerReading) powerReading.textContent = this.power.toFixed(2) + ' kW';
        if (voltageReading) voltageReading.textContent = this.voltage.toFixed(1) + ' V';
        if (currentReading) currentReading.textContent = this.current.toFixed(2) + ' A';
        if (efficiencyReading) efficiencyReading.textContent = (this.panelEfficiency * totalLoss).toFixed(1) + ' %';
        
        // Store IV curve data for plotting
        this.ivCurveData = ivPoints;
        
        this.draw();
        this.drawIVCurve();
        this.drawPowerCurve();
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // Sky gradient based on time of day and clouds
        const skyGradient = this.drawSky(ctx, w, h);
        
        // Draw clouds
        this.drawClouds(ctx, w, h);
        
        // Draw sun with corona
        this.drawSun(ctx, w, h);
        
        // Draw particles (dust/pollen)
        this.drawParticles(ctx, w, h);
        
        // Draw ground with grass texture
        this.drawGround(ctx, w, h);
        
        // Draw realistic solar panels
        this.drawRealisticPanels(ctx, w, h);
        
        // Draw power output display
        this.drawPowerDisplay(ctx, w, h);
        
        this.time += 0.016;
    }
    
    drawSky(ctx, w, h) {
        const sunY = h - 100 - (this.sunAngle / 90) * (h - 150);
        const isDawn = this.sunAngle < 15;
        const isDusk = this.sunAngle > 85;
        
        let skyGradient;
        
        if (this.cloudCover > 70) {
            // Overcast sky
            skyGradient = ctx.createLinearGradient(0, 0, 0, h);
            skyGradient.addColorStop(0, '#4a5568');
            skyGradient.addColorStop(0.5, '#718096');
            skyGradient.addColorStop(1, '#a0aec0');
        } else if (isDawn || isDusk) {
            // Golden hour
            skyGradient = ctx.createLinearGradient(0, 0, 0, h);
            skyGradient.addColorStop(0, '#1a202c');
            skyGradient.addColorStop(0.3, '#553c9a');
            skyGradient.addColorStop(0.6, '#ed8936');
            skyGradient.addColorStop(1, '#f6e05e');
        } else {
            // Clear blue sky
            skyGradient = ctx.createLinearGradient(0, 0, 0, h);
            skyGradient.addColorStop(0, '#1e3a5f');
            skyGradient.addColorStop(0.4, '#3182ce');
            skyGradient.addColorStop(0.7, '#63b3ed');
            skyGradient.addColorStop(1, '#bee3f8');
        }
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, w, h);
    }
    
    drawSun(ctx, w, h) {
        const sunX = w * 0.7;
        const sunY = h - 100 - (this.sunAngle / 90) * (h - 150);
        
        // Sun corona (outer glow)
        const coronaGradient = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 150);
        coronaGradient.addColorStop(0, 'rgba(255, 236, 179, 0.8)');
        coronaGradient.addColorStop(0.3, 'rgba(255, 193, 7, 0.4)');
        coronaGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
        
        ctx.fillStyle = coronaGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 150, 0, Math.PI * 2);
        ctx.fill();
        
        // Sun core
        const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 45);
        sunGradient.addColorStop(0, '#fff');
        sunGradient.addColorStop(0.5, '#ffeb3b');
        sunGradient.addColorStop(1, '#ff9800');
        
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Sun rays animation
        ctx.strokeStyle = 'rgba(255, 235, 59, 0.4)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + this.time * 0.5;
            ctx.beginPath();
            ctx.moveTo(sunX + Math.cos(angle) * 50, sunY + Math.sin(angle) * 50);
            ctx.lineTo(sunX + Math.cos(angle) * 80, sunY + Math.sin(angle) * 80);
            ctx.stroke();
        }
    }
    
    drawClouds(ctx, w, h) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > w + 100) cloud.x = -150;
            
            // Draw fluffy cloud shape
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.4, cloud.y - cloud.size * 0.1, cloud.size * 0.4, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.8, cloud.y, cloud.size * 0.35, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.3, cloud.y + cloud.size * 0.2, cloud.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            // Darker bottom
            ctx.fillStyle = 'rgba(200, 200, 210, 0.9)';
            ctx.beginPath();
            ctx.arc(cloud.x + 10, cloud.y + 15, cloud.size * 0.4, 0, Math.PI);
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        });
    }
    
    drawParticles(ctx, w, h) {
        this.particles.forEach(p => {
            p.x += p.speedX + Math.sin(this.time + p.y) * 0.2;
            p.y += p.speedY;
            
            if (p.y < 0) p.y = h;
            if (p.x > w) p.x = 0;
            
            ctx.fillStyle = `rgba(255, 255, 240, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawGround(ctx, w, h) {
        const groundY = h - 80;
        
        // Grass gradient
        const grassGradient = ctx.createLinearGradient(0, groundY, 0, h);
        grassGradient.addColorStop(0, '#4a7c59');
        grassGradient.addColorStop(0.5, '#3d6b4f');
        grassGradient.addColorStop(1, '#2d5a3d');
        
        ctx.fillStyle = grassGradient;
        ctx.fillRect(0, groundY, w, 80);
        
        // Grass blades
        ctx.strokeStyle = '#5a8c69';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 8) {
            const bladeHeight = 5 + Math.sin(i * 0.1 + this.time) * 3;
            ctx.beginPath();
            ctx.moveTo(i, groundY);
            ctx.quadraticCurveTo(i + 2, groundY - bladeHeight / 2, i + 1, groundY - bladeHeight);
            ctx.stroke();
        }
        
        // Path
        ctx.fillStyle = '#8b7355';
        ctx.beginPath();
        ctx.moveTo(w * 0.3, h);
        ctx.quadraticCurveTo(w * 0.35, groundY, w * 0.4, groundY + 20);
        ctx.lineTo(w * 0.45, groundY + 25);
        ctx.quadraticCurveTo(w * 0.5, groundY, w * 0.55, h);
        ctx.fill();
    }
    
    drawRealisticPanels(ctx, w, h) {
        const groundY = h - 80;
        const rackX = w / 2 - 200;
        const rackY = groundY;
        
        // Panel configuration: 3 rows of 4 panels
        const panelWidth = 70;
        const panelHeight = 45;
        const panelGap = 5;
        const rows = 3;
        const cols = 4;
        
        // Draw support structure
        ctx.fillStyle = '#3d3d4d';
        // Vertical poles
        ctx.fillRect(rackX - 10, rackY - 120, 15, 120);
        ctx.fillRect(rackX + cols * (panelWidth + panelGap) + 5, rackY - 120, 15, 120);
        
        // Cross beams
        ctx.fillStyle = '#4a4a5a';
        ctx.fillRect(rackX - 15, rackY - 120, cols * (panelWidth + panelGap) + 25, 10);
        
        // Calculate effective irradiance based on tilt and angle
        const incidenceAngle = Math.abs(this.panelTilt - this.sunAngle);
        const angleLoss = Math.cos(incidenceAngle * Math.PI / 180);
        const effectiveIrradiance = this.solarIrradiance * angleLoss * (1 - this.cloudCover / 100);
        
        // Draw each panel
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const panelX = rackX + col * (panelWidth + panelGap);
                const panelY = rackY - 120 - row * (panelHeight + panelGap);
                
                // Panel shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(panelX + 4, panelY + 4, panelWidth, panelHeight);
                
                // Panel frame
                ctx.fillStyle = '#2a2a3a';
                ctx.fillRect(panelX - 2, panelY - 2, panelWidth + 4, panelHeight + 4);
                
                // Panel background (dark blue)
                const panelGrad = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
                panelGrad.addColorStop(0, '#0a1628');
                panelGrad.addColorStop(0.5, '#0d2140');
                panelGrad.addColorStop(1, '#0a1628');
                ctx.fillStyle = panelGrad;
                ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
                
                // Draw solar cells (6x10 grid per panel)
                const cellWidth = (panelWidth - 10) / 10;
                const cellHeight = (panelHeight - 8) / 6;
                
                for (let r = 0; r < 6; r++) {
                    for (let c = 0; c < 10; c++) {
                        const cellX = panelX + 5 + c * cellWidth;
                        const cellY = panelY + 4 + r * cellHeight;
                        
                        // Cell color varies with irradiance
                        const brightness = 0.3 + (effectiveIrradiance / 1000) * 0.7;
                        const cellGrad = ctx.createLinearGradient(cellX, cellY, cellX + cellWidth, cellY + cellHeight);
                        cellGrad.addColorStop(0, `rgb(${Math.floor(20 * brightness)}, ${Math.floor(40 * brightness)}, ${Math.floor(100 * brightness)})`);
                        cellGrad.addColorStop(0.5, `rgb(${Math.floor(30 * brightness)}, ${Math.floor(60 * brightness)}, ${Math.floor(140 * brightness)})`);
                        cellGrad.addColorStop(1, `rgb(${Math.floor(20 * brightness)}, ${Math.floor(40 * brightness)}, ${Math.floor(100 * brightness)})`);
                        
                        ctx.fillStyle = cellGrad;
                        ctx.fillRect(cellX, cellY, cellWidth - 1, cellHeight - 1);
                        
                        // Cell grid lines
                        ctx.strokeStyle = 'rgba(100, 100, 150, 0.5)';
                        ctx.lineWidth = 0.5;
                        ctx.strokeRect(cellX, cellY, cellWidth - 1, cellHeight - 1);
                    }
                }
                
                // Reflection on panel (glass effect)
                const reflectionGrad = ctx.createLinearGradient(panelX, panelY, panelX + panelWidth, panelY + panelHeight);
                reflectionGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                reflectionGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
                reflectionGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = reflectionGrad;
                ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
            }
        }
        
        // Panel efficiency glow
        if (this.power > 0.5) {
            const glowIntensity = this.power / this.systemCapacity;
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 20 * glowIntensity;
            ctx.strokeStyle = `rgba(0, 212, 255, ${glowIntensity * 0.5})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(rackX - 20, rackY - 130, cols * (panelWidth + panelGap) + 15, rows * (panelHeight + panelGap) + 20);
            ctx.shadowBlur = 0;
        }
    }
    
    drawPowerDisplay(ctx, w, h) {
        // Power output box
        const boxX = 20;
        const boxY = 20;
        
        ctx.fillStyle = 'rgba(10, 20, 40, 0.9)';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, 200, 100, 10);
        ctx.fill();
        ctx.stroke();
        
        // Power value
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(this.power.toFixed(2), boxX + 15, boxY + 45);
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#888';
        ctx.fillText('kW', boxX + 120, boxY + 45);
        
        // System capacity
        ctx.fillStyle = '#2ed573';
        ctx.font = '16px Arial';
        ctx.fillText(`of ${this.systemCapacity} kWp`, boxX + 15, boxY + 70);
        
        // Efficiency
        const eff = (this.power / (this.systemCapacity * this.solarIrradiance / 1000)) * 100;
        ctx.fillStyle = '#ffa502';
        ctx.fillText(`Efficiency: ${eff.toFixed(1)}%`, boxX + 15, boxY + 90);
        
        // Real-time indicators
        this.drawIndicator(ctx, boxX + 140, boxY + 75, 'I', this.current, 50);
        this.drawIndicator(ctx, boxX + 165, boxY + 75, 'V', this.voltage, 400);
    }
    
    drawIndicator(ctx, x, y, label, value, max) {
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.fillText(label, x, y - 8);
        
        const barWidth = 20;
        const barHeight = 6;
        const fill = Math.min(value / max, 1) * barWidth;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        ctx.fillStyle = '#00d4ff';
        ctx.fillRect(x, y, fill, barHeight);
    }
    
    drawIVCurve() {
        if (!this.ivCanvas || !this.ivCurveData) return;
        
        const ctx = this.ivCtx;
        const w = this.ivCanvas.width;
        const h = this.ivCanvas.height;
        
        // Background
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, w, h);
        
        // Grid
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            ctx.beginPath();
            ctx.moveTo(i * w / 5, 0);
            ctx.lineTo(i * w / 5, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * h / 5);
            ctx.lineTo(w, i * h / 5);
            ctx.stroke();
        }
        
        if (this.ivCurveData.length < 2) return;
        
        const maxV = Math.max(...this.ivCurveData.map(p => p.V)) * 1.1;
        const maxI = Math.max(...this.ivCurveData.map(p => p.I)) * 1.1;
        
        // Draw IV curve
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        this.ivCurveData.forEach((pt, i) => {
            const x = (pt.V / maxV) * w;
            const y = h - (pt.I / maxI) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Mark MPP
        const mpp = this.ivCurveData.reduce((max, pt) => pt.P > max.P ? pt : max, this.ivCurveData[0]);
        const mppX = (mpp.V / maxV) * w;
        const mppY = h - (mpp.I / maxI) * h;
        
        ctx.fillStyle = '#2ed573';
        ctx.beginPath();
        ctx.arc(mppX, mppY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Labels
        ctx.fillStyle = '#888';
        ctx.font = '10px Arial';
        ctx.fillText('V', w - 15, h - 5);
        ctx.fillText('I', 5, 15);
    }
    
    drawPowerCurve() {
        if (!this.powerCanvas || !this.ivCurveData) return;
        
        const ctx = this.powerCtx;
        const w = this.powerCanvas.width;
        const h = this.powerCanvas.height;
        
        // Background
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, w, h);
        
        // Grid
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            ctx.beginPath();
            ctx.moveTo(i * w / 5, 0);
            ctx.lineTo(i * w / 5, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * h / 5);
            ctx.lineTo(w, i * h / 5);
            ctx.stroke();
        }
        
        if (this.ivCurveData.length < 2) return;
        
        const maxV = Math.max(...this.ivCurveData.map(p => p.V)) * 1.1;
        const maxP = Math.max(...this.ivCurveData.map(p => p.P)) * 1.1;
        
        // Draw power curve
        ctx.strokeStyle = '#ffa502';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        this.ivCurveData.forEach((pt, i) => {
            const x = (pt.V / maxV) * w;
            const y = h - (pt.P / maxP) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#888';
        ctx.font = '10px Arial';
        ctx.fillText('V', w - 15, h - 5);
        ctx.fillText('P', 5, 15);
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
    
    resize() {
        if (this.canvas) {
            this.canvas.width = this.canvas.parentElement.clientWidth;
            this.canvas.height = 450;
        }
        if (this.ivCanvas) {
            this.ivCanvas.width = this.ivCanvas.parentElement.clientWidth;
            this.ivCanvas.height = 200;
        }
        if (this.powerCanvas) {
            this.powerCanvas.width = this.powerCanvas.parentElement.clientWidth;
            this.powerCanvas.height = 200;
        }
        this.calculate();
    }
}
