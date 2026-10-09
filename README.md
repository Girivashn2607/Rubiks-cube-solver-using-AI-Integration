# 🧊 Rubik's Cube AI Solver & 3D Interactive Studio

An advanced, interactive 3D Rubik's Cube simulator and solver powered by React 19, Three.js, React Three Fiber, and Herbert Kociemba's Two-Phase Algorithm. Features computer-vision webcam cube scanning, custom 2D net painting, animated move execution, and step-by-step beginner explanations.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (bundled with Node.js)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
> **Windows PowerShell Note:** If script execution policy blocks `npm`, run `npm.cmd run dev` or launch in CMD / Git Bash.

### 3. Open in Browser
Open:
```
http://localhost:5173
```
*(If port 5173 is occupied, Vite will assign next available port displayed in terminal output).*

---

## 🛠️ Scripts Reference

| Command | Action |
|---|---|
| `npm run dev` | Launch Vite hot-reloading development server |
| `npm run build` | Type-check TypeScript (`tsc -b`) & build production bundle (`dist/`) |
| `npm run preview` | Locally preview production build |
| `npm run lint` | Run Oxlint fast linter |
| `node build-kociemba.js` | Rebuild standalone ES module wrapper for Kociemba solver (`src/solver/kociembaLib.js`) |

---

## ✨ Key Features

- **🎮 3D WebGL Cube Simulation**
  - Smooth 3D orbiting, panning, and zooming powered by Three.js & `@react-three/fiber`.
  - Slice and face turn animations with realistic physics easing.
  - Manual face rotation buttons for standard notation: `U`, `D`, `L`, `R`, `F`, `B` and inverse primes (`U'`, `D'`, etc.).

- **🧠 Dual Solving Engines**
  - **Two-Phase Kociemba Algorithm**: Optimal solutions in ≤ 22 moves using pre-computed pruning tables.
  - **AI / Layer-by-Layer Explanations**: Human-friendly step breakdown detailing Cross, F2L, OLL, and PLL mechanics.

- **📷 Webcam Cube Scanner**
  - Real-time video detection grid to scan physical cube faces via camera.
  - Automatic color extraction mapping to cubelet state.

- **🎨 2D Facelet Net Editor**
  - Unfolded cube net view (`Up`, `Left`, `Front`, `Right`, `Back`, `Down`).
  - Paint custom sticker colors to reproduce any physical scramble.
  - Parity and sticker count validation (checks 9 stickers per color, valid geometry).

- **⏯️ Playback Controls**
  - Step forward, step backward, auto-play, pause, and speed multiplier (0.5x to 2x).
  - Move timeline with real-time algorithm progress.
  - Scramble generator using standard WCA notations.
  - Confetti celebration upon solve completion.

---

## 🏗️ Project Architecture

```
ai-project/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── 3d/             # Three.js canvas, Cube mesh, Orbit controls, Face turn controls
│   │   ├── editor/         # 2D Facelet net painter modal & color picker
│   │   ├── layout/         # Header, responsive navigation, status badges
│   │   ├── scanner/        # Webcam capture & HSV color detection
│   │   └── solver/         # Step-by-step playback bar & explanation cards
│   ├── solver/
│   │   ├── cubeModel.ts    # Facelet mathematics, move permutations, scrambler, validator
│   │   ├── explanations.ts # Step-by-step human CFOP logic & explanations
│   │   ├── kociembaLib.js  # Compiled ES Two-Phase Kociemba solver engine
│   │   └── solverService.ts# Solver dispatcher, table initialization, and error handling
│   ├── types/
│   │   └── cube.ts         # TypeScript definitions for moves, faces, facelets, and solve results
│   ├── App.tsx             # Root state controller (solver, playback, 3D bridge)
│   ├── index.css           # Tailwind CSS v4 styling & theme tokens
│   └── main.tsx            # React root entry point
├── build-kociemba.js       # Node builder bundling cubejs into clean browser ES module
├── package.json            # Dependencies & scripts
└── vite.config.ts          # Vite configuration
```

---

## 🎯 Usage Walkthrough

1. **Scramble**:
   - Click **"Scramble"** button in header/controls for random WCA scramble, OR
   - Click **"Edit State"** to manually color-paint stickers matching physical cube, OR
   - Click **"Scan Camera"** to capture cube faces sequentially with webcam.
2. **Solve**:
   - Choose solving mode: **"Kociemba (Optimal)"** or **"Step-by-Step Guide"**.
   - Click **"Solve Cube"**. Solver computes sequence in milliseconds.
3. **Playback**:
   - Press **Play (▶)** to watch animated solve.
   - Adjust speed or use **Step Forward (⏭)** / **Step Backward (⏮)** to inspect each move.
   - Read move mechanics in the explanation panel.

---

## 🧰 Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 8
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Linter**: Oxlint
