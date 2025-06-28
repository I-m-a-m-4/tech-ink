
"use client";

import React, { useEffect, useState } from 'react';
import ReactConfetti from 'react-confetti';

const useWindowSize = () => {
    const [size, setSize] = useState({ width: 0, height: 0 });
    useEffect(() => {
        const handleResize = () => {
            setSize({ width: window.innerWidth, height: window.innerHeight });
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return size;
}

export const Confetti = () => {
  const { width, height } = useWindowSize();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 7000); // Confetti for 7 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!show) {
    return null;
  }

  return (
    <ReactConfetti
      width={width}
      height={height}
      numberOfPieces={200}
      recycle={false}
      gravity={0.1}
    />
  );
};
