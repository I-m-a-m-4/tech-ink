
"use client";
import React, { useRef, useEffect } from 'react';

// Star class to manage individual star properties
class Star {
  x: number;
  y: number;
  z: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth - canvasWidth / 2;
    this.y = Math.random() * canvasHeight - canvasHeight / 2;
    this.z = Math.random() * canvasWidth;
  }

  reset(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth - canvasWidth / 2;
    this.y = Math.random() * canvasHeight - canvasHeight / 2;
    this.z = canvasWidth;
  }
}


export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars: Star[] = [];
    const numStars = 800;
    let animationFrameId: number;
    
    const setup = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.scale(dpr, dpr);
        
        stars = [];
        for (let i = 0; i < numStars; i++) {
            stars.push(new Star(canvas.width / dpr, canvas.height / dpr));
        }
    };

    const draw = () => {
        if (!ctx || !canvas) return;
        const speed = 0.5; // Adjust for faster/slower stars
        const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = canvas.height / (window.devicePixelRatio || 1);

        ctx.fillStyle = 'hsl(var(--background))';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        
        for (let star of stars) {
            star.z -= speed;
            if (star.z <= 0) {
                star.reset(canvasWidth, canvasHeight);
            }
            
            const k = 200.0 / star.z; // Adjust focal length
            const px = star.x * k;
            const py = star.y * k;

            if (px >= -canvasWidth/2 && px < canvasWidth/2 && py >= -canvasHeight/2 && py < canvasHeight/2) {
                const size = (1 - star.z / canvasWidth) * 5;
                const opacity = 1 - star.z / canvasWidth;
                ctx.fillStyle = `hsla(0, 0%, 100%, ${opacity})`;
                ctx.beginPath();
                ctx.arc(px, py, size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
        animationFrameId = requestAnimationFrame(draw);
    };

    setup();
    animationFrameId = requestAnimationFrame(draw);

    const handleResize = () => {
        cancelAnimationFrame(animationFrameId);
        setup();
        animationFrameId = requestAnimationFrame(draw);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        background: 'hsl(var(--background))'
      }}
    />
  );
};
