
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export type BackgroundType = 'starfield' | 'grid' | 'none' | 'aurora';

interface BackgroundContextType {
  background: BackgroundType;
  setBackground: (background: BackgroundType) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider: React.FC<{ children: React.ReactNode; defaultBackground?: BackgroundType; }> = ({ children, defaultBackground = 'grid' }) => {
  const [background, setBackgroundState] = useState<BackgroundType>(defaultBackground);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedBackground = localStorage.getItem('background-theme') as BackgroundType;
    if (storedBackground && ['starfield', 'grid', 'none', 'aurora'].includes(storedBackground)) {
      setBackgroundState(storedBackground);
    } else {
        setBackgroundState(defaultBackground); // Set default from props
    }
  }, [defaultBackground]);

  const setBackground = (newBackground: BackgroundType) => {
    setBackgroundState(newBackground);
    if (isMounted) {
      localStorage.setItem('background-theme', newBackground);
    }
  };

  const value = { background, setBackground };

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = (): BackgroundContextType => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
};
