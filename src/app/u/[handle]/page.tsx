
"use client";

import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, initializationError } from '@/lib/firebase';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gem, Rss, Share2, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import type { UserProfile } from '@/contexts/auth-context';
import type { SocialFeedItem } from '@/ai/schemas/social-feed-item-schema';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

type UserData = UserProfile & {
    id: string;
    displayName: string;
    handle: string;
    avatar?: string;
};

type PostWithId = SocialFeedItem & { id: string; createdAt?: any };

async function getUserData(handle: string): Promise<{user: UserData | null, posts: PostWithId[], error?: string, indexLink?: string}> {
    if (initializationError || !db) return { user: null, posts: [], error: "Firebase not initialized." };
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('handle', '==', `@${handle}`), limit(1));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return { user: null, posts: [], error: "User not found." };
        
        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data();
        const userData = {
            id: userDoc.id,
            displayName: data.displayName || 'Anonymous User',
            handle: data.handle,
            points: data.points || 0,
            avatar: `https://source.unsplash.com/random/100x100?portrait,user&sig=${userDoc.id}`
        } as UserData;

        const postsRef = collection(db, 'feedItems');
        const postsQuery = query(postsRef, where('userId', '==', userData.id), orderBy('createdAt', 'desc'));
        const postsSnapshot = await getDocs(postsQuery);
        const userPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostWithId));

        return { user: userData, posts: userPosts };
    } catch (error: any) {
        console.error("Error fetching user data:", error);
        if (error.code === 'failed-precondition') {
             return { user: null, posts: [], error: "Query requires a database index.", indexLink: error.message.match(/https?:\/\/[^\s]+/)?.[0] || '' };
        }
        return { user: null, posts: [], error: "An unexpected error occurred while fetching profile data." };
    }
}

function ShareProfileButton({ handle }: { handle: string }) {
    const { toast } = useToast();
    const handleShare = async () => {
        if (typeof window === 'undefined') return;
        const shareUrl = `${window.location.origin}/u/${handle}`;
        if (navigator.share) {
            await navigator.share({ title: `View ${handle}'s profile on Tech Ink`, url: shareUrl }).catch(error => console.error('Error sharing:', error));
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast({ title: "Link Copied!", description: "Profile link copied to your clipboard." });
        }
    };
    return (
        <Button onClick={handleShare} variant="outline" size="sm" className="absolute top-4 right-4">
            <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
    )
}

function UserProfileComponent({ handle }: { handle: string }) {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [userPosts, setUserPosts] = useState<PostWithId[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [indexLink, setIndexLink] = useState<string | undefined>();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            const { user, posts, error: fetchError, indexLink: fetchIndexLink } = await getUserData(handle);
            if (fetchError) {
                setError(fetchError);
                setIndexLink(fetchIndexLink);
            } else {
                setUserData(user);
                setUserPosts(posts);
            }
            setIsLoading(false);
        };
        fetchData();
    }, [handle]);

    if (isLoading) {
        return (
             <div className="flex items-center justify-center" style={{minHeight: 'calc(100vh - 200px)'}}>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !userData) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-4" style={{minHeight: 'calc(100vh - 200px)'}}>
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">{error === 'User not found.' ? 'Profile Not Found' : 'Database Error'}</h2>
                <p className="text-muted-foreground max-w-md mt-2">{error || "The user profile you are looking for does not exist."}</p>
                {indexLink && (
                    <Card className="mt-6 p-4 text-left text-sm bg-muted/50">
                        <p className="font-bold">Admin Action Required:</p>
                        <p className="mt-2">To fix this, you must create a database index in your Firebase project. This is a one-time setup.</p>
                        <Button asChild className="mt-4 w-full">
                            <a href={indexLink} target="_blank" rel="noopener noreferrer">
                                Create Index in Firebase <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    </Card>
                )}
            </div>
        )
    }

    return (
        <section className="container mx-auto max-w-4xl px-4 sm:px-6 py-12 md:py-16">
            <Card className="relative p-8 flex flex-col md:flex-row items-center gap-6 mb-12">
                <ShareProfileButton handle={handle} />
                <Avatar className="h-24 w-24 border-4 border-primary">
                    <AvatarImage src={userData.avatar} alt={userData.displayName} />
                    <AvatarFallback>{userData.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold">{userData.displayName}</h1>
                    <p className="text-lg text-muted-foreground">{userData.handle}</p>
                    <div className="mt-4 flex items-center justify-center md:justify-start gap-4">
                        <div className="flex items-center gap-2">
                            <Gem className="h-5 w-5 text-primary" />
                            <span className="font-bold">{userData.points.toLocaleString()}</span>
                            <span className="text-muted-foreground">Points</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Rss className="h-5 w-5 text-primary" />
                            <span className="font-bold">{userPosts.length}</span>
                            <span className="text-muted-foreground">Posts</span>
                        </div>
                    </div>
                </div>
            </Card>

            <h2 className="text-2xl font-bold mb-6">Contributions</h2>
            <div className="space-y-6">
                {userPosts.length > 0 ? (
                    userPosts.map(post => (
                        <Card key={post.id} className="p-6">
                             <Link href={`/feed?post=${post.id}`} className="block group">
                                <CardHeader className="p-0">
                                    <CardTitle className="group-hover:text-primary transition-colors">{post.headline}</CardTitle>
                                    <CardDescription className="pt-1">
                                        Posted {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'recently'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 pt-4">
                                    <div className="text-foreground/90 whitespace-pre-line prose dark:prose-invert max-w-none"><ReactMarkdown>{post.content}</ReactMarkdown></div>
                                </CardContent>
                            </Link>
                        </Card>
                    ))
                ) : (
                    <Card className="p-8 text-center text-muted-foreground">
                        <p>{userData.displayName} hasn't made any posts yet.</p>
                    </Card>
                )}
            </div>
        </section>
    )
}

export default function UserProfilePage({ params }: { params: { handle: string } }) {
    const pathname = usePathname();
    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">
                <Suspense fallback={
                    <div className="flex items-center justify-center" style={{minHeight: 'calc(100vh - 200px)'}}>
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                }>
                    <UserProfileComponent key={pathname} handle={params.handle} />
                </Suspense>
            </main>
            <SiteFooter />
        </div>
    );
}
