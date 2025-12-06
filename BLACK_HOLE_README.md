# Black Hole Visualization - Next.js + Three.js

A real-time black hole simulation with gravitational lensing, ported from C++ to Next.js and Three.js.

## 🌌 Features

- **Schwarzschild Metric Geodesic Solver** - Accurately simulates light paths in curved spacetime
- **RK4 Integration** - 4th order Runge-Kutta method for precise geodesic calculations
- **Gravitational Lensing** - Real-time ray tracing shows how light bends around black holes
- **Event Horizon Visualization** - See the point of no return
- **Accretion Disk** - Rotating disk of matter around the black hole
- **Interactive Camera** - Orbit and zoom to explore from different angles
- **FPS Counter** - Monitor performance

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎮 Controls

- **Left Mouse + Drag**: Orbit camera around black hole
- **Scroll Wheel**: Zoom in/out

## 🔬 Physics Implementation

### Schwarzschild Metric

The simulation uses the Schwarzschild metric for a non-rotating black hole:

```
ds² = -(1 - rs/r)dt² + (1 - rs/r)⁻¹dr² + r²(dθ² + sin²θ dφ²)
```

Where:
- `rs` = Schwarzschild radius (event horizon)
- `r` = radial coordinate
- `θ, φ` = angular coordinates

### Geodesic Equations

Light rays follow null geodesics, integrated using RK4:

```typescript
// Conserved quantities
E = (1 - rs/r) * dt/dλ           // Energy
L = r² sin²θ dφ/dλ               // Angular momentum

// Geodesic equations
d²r/dλ² = -(rs/2r²)(1-rs/r)(dt/dλ)² + (rs/2r²)/(1-rs/r)(dr/dλ)² 
          + r(dθ/dλ)² + r sin²θ(dφ/dλ)²
```

## 📂 Project Structure

```
/app
  page.tsx          - Main page
  layout.tsx        - Root layout
  globals.css       - Global styles

/components
  BlackHoleSimulation.tsx  - Main simulation component

/lib
  rayTracing.ts     - Geodesic solver & ray tracing engine
  camera.ts         - Interactive camera controller

/black_hole-main    - Original C++ implementation (reference)
```

## 🧮 Algorithm Overview

1. **Ray Generation**: For each pixel, generate a ray from camera through screen space
2. **Geodesic Integration**: Use RK4 to integrate photon path in curved spacetime
3. **Termination Conditions**:
   - Ray escapes to infinity → sample starfield
   - Ray crosses event horizon → render black
   - Max iterations reached → render gray
4. **Rendering**: Composite ray-traced image with accretion disk

## 🎯 Performance

- **Ray Tracing**: CPU-based (800x600 resolution)
- **Rendering**: WebGL via Three.js
- **Target FPS**: 30-60 fps on modern hardware

### Optimization Opportunities

- Implement compute shaders (WebGPU) for GPU acceleration
- Use lower resolution for ray tracing, upscale with Three.js
- Cache geodesic calculations for static camera views
- Adaptive sampling based on frame time

## 📚 References

- [Original C++ Implementation](./black_hole-main/)
- [Schwarzschild Metric](https://en.wikipedia.org/wiki/Schwarzschild_metric)
- [Geodesic Equations](https://en.wikipedia.org/wiki/Geodesics_in_general_relativity)
- [Black Hole Ray Tracing](https://rantonels.github.io/starless/)

## 🛠️ Tech Stack

- **Next.js 16** - React framework
- **React 19** - UI library
- **Three.js** - 3D rendering
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## 📝 License

Based on the original C++ implementation by [kavan010](https://github.com/kavan010/black_hole)

## 🎥 Video Explanation

Original C++ project video: [https://www.youtube.com/watch?v=8-B6ryuBkCM](https://www.youtube.com/watch?v=8-B6ryuBkCM)
