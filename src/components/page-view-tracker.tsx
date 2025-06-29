
"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/actions/analytics';

export function PageViewTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (pathname) {
            // We fire and forget this server action.
            // No need to handle loading or error states on the client.
            // Removing debounce to make it more reliable.
            trackPageView(pathname);
        }
    }, [pathname]);
    
    return null; // This component does not render anything.
}
