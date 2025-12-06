'use client';

import { useEffect, useRef, useState } from 'react';

export default function BlackHoleSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let frameCount = 0;
    let lastTime = Date.now();

    const blackHoleX = canvas.width / 2;
    const blackHoleY = canvas.height / 2;
    const blackHoleRadius = 30;
    const eventHorizonRadius = 15;
    const diskRadiusOuter = 100;

    const stars: Array<{ x: number; y: number; brightness: number }> = [];
    for (let i = 0; i < 500; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        brightness: Math.random() * 0.7 + 0.3
      });
    }

    const animate = () => {
      requestAnimationFrame(animate);
      frameCount++;

      const currentTime = Date.now();
      if (currentTime - lastTime > 500) {
        setFps(Math.round(frameCount / ((currentTime - lastTime) / 1000)));
        frameCount = 0;
        lastTime = currentTime;
      }

      // Clear background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw starfield
      ctx.fillStyle = '#ffffff';
      for (const star of stars) {
        ctx.globalAlpha = star.brightness;
        ctx.fillRect(star.x, star.y, 1.5, 1.5);
      }
      ctx.globalAlpha = 1.0;

      // Draw lensing grid
      ctx.strokeStyle = '#00ff88';
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1;
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const x1 = blackHoleX + Math.cos(angle) * 80;
        const y1 = blackHoleY + Math.sin(angle) * 80;
        const x2 = blackHoleX + Math.cos(angle) * 120;
        const y2 = blackHoleY + Math.sin(angle) * 120;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // Draw accretion disk
      ctx.strokeStyle = '#ff6600';
      ctx.lineWidth = 8;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.ellipse(blackHoleX, blackHoleY, diskRadiusOuter, diskRadiusOuter * 0.3, Math.PI / 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Draw black hole with gradient
      const gradient = ctx.createRadialGradient(blackHoleX, blackHoleY, 0, blackHoleX, blackHoleY, blackHoleRadius);
      gradient.addColorStop(0, '#1a1a1a');
      gradient.addColorStop(0.7, '#000000');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(blackHoleX, blackHoleY, blackHoleRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw event horizon
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(blackHoleX, blackHoleY, eventHorizonRadius, 0, Math.PI * 2);
      ctx.stroke();
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-screen bg-black">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      <div className="absolute top-5 right-5 text-green-400 font-mono text-sm z-10">
        <div>FPS: {fps}</div>
        <div className="text-xs text-green-600 mt-2">Black Hole Visualization</div>
      </div>
    </div>
  );
}
