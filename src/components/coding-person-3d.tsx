"use client";

import React, { useRef, useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';

export function CodingPerson3d() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  const springConfig = { damping: 25, stiffness: 100, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Adjusted the rotation to be less extreme for a more natural desk angle
  const rotateX = useTransform(smoothMouseY, [0, 1], [60, 75]); 
  const rotateY = useTransform(smoothMouseX, [0, 1], [-45, 45]);
  const lightX = useTransform(smoothMouseX, [0, 1], ['20%', '80%']);
  const lightY = useTransform(smoothMouseY, [0, 1], ['20%', '80%']);

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full flex items-center justify-center"
        style={{ perspective: '3000px' }}
    >
      <motion.div 
        className="relative w-full h-full"
        style={{ 
            transformStyle: 'preserve-3d',
            rotateX,
            rotateY,
            scale: 1.1,
        }}
      >
        {/* The Desk Group */}
        <div className="absolute top-1/2 left-1/2 w-[700px] h-[400px]" style={{ transformStyle: 'preserve-3d', transform: 'translate(-50%, -50%)' }}>
            {/* Desk Surface */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-800 to-amber-950 border border-amber-950/50 shadow-2xl"></div>
            {/* Desk Thickness */}
            <div className="absolute top-0 left-0 w-full h-[20px] bg-amber-950" style={{ transformOrigin: 'top', transform: 'rotateX(-90deg) translateY(-10px)' }}></div>
            
            {/* Monitor Group - positioned ON the desk */}
            {/* Increased the Z-axis translation to lift the monitor higher off the desk */}
            <div className="absolute" style={{ transformStyle: 'preserve-3d', transform: 'translate3d(100px, 50px, 50px)' }}>
                {/* Monitor Stand */}
                <div className="absolute w-[20px] h-[100px] bg-neutral-600 left-1/2 -translate-x-1/2 bottom-0" style={{ transform: 'rotateX(90deg) translateZ(-50px)'}}></div>
                <div className="absolute w-[150px] h-[10px] bg-neutral-700 left-1/2 -translate-x-1/2 bottom-0 rounded-full" style={{ transform: 'rotateX(90deg) translateZ(-5px)'}}></div>
                
                {/* Monitor Screen */}
                <div 
                    className="absolute w-[500px] h-[350px] rounded-lg bg-neutral-800 border-4 border-neutral-700"
                    style={{
                        transform: 'translateY(-140px) rotateX(-90deg)',
                    }}
                >
                    <div className="absolute inset-1.5 bg-black rounded-sm overflow-hidden">
                        {/* Screen Glow */}
                        <motion.div 
                            className="absolute w-40 h-40 bg-primary/40 rounded-full"
                            style={{
                                top: lightY,
                                left: lightX,
                                filter: 'blur(80px)',
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                        {/* Code lines */}
                        <div className="absolute inset-4 opacity-80 p-2 font-mono text-sm text-green-300 leading-relaxed">
                            <p>&gt; <span className="text-purple-400">import</span> &#123; Community &#125; from './future';</p>
                            <p>&gt; <span className="text-blue-400">const</span> techInk = <span className="text-yellow-400">new</span> Community();</p>
                            <p>&gt; </p>
                            <p>&gt; techInk.on('inspiration', (idea) => &#123;</p>
                            <p className="pl-4">console.log(`New Insight: $&#123;idea&#125;`);</p>
                            <p>&gt; &#125;);</p>
                            <p>&gt; </p>
                            <p>&gt; techInk.<span className="text-red-400">launch</span>();</p>
                            <p className="animate-pulse text-white">&gt; _</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hanging Bulb Group */}
            <div className="absolute" style={{ transformStyle: 'preserve-3d', transform: 'translate3d(400px, 0px, 200px) rotateX(90deg)' }}>
                {/* Wire */}
                <div className="absolute w-0.5 h-[250px] bg-neutral-400 left-1/2 -translate-x-1/2 bottom-[50px]"></div>
                {/* Socket */}
                <div className="absolute w-6 h-8 bg-neutral-800 left-1/2 -translate-x-1/2 bottom-[35px] rounded-t-sm"></div>
                {/* Bulb */}
                <div className="absolute w-12 h-12 bg-gradient-to-b from-amber-100 to-amber-300 left-1/2 -translate-x-1/2 bottom-[-10px] rounded-full shadow-[0_0_80px_30px_hsl(var(--primary)/0.6)]">
                    {/* Filament */}
                    <div className="absolute inset-3 border-2 border-amber-400/50 rounded-full"></div>
                </div>
                {/* Light Cone */}
                <div className="absolute w-[400px] h-[400px] rounded-full left-1/2 -translate-x-1/2 bottom-[-350px]" style={{
                    background: 'radial-gradient(ellipse at center, hsl(45 100% 85% / 0.25) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }}></div>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
