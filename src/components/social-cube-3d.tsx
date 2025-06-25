
"use client";

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Icons } from './icons';

export function SocialCube3d() {
  const cubeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cube = cubeRef.current;
    if (!cube) return;

    let rotationX = 0;
    let rotationY = 0;

    const animation = () => {
      rotationX += 0.1;
      rotationY += 0.1;
      cube.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
      requestAnimationFrame(animation);
    };

    const animationId = requestAnimationFrame(animation);

    return () => cancelAnimationFrame(animationId);
  }, []);

  const faceClasses = "absolute bg-card/40 border border-primary/20 flex items-center justify-center";
  const iconClasses = "text-primary/70";

  return (
    <div className="w-full h-[25rem] md:h-[35rem] flex items-center justify-center [perspective:1500px]">
      <div
        ref={cubeRef}
        className="relative w-[250px] h-[250px] md:w-[350px] md:h-[350px] [transform-style:preserve-3d]"
      >
        <div className={cn(faceClasses, "w-[250px] h-[250px] md:w-[350px] md:h-[350px]", "[transform:rotateY(0deg)_translateZ(125px)] md:[transform:rotateY(0deg)_translateZ(175px)]")}><Icons.twitter className={cn(iconClasses, "w-20 h-20 md:w-28 md:h-28")} /></div>
        <div className={cn(faceClasses, "w-[250px] h-[250px] md:w-[350px] md:h-[350px]", "[transform:rotateY(90deg)_translateZ(125px)] md:[transform:rotateY(90deg)_translateZ(175px)]")}><Icons.youtube className={cn(iconClasses, "w-20 h-20 md:w-28 md:h-28")} /></div>
        <div className={cn(faceClasses, "w-[250px] h-[250px] md:w-[350px] md:h-[350px]", "[transform:rotateY(180deg)_translateZ(125px)] md:[transform:rotateY(180deg)_translateZ(175px)]")}><Icons.instagram className={cn(iconClasses, "w-20 h-20 md:w-28 md:h-28")} /></div>
        <div className={cn(faceClasses, "w-[250px] h-[250px] md:w-[350px] md:h-[350px]", "[transform:rotateY(-90deg)_translateZ(125px)] md:[transform:rotateY(-90deg)_translateZ(175px)]")}><Icons.twitter className={cn(iconClasses, "w-20 h-20 md:w-28 md:h-28")} /></div>
        <div className={cn(faceClasses, "w-[250px] h-[250px] md:w-[350px] md:h-[350px]", "[transform:rotateX(90deg)_translateZ(125px)] md:[transform:rotateX(90deg)_translateZ(175px)]")}><Icons.youtube className={cn(iconClasses, "w-20 h-20 md:w-28 md:h-28")} /></div>
        <div className={cn(faceClasses, "w-[250px] h-[250px] md:w-[350px] md:h-[350px]", "[transform:rotateX(-90deg)_translateZ(125px)] md:[transform:rotateX(-90deg)_translateZ(175px)]")}><Icons.instagram className={cn(iconClasses, "w-20 h-20 md:w-28 md:h-28")} /></div>
      </div>
    </div>
  );
}
