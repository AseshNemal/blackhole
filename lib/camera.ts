import * as THREE from 'three';

/**
 * Camera controller for black hole visualization
 */
export class Camera {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number = 75;

  // Spherical coordinates for orbiting
  radius: number = 100;
  azimuth: number = 0;
  elevation: number = Math.PI / 2.0;

  // Constraints
  minRadius: number = 30;
  maxRadius: number = 500;

  // Interaction
  isOrbiting: boolean = false;
  lastX: number = 0;
  lastY: number = 0;

  // Speeds
  orbitSpeed: number = 0.01;
  zoomSpeed: number = 1.08;

  private forward: THREE.Vector3;
  private right: THREE.Vector3;
  private up: THREE.Vector3;

  constructor(position: THREE.Vector3, target: THREE.Vector3) {
    this.position = position.clone();
    this.target = target.clone();
    this.forward = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0);
    this.updateVectors();
  }

  /**
   * Update camera basis vectors
   */
  private updateVectors(): void {
    // Calculate forward vector
    this.forward
      .copy(this.target)
      .sub(this.position)
      .normalize();

    // Calculate right vector (perpendicular to forward and up)
    this.right.crossVectors(this.forward, this.up).normalize();

    // Recalculate up to ensure orthogonality
    this.up.crossVectors(this.right, this.forward).normalize();
  }

  /**
   * Update position based on spherical coordinates
   */
  private updatePosition(): void {
    const sinElev = Math.sin(this.elevation);
    const cosElev = Math.cos(this.elevation);
    const sinAzim = Math.sin(this.azimuth);
    const cosAzim = Math.cos(this.azimuth);

    this.position.x = this.target.x + this.radius * sinElev * cosAzim;
    this.position.y = this.target.y + this.radius * cosElev;
    this.position.z = this.target.z + this.radius * sinElev * sinAzim;

    this.updateVectors();
  }

  /**
   * Handle mouse down event
   */
  onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      // Left mouse button
      this.isOrbiting = true;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    }
  }

  /**
   * Handle mouse move event
   */
  onMouseMove(event: MouseEvent): void {
    if (!this.isOrbiting) return;

    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;

    this.azimuth -= dx * this.orbitSpeed * 0.01;
    this.elevation -= dy * this.orbitSpeed * 0.01;

    // Clamp elevation to avoid gimbal lock
    this.elevation = Math.max(0.01, Math.min(Math.PI - 0.01, this.elevation));

    this.updatePosition();

    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  /**
   * Handle mouse up event
   */
  onMouseUp(): void {
    this.isOrbiting = false;
  }

  /**
   * Handle scroll event for zooming
   */
  onScroll(delta: number): void {
    if (delta > 0) {
      this.radius *= this.zoomSpeed;
    } else {
      this.radius /= this.zoomSpeed;
    }

    this.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.radius));
    this.updatePosition();
  }

  /**
   * Get camera position
   */
  getPosition(): { x: number; y: number; z: number } {
    return {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
    };
  }

  /**
   * Get forward vector
   */
  getForward(): { x: number; y: number; z: number } {
    return {
      x: this.forward.x,
      y: this.forward.y,
      z: this.forward.z,
    };
  }

  /**
   * Get right vector
   */
  getRight(): { x: number; y: number; z: number } {
    return {
      x: this.right.x,
      y: this.right.y,
      z: this.right.z,
    };
  }

  /**
   * Get up vector
   */
  getUp(): { x: number; y: number; z: number } {
    return {
      x: this.up.x,
      y: this.up.y,
      z: this.up.z,
    };
  }
}
