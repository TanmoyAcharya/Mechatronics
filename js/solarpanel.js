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
            this.canvas.width = 900;
            this.canvas.height = 450;
        }
        if (this.ivCanvas && this.ivCanvas.width === 0) {
            this.ivCanvas.width = 430;
            this.ivCanvas.height = 250;
        }
        if (this.powerCanvas && this.powerCanvas.width === 0) {
            this.powerCanvas.width = 430;
            this.powerCanvas.height = 250;
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
        
        // Adjust sky based on cloud cover - darker when cloudy
        const cloudDarkening = this.cloudCover / 100 * 0.4;
        
        if (this.cloudCover > 70) {
            // Overcast sky - gray with slight blue tint
            skyGradient = ctx.createLinearGradient(0, 0, 0, h);
            skyGradient.addColorStop(0, `rgb(${Math.floor(74 - cloudDarkening * 50)}, ${Math.floor(90 - cloudDarkening * 30)}, ${Math.floor(104 - cloudDarkening * 20)})`);
            skyGradient.addColorStop(0.4, `rgb(${Math.floor(113 - cloudDarkening * 50)}, ${Math.floor(130 - cloudDarkening * 30)}, ${Math.floor(150 - cloudDarkening * 20)})`);
            skyGradient.addColorStop(0.7, `rgb(${Math.floor(140 - cloudDarkening * 40)}, ${Math.floor(160 - cloudDarkening * 30)}, ${Math.floor(180 - cloudDarkening * 20)})`);
            skyGradient.addColorStop(1, `rgb(${Math.floor(176 - cloudDarkening * 30)}, ${Math.floor(190 - cloudDarkening * 20)}, ${Math.floor(208 - cloudDarkening * 10)})`);
        } else if (isDawn || isDusk) {
            // Golden hour - warm colors
            const dawnFactor = isDawn ? (15 - this.sunAngle) / 15 : (this.sunAngle - 85) / 15;
            skyGradient = ctx.createLinearGradient(0, 0, 0, h);
            skyGradient.addColorStop(0, `rgb(${Math.floor(26 + dawnFactor * 20)}, ${Math.floor(32 + dawnFactor * 20)}, ${Math.floor(44 + dawnFactor * 30)})`);
            skyGradient.addColorStop(0.25, `rgb(${Math.floor(60 + dawnFactor * 30)}, ${Math.floor(40 + dawnFactor * 30)}, ${Math.floor(80 + dawnFactor * 40)})`);
            skyGradient.addColorStop(0.5, `rgb(${Math.floor(85 + dawnFactor * 50)}, ${Math.floor(60 + dawnFactor * 40)}, ${Math.floor(100 + dawnFactor * 30)})`);
            skyGradient.addColorStop(0.75, `rgb(${Math.floor(237 - dawnFactor * 50)}, ${Math.floor(137 - dawnFactor * 30)}, ${Math.floor(54 - dawnFactor * 20)})`);
            skyGradient.addColorStop(1, `rgb(${Math.floor(246 - dawnFactor * 30)}, ${Math.floor(224 - dawnFactor * 50)}, ${Math.floor(94 - dawnFactor * 30)})`);
        } else {
            // Clear blue sky - adjust for cloud cover
            const baseBlue = 1 - cloudDarkening;
            skyGradient = ctx.createLinearGradient(0, 0, 0, h);
            skyGradient.addColorStop(0, `rgb(${Math.floor(30 * baseBlue)}, ${Math.floor(58 * baseBlue)}, ${Math.floor(95 * baseBlue)})`);
            skyGradient.addColorStop(0.35, `rgb(${Math.floor(49 * baseBlue)}, ${Math.floor(129 * baseBlue)}, ${Math.floor(206 * baseBlue)})`);
            skyGradient.addColorStop(0.6, `rgb(${Math.floor(99 * baseBlue)}, ${Math.floor(179 * baseBlue)}, ${Math.floor(237 * baseBlue)})`);
            skyGradient.addColorStop(1, `rgb(${Math.floor(190 * baseBlue)}, ${Math.floor(227 * baseBlue)}, ${Math.floor(248 * baseBlue)})`);
        }
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, w, h);
        
        // Add subtle atmospheric haze near horizon
        const hazeGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
        hazeGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        hazeGrad.addColorStop(1, `rgba(255, 255, 255, ${0.1 + this.cloudCover / 500})`);
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(0, h * 0.6, w, h * 0.4);
    }
    
    drawSun(ctx, w, h) {
        const sunX = w * 0.75;
        const sunY = h - 100 - (this.sunAngle / 90) * (h - 150);
        
        // Sun corona (outer glow) - more intense
        const coronaGradient = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 200);
        coronaGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
        coronaGradient.addColorStop(0.15, 'rgba(255, 220, 100, 0.6)');
        coronaGradient.addColorStop(0.4, 'rgba(255, 180, 50, 0.3)');
        coronaGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
        
        ctx.fillStyle = coronaGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 200, 0, Math.PI * 2);
        ctx.fill();
        
        // Multiple glow layers for realism
        for (let i = 3; i > 0; i--) {
            const glowGradient = ctx.createRadialGradient(sunX, sunY, 30, sunX, sunY, 30 + i * 25);
            glowGradient.addColorStop(0, `rgba(255, 255, 255, ${0.3 / i})`);
            glowGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(sunX, sunY, 30 + i * 25, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Sun core - bright white-yellow
        const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 50);
        sunGradient.addColorStop(0, '#ffffff');
        sunGradient.addColorStop(0.3, '#fffde7');
        sunGradient.addColorStop(0.6, '#ffeb3b');
        sunGradient.addColorStop(0.85, '#ffc107');
        sunGradient.addColorStop(1, '#ff9800');
        
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 45, 0, Math.PI * 2);
        ctx.fill();
        
        // Lens flare effect
        ctx.globalCompositeOperation = 'screen';
        const flarePositions = [0.3, 0.5, 0.7, 1.2, 1.5];
        const flareSizes = [8, 15, 6, 20, 12];
        const flareColors = ['rgba(255,255,200,0.4)', 'rgba(255,200,100,0.3)', 'rgba(255,150,50,0.2)', 'rgba(200,255,255,0.2)', 'rgba(255,220,180,0.3)'];
        
        for (let i = 0; i < flarePositions.length; i++) {
            const angle = Math.atan2(h/2 - sunY, w/2 - sunX);
            const dist = Math.sqrt((w/2 - sunX)**2 + (h/2 - sunY)**2);
            const flareX = sunX + Math.cos(angle) * dist * flarePositions[i];
            const flareY = sunY + Math.sin(angle) * dist * flarePositions[i];
            
            const flareGrad = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, flareSizes[i]);
            flareGrad.addColorStop(0, flareColors[i]);
            flareGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = flareGrad;
            ctx.beginPath();
            ctx.arc(flareX, flareY, flareSizes[i], 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        
        // Sun rays - animated
        ctx.strokeStyle = 'rgba(255, 245, 157, 0.5)';
        ctx.lineWidth = 2;
        const rayTime = this.time * 0.3;
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2 + rayTime;
            const rayLength = 40 + Math.sin(this.time * 2 + i) * 10;
            ctx.beginPath();
            ctx.moveTo(sunX + Math.cos(angle) * 55, sunY + Math.sin(angle) * 55);
            ctx.lineTo(sunX + Math.cos(angle) * (55 + rayLength), sunY + Math.sin(angle) * (55 + rayLength));
            ctx.stroke();
        }
    }
    
    drawClouds(ctx, w, h) {
        if (this.cloudCover < 10) return; // Skip drawing if clear sky
        
        const cloudOpacity = this.cloudCover / 100 * 0.9;
        const cloudBrightness = 255 - this.cloudCover * 0.5;
        
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > w + 150) cloud.x = -200;
            
            // Draw fluffy cloud with multiple overlapping circles
            const baseColor = `rgba(${cloudBrightness}, ${cloudBrightness}, ${cloudBrightness}, ${cloudOpacity})`;
            const shadowColor = `rgba(${cloudBrightness * 0.7}, ${cloudBrightness * 0.7}, ${cloudBrightness * 0.75}, ${cloudOpacity})`;
            const highlightColor = `rgba(${Math.min(255, cloudBrightness + 20)}, ${Math.min(255, cloudBrightness + 20)}, ${Math.min(255, cloudBrightness + 25)}, ${cloudOpacity})`;
            
            // Cloud shadow/base
            ctx.fillStyle = shadowColor;
            ctx.beginPath();
            ctx.arc(cloud.x + 10, cloud.y + 20, cloud.size * 0.45, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.5, cloud.y + 22, cloud.size * 0.4, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.9, cloud.y + 18, cloud.size * 0.35, 0, Math.PI * 2);
            ctx.fill();
            
            // Cloud main body
            ctx.fillStyle = baseColor;
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.4, cloud.y - cloud.size * 0.15, cloud.size * 0.45, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.85, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.3, cloud.y + cloud.size * 0.2, cloud.size * 0.35, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.6, cloud.y + cloud.size * 0.15, cloud.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            // Cloud highlights
            ctx.fillStyle = highlightColor;
            ctx.beginPath();
            ctx.arc(cloud.x + cloud.size * 0.2, cloud.y - cloud.size * 0.15, cloud.size * 0.25, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.2, cloud.size * 0.2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Add ambient cloud layer when overcast
        if (this.cloudCover > 50) {
            ctx.fillStyle = `rgba(${cloudBrightness * 0.9}, ${cloudBrightness * 0.9}, ${cloudBrightness * 0.95}, ${cloudOpacity * 0.5})`;
            for (let i = 0; i < 3; i++) {
                const x = (w * 0.2 + i * w * 0.3 + this.time * 20) % (w + 200) - 100;
                ctx.beginPath();
                ctx.ellipse(x, 60 + i * 30, 150, 40, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
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
        
        // Draw birds in sky (only when clear enough)
        if (this.cloudCover < 60) {
            const birdCount = 3;
            const time = this.time;
            
            for (let i = 0; i < birdCount; i++) {
                const birdX = (w * 0.2 + i * w * 0.25 + time * 15 * (0.8 + i * 0.1)) % (w + 100) - 50;
                const birdY = 80 + i * 40 + Math.sin(time * 2 + i) * 15;
                const wingFlap = Math.sin(time * 8 + i * 2) * 4;
                
                ctx.strokeStyle = '#2a2a2a';
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';
                
                // Bird body
                ctx.beginPath();
                ctx.moveTo(birdX - 8, birdY);
                ctx.quadraticCurveTo(birdX - 4, birdY - 3 + wingFlap, birdX, birdY);
                ctx.quadraticCurveTo(birdX + 4, birdY - 3 - wingFlap, birdX + 8, birdY);
                ctx.stroke();
            }
        }
    }
    
    drawGround(ctx, w, h) {
        const groundY = h - 80;
        
        // Multiple grass layers for depth
        // Far grass
        const farGrassGrad = ctx.createLinearGradient(0, groundY - 20, 0, h);
        farGrassGrad.addColorStop(0, '#3d6b4f');
        farGrassGrad.addColorStop(1, '#2d5a3d');
        ctx.fillStyle = farGrassGrad;
        ctx.fillRect(0, groundY - 20, w, 100);
        
        // Grass texture - random patches
        for (let i = 0; i < w; i += 15) {
            const patchBrightness = 0.8 + Math.random() * 0.4;
            ctx.fillStyle = `rgba(${Math.floor(74 * patchBrightness)}, ${Math.floor(124 * patchBrightness)}, ${Math.floor(89 * patchBrightness)}, 0.3)`;
            ctx.beginPath();
            ctx.ellipse(i + Math.random() * 10, groundY + 10 + Math.random() * 20, 8 + Math.random() * 8, 4 + Math.random() * 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Main grass gradient
        const grassGradient = ctx.createLinearGradient(0, groundY, 0, h);
        grassGradient.addColorStop(0, '#5a8c69');
        grassGradient.addColorStop(0.3, '#4a7c59');
        grassGradient.addColorStop(0.7, '#3d6b4f');
        grassGradient.addColorStop(1, '#2d5a3d');
        
        ctx.fillStyle = grassGradient;
        ctx.fillRect(0, groundY, w, 80);
        
        // Grass blades - foreground
        ctx.strokeStyle = '#6a9c79';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < w; i += 6) {
            const bladeHeight = 8 + Math.sin(i * 0.15 + this.time * 0.5) * 4 + Math.random() * 3;
            ctx.beginPath();
            ctx.moveTo(i, groundY);
            ctx.quadraticCurveTo(i + 3, groundY - bladeHeight / 2, i + 2, groundY - bladeHeight);
            ctx.stroke();
        }
        
        // Add small stones/rocks
        ctx.fillStyle = '#6a6a6a';
        const stones = [
            {x: w * 0.15, y: groundY + 35, r: 6},
            {x: w * 0.18, y: groundY + 40, r: 4},
            {x: w * 0.72, y: groundY + 25, r: 5},
            {x: w * 0.75, y: groundY + 30, r: 3},
        ];
        stones.forEach(stone => {
            ctx.beginPath();
            ctx.ellipse(stone.x, stone.y, stone.r, stone.r * 0.6, Math.random(), 0, Math.PI * 2);
            ctx.fillStyle = `rgb(${Math.floor(90 + Math.random() * 30)}, ${Math.floor(90 + Math.random() * 30)}, ${Math.floor(90 + Math.random() * 30)})`;
            ctx.fill();
        });
        
        // Dirt path
        const pathGrad = ctx.createLinearGradient(w * 0.3, h, w * 0.5, groundY);
        pathGrad.addColorStop(0, '#6b5344');
        pathGrad.addColorStop(0.5, '#8b7355');
        pathGrad.addColorStop(1, '#7a6548');
        ctx.fillStyle = pathGrad;
        ctx.beginPath();
        ctx.moveTo(w * 0.28, h);
        ctx.quadraticCurveTo(w * 0.33, groundY - 10, w * 0.38, groundY + 15);
        ctx.lineTo(w * 0.48, groundY + 20);
        ctx.quadraticCurveTo(w * 0.53, groundY - 5, w * 0.58, h);
        ctx.fill();
        
        // Path texture - small pebbles
        ctx.fillStyle = 'rgba(100, 80, 60, 0.4)';
        for (let i = 0; i < 20; i++) {
            const px = w * 0.35 + Math.random() * w * 0.2;
            const py = groundY + 15 + Math.random() * 50;
            ctx.beginPath();
            ctx.arc(px, py, 1 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawRealisticPanels(ctx, w, h) {
        const groundY = h - 80;
        const rackX = w / 2 - 220;
        const rackY = groundY;
        
        // Panel configuration: 3 rows of 4 panels
        const panelWidth = 80;
        const panelHeight = 50;
        const panelGap = 6;
        const rows = 3;
        const cols = 4;
        
        // Draw support structure - aluminum mounting rails
        ctx.fillStyle = '#5a5a6a';
        // Vertical poles - galvanized steel
        const poleGrad = ctx.createLinearGradient(rackX - 10, 0, rackX + 5, 0);
        poleGrad.addColorStop(0, '#4a4a5a');
        poleGrad.addColorStop(0.5, '#6a6a7a');
        poleGrad.addColorStop(1, '#4a4a5a');
        ctx.fillStyle = poleGrad;
        ctx.fillRect(rackX - 12, rackY - 140, 14, 140);
        ctx.fillRect(rackX + cols * (panelWidth + panelGap) + 2, rackY - 140, 14, 140);
        
        // Cross beams - mounting rails
        ctx.fillStyle = '#5a5a6a';
        ctx.fillRect(rackX - 18, rackY - 140, cols * (panelWidth + panelGap) + 30, 12);
        
        // Ground mount base - concrete pads
        ctx.fillStyle = '#7a7a7a';
        ctx.beginPath();
        ctx.ellipse(rackX - 5, rackY + 5, 25, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rackX + cols * (panelWidth + panelGap) + 9, rackY + 5, 25, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Calculate effective irradiance based on tilt and angle
        const incidenceAngle = Math.abs(this.panelTilt - this.sunAngle);
        const angleLoss = Math.cos(incidenceAngle * Math.PI / 180);
        const effectiveIrradiance = this.solarIrradiance * angleLoss * (1 - this.cloudCover / 100);
        
        // Draw each panel with realistic details
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const panelX = rackX + col * (panelWidth + panelGap);
                const panelY = rackY - 140 - row * (panelHeight + panelGap);
                
                // Panel shadow - dynamic based on sun position
                const shadowOffsetX = (w * 0.75 - panelX) * 0.05;
                const shadowOffsetY = 6;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                ctx.beginPath();
                ctx.roundRect(panelX + shadowOffsetX, panelY + shadowOffsetY, panelWidth, panelHeight, 3);
                ctx.fill();
                
                // Panel frame - anodized aluminum
                const frameGrad = ctx.createLinearGradient(panelX - 3, panelY - 3, panelX + panelWidth + 3, panelY + panelHeight + 3);
                frameGrad.addColorStop(0, '#3a3a4a');
                frameGrad.addColorStop(0.3, '#5a5a6a');
                frameGrad.addColorStop(0.7, '#4a4a5a');
                frameGrad.addColorStop(1, '#2a2a3a');
                ctx.fillStyle = frameGrad;
                ctx.beginPath();
                ctx.roundRect(panelX - 3, panelY - 3, panelWidth + 6, panelHeight + 6, 4);
                ctx.fill();
                
                // Frame highlight
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(panelX - 2, panelY - 2, panelWidth + 4, 2, 2);
                ctx.stroke();
                
                // Panel background - dark blue PV cells
                const brightness = 0.2 + (effectiveIrradiance / 1000) * 0.8;
                const panelGrad = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
                panelGrad.addColorStop(0, `rgb(${Math.floor(10 * brightness)}, ${Math.floor(25 * brightness)}, ${Math.floor(80 * brightness)})`);
                panelGrad.addColorStop(0.5, `rgb(${Math.floor(15 * brightness)}, ${Math.floor(40 * brightness)}, ${Math.floor(110 * brightness)})`);
                panelGrad.addColorStop(1, `rgb(${Math.floor(8 * brightness)}, ${Math.floor(20 * brightness)}, ${Math.floor(60 * brightness)})`);
                ctx.fillStyle = panelGrad;
                ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
                
                // Draw solar cells (6x10 grid per panel) with busbars
                const cellWidth = (panelWidth - 12) / 10;
                const cellHeight = (panelHeight - 10) / 6;
                
                for (let r = 0; r < 6; r++) {
                    for (let c = 0; c < 10; c++) {
                        const cellX = panelX + 6 + c * cellWidth;
                        const cellY = panelY + 5 + r * cellHeight;
                        
                        // Cell gradient - multi-layer for depth
                        const cellBrightness = brightness * (0.9 + Math.random() * 0.2);
                        const cellGrad = ctx.createLinearGradient(cellX, cellY, cellX + cellWidth, cellY + cellHeight);
                        cellGrad.addColorStop(0, `rgb(${Math.floor(15 * cellBrightness)}, ${Math.floor(35 * cellBrightness)}, ${Math.floor(90 * cellBrightness)})`);
                        cellGrad.addColorStop(0.4, `rgb(${Math.floor(25 * cellBrightness)}, ${Math.floor(55 * cellBrightness)}, ${Math.floor(130 * cellBrightness)})`);
                        cellGrad.addColorStop(0.6, `rgb(${Math.floor(20 * cellBrightness)}, ${Math.floor(45 * cellBrightness)}, ${Math.floor(110 * cellBrightness)})`);
                        cellGrad.addColorStop(1, `rgb(${Math.floor(10 * cellBrightness)}, ${Math.floor(30 * cellBrightness)}, ${Math.floor(80 * cellBrightness)})`);
                        
                        ctx.fillStyle = cellGrad;
                        ctx.fillRect(cellX, cellY, cellWidth - 1, cellHeight - 1);
                        
                        // Busbar lines (silver contacts)
                        ctx.strokeStyle = `rgba(180, 180, 200, ${0.3 + brightness * 0.3})`;
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(cellX + cellWidth/2, cellY);
                        ctx.lineTo(cellX + cellWidth/2, cellY + cellHeight - 1);
                        ctx.stroke();
                        
                        // Cell grid lines - very subtle
                        ctx.strokeStyle = 'rgba(60, 60, 100, 0.3)';
                        ctx.lineWidth = 0.4;
                        ctx.strokeRect(cellX, cellY, cellWidth - 1, cellHeight - 1);
                    }
                }
                
                // Anti-reflective coating effect
                const arcGrad = ctx.createRadialGradient(
                    panelX + panelWidth * 0.3, panelY + panelHeight * 0.3, 0,
                    panelX + panelWidth * 0.5, panelY + panelHeight * 0.5, panelWidth * 0.8
                );
                arcGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
                arcGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
                arcGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = arcGrad;
                ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
                
                // Glass reflection diagonal
                ctx.save();
                ctx.beginPath();
                ctx.rect(panelX, panelY, panelWidth, panelHeight);
                ctx.clip();
                
                const reflectGrad = ctx.createLinearGradient(panelX, panelY + panelHeight, panelX + panelWidth, panelY);
                reflectGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                reflectGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.05)');
                reflectGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
                reflectGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.05)');
                reflectGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = reflectGrad;
                ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
                ctx.restore();
            }
        }
        
        // Panel efficiency glow effect
        if (this.power > 0.5) {
            const glowIntensity = Math.min(this.power / this.systemCapacity, 1);
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 25 * glowIntensity;
            ctx.strokeStyle = `rgba(0, 212, 255, ${glowIntensity * 0.6})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(rackX - 22, rackY - 150, cols * (panelWidth + panelGap) + 18, rows * (panelHeight + panelGap) + 18, 6);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // Add junction box on first panel
        const jbX = rackX + panelWidth * 0.7;
        const jbY = rackY - 140 + panelHeight * 0.7;
        ctx.fillStyle = '#2a2a3a';
        ctx.beginPath();
        ctx.roundRect(jbX, jbY, 15, 10, 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(jbX + 3, jbY + 3, 4, 4);
    }
    
    drawPowerDisplay(ctx, w, h) {
        // Power output box - glassmorphism style
        const boxX = 20;
        const boxY = 20;
        
        // Background with blur effect simulation
        ctx.fillStyle = 'rgba(10, 20, 40, 0.85)';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, 220, 130, 12);
        ctx.fill();
        ctx.stroke();
        
        // Inner glow
        const innerGlow = ctx.createLinearGradient(boxX, boxY, boxX, boxY + 130);
        innerGlow.addColorStop(0, 'rgba(0, 212, 255, 0.15)');
        innerGlow.addColorStop(1, 'rgba(0, 212, 255, 0)');
        ctx.fillStyle = innerGlow;
        ctx.beginPath();
        ctx.roundRect(boxX + 2, boxY + 2, 216, 126, 10);
        ctx.fill();
        
        // Power value - large and prominent
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(this.power.toFixed(2), boxX + 18, boxY + 50);
        
        // Unit
        ctx.font = '16px Arial';
        ctx.fillStyle = '#888';
        ctx.fillText('kW', boxX + 135, boxY + 45);
        
        // System capacity
        ctx.fillStyle = '#2ed573';
        ctx.font = '14px Arial';
        ctx.fillText(`of ${this.systemCapacity} kWp system`, boxX + 18, boxY + 72);
        
        // Efficiency bar
        const eff = (this.power / (this.systemCapacity * this.solarIrradiance / 1000)) * 100;
        const effClamped = Math.min(eff, 100);
        
        ctx.fillStyle = '#ffa502';
        ctx.font = '12px Arial';
        ctx.fillText(`Performance: ${effClamped.toFixed(1)}%`, boxX + 18, boxY + 92);
        
        // Efficiency bar background
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.roundRect(boxX + 18, boxY + 98, 120, 8, 4);
        ctx.fill();
        
        // Efficiency bar fill
        const effBarGrad = ctx.createLinearGradient(boxX + 18, 0, boxX + 138, 0);
        effBarGrad.addColorStop(0, '#ff6b6b');
        effBarGrad.addColorStop(0.5, '#ffa502');
        effBarGrad.addColorStop(1, '#2ed573');
        ctx.fillStyle = effBarGrad;
        ctx.beginPath();
        ctx.roundRect(boxX + 18, boxY + 98, Math.max(0, effClamped * 1.2), 8, 4);
        ctx.fill();
        
        // Real-time indicators
        this.drawIndicator(ctx, boxX + 150, boxY + 60, 'I', this.current, 60);
        this.drawIndicator(ctx, boxX + 178, boxY + 60, 'V', this.voltage, 500);
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
            this.ivCanvas.height = 250;
        }
        if (this.powerCanvas) {
            this.powerCanvas.width = this.powerCanvas.parentElement.clientWidth;
            this.powerCanvas.height = 250;
        }
        this.calculate();
    }
}
