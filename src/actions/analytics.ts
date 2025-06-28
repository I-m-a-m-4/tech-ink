
'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';

function sanitizePath(path: string): string {
    if (path === '/') return 'home';
    return path.replace(/^\//, '').replace(/\//g, '_');
}

export async function trackPageView(path: string) {
    if (!db || !path) return;
    
    // Ignore tracking for admin pages
    if (path.startsWith('/imam')) return;

    try {
        const sanitizedPath = sanitizePath(path);
        const docRef = doc(db, 'analytics', sanitizedPath);
        
        await setDoc(docRef, {
            views: increment(1),
            lastViewed: serverTimestamp(),
            originalPath: path
        }, { merge: true });

    } catch (error) {
        console.error(`Failed to track page view for ${path}:`, error);
        // Fail silently to not impact user experience
    }
}
