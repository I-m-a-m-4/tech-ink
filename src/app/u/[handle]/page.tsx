
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db, initializationError } from '@/lib/firebase';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import type { UserProfile } from '@/contexts/auth-context';
import type { SocialFeedItem } from '@/ai/schemas/social-feed-item-schema';
import UserProfileClientPage from './client-page';

export type UserBadge = 'blue' | 'grey' | 'orange' | null;

export type UserData = UserProfile & {
    id: string;
    displayName: string;
    handle: string;
    avatar?: string;
    badge: UserBadge;
};
export type PostWithId = Omit<SocialFeedItem, 'createdAt'> & { id: string; createdAt?: string };

export type PageData = {
    userData: UserData | null;
    posts: PostWithId[];
    error: string | null;
    indexErrorLink: string | null;
}

async function getUserProfileData(handle: string): Promise<PageData> {
    if (initializationError || !db) {
        return { userData: null, posts: [], error: 'Database not available.', indexErrorLink: null };
    }

    try {
        // 1. Fetch user by handle
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('handle', '==', `@${handle}`), limit(1));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            return { userData: null, posts: [], error: "User not found.", indexErrorLink: null };
        }
        
        const userDoc = userSnapshot.docs[0];
        const userData = {
            id: userDoc.id,
            displayName: userDoc.data().displayName || 'Anonymous User',
            handle: userDoc.data().handle,
            points: userDoc.data().points || 0,
            avatar: `https://source.unsplash.com/random/100x100?portrait,user&sig=${userDoc.id}`,
            badge: userDoc.data().badge || null,
        } as UserData;
        
        // 2. Fetch user's posts
        try {
            const postsRef = collection(db, 'feedItems');
            const postsQuery = query(postsRef, where('userId', '==', userData.id), orderBy('createdAt', 'desc'));
            const postsSnapshot = await getDocs(postsQuery);

            const posts = postsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Make sure timestamp is serialized
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : undefined
                } as PostWithId;
            });
            
            return { userData, posts, error: null, indexErrorLink: null };

        } catch (e: any) {
             if (e.code === 'failed-precondition') {
                const link = e.message.match(/https?:\/\/[^\s]+/)?.[0] || '';
                return { userData, posts: [], error: "Query requires a database index.", indexErrorLink: link };
            }
            throw e; // re-throw other post-fetching errors
        }
    } catch (e: any) {
        console.error("Error fetching user profile data:", e);
        return { userData: null, posts: [], error: e.message || "An error occurred fetching the profile.", indexErrorLink: null };
    }
}


export default async function UserProfilePage({ params }: { params: { handle: string } }) {
    const data = await getUserProfileData(params.handle);

    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">
                <Suspense fallback={
                    <div className="flex items-center justify-center" style={{minHeight: 'calc(100vh - 200px)'}}>
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                }>
                    <UserProfileClientPage 
                        handle={params.handle}
                        initialData={data} 
                    />
                </Suspense>
            </main>
            <SiteFooter />
        </div>
    );
}
