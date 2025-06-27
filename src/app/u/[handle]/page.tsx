
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db, initializationError } from '@/lib/firebase';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import type { UserProfile } from '@/contexts/auth-context';
import type { SocialFeedItem, Poll } from '@/ai/schemas/social-feed-item-schema';
import UserProfileClientPage from './client-page';
import type { Metadata } from 'next';

export type UserBadge = 'blue' | 'grey' | 'orange' | null;

export type UserData = UserProfile & {
    id: string;
    displayName: string;
    handle: string;
    avatar?: string;
    badge: UserBadge;
    publicName: boolean;
};
export type PostWithId = Omit<SocialFeedItem, 'createdAt' | 'poll'> & { 
    id: string; 
    createdAt?: string;
    poll?: Poll;
};

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
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('handle', '==', `@${handle}`), limit(1));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            return { userData: null, posts: [], error: "User not found.", indexErrorLink: null };
        }
        
        const userDoc = userSnapshot.docs[0];
        const docData = userDoc.data();
        const userData = {
            id: userDoc.id,
            displayName: docData.displayName || 'Anonymous User',
            handle: docData.handle,
            points: docData.points || 0,
            avatar: `https://source.unsplash.com/random/100x100?portrait,user&sig=${userDoc.id}`,
            badge: docData.badge || null,
            publicName: docData.publicName !== false,
        } as UserData;
        
        try {
            const postsRef = collection(db, 'feedItems');
            const postsQuery = query(postsRef, where('userId', '==', userData.id), orderBy('createdAt', 'desc'));
            const postsSnapshot = await getDocs(postsQuery);

            const posts = postsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : undefined
                } as PostWithId;
            });
            
            return { userData, posts, error: null, indexErrorLink: null };

        } catch (e: any) {
             if (e.code === 'failed-precondition') {
                const link = e.message.match(/https?:\/\/[^\s]+/)?.[0] || '';
                return { userData, posts: [], error: "Query requires a database index.", indexErrorLink: link };
            }
            throw e;
        }
    } catch (e: any) {
        console.error("Error fetching user profile data:", e);
        return { userData: null, posts: [], error: e.message || "An error occurred fetching the profile.", indexErrorLink: null };
    }
}

export async function generateMetadata({ params }: { params: { handle: string } }): Promise<Metadata> {
    const data = await getUserProfileData(params.handle);
    if (!data.userData) {
        return { title: 'Profile Not Found' };
    }
    const { userData } = data;
    const displayName = userData.publicName ? userData.displayName : userData.handle;
    return {
        title: `${displayName}'s Profile`,
        description: `View the profile and contributions of ${displayName} on Tech Ink Insights.`,
    };
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
