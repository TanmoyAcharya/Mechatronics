/**
 * Visualizations Utility Functions
 * Additional visualization helpers for the simulator
 */

class Visualizations {
    /**
     * Draw a phasor diagram
     */
    static drawPhasorDiagram(ctx, canvas, phasors, options = {}) {
        const {
            centerX = canvas.width / 2,
            centerY = canvas.height / 2,
            scale = Math.min(canvas.width, canvas.height) * 0.35,
            showGrid = true,
            gridColor = 'rgba(255,255,255,0.1)',
            backgroundColor = '#15151f'
        } = options;
        
        // Clear canvas
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        if (showGrid) {
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            
            // Vertical lines
            for (let x = 0; x <= canvas.width; x += 20) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            
            // Horizontal lines
            for (let y = 0; y <= canvas.height; y += 20) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
            
            // Draw axes
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(canvas.width, centerY);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(centerX, 0);
            ctx.lineTo(centerX, canvas.height);
            ctx.stroke();
            
            // Unit circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, scale, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.stroke();
        }
        
        // Draw phasors
        phasors.forEach(phasor => {
            const magnitude = phasor.magnitude * scale;
            const angle = phasor.angle * Math.PI / 180; // Convert to radians
            
            const endX = centerX + Math.cos(angle) * magnitude;
            const endY = centerY - Math.sin(angle) * magnitude;
            
            // Draw phasor line
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = phasor.color || '#00d4ff';
            ctx.lineWidth = phasor.lineWidth || 2;
            ctx.stroke();
            
            // Draw arrow head
            const arrowSize = 8;
            const arrowAngle = Math.atan2(centerY - endY, endX - centerX);
            
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
            ctx.fillStyle = phasor.color || '#00d4ff';
            ctx.fill();
            
            // Draw label
            if (phasor.label) {
                ctx.fillStyle = phasor.color || '#00d4ff';
                ctx.font = '12px JetBrains Mono';
                ctx.fillText(phasor.label, endX + 8, endY - 8);
            }
        });
    }
    
    /**
     * Draw a waveform
     */
    static drawWaveform(ctx, canvas, waves, options = {}) {
        const {
            backgroundColor = '#15151f',
            time = 0,
            duration = 0.04, // 40ms = one cycle at 25Hz
            amplitude = canvas.height * 0.35,
            centerY = canvas.height / 2,
            showGrid = true,
            gridColor = 'rgba(255,255,255,0.05)'
        } = options;
        
        // Clear canvas
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        if (showGrid) {
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            
            // Vertical lines (time divisions)
            for (let x = 0; x <= canvas.width; x += canvas.width / 8) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            
            // Horizontal lines (amplitude divisions)
            for (let y = 0; y <= canvas.height; y += canvas.height / 8) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
            
            // Center line
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(canvas.width, centerY);
            ctx.stroke();
        }
        
        // Draw waves
        waves.forEach(wave => {
            ctx.beginPath();
            ctx.strokeStyle = wave.color;
            ctx.lineWidth = wave.lineWidth || 2;
            
            for (let x = 0; x < canvas.width; x++) {
                const t = (x / canvas.width) * duration + time;
                const y = centerY + Math.sin(2 * Math.PI * wave.frequency * t + wave.phase) * amplitude * wave.amplitude;
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
        });
    }
    
    /**
     * Draw a pie chart
     */
    static drawPieChart(ctx, canvas, data, options = {}) {
        const {
            centerX = canvas.width / 2,
            centerY = canvas.height / 2,
            radius = Math.min(canvas.width, canvas.height) * 0.35,
            backgroundColor = '#15151f',
            showLabels = true,
            labelColor = '#e8e8ed',
            font = '12px JetBrains Mono'
        } = options;
        
        // Clear canvas
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let startAngle = -Math.PI / 2;
        
        data.forEach(item => {
            const sliceAngle = (item.value / total) * Math.PI * 2;
            
            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();
            
            // Draw label
            if (showLabels && item.label) {
                const midAngle = startAngle + sliceAngle / 2;
                const labelRadius = radius * 0.7;
                const labelX = centerX + Math.cos(midAngle) * labelRadius;
                const labelY = centerY + Math.sin(midAngle) * labelRadius;
                
                ctx.fillStyle = labelColor;
                ctx.font = font;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.label, labelX, labelY);
            }
            
            startAngle += sliceAngle;
        });
        
        // Draw center circle (donut style)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = backgroundColor;
        ctx.fill();
    }
    
    /**
     * Draw a bar chart
     */
    static drawBarChart(ctx, canvas, data, options = {}) {
        const {
            backgroundColor = '#15151f',
            barColor = '#00d4ff',
            labelColor = '#9898a8',
            valueColor = '#e8e8ed',
            font = '11px JetBrains Mono',
            padding = 40,
            barSpacing = 10
        } = options;
        
        // Clear canvas
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const maxValue = Math.max(...data.map(d => d.value));
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        const barWidth = (chartWidth - (data.length - 1) * barSpacing) / data.length;
        
        // Draw bars
        data.forEach((item, index) => {
            const x = padding + index * (barWidth + barSpacing);
            const barHeight = (item.value / maxValue) * chartHeight;
            const y = canvas.height - padding - barHeight;
            
            // Draw bar
            ctx.fillStyle = item.color || barColor;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw label
            ctx.fillStyle = labelColor;
            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x + barWidth / 2, canvas.height - padding + 15);
            
            // Draw value
            ctx.fillStyle = valueColor;
            ctx.fillText(item.value.toFixed(1), x + barWidth / 2, y - 5);
        });
    }
    
    /**
     * Draw a gauge/meter
     */
    static drawGauge(ctx, canvas, value, options = {}) {
        const {
            min = 0,
            max = 100,
            startAngle = -Math.PI * 0.75,
            endAngle = Math.PI * 0.75,
            radius = Math.min(canvas.width, canvas.height) * 0.4,
            centerX = canvas.width / 2,
            centerY = canvas.height * 0.85,
            backgroundColor = '#15151f',
            arcColor = '#2a2a3a',
            fillColor = '#00d4ff',
            needleColor = '#ff4444',
            showTicks = true,
            tickCount = 10,
            label = '',
            unit = ''
        } = options;
        
        // Clear canvas
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw background arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = arcColor;
        ctx.lineWidth = 15;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Draw filled arc based on value
        const normalizedValue = (value - min) / (max - min);
        const valueAngle = startAngle + normalizedValue * (endAngle - startAngle);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, valueAngle);
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = 15;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Draw ticks
        if (showTicks) {
            for (let i = 0; i <= tickCount; i++) {
                const tickAngle = startAngle + (i / tickCount) * (endAngle - startAngle);
                const innerRadius = radius - 25;
                const outerRadius = radius - 10;
                
                ctx.beginPath();
                ctx.moveTo(
                    centerX + Math.cos(tickAngle) * innerRadius,
                    centerY + Math.sin(tickAngle) * innerRadius
                );
                ctx.lineTo(
                    centerX + Math.cos(tickAngle) * outerRadius,
                    centerY + Math.sin(tickAngle) * outerRadius
                );
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Tick labels
                const tickValue = min + (i / tickCount) * (max - min);
                const labelRadius = radius - 35;
                ctx.fillStyle = '#606070';
                ctx.font = '10px JetBrains Mono';
                ctx.textAlign = 'center';
                ctx.fillText(
                    tickValue.toFixed(0),
                    centerX + Math.cos(tickAngle) * labelRadius,
                    centerY + Math.sin(tickAngle) * labelRadius + 3
                );
            }
        }
        
        // Draw needle
        const needleLength = radius - 30;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(valueAngle) * needleLength,
            centerY + Math.sin(valueAngle) * needleLength
        );
        ctx.strokeStyle = needleColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.fillStyle = needleColor;
        ctx.fill();
        
        // Value display
        ctx.fillStyle = '#e8e8ed';
        ctx.font = 'bold 20px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`${value.toFixed(1)} ${unit}`, centerX, centerY + 30);
        
        // Label
        if (label) {
            ctx.fillStyle = '#9898a8';
            ctx.font = '12px JetBrains Mono';
            ctx.fillText(label, centerX, centerY + 50);
        }
    }
    
    /**
     * Draw magnetic field lines between two poles
     */
    static drawMagneticField(ctx, canvas, options = {}) {
        const {
            northPole = { x: canvas.width * 0.3, y: canvas.height / 2 },
            southPole = { x: canvas.width * 0.7, y: canvas.height / 2 },
            poleRadius = 30,
            numLines = 8,
            animate = false,
            time = 0,
            backgroundColor = '#0a0a10'
        } = options;
        
        // Clear canvas
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw field lines
        for (let i = 0; i < numLines; i++) {
            const offset = (i - numLines / 2 + 0.5) * 0.15;
            
            ctx.beginPath();
            
            // Calculate start point on north pole
            const startAngle = -Math.PI / 2 + offset;
            const startX = northPole.x + Math.cos(startAngle) * poleRadius;
            const startY = northPole.y + Math.sin(startAngle) * poleRadius;
            
            ctx.moveTo(startX, startY);
            
            // Draw curved line through air gap
            const midX = (northPole.x + southPole.x) / 2;
            const controlOffset = offset * 100;
            
            ctx.quadraticCurveTo(
                midX, southPole.y - controlOffset,
                southPole.x + Math.cos(startAngle) * poleRadius,
                southPole.y + Math.sin(startAngle) * poleRadius
            );
            
            ctx.strokeStyle = animate 
                ? `rgba(0, 212, 255, ${0.3 + 0.3 * Math.sin(time * 3 + i)})`
                : 'rgba(0, 212, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Draw poles
        // North pole (red)
        const northGradient = ctx.createRadialGradient(
            northPole.x, northPole.y, 0,
            northPole.x, northPole.y, poleRadius
        );
        northGradient.addColorStop(0, '#ff6666');
        northGradient.addColorStop(1, '#cc0000');
        
        ctx.beginPath();
        ctx.arc(northPole.x, northPole.y, poleRadius, 0, Math.PI * 2);
        ctx.fillStyle = northGradient;
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', northPole.x, northPole.y);
        
        // South pole (blue)
        const southGradient = ctx.createRadialGradient(
            southPole.x, southPole.y, 0,
            southPole.x, southPole.y, poleRadius
        );
        southGradient.addColorStop(0, '#6666ff');
        southGradient.addColorStop(1, '#0000cc');
        
        ctx.beginPath();
        ctx.arc(southPole.x, southPole.y, poleRadius, 0, Math.PI * 2);
        ctx.fillStyle = southGradient;
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText('S', southPole.x, southPole.y);
        
        // Field direction arrows
        ctx.fillStyle = '#00d4ff';
        ctx.font = '12px JetBrains Mono';
        ctx.fillText('→', canvas.width / 2, canvas.height / 2 - 40);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Visualizations;
}
