/**
 * Quantum Computer Simulator
 * Interactive visualization of quantum computing concepts:
 * - Qubit states on the Bloch sphere
 * - Quantum gates (H, X, Y, Z, CNOT, T, S)
 * - Measurement & probability display
 * - Multi-qubit circuit builder
 */

class QuantumComputerSimulator {
    constructor() {
        // Qubit state: represented as [alpha, beta] complex amplitudes
        // |psi> = alpha|0> + beta|1>
        // Using {re, im} for complex numbers
        this.numQubits = 2;
        this.qubits = [];
        this.initQubits();

        // Circuit: array of {gate, qubit, control?} steps
        this.circuit = [];
        this.maxCircuitSteps = 12;

        // Bloch sphere rotation for visualization
        this.blochTheta = 0.4;  // view angle
        this.blochPhi = -0.3;

        // Animation
        this.animationId = null;
        this.time = 0;
        this.measurementResult = null;
        this.measurementFlash = 0;

        // History for probability chart
        this.probHistory = [];
        this.maxHistory = 100;

        this.init();
    }

    initQubits() {
        this.qubits = [];
        for (let i = 0; i < this.numQubits; i++) {
            // Start in |0> state
            this.qubits.push({
                alpha: { re: 1, im: 0 },
                beta: { re: 0, im: 0 }
            });
        }
    }

    // Complex number helpers
    cMul(a, b) {
        return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
    }
    cAdd(a, b) {
        return { re: a.re + b.re, im: a.im + b.im };
    }
    cSub(a, b) {
        return { re: a.re - b.re, im: a.im - b.im };
    }
    cAbs2(a) {
        return a.re * a.re + a.im * a.im;
    }
    cScale(a, s) {
        return { re: a.re * s, im: a.im * s };
    }

    init() {
        this.canvas = document.getElementById('quantum-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        if (this.canvas.width === 0) {
            this.canvas.width = 800;
            this.canvas.height = 450;
        }
        this.vizCanvas = document.getElementById('quantum-viz-canvas');
        if (this.vizCanvas) {
            this.vizCtx = this.vizCanvas.getContext('2d');
            if (this.vizCanvas.width === 0) {
                this.vizCanvas.width = 780;
                this.vizCanvas.height = 250;
            }
        }
        this.setupControls();
        this.calculate();
    }

    setupControls() {
        // Number of qubits slider
        const qubitSlider = document.getElementById('quantum-qubits-slider');
        const qubitValue = document.getElementById('quantum-qubits-value');
        if (qubitSlider) {
            qubitSlider.addEventListener('input', (e) => {
                this.numQubits = parseInt(e.target.value);
                if (qubitValue) qubitValue.textContent = this.numQubits;
                this.initQubits();
                this.circuit = [];
                this.measurementResult = null;
                this.renderCircuit();
                this.calculate();
            });
        }

        // Gate buttons
        const gateButtons = document.querySelectorAll('.quantum-gate-btn');
        gateButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const gate = btn.dataset.gate;
                const targetQubit = parseInt(document.getElementById('quantum-target-slider')?.value || '0');
                const controlQubit = parseInt(document.getElementById('quantum-control-slider')?.value || '0');

                if (this.circuit.length >= this.maxCircuitSteps) return;

                if (gate === 'CNOT') {
                    if (targetQubit !== controlQubit) {
                        this.circuit.push({ gate, qubit: targetQubit, control: controlQubit });
                    }
                } else {
                    this.circuit.push({ gate, qubit: targetQubit });
                }
                this.executeCircuit();
                this.renderCircuit();
                this.calculate();
            });
        });

        // Target qubit slider
        const targetSlider = document.getElementById('quantum-target-slider');
        const targetValue = document.getElementById('quantum-target-value');
        if (targetSlider) {
            targetSlider.addEventListener('input', (e) => {
                if (targetValue) targetValue.textContent = e.target.value;
            });
            targetSlider.max = this.numQubits - 1;
        }

        // Control qubit slider
        const controlSlider = document.getElementById('quantum-control-slider');
        const controlValue = document.getElementById('quantum-control-value');
        if (controlSlider) {
            controlSlider.addEventListener('input', (e) => {
                if (controlValue) controlValue.textContent = e.target.value;
            });
            controlSlider.max = this.numQubits - 1;
        }

        // Measure button
        const measureBtn = document.getElementById('quantum-measure-btn');
        if (measureBtn) {
            measureBtn.addEventListener('click', () => this.measure());
        }

        // Reset button
        const resetBtn = document.getElementById('quantum-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.initQubits();
                this.circuit = [];
                this.measurementResult = null;
                this.probHistory = [];
                this.renderCircuit();
                this.calculate();
            });
        }

        this.renderCircuit();
    }

    // Apply a single-qubit gate matrix [[a,b],[c,d]] to qubit index q
    applyGate(q, a, b, c, d) {
        const qubit = this.qubits[q];
        const newAlpha = this.cAdd(this.cMul(a, qubit.alpha), this.cMul(b, qubit.beta));
        const newBeta = this.cAdd(this.cMul(c, qubit.alpha), this.cMul(d, qubit.beta));
        qubit.alpha = newAlpha;
        qubit.beta = newBeta;
    }

    executeCircuit() {
        // Reset qubits and replay entire circuit
        this.initQubits();
        const inv = 1 / Math.sqrt(2);

        for (const step of this.circuit) {
            const q = step.qubit;
            switch (step.gate) {
                case 'H': // Hadamard
                    this.applyGate(q,
                        { re: inv, im: 0 }, { re: inv, im: 0 },
                        { re: inv, im: 0 }, { re: -inv, im: 0 }
                    );
                    break;
                case 'X': // Pauli-X (NOT)
                    this.applyGate(q,
                        { re: 0, im: 0 }, { re: 1, im: 0 },
                        { re: 1, im: 0 }, { re: 0, im: 0 }
                    );
                    break;
                case 'Y': // Pauli-Y
                    this.applyGate(q,
                        { re: 0, im: 0 }, { re: 0, im: -1 },
                        { re: 0, im: 1 }, { re: 0, im: 0 }
                    );
                    break;
                case 'Z': // Pauli-Z
                    this.applyGate(q,
                        { re: 1, im: 0 }, { re: 0, im: 0 },
                        { re: 0, im: 0 }, { re: -1, im: 0 }
                    );
                    break;
                case 'T': // T gate (pi/8)
                    this.applyGate(q,
                        { re: 1, im: 0 }, { re: 0, im: 0 },
                        { re: 0, im: 0 }, { re: Math.cos(Math.PI / 4), im: Math.sin(Math.PI / 4) }
                    );
                    break;
                case 'S': // S gate (phase)
                    this.applyGate(q,
                        { re: 1, im: 0 }, { re: 0, im: 0 },
                        { re: 0, im: 0 }, { re: 0, im: 1 }
                    );
                    break;
                case 'CNOT': {
                    // Simplified CNOT: if control qubit has |1> probability, flip target
                    const ctrl = this.qubits[step.control];
                    const p1 = this.cAbs2(ctrl.beta);
                    if (p1 > 0.5) {
                        // Flip target qubit
                        this.applyGate(q,
                            { re: 0, im: 0 }, { re: 1, im: 0 },
                            { re: 1, im: 0 }, { re: 0, im: 0 }
                        );
                    }
                    // In superposition case, create entanglement approximation
                    if (p1 > 0.1 && p1 < 0.9) {
                        const tgt = this.qubits[q];
                        // Mix target state based on control probability
                        const mix = Math.sqrt(p1);
                        const newAlpha = {
                            re: tgt.alpha.re * (1 - mix) + tgt.beta.re * mix,
                            im: tgt.alpha.im * (1 - mix) + tgt.beta.im * mix
                        };
                        const newBeta = {
                            re: tgt.beta.re * (1 - mix) + tgt.alpha.re * mix,
                            im: tgt.beta.im * (1 - mix) + tgt.alpha.im * mix
                        };
                        // Normalize
                        const norm = Math.sqrt(this.cAbs2(newAlpha) + this.cAbs2(newBeta));
                        if (norm > 0) {
                            tgt.alpha = this.cScale(newAlpha, 1 / norm);
                            tgt.beta = this.cScale(newBeta, 1 / norm);
                        }
                    }
                    break;
                }
            }
        }
    }

    measure() {
        this.measurementResult = [];
        for (let i = 0; i < this.numQubits; i++) {
            const p0 = this.cAbs2(this.qubits[i].alpha);
            const outcome = Math.random() < p0 ? 0 : 1;
            this.measurementResult.push(outcome);

            // Collapse qubit state
            if (outcome === 0) {
                this.qubits[i].alpha = { re: 1, im: 0 };
                this.qubits[i].beta = { re: 0, im: 0 };
            } else {
                this.qubits[i].alpha = { re: 0, im: 0 };
                this.qubits[i].beta = { re: 1, im: 0 };
            }
        }
        this.measurementFlash = 1.0;
        this.calculate();
    }

    renderCircuit() {
        const container = document.getElementById('quantum-circuit-display');
        if (!container) return;

        let html = '';
        for (let q = 0; q < this.numQubits; q++) {
            html += `<div class="quantum-wire"><span class="wire-label">q${q}</span><span class="wire-line">`;
            for (const step of this.circuit) {
                if (step.qubit === q) {
                    html += `<span class="gate-chip gate-${step.gate}">${step.gate}</span>`;
                } else if (step.gate === 'CNOT' && step.control === q) {
                    html += `<span class="gate-chip gate-ctrl">●</span>`;
                } else {
                    html += `<span class="gate-chip gate-wire">─</span>`;
                }
            }
            if (this.circuit.length === 0) {
                html += `<span class="gate-chip gate-wire">─────</span>`;
            }
            html += `</span></div>`;
        }
        container.innerHTML = html;
    }

    calculate() {
        // Update readings
        for (let i = 0; i < this.numQubits; i++) {
            const p0 = this.cAbs2(this.qubits[i].alpha);
            const p1 = this.cAbs2(this.qubits[i].beta);

            const p0El = document.getElementById(`quantum-p0-q${i}`);
            const p1El = document.getElementById(`quantum-p1-q${i}`);
            if (p0El) p0El.textContent = (p0 * 100).toFixed(1) + '%';
            if (p1El) p1El.textContent = (p1 * 100).toFixed(1) + '%';
        }

        // Update state vector display
        const stateEl = document.getElementById('quantum-state-reading');
        if (stateEl) {
            let stateStr = '';
            for (let i = 0; i < this.numQubits; i++) {
                const a = this.qubits[i].alpha;
                const b = this.qubits[i].beta;
                stateStr += `q${i}: ${this.complexToStr(a)}|0⟩ + ${this.complexToStr(b)}|1⟩  `;
            }
            stateEl.textContent = stateStr.trim();
        }

        // Update measurement result
        const measEl = document.getElementById('quantum-measurement-reading');
        if (measEl) {
            if (this.measurementResult) {
                measEl.textContent = '|' + this.measurementResult.join('') + '⟩';
            } else {
                measEl.textContent = 'Not measured';
            }
        }

        // Circuit depth display
        const depthEl = document.getElementById('quantum-depth-reading');
        if (depthEl) depthEl.textContent = this.circuit.length;

        // Track probability history
        if (this.qubits.length > 0) {
            const p0 = this.cAbs2(this.qubits[0].alpha);
            this.probHistory.push(p0);
            if (this.probHistory.length > this.maxHistory) this.probHistory.shift();
        }

        // Update qubit slider ranges
        const targetSlider = document.getElementById('quantum-target-slider');
        const controlSlider = document.getElementById('quantum-control-slider');
        if (targetSlider) targetSlider.max = this.numQubits - 1;
        if (controlSlider) controlSlider.max = this.numQubits - 1;

        this.draw();
    }

    complexToStr(c) {
        const re = c.re.toFixed(2);
        const im = c.im.toFixed(2);
        if (Math.abs(c.im) < 0.005) return re;
        if (Math.abs(c.re) < 0.005) return im + 'i';
        return `(${re}${c.im >= 0 ? '+' : ''}${im}i)`;
    }

    draw() {
        if (!this.ctx) return;
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);

        // Dark background with grid
        this.ctx.fillStyle = '#0a0a14';
        this.ctx.fillRect(0, 0, w, h);

        // Grid lines
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
            this.ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
            this.ctx.stroke();
        }

        // Draw Bloch sphere for qubit 0 on the left
        this.drawBlochSphere(w * 0.25, h * 0.5, Math.min(w * 0.2, h * 0.35), 0);

        // Draw probability bars for all qubits on the right
        this.drawProbabilityBars(w * 0.6, h * 0.1, w * 0.35, h * 0.8);

        // Measurement flash effect
        if (this.measurementFlash > 0) {
            this.ctx.fillStyle = `rgba(0, 212, 255, ${this.measurementFlash * 0.3})`;
            this.ctx.fillRect(0, 0, w, h);
        }
    }

    drawBlochSphere(cx, cy, r, qubitIdx) {
        const ctx = this.ctx;
        const qubit = this.qubits[qubitIdx];
        if (!qubit) return;

        // Calculate Bloch sphere coordinates from qubit state
        const p0 = this.cAbs2(qubit.alpha);
        const p1 = this.cAbs2(qubit.beta);
        const theta = 2 * Math.acos(Math.min(1, Math.sqrt(p0)));
        const phi = Math.atan2(qubit.beta.im, qubit.beta.re) - Math.atan2(qubit.alpha.im, qubit.alpha.re);

        // Bloch sphere x, y, z
        const bx = Math.sin(theta) * Math.cos(phi);
        const by = Math.sin(theta) * Math.sin(phi);
        const bz = Math.cos(theta);

        // 3D perspective projection
        const viewTheta = this.blochTheta + this.time * 0.15;
        const viewPhi = this.blochPhi;
        const cosT = Math.cos(viewTheta), sinT = Math.sin(viewTheta);
        const cosP = Math.cos(viewPhi), sinP = Math.sin(viewPhi);

        const project = (x, y, z) => {
            const xr = x * cosT - y * sinT;
            const yr = (x * sinT + y * cosT) * sinP + z * cosP;
            const zr = -(x * sinT + y * cosT) * cosP + z * sinP;
            const scale = 1 / (1 + zr * 0.3);
            return { x: cx + xr * r * scale, y: cy - yr * r * scale, behind: zr < 0 };
        };

        // Draw sphere outline
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Sphere fill
        const sphereGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
        sphereGrad.addColorStop(0, 'rgba(0, 212, 255, 0.08)');
        sphereGrad.addColorStop(1, 'rgba(0, 212, 255, 0.02)');
        ctx.fillStyle = sphereGrad;
        ctx.fill();

        // Draw equator circle
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.1) {
            const p = project(Math.cos(a), Math.sin(a), 0);
            if (a === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw meridian circles
        for (let m = 0; m < 3; m++) {
            const mAngle = m * Math.PI / 3;
            ctx.beginPath();
            for (let a = 0; a <= Math.PI * 2; a += 0.1) {
                const x = Math.cos(a) * Math.cos(mAngle);
                const y = Math.cos(a) * Math.sin(mAngle);
                const z = Math.sin(a);
                const p = project(x, y, z);
                if (a === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw axes
        const axes = [
            { dir: [1, 0, 0], label: 'X', color: '#ff6b6b' },
            { dir: [0, 1, 0], label: 'Y', color: '#51cf66' },
            { dir: [0, 0, 1], label: '|0⟩', color: '#00d4ff' },
            { dir: [0, 0, -1], label: '|1⟩', color: '#ff9f43' }
        ];
        for (const axis of axes) {
            const p = project(axis.dir[0], axis.dir[1], axis.dir[2]);
            const o = project(0, 0, 0);
            ctx.beginPath();
            ctx.moveTo(o.x, o.y);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = axis.color + '60';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = axis.color;
            ctx.font = 'bold 12px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(axis.label, p.x + (p.x - o.x) * 0.15, p.y + (p.y - o.y) * 0.15);
        }

        // Draw state vector on Bloch sphere
        const stateP = project(bx, by, bz);
        const origin = project(0, 0, 0);

        // State vector line
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(stateP.x, stateP.y);
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // State vector tip (glowing dot)
        ctx.beginPath();
        ctx.arc(stateP.x, stateP.y, 8, 0, Math.PI * 2);
        const dotGrad = ctx.createRadialGradient(stateP.x, stateP.y, 0, stateP.x, stateP.y, 8);
        dotGrad.addColorStop(0, '#ffffff');
        dotGrad.addColorStop(0.5, '#00d4ff');
        dotGrad.addColorStop(1, 'rgba(0, 212, 255, 0)');
        ctx.fillStyle = dotGrad;
        ctx.fill();

        // Label
        ctx.fillStyle = '#e8e8ed';
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Qubit 0 - Bloch Sphere`, cx, cy + r + 20);

        // State info below
        ctx.fillStyle = '#9898a8';
        ctx.font = '11px "Fira Code", monospace';
        ctx.fillText(`θ=${(theta * 180 / Math.PI).toFixed(0)}° φ=${(phi * 180 / Math.PI).toFixed(0)}°`, cx, cy + r + 38);
    }

    drawProbabilityBars(x, y, w, h) {
        const ctx = this.ctx;
        const barWidth = Math.min(60, w / (this.numQubits * 2 + 1));
        const gap = barWidth * 0.5;
        const totalWidth = this.numQubits * (barWidth * 2 + gap) - gap;
        const startX = x + (w - totalWidth) / 2;

        // Title
        ctx.fillStyle = '#e8e8ed';
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Qubit Probabilities', x + w / 2, y);

        const barAreaTop = y + 25;
        const barAreaH = h - 60;

        for (let i = 0; i < this.numQubits; i++) {
            const qubit = this.qubits[i];
            if (!qubit) continue;
            const p0 = this.cAbs2(qubit.alpha);
            const p1 = this.cAbs2(qubit.beta);

            const bx0 = startX + i * (barWidth * 2 + gap);
            const bx1 = bx0 + barWidth;

            // |0> bar
            const h0 = p0 * barAreaH;
            const grad0 = ctx.createLinearGradient(bx0, barAreaTop + barAreaH - h0, bx0, barAreaTop + barAreaH);
            grad0.addColorStop(0, '#00d4ff');
            grad0.addColorStop(1, '#0066cc');
            ctx.fillStyle = grad0;
            ctx.fillRect(bx0, barAreaTop + barAreaH - h0, barWidth - 2, h0);

            // |0> glow
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 10;
            ctx.fillRect(bx0, barAreaTop + barAreaH - h0, barWidth - 2, 2);
            ctx.shadowBlur = 0;

            // |1> bar
            const h1 = p1 * barAreaH;
            const grad1 = ctx.createLinearGradient(bx1, barAreaTop + barAreaH - h1, bx1, barAreaTop + barAreaH);
            grad1.addColorStop(0, '#8b5cf6');
            grad1.addColorStop(1, '#5b21b6');
            ctx.fillStyle = grad1;
            ctx.fillRect(bx1, barAreaTop + barAreaH - h1, barWidth - 2, h1);

            // |1> glow
            ctx.shadowColor = '#8b5cf6';
            ctx.shadowBlur = 10;
            ctx.fillRect(bx1, barAreaTop + barAreaH - h1, barWidth - 2, 2);
            ctx.shadowBlur = 0;

            // Labels
            ctx.fillStyle = '#00d4ff';
            ctx.font = '11px "Fira Code", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('|0⟩', bx0 + barWidth / 2, barAreaTop + barAreaH + 15);
            ctx.fillText((p0 * 100).toFixed(0) + '%', bx0 + barWidth / 2, barAreaTop + barAreaH - h0 - 5);

            ctx.fillStyle = '#8b5cf6';
            ctx.fillText('|1⟩', bx1 + barWidth / 2, barAreaTop + barAreaH + 15);
            ctx.fillText((p1 * 100).toFixed(0) + '%', bx1 + barWidth / 2, barAreaTop + barAreaH - h1 - 5);

            // Qubit label
            ctx.fillStyle = '#e8e8ed';
            ctx.font = 'bold 12px Outfit, sans-serif';
            ctx.fillText(`q${i}`, bx0 + barWidth - 1, barAreaTop + barAreaH + 32);
        }
    }

    drawViz() {
        if (!this.vizCtx) return;
        const ctx = this.vizCtx;
        const w = this.vizCanvas.width;
        const h = this.vizCanvas.height;
        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, w, h);

        // Draw probability evolution over time
        ctx.fillStyle = '#e8e8ed';
        ctx.font = 'bold 13px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Qubit 0: |0⟩ Probability Over Time', w / 2, 20);

        if (this.probHistory.length < 2) return;

        const padL = 50, padR = 20, padT = 35, padB = 30;
        const plotW = w - padL - padR;
        const plotH = h - padT - padB;

        // Draw axes
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, padT);
        ctx.lineTo(padL, padT + plotH);
        ctx.lineTo(padL + plotW, padT + plotH);
        ctx.stroke();

        // Y axis labels
        ctx.fillStyle = '#9898a8';
        ctx.font = '10px "Fira Code", monospace';
        ctx.textAlign = 'right';
        for (let v = 0; v <= 1; v += 0.25) {
            const yy = padT + plotH - v * plotH;
            ctx.fillText((v * 100).toFixed(0) + '%', padL - 5, yy + 4);
            ctx.beginPath();
            ctx.moveTo(padL, yy);
            ctx.lineTo(padL + plotW, yy);
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.07)';
            ctx.stroke();
        }

        // Draw history line
        ctx.beginPath();
        for (let i = 0; i < this.probHistory.length; i++) {
            const px = padL + (i / (this.maxHistory - 1)) * plotW;
            const py = padT + plotH - this.probHistory[i] * plotH;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Glow fill
        const lastIdx = this.probHistory.length - 1;
        const lastPx = padL + (lastIdx / (this.maxHistory - 1)) * plotW;
        ctx.lineTo(lastPx, padT + plotH);
        ctx.lineTo(padL, padT + plotH);
        ctx.closePath();
        const fillGrad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
        fillGrad.addColorStop(0, 'rgba(0, 212, 255, 0.2)');
        fillGrad.addColorStop(1, 'rgba(0, 212, 255, 0.02)');
        ctx.fillStyle = fillGrad;
        ctx.fill();
    }

    start() {
        if (this.animationId) return;
        this.animate();
    }

    animate() {
        this.time += 0.02;

        // Decay measurement flash
        if (this.measurementFlash > 0) {
            this.measurementFlash -= 0.02;
        }

        this.draw();
        this.drawViz();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resize() {
        if (this.canvas) {
            const parent = this.canvas.parentElement;
            if (parent) {
                this.canvas.width = parent.clientWidth || 800;
                this.canvas.height = 450;
            }
        }
        if (this.vizCanvas) {
            const parent = this.vizCanvas.parentElement;
            if (parent) {
                this.vizCanvas.width = parent.clientWidth || 780;
                this.vizCanvas.height = 250;
            }
        }
        this.draw();
        this.drawViz();
    }
}
