
"use client";
import { useBackground } from '@/contexts/background-context';
import { Starfield } from './starfield';
import { useEffect } from 'react';

export function SiteBackgroundWrapper({ children }: { children: React.ReactNode }) {
    const { background } = useBackground();
    
    useEffect(() => {
        document.body.dataset.background = background;
    }, [background]);

    return (
        <>
            {background === 'starfield' && <Starfield />}
            {children}
        </>
    );
}
