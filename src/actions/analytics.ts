
'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';

function sanitizePath(path: string): string {
    if (path === '/') return 'home';
    return path.replace(/^\//, '').replace(/\//g, '_');
}

export async function trackPageView(path: string) {
    if (!db || !path) {
        console.log('[Analytics] DB not initialized or no path, skipping track.');
        return;
    }
    
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
        // This log will only appear on the server.
        console.error(`[Analytics] Failed to track page view for ${path}:`, error);
        // Fail silently to not impact user experience. The most common cause for this
        // is Firestore security rules not allowing writes from unauthenticated users.
    }
}
