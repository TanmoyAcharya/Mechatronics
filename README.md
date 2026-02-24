# ElectroMachines Lab 🧪⚡

An interactive electrical machines simulation platform for learning and understanding electrical machines through real-time simulations, animations, and deep physics explanations.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Active-green.svg)

## 🌟 Features

### Machine Simulators
- **Synchronous Machine** - Motor/Generator with field excitation control
  - Real-time phasor diagrams
  - Three-phase voltage waveforms
  - Power factor control (leading/lagging/unity)
  - Deep physics equations and equivalent circuits
  
- **Induction Machine** - Asynchronous motor/generator
  - Torque-speed characteristic curves
  - Slip analysis
  - Squirrel cage & wound rotor simulation
  
- **DC Motor** - Shunt, Series, Compound motors
  - Armature & field control
  - Speed-torque characteristics
  - Back EMF visualization
  
- **Transformer** - Power transformer simulation
  - Primary/secondary voltage visualization
  - Flux animation
  - Efficiency calculations
  
- **Construction Viewer** - Machine anatomy
  - Interactive 3D-style component explorer
  - Cross-section views
  - Assembly/disassembly animations

### Key Features
- 🎯 Interactive parameter controls
- 📊 Real-time visualizations
- 📚 PhD-level physics explanations
- 🎨 Beautiful dark theme UI
- 📱 Responsive design

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Node.js (optional, for local development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/TanmoyAcharya/Mechatronics.git
cd Mechatronics
```

2. Open in browser:
- Simply open `index.html` in your browser
- Or use a local server:
```bash
npx serve
```

3. Visit `http://localhost:3000`

## 📖 How to Use

1. **Home Page** - Choose a machine to learn about
2. **Select Machine** - Click on Synchronous, Induction, DC Motor, or Transformer
3. **Adjust Parameters** - Use sliders to change voltage, current, torque, etc.
4. **Observe Results** - Watch real-time animations and waveforms
5. **Read Theory** - Expand theory panels for deep physics explanations

## 🏗️ Project Structure

```
Mechatronics/
├── index.html          # Main HTML file
├── styles.css         # CSS styles
├── js/
│   ├── app.js        # Main application logic
│   ├── synchronous.js # Synchronous machine simulator
│   ├── induction.js  # Induction machine simulator
│   ├── dc-motor.js   # DC motor simulator
│   ├── transformer.js # Transformer simulator
│   ├── construction.js # Construction viewer
│   └── visualizations.js # Chart utilities
└── package.json       # Project dependencies
```

## 🔬 Physics Topics Covered

### Synchronous Machines
- Rotating magnetic fields
- Phasor diagrams
- Power-angle characteristics
- Synchronous reactance
- Voltage regulation

### Induction Machines
- Slip and asynchronous operation
- Torque-speed curves
- Equivalent circuits
- Starting methods

### DC Machines
- Armature reaction
- Field control
- Speed regulation
- Back EMF

### Transformers
- Turn ratio
- Equivalent circuits
- Magnetic flux
- Efficiency

## 🎨 Technology Stack

- **HTML5 Canvas** - For animations and visualizations
- **Vanilla JavaScript** - No frameworks required
- **CSS3** - Modern styling with CSS variables
- **No build tools needed** - Works directly in browser

## 🚢 Deployment

### Vercel (Recommended)
1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

### GitHub Pages
1. Go to Settings → Pages
2. Select "main" branch
3. Your site will be live at `username.github.io/Mechatronics`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is MIT licensed.

## 🙏 Acknowledgments

- Electrical machines theory references
- Open source educational resources

---

Made with ❤️ for electrical engineering education
