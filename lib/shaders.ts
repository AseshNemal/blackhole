/**
 * WebGL Shaders for Black Hole Ray Tracing
 * GPU-accelerated geodesic integration
 */

export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  uniform vec3 cameraPos;
  uniform vec3 cameraForward;
  uniform vec3 cameraRight;
  uniform vec3 cameraUp;
  uniform float tanHalfFov;
  uniform float aspect;
  uniform float time;
  
  varying vec2 vUv;
  
  const float SagA_rs = 10.0;
  const float D_LAMBDA = 5e6;
  const float ESCAPE_R = 500.0;
  const int MAX_STEPS = 100;
  
  const float disk_r1 = 15.0;
  const float disk_r2 = 30.0;
  const float disk_thickness = 0.5;
  
  struct Ray {
    vec3 pos;
    float r;
    float theta;
    float phi;
    float dr;
    float dtheta;
    float dphi;
    float E;
    float L;
  };
  
  Ray initRay(vec3 pos, vec3 dir) {
    Ray ray;
    ray.pos = pos;
    ray.r = length(pos);
    ray.theta = acos(pos.z / max(ray.r, 0.001));
    ray.phi = atan(pos.y, pos.x);
    
    float sinTheta = sin(ray.theta);
    float cosTheta = cos(ray.theta);
    float sinPhi = sin(ray.phi);
    float cosPhi = cos(ray.phi);
    
    ray.dr = sinTheta * cosPhi * dir.x + sinTheta * sinPhi * dir.y + cosTheta * dir.z;
    ray.dtheta = (cosTheta * cosPhi * dir.x + cosTheta * sinPhi * dir.y - sinTheta * dir.z) / ray.r;
    ray.dphi = (-sinPhi * dir.x + cosPhi * dir.y) / (ray.r * sinTheta);
    
    ray.L = ray.r * ray.r * sinTheta * ray.dphi;
    float f = 1.0 - SagA_rs / ray.r;
    float dt_dL = sqrt((ray.dr * ray.dr) / f + ray.r * ray.r * (ray.dtheta * ray.dtheta + sinTheta * sinTheta * ray.dphi * ray.dphi));
    ray.E = f * dt_dL;
    
    return ray;
  }
  
  void geodesicRHS(Ray ray, out vec3 d1, out vec3 d2) {
    float r = ray.r;
    float theta = ray.theta;
    float dr = ray.dr;
    float dtheta = ray.dtheta;
    float dphi = ray.dphi;
    
    float f = 1.0 - SagA_rs / r;
    float dt_dL = ray.E / f;
    
    d1 = vec3(dr, dtheta, dphi);
    
    float sinTheta = sin(theta);
    float cosTheta = cos(theta);
    
    d2.x = -(SagA_rs / (2.0 * r * r)) * f * dt_dL * dt_dL
           + (SagA_rs / (2.0 * r * r * f)) * dr * dr
           + r * (dtheta * dtheta + sinTheta * sinTheta * dphi * dphi);
    d2.y = -2.0 * dr * dtheta / r + sinTheta * cosTheta * dphi * dphi;
    d2.z = -2.0 * dr * dphi / r - 2.0 * cosTheta / sinTheta * dtheta * dphi;
  }
  
  void rk4Step(inout Ray ray, float dL) {
    vec3 k1a, k1b, k2a, k2b, k3a, k3b, k4a, k4b;
    
    geodesicRHS(ray, k1a, k1b);
    
    Ray ray2 = ray;
    ray2.r += (dL / 2.0) * k1a.x;
    ray2.theta += (dL / 2.0) * k1a.y;
    ray2.phi += (dL / 2.0) * k1a.z;
    ray2.dr += (dL / 2.0) * k1b.x;
    ray2.dtheta += (dL / 2.0) * k1b.y;
    ray2.dphi += (dL / 2.0) * k1b.z;
    geodesicRHS(ray2, k2a, k2b);
    
    Ray ray3 = ray;
    ray3.r += (dL / 2.0) * k2a.x;
    ray3.theta += (dL / 2.0) * k2a.y;
    ray3.phi += (dL / 2.0) * k2a.z;
    ray3.dr += (dL / 2.0) * k2b.x;
    ray3.dtheta += (dL / 2.0) * k2b.y;
    ray3.dphi += (dL / 2.0) * k2b.z;
    geodesicRHS(ray3, k3a, k3b);
    
    Ray ray4 = ray;
    ray4.r += dL * k3a.x;
    ray4.theta += dL * k3a.y;
    ray4.phi += dL * k3a.z;
    ray4.dr += dL * k3b.x;
    ray4.dtheta += dL * k3b.y;
    ray4.dphi += dL * k3b.z;
    geodesicRHS(ray4, k4a, k4b);
    
    ray.r += (dL / 6.0) * (k1a.x + 2.0 * k2a.x + 2.0 * k3a.x + k4a.x);
    ray.theta += (dL / 6.0) * (k1a.y + 2.0 * k2a.y + 2.0 * k3a.y + k4a.y);
    ray.phi += (dL / 6.0) * (k1a.z + 2.0 * k2a.z + 2.0 * k3a.z + k4a.z);
    
    ray.dr += (dL / 6.0) * (k1b.x + 2.0 * k2b.x + 2.0 * k3b.x + k4b.x);
    ray.dtheta += (dL / 6.0) * (k1b.y + 2.0 * k2b.y + 2.0 * k3b.y + k4b.y);
    ray.dphi += (dL / 6.0) * (k1b.z + 2.0 * k2b.z + 2.0 * k3b.z + k4b.z);
    
    ray.pos.x = ray.r * sin(ray.theta) * cos(ray.phi);
    ray.pos.y = ray.r * sin(ray.theta) * sin(ray.phi);
    ray.pos.z = ray.r * cos(ray.theta);
  }
  
  bool crossesEquatorialPlane(vec3 oldPos, vec3 newPos) {
    bool crossed = (oldPos.y * newPos.y < 0.0);
    float r = length(vec2(newPos.x, newPos.z));
    return crossed && (r >= disk_r1 && r <= disk_r2);
  }
  
  // Simple noise function for stars
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  vec3 starfield(vec3 dir) {
    vec2 st = vec2(atan(dir.z, dir.x), asin(dir.y));
    st *= 8.0;

    // Base gradient for visibility
    float base = 0.05 + 0.15 * (0.5 + 0.5 * dir.y);

    float brightness = base;
    for(float i = 0.0; i < 8.0; i++) {
      vec2 grid = floor(st + i * 0.7);
      float star = hash(grid);
      if(star > 0.9) {
        vec2 offset = fract(st + i * 0.7) - 0.5;
        float dist = length(offset);
        brightness += smoothstep(0.25, 0.0, dist) * (star - 0.9) * 3.0;
      }
    }

    return vec3(brightness);
  }
  
  void main() {
    // Calculate ray direction
    float u = (2.0 * vUv.x - 1.0) * aspect * tanHalfFov;
    float v = (1.0 - 2.0 * vUv.y) * tanHalfFov;
    
    vec3 dir = normalize(u * cameraRight - v * cameraUp + cameraForward);
    vec3 pos = cameraPos;
    
    vec4 color = vec4(0.0);
    float r = length(pos);
    
    // Simple ray marching
    for(int i = 0; i < MAX_STEPS; i++) {
      r = length(pos);
      
      // Hit black hole
      if(r < SagA_rs * 1.5) {
        color = vec4(0.0, 0.0, 0.0, 1.0);
        break;
      }
      
      // Check if crossing accretion disk
      if(abs(pos.y) < 0.5 && r > disk_r1 && r < disk_r2) {
        float diskR = r / disk_r2;
        vec3 diskColor = vec3(1.0, diskR * 0.5 + 0.2, 0.1);
        color = vec4(diskColor, 1.0);
        break;
      }
      
      // Escape
      if(r > ESCAPE_R) {
        vec3 stars = starfield(dir);
        color = vec4(stars, 1.0);
        break;
      }
      
      // Step forward with gravitational deflection
      float f = 1.0 - SagA_rs / r;
      vec3 accel = -normalize(pos) * (SagA_rs / (r * r));
      dir += accel * D_LAMBDA * 0.0001;
      dir = normalize(dir);
      pos += dir * D_LAMBDA;
    }
    
    // Default: show stars
    if(color.a == 0.0) {
      vec3 stars = starfield(dir);
      color = vec4(stars, 1.0);
    }
    
    gl_FragColor = color;
  }
`;
