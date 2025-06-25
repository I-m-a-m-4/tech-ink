
"use client";

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Icons } from './icons';

const defaultHeadlines = [
  "Quantum Leap in AI Processing",
  "Neural Networks Mimic Human Brain",
  "Cyber threats on the rise",
  "New Graphene Battery Charges in Seconds",
  "Web3: The Future of the Internet?",
  "First Commercial Fusion Reactor Online",
  "Gene Editing Tech Cures Rare Disease",
  "Self-Driving Cars Hit City Streets",
  "AI predicts stock market with 99% accuracy",
  "Holographic displays now available",
  "Flying cars approved for public use",
  "Brain-computer interfaces are here"
];

export function RetroTv3d({ content }: { content?: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: -15, y: 20 });

  const headlines = content || defaultHeadlines;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const { clientX, clientY, currentTarget } = e;
      const { left, top, width, height } = (currentTarget as HTMLElement).getBoundingClientRect();
      
      const x = (clientX - left) / width; // 0 to 1
      const y = (clientY - top) / height; // 0 to 1

      const newRotationY = 25 - (x * 50); // from 25 to -25
      const newRotationX = -25 + (y * 50); // from -25 to 25

      setRotation({ x: newRotationX, y: newRotationY });
    };

    const handleMouseLeave = () => {
      setRotation({ x: -15, y: 20 });
    };

    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);
    container?.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container?.removeEventListener('mousemove', handleMouseMove);
      container?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full [perspective:1000px]">
      <div 
        className="relative h-full w-full [transform-style:preserve-3d] transition-transform duration-300 ease-out"
        style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
      >
        {/* Holographic Screen */}
        <div 
          className="absolute inset-x-0 top-[10%] h-[60%] w-full rounded-lg border-2 border-primary/50 bg-primary/10 [transform-style:preserve-3d] animate-flicker"
          style={{
            boxShadow: '0 0 50px 15px hsl(var(--primary) / 0.3), inset 0 0 25px hsl(var(--primary) / 0.4)',
          }}
        >
          <div className="absolute inset-4 font-mono text-sm overflow-hidden text-primary [text-shadow:0_0_8px_hsl(var(--primary)/0.8)]">
            <div className="h-full animate-scroll-vertical">
              {[...headlines, ...headlines].map((headline, i) => (
                <p key={i} className="whitespace-pre">
                  <span className="text-primary-foreground/70" style={{textShadow: 'none'}}>&gt; </span>{headline}
                </p>
              ))}
            </div>
          </div>
           {/* Scanline effect */}
           <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,hsl(var(--primary)/0.1)_51%)]" style={{ backgroundSize: '100% 4px', animation: 'scanline 1s linear infinite' }}></div>
        </div>

        {/* Projector Base */}
        <div className="absolute bottom-[5%] left-1/2 w-40 h-10 [transform-style:preserve-3d] [transform:translateX(-50%)]">
          <div className="absolute inset-0 rounded-full bg-primary/10 shadow-[0_0_40px_10px_hsl(var(--primary)/0.3)] border-t-2 border-primary/30">
            {/* Projector Lens */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-primary shadow-[0_0_20px_8px_hsl(var(--primary)/0.5)] animate-pulse"></div>
          </div>
        </div>

        {/* Projection Light Cone */}
        <div className="absolute bottom-[5%] left-1/2 w-[90%] h-[55%] [transform:translateX(-50%)]">
           <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_top,hsl(var(--primary)/0.2)_0%,transparent_100%)] [clip-path:polygon(0%_100%,100%_100%,85%_0,15%_0)] opacity-60 animate-flicker"></div>
        </div>
      </div>
    </div>
  );
}
