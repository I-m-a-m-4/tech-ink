
"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/actions/analytics';
import { useDebounce } from 'use-debounce';

export function PageViewTracker() {
    const pathname = usePathname();
    const [debouncedPathname] = useDebounce(pathname, 500);

    useEffect(() => {
        if (debouncedPathname) {
            // We fire and forget this server action.
            // No need to handle loading or error states on the client.
            trackPageView(debouncedPathname);
        }
    }, [debouncedPathname]);
    
    return null; // This component does not render anything.
}
