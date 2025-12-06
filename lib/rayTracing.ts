/**
 * Black Hole Ray Tracing Engine
 * Implements gravitational lensing using Schwarzschild metric
 * Ported from C++ implementation
 */

import { Camera } from './camera';

// Constants
const G = 1.0; // Gravitational constant (normalized)
const c = 1.0; // Speed of light (normalized)
const SagA_rs = 10.0; // Schwarzschild radius (normalized)

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface SphericalCoords {
  r: number;
  theta: number;
  phi: number;
  dr: number;
  dtheta: number;
  dphi: number;
}

interface Ray extends SphericalCoords {
  x: number;
  y: number;
  z: number;
  E: number;
  L: number;
}

/**
 * Convert Cartesian to spherical coordinates
 */
function toSpherical(pos: Vector3): { r: number; theta: number; phi: number } {
  const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  const theta = Math.acos(pos.z / Math.max(r, 0.001));
  const phi = Math.atan2(pos.y, pos.x);
  return { r, theta, phi };
}

/**
 * Convert spherical to Cartesian coordinates
 */
function toCartesian(r: number, theta: number, phi: number): Vector3 {
  return {
    x: r * Math.sin(theta) * Math.cos(phi),
    y: r * Math.sin(theta) * Math.sin(phi),
    z: r * Math.cos(theta),
  };
}

/**
 * Initialize ray with position and direction
 */
function initRay(pos: Vector3, dir: Vector3): Ray {
  const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  const theta = Math.acos(pos.z / Math.max(r, 0.001));
  const phi = Math.atan2(pos.y, pos.x);

  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);

  const dx = dir.x,
    dy = dir.y,
    dz = dir.z;

  const dr =
    sinTheta * cosPhi * dx + sinTheta * sinPhi * dy + cosTheta * dz;
  const dtheta =
    (cosTheta * cosPhi * dx + cosTheta * sinPhi * dy - sinTheta * dz) / r;
  const dphi = (-sinPhi * dx + cosPhi * dy) / (r * sinTheta);

  // Angular momentum (conserved)
  const L = r * r * sinTheta * dphi;

  // Schwarzschild metric
  const f = 1.0 - SagA_rs / r;
  const dt_dL = Math.sqrt(
    (dr * dr) / f + r * r * (dtheta * dtheta + sinTheta * sinTheta * dphi * dphi)
  );
  const E = f * dt_dL;

  return {
    x: pos.x,
    y: pos.y,
    z: pos.z,
    r,
    theta,
    phi,
    dr,
    dtheta,
    dphi,
    E,
    L,
  };
}

/**
 * RK4 step for geodesic equations
 */
function geodesicRHS(
  ray: Ray
): { d1: [number, number, number]; d2: [number, number, number] } {
  const r = ray.r;
  const theta = ray.theta;
  const dr = ray.dr;
  const dtheta = ray.dtheta;
  const dphi = ray.dphi;

  const f = 1.0 - SagA_rs / r;
  const dt_dL = ray.E / f;

  const d1: [number, number, number] = [dr, dtheta, dphi];

  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);

  const d2x =
    -(SagA_rs / (2.0 * r * r)) * f * dt_dL * dt_dL +
    (SagA_rs / (2.0 * r * r * f)) * dr * dr +
    r * (dtheta * dtheta + sinTheta * sinTheta * dphi * dphi);

  const d2y =
    (-2.0 * dr * dtheta) / r + sinTheta * cosTheta * dphi * dphi;

  const d2z =
    (-2.0 * dr * dphi) / r -
    (2.0 * cosTheta) / sinTheta * dtheta * dphi;

  const d2: [number, number, number] = [d2x, d2y, d2z];

  return { d1, d2 };
}

/**
 * RK4 integration step
 */
function rk4Step(ray: Ray, dL: number): void {
  const k1 = geodesicRHS(ray);

  // k2
  const ray2: Ray = { ...ray };
  ray2.r += (dL / 2.0) * k1.d1[0];
  ray2.theta += (dL / 2.0) * k1.d1[1];
  ray2.phi += (dL / 2.0) * k1.d1[2];
  ray2.dr += (dL / 2.0) * k1.d2[0];
  ray2.dtheta += (dL / 2.0) * k1.d2[1];
  ray2.dphi += (dL / 2.0) * k1.d2[2];
  const k2 = geodesicRHS(ray2);

  // k3
  const ray3: Ray = { ...ray };
  ray3.r += (dL / 2.0) * k2.d1[0];
  ray3.theta += (dL / 2.0) * k2.d1[1];
  ray3.phi += (dL / 2.0) * k2.d1[2];
  ray3.dr += (dL / 2.0) * k2.d2[0];
  ray3.dtheta += (dL / 2.0) * k2.d2[1];
  ray3.dphi += (dL / 2.0) * k2.d2[2];
  const k3 = geodesicRHS(ray3);

  // k4
  const ray4: Ray = { ...ray };
  ray4.r += dL * k3.d1[0];
  ray4.theta += dL * k3.d1[1];
  ray4.phi += dL * k3.d1[2];
  ray4.dr += dL * k3.d2[0];
  ray4.dtheta += dL * k3.d2[1];
  ray4.dphi += dL * k3.d2[2];
  const k4 = geodesicRHS(ray4);

  // Update ray
  ray.r += (dL / 6.0) * (k1.d1[0] + 2.0 * k2.d1[0] + 2.0 * k3.d1[0] + k4.d1[0]);
  ray.theta +=
    (dL / 6.0) *
    (k1.d1[1] + 2.0 * k2.d1[1] + 2.0 * k3.d1[1] + k4.d1[1]);
  ray.phi +=
    (dL / 6.0) *
    (k1.d1[2] + 2.0 * k2.d1[2] + 2.0 * k3.d1[2] + k4.d1[2]);

  ray.dr +=
    (dL / 6.0) *
    (k1.d2[0] + 2.0 * k2.d2[0] + 2.0 * k3.d2[0] + k4.d2[0]);
  ray.dtheta +=
    (dL / 6.0) *
    (k1.d2[1] + 2.0 * k2.d2[1] + 2.0 * k3.d2[1] + k4.d2[1]);
  ray.dphi +=
    (dL / 6.0) *
    (k1.d2[2] + 2.0 * k2.d2[2] + 2.0 * k3.d2[2] + k4.d2[2]);

  // Update Cartesian coords
  const cart = toCartesian(ray.r, ray.theta, ray.phi);
  ray.x = cart.x;
  ray.y = cart.y;
  ray.z = cart.z;
}

/**
 * Trace a single ray
 */
function traceRay(
  screenX: number,
  screenY: number,
  width: number,
  height: number,
  camera: Camera
): [number, number, number] {
  // Normalize screen coordinates to [-1, 1]
  const u = (screenX / width) * 2.0 - 1.0;
  const v = (screenY / height) * 2.0 - 1.0;

  // Get camera basis vectors
  const camPos = camera.getPosition();
  const forward = camera.getForward();
  const right = camera.getRight();
  const up = camera.getUp();
  const fov = camera.fov;

  // Generate ray direction
  const tanHalfFov = Math.tan((fov * Math.PI) / 180.0 / 2.0);
  const aspect = width / height;

  const rayDir = {
    x:
      forward.x +
      u * tanHalfFov * aspect * right.x +
      v * tanHalfFov * up.x,
    y:
      forward.y +
      u * tanHalfFov * aspect * right.y +
      v * tanHalfFov * up.y,
    z:
      forward.z +
      u * tanHalfFov * aspect * right.z +
      v * tanHalfFov * up.z,
  };

  // Normalize
  const len = Math.sqrt(
    rayDir.x * rayDir.x + rayDir.y * rayDir.y + rayDir.z * rayDir.z
  );
  rayDir.x /= len;
  rayDir.y /= len;
  rayDir.z /= len;

  let ray = initRay(camPos, rayDir);

  const dL = 1e7; // Integration step
  const maxSteps = 500;
  const escapeRadius = 1e30;

  // Integrate geodesic
  for (let step = 0; step < maxSteps; step++) {
    // Check if ray escaped
    if (ray.r > escapeRadius) {
      return [1.0, 1.0, 1.0]; // Star color (white)
    }

    // Check if ray hit event horizon
    if (ray.r < SagA_rs * 1.5) {
      return [0.0, 0.0, 0.0]; // Black
    }

    rk4Step(ray, dL);
  }

  return [0.5, 0.5, 0.5]; // Gray (default)
}

/**
 * Generate starfield with lensing
 */
function generateStarfield(width: number, height: number): ImageData {
  const imageData = new ImageData(width, height);
  const data = imageData.data;

  // Generate random stars
  const starCount = 500;
  const stars: Array<{ x: number; y: number; brightness: number }> = [];

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      brightness: Math.random() * 0.8 + 0.2,
    });
  }

  // Draw stars with Gaussian blur for anti-aliasing
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;

      for (const star of stars) {
        const dx = x - star.x;
        const dy = y - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const brightness =
          star.brightness * Math.exp(-(dist * dist) / 8.0);

        r += brightness;
        g += brightness;
        b += brightness;
      }

      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, Math.floor(r * 255));
      data[idx + 1] = Math.min(255, Math.floor(g * 255));
      data[idx + 2] = Math.min(255, Math.floor(b * 255));
      data[idx + 3] = 255;
    }
  }

  return imageData;
}

/**
 * Main ray tracing function
 */
export function rayTraceBlackHole(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mass: number,
  frameCount: number,
  camera: Camera
): void {
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Generate starfield background
  const starfield = generateStarfield(width, height);
  const starData = starfield.data;

  // Ray trace each pixel (sample every 2 pixels for performance)
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const [r, g, b] = traceRay(x, y, width, height, camera);

      const traceR = r * 255;
      const traceG = g * 255;
      const traceB = b * 255;

      // Fill 2x2 block
      for (let dy = 0; dy < 2 && y + dy < height; dy++) {
        for (let dx = 0; dx < 2 && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          const starIdx = ((y + dy) * width + (x + dx)) * 4;

          const starR = starData[starIdx];
          const starG = starData[starIdx + 1];
          const starB = starData[starIdx + 2];

          // If ray hit black hole, show black
          if (r === 0 && g === 0 && b === 0) {
            data[idx] = 0;
            data[idx + 1] = 0;
            data[idx + 2] = 0;
          } else {
            // Otherwise blend with starfield
            data[idx] = Math.max(traceR, starR);
            data[idx + 1] = Math.max(traceG, starG);
            data[idx + 2] = Math.max(traceB, starB);
          }

          data[idx + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
