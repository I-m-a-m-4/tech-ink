
"use client";

import React, { useRef, useEffect } from 'react';

export function CircuitPen3d() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !container.parentElement) return;

    const handleMouseMove = (e: MouseEvent) => {
      const parent = container.parentElement;
      if (!parent) return;
      const { clientX, clientY } = e;
      const { left, top, width, height } = parent.getBoundingClientRect();
      const x = (clientX - left - width / 2) / (width / 2); // -1 to 1
      const y = (clientY - top - height / 2) / (height / 2); // -1 to 1
      
      container.style.setProperty('--rotate-x', `${-y * 15}deg`);
      container.style.setProperty('--rotate-y', `${x * 15}deg`);
      container.style.setProperty('--translate-z', '50px');
    };

    const handleMouseLeave = () => {
      container.style.setProperty('--rotate-x', '-10deg');
      container.style.setProperty('--rotate-y', '20deg');
      container.style.setProperty('--translate-z', '0px');
    };
    
    const parentEl = container.parentElement;
    parentEl?.addEventListener('mousemove', handleMouseMove);
    parentEl?.addEventListener('mouseleave', handleMouseLeave);

    // Subtle floating animation
    let animationFrameId: number;
    const animate = () => {
        if(container) {
            const time = Date.now() * 0.001;
            container.style.setProperty('--float-y', `${Math.sin(time) * 5}px`);
        }
        animationFrameId = requestAnimationFrame(animate);
    }
    animationFrameId = requestAnimationFrame(animate);


    return () => {
      parentEl?.removeEventListener('mousemove', handleMouseMove);
      parentEl?.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Define the geometry of the hexagonal pen
  const numSides = 6;
  const radius = 12; // in pixels

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out" 
        style={{
            perspective: '1000px',
            transform: `rotateX(var(--rotate-x, -20deg)) rotateY(var(--rotate-y, 30deg)) translateZ(var(--translate-z, 0px)) translateY(var(--float-y, 0px))`
        }}
    >
      <div className="relative w-8 h-56" style={{ transformStyle: 'preserve-3d', transform: 'rotateZ(-45deg)' }}>
        
        {/* Animated SVG Writing */}
        <svg className="absolute w-[300px] h-[300px] -top-8 -left-40 overflow-visible" style={{ transform: 'translateZ(10px) rotateY(-90deg) rotateX(10deg)' }}>
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* "Tech Ink" path */}
            <path 
                d="M 50,150 L 70,130 L 90,150 L 70,150 L 70,170 M 100,170 L 100,130 L 120,130 M 130,170 L 130,130 L 150,130 L 150,170 M 160,130 L 180,130 M 190,130 L 190,170 M 200,170 L 200,130 L 220,150 L 200,170 M 230,130 L 230,170" 
                stroke="hsl(var(--primary))" 
                fill="none" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="animate-draw-circuit-1" 
                style={{ strokeDasharray: 500, strokeDashoffset: 500, filter: 'url(#glow)' }} 
            />
        </svg>

        {/* Hexagonal Pen Body */}
        <div className="absolute w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
            {Array.from({ length: numSides }).map((_, i) => (
                <div
                    key={i}
                    className="absolute w-full h-full bg-primary"
                    style={{
                        transform: `rotateY(${i * (360 / numSides)}deg) translateZ(${radius}px)`,
                        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
                        background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary) / 0.7))'
                    }}
                />
            ))}
        </div>

        {/* Nib section */}
        <div className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 w-6 h-8" style={{ transformStyle: 'preserve-3d' }}>
             <div className="absolute inset-0 bg-gradient-to-r from-neutral-100 to-neutral-400" style={{clipPath: 'polygon(25% 0, 75% 0, 100% 100%, 0% 100%)'}}></div>
        </div>
        <div className="absolute bottom-[-45px] left-1/2 -translate-x-1/2 w-2 h-4 bg-neutral-800" style={{ clipPath: 'polygon(50% 100%, 100% 0, 0 0)'}}></div>
        
        {/* Top clicker */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-3 rounded-t-sm bg-muted"></div>
        
        {/* Clip */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-24 bg-neutral-400 rounded-md" style={{transform: `translateZ(${radius + 1}px)`}}>
            <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent rounded-md"></div>
             <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-neutral-500"></div>
        </div>
      </div>
    </div>
  );
}
