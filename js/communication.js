/**
 * ElectroMachines Lab - Communication Systems Simulator
 * Interactive simulator for industrial communication protocols
 */

class CommunicationSimulator {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.animationId = null;
        
        // Communication parameters
        this.protocol = 'modbus'; // 'modbus', 'can', 'ethernet', 'profibus'
        this.baudRate = 9600;
        this.dataBits = 8;
        this.parity = 'none';
        this.stopBits = 1;
        this.packetSize = 8;
        this.transmissionRate = 50; // packets per second
        this.noiseLevel = 5; // percentage
        
        // Data visualization
        this.packets = [];
        this.dataStream = [];
        this.errors = [];
        this.stats = {
            sent: 0,
            received: 0,
            errors: 0,
            latency: 0
        };
        
        // Protocol parameters
        this.protocols = {
            modbus: {
                name: 'Modbus RTU',
                type: 'Serial',
                maxBaud: 115200,
                maxDistance: 1200,
                topology: 'Bus',
                color: '#22c55e'
            },
            can: {
                name: 'CAN Bus',
                type: 'Automotive/Industrial',
                maxBaud: 1000000,
                maxDistance: 40,
                topology: 'Bus',
                color: '#eab308'
            },
            ethernet: {
                name: 'Industrial Ethernet',
                type: 'Ethernet',
                maxBaud: 1000000000,
                maxDistance: 100,
                topology: 'Star',
                color: '#8b5cf6'
            },
            profibus: {
                name: 'Profibus DP',
                type: 'Fieldbus',
                maxBaud: 12000000,
                maxDistance: 1200,
                topology: 'Bus',
                color: '#f472b6'
            }
        };
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('comm-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.setupEventListeners();
            this.start();
        }
    }
    
    setupEventListeners() {
        // Protocol selector
        const protocolBtns = document.querySelectorAll('.protocol-btn');
        protocolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                protocolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.protocol = btn.dataset.protocol;
                this.updateProtocolInfo();
                this.updateDisplay();
            });
        });
        
        // Baud rate slider
        const baudSlider = document.getElementById('baud-slider');
        const baudValue = document.getElementById('baud-value');
        if (baudSlider) {
            baudSlider.addEventListener('input', (e) => {
                this.baudRate = parseInt(e.target.value);
                if (baudValue) baudValue.textContent = this.formatBaudRate(this.baudRate);
                this.updateDisplay();
            });
        }
        
        // Packet size slider
        const packetSlider = document.getElementById('packet-slider');
        const packetValue = document.getElementById('packet-value');
        if (packetSlider) {
            packetSlider.addEventListener('input', (e) => {
                this.packetSize = parseInt(e.target.value);
                if (packetValue) packetValue.textContent = this.packetSize + ' bytes';
                this.updateDisplay();
            });
        }
        
        // Transmission rate slider
        const rateSlider = document.getElementById('rate-slider');
        const rateValue = document.getElementById('rate-value');
        if (rateSlider) {
            rateSlider.addEventListener('input', (e) => {
                this.transmissionRate = parseInt(e.target.value);
                if (rateValue) rateValue.textContent = this.transmissionRate + ' pps';
                this.updateDisplay();
            });
        }
        
        // Noise level slider
        const noiseSlider = document.getElementById('noise-slider');
        const noiseValue = document.getElementById('noise-value');
        if (noiseSlider) {
            noiseSlider.addEventListener('input', (e) => {
                this.noiseLevel = parseInt(e.target.value);
                if (noiseValue) noiseValue.textContent = this.noiseLevel + '%';
                this.updateDisplay();
            });
        }
        
        // Parity selector
        const paritySelect = document.getElementById('parity-select');
        if (paritySelect) {
            paritySelect.addEventListener('change', (e) => {
                this.parity = e.target.value;
                this.updateDisplay();
            });
        }
    }
    
    formatBaudRate(baud) {
        if (baud >= 1000000) return (baud / 1000000).toFixed(1) + ' Mbps';
        if (baud >= 1000) return (baud / 1000).toFixed(0) + ' kbps';
        return baud + ' bps';
    }
    
    updateProtocolInfo() {
        const proto = this.protocols[this.protocol];
        
        const nameDisplay = document.getElementById('protocol-name');
        if (nameDisplay) nameDisplay.textContent = proto.name;
        
        const typeDisplay = document.getElementById('protocol-type');
        if (typeDisplay) typeDisplay.textContent = proto.type;
        
        const maxBaudDisplay = document.getElementById('protocol-baud');
        if (maxBaudDisplay) maxBaudDisplay.textContent = this.formatBaudRate(proto.maxBaud);
        
        const topologyDisplay = document.getElementById('protocol-topology');
        if (topologyDisplay) topologyDisplay.textContent = proto.topology;
        
        const distanceDisplay = document.getElementById('protocol-distance');
        if (distanceDisplay) distanceDisplay.textContent = proto.maxDistance + 'm';
    }
    
    calculatePerformance() {
        const proto = this.protocols[this.protocol];
        
        // Calculate data throughput
        const effectiveBaud = Math.min(this.baudRate, proto.maxBaud);
        const bitsPerPacket = this.packetSize * 8 + (this.parity !== 'none' ? 1 : 0) + this.stopBits;
        const throughput = (effectiveBaud / bitsPerPacket) * this.transmissionRate;
        
        // Calculate error rate based on noise
        const baseErrorRate = this.noiseLevel / 100;
        const parityBonus = this.parity === 'even' || this.parity === 'odd' ? 0.8 : 1;
        const errorRate = baseErrorRate * parityBonus;
        
        // Calculate latency
        const propagationDelay = proto.maxDistance / 300000; // speed of light approx
        const processingDelay = bitsPerPacket / effectiveBaud;
        const latency = (propagationDelay + processingDelay) * 1000; // ms
        
        // Calculate errors per second
        const errorsPerSecond = this.transmissionRate * errorRate;
        
        return {
            throughput: throughput,
            errorRate: errorRate,
            latency: latency,
            errorsPerSecond: errorsPerSecond,
            effectiveBaud: effectiveBaud,
            safeOperation: errorRate < 0.01
        };
    }
    
    updateDisplay() {
        const metrics = this.calculatePerformance();
        
        const throughputDisplay = document.getElementById('throughput-display');
        if (throughputDisplay) {
            if (metrics.throughput >= 1000) {
                throughputDisplay.textContent = (metrics.throughput / 1000).toFixed(1) + ' kB/s';
            } else {
                throughputDisplay.textContent = metrics.throughput.toFixed(0) + ' B/s';
            }
        }
        
        const latencyDisplay = document.getElementById('latency-display');
        if (latencyDisplay) {
            latencyDisplay.textContent = metrics.latency.toFixed(2) + ' ms';
        }
        
        const errorRateDisplay = document.getElementById('error-display');
        if (errorRateDisplay) {
            errorRateDisplay.textContent = (metrics.errorRate * 100).toFixed(2) + '%';
            errorRateDisplay.style.color = metrics.errorRate < 0.1 ? '#22c55e' : 
                                          metrics.errorRate < 1 ? '#eab308' : '#ef4444';
        }
        
        const sentDisplay = document.getElementById('sent-display');
        if (sentDisplay) sentDisplay.textContent = this.stats.sent;
        
        const recvDisplay = document.getElementById('recv-display');
        if (recvDisplay) recvDisplay.textContent = this.stats.received;
        
        const errorsDisplay = document.getElementById('errors-count-display');
        if (errorsDisplay) errorsDisplay.textContent = this.stats.errors;
        
        const safeDisplay = document.getElementById('safe-op-display');
        if (safeDisplay) {
            safeDisplay.textContent = metrics.safeOperation ? '✓ Healthy' : '⚠ High Errors';
            safeDisplay.style.color = metrics.safeOperation ? '#22c55e' : '#ef4444';
        }
        
        // Update slider max based on protocol
        const baudSlider = document.getElementById('baud-slider');
        if (baudSlider) {
            baudSlider.max = this.protocols[this.protocol].maxBaud;
        }
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.updateProtocolInfo();
        this.updateDisplay();
        this.animate();
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
        
        const gridSize = 40;
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
        
        // Draw network visualization
        this.drawNetwork(ctx, canvas);
        
        // Draw packet animation
        this.drawPackets(ctx, canvas);
        
        // Draw data stream
        this.drawDataStream(ctx, canvas);
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    drawNetwork(ctx, canvas) {
        const proto = this.protocols[this.protocol];
        const centerY = canvas.height / 2;
        
        if (proto.topology === 'Bus') {
            // Draw bus topology
            ctx.strokeStyle = proto.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(50, centerY);
            ctx.lineTo(canvas.width - 50, centerY);
            ctx.stroke();
            
            // Draw termination resistors
            ctx.fillStyle = '#333';
            ctx.fillRect(30, centerY - 15, 20, 30);
            ctx.fillRect(canvas.width - 50, centerY - 15, 20, 30);
            
            // Draw nodes
            const nodePositions = [150, 300, 450, 600, 700];
            nodePositions.forEach((x, i) => {
                // Drop line
                ctx.strokeStyle = proto.color + '80';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, centerY);
                ctx.lineTo(x, centerY - 40);
                ctx.stroke();
                
                // Node
                ctx.fillStyle = proto.color;
                ctx.beginPath();
                ctx.arc(x, centerY - 50, 15, 0, Math.PI * 2);
                ctx.fill();
                
                // Label
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Node ${i + 1}`, x, centerY - 70);
            });
            
            // Draw label
            ctx.fillStyle = '#888';
            ctx.font = '12px Arial';
            ctx.fillText(`${proto.name} - Bus Topology`, canvas.width / 2, centerY + 30);
            
        } else if (proto.topology === 'Star') {
            // Draw star topology
            const centerX = canvas.width / 2;
            
            // Draw central switch
            ctx.fillStyle = proto.color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Switch', centerX, centerY + 4);
            
            // Draw nodes
            const nodePositions = [
                { x: 150, y: centerY - 80 },
                { x: canvas.width - 150, y: centerY - 80 },
                { x: 100, y: centerY + 80 },
                { x: canvas.width - 100, y: centerY + 80 },
                { x: centerX, y: centerY - 120 }
            ];
            
            nodePositions.forEach((pos, i) => {
                // Connection line
                ctx.strokeStyle = proto.color + '80';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                
                // Node
                ctx.fillStyle = proto.color;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
                ctx.fill();
                
                // Label
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`PLC ${i + 1}`, pos.x, pos.y + 30);
            });
            
            // Draw label
            ctx.fillStyle = '#888';
            ctx.font = '12px Arial';
            ctx.fillText(`${proto.name} - Star Topology`, centerX, centerY + 150);
        }
    }
    
    drawPackets(ctx, canvas) {
        const proto = this.protocols[this.protocol];
        const centerY = canvas.height / 2;
        
        // Randomly generate packets
        if (Math.random() < this.transmissionRate / 60) {
            const isError = Math.random() < (this.noiseLevel / 100);
            this.packets.push({
                x: 50,
                y: centerY - 50 + Math.random() * 20 - 10,
                targetX: 700 + Math.random() * 50,
                speed: 3 + Math.random() * 2,
                isError: isError,
                size: this.packetSize * 2
            });
            
            this.stats.sent++;
            if (isError) {
                this.stats.errors++;
            }
        }
        
        // Draw and update packets
        this.packets = this.packets.filter(p => {
            p.x += p.speed;
            
            // Draw packet
            ctx.fillStyle = p.isError ? '#ef4444' : proto.color;
            ctx.beginPath();
            ctx.roundRect(p.x, p.y - 5, p.size, 10, 3);
            ctx.fill();
            
            // Draw data pattern
            ctx.fillStyle = '#fff';
            ctx.font = '6px Arial';
            ctx.textAlign = 'center';
            for (let i = 0; i < Math.min(p.size / 4, 4); i++) {
                ctx.fillText(Math.random() > 0.5 ? '1' : '0', p.x + 4 + i * 4, p.y + 2);
            }
            
            // Check if packet reached destination
            if (p.x >= p.targetX) {
                if (!p.isError) {
                    this.stats.received++;
                }
                return false;
            }
            return true;
        });
    }
    
    drawDataStream(ctx, canvas) {
        const proto = this.protocols[this.protocol];
        
        // Draw bit stream at bottom
        const streamY = canvas.height - 40;
        ctx.fillStyle = '#333';
        ctx.fillRect(50, streamY - 10, canvas.width - 100, 30);
        
        // Generate and draw bits
        const bits = [];
        for (let i = 0; i < 40; i++) {
            bits.push(Math.random() > 0.5 ? 1 : 0);
        }
        
        bits.forEach((bit, i) => {
            const x = 60 + i * 15;
            ctx.fillStyle = bit ? proto.color : '#444';
            ctx.fillRect(x, streamY, 10, 20);
            
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(bit.toString(), x + 5, streamY + 14);
        });
        
        // Draw label
        ctx.fillStyle = '#888';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Data Stream:', 50, streamY - 15);
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // The simulator will be initialized by the main app
});
