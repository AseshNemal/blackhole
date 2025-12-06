'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Camera } from '@/lib/camera';
import { vertexShader, fragmentShader } from '@/lib/shaders';

export default function BlackHoleSimulation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    // Fullscreen quad camera
    const screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    containerRef.current.appendChild(renderer.domElement);

    // Camera controller
    const cameraController = new Camera(
      new THREE.Vector3(0, 0, 100),
      new THREE.Vector3(0, 0, 0)
    );

    // Shader material for GPU-accelerated black hole
    const uniforms = {
      cameraPos: { value: new THREE.Vector3(0, 0, 100) },
      cameraForward: { value: new THREE.Vector3(0, 0, -1) },
      cameraRight: { value: new THREE.Vector3(1, 0, 0) },
      cameraUp: { value: new THREE.Vector3(0, 1, 0) },
      tanHalfFov: { value: Math.tan((75 * Math.PI) / 180 / 2) },
      aspect: { value: window.innerWidth / window.innerHeight },
      time: { value: 0 }
    };

    const shaderGeometry = new THREE.PlaneGeometry(2, 2);
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader
    });
    const shaderPlane = new THREE.Mesh(shaderGeometry, shaderMaterial);
    scene.add(shaderPlane);

    let frameCount = 0;
    let frameCountForFPS = 0;
    let lastTime = Date.now();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.aspect.value = window.innerWidth / window.innerHeight;
    };

    const handleMouseDown = (e: MouseEvent) => cameraController.onMouseDown(e);
    const handleMouseMove = (e: MouseEvent) => cameraController.onMouseMove(e);
    const handleMouseUp = () => cameraController.onMouseUp();
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraController.onScroll(e.deltaY);
    };

    const animate = () => {
      requestAnimationFrame(animate);

      frameCount++;
      frameCountForFPS++;

      const currentTime = Date.now();
      if (currentTime - lastTime > 500) {
        setFps(Math.round((frameCountForFPS * 1000) / (currentTime - lastTime)));
        frameCountForFPS = 0;
        lastTime = currentTime;
      }

      const camPos = cameraController.getPosition();
      const forward = cameraController.getForward();
      const right = cameraController.getRight();
      const up = cameraController.getUp();

      uniforms.cameraPos.value.set(camPos.x, camPos.y, camPos.z);
      uniforms.cameraForward.value.set(forward.x, forward.y, forward.z);
      uniforms.cameraRight.value.set(right.x, right.y, right.z);
      uniforms.cameraUp.value.set(up.x, up.y, up.z);
      uniforms.time.value = frameCount * 0.01;

      renderer.render(scene, screenCamera);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh' }}>
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          color: '#00ff00',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 100,
        }}
      >
        <div>FPS: {fps}</div>
        <div style={{ fontSize: '12px', marginTop: '10px', color: '#00aa00' }}>
          Left Mouse: Orbit | Scroll: Zoom
        </div>
      </div>
    </div>
  );
}
