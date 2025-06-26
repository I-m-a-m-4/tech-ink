
"use client";

import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, initializationError } from '@/lib/firebase';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gem, Share2, Loader2, AlertTriangle, ExternalLink, PenLine } from 'lucide-react';
import type { UserProfile } from '@/contexts/auth-context';
import type { SocialFeedItem } from '@/ai/schemas/social-feed-item-schema';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Timestamp } from 'firebase/firestore';
import Image from 'next/image';

type UserData = UserProfile & {
    id: string;
    displayName: string;
    handle: string;
    avatar?: string;
};

type PostWithId = SocialFeedItem & { id: string; createdAt?: Timestamp };

const TRUNCATE_LENGTH = 350;

const ExpandableText = ({ text }: { text: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const textContainerClasses = "text-foreground/90 whitespace-pre-line prose dark:prose-invert max-w-none";
    
    if (text.length <= TRUNCATE_LENGTH) {
        return <div className={textContainerClasses}><ReactMarkdown>{text}</ReactMarkdown></div>;
    }

    return (
        <>
            <div className={textContainerClasses}>
                <ReactMarkdown>{isExpanded ? text : `${text.substring(0, TRUNCATE_LENGTH)}...`}</ReactMarkdown>
            </div>
            {!isExpanded && (
                <Button variant="link" className="px-0 h-auto -mt-2 text-sm" onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}>
                    Read More
                </Button>
            )}
        </>
    );
};

function ShareProfileButton({ handle }: { handle: string }) {
    const { toast } = useToast();
    const handleShare = async () => {
        if (typeof window === 'undefined') return;
        const shareUrl = `${window.location.origin}/u/${handle}`;
        if (navigator.share) {
            await navigator.share({ title: `View @${handle}'s profile on Tech Ink`, url: shareUrl }).catch(error => console.error('Error sharing:', error));
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast({ title: "Link Copied!", description: "Profile link copied to your clipboard." });
        }
    };
    return (
        <Button onClick={handleShare} variant="outline" size="sm" className="absolute top-4 right-4">
            <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
    );
}

function UserProfilePageContent() {
    const params = useParams();
    const handle = typeof params.handle === 'string' ? params.handle : '';
    
    const [userData, setUserData] = useState<UserData | null>(null);
    const [posts, setPosts] = useState<PostWithId[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [indexErrorLink, setIndexErrorLink] = useState<string | null>(null);

    useEffect(() => {
        if (!handle) return;

        const fetchAllData = async () => {
            setIsLoading(true);
            setError(null);
            setIndexErrorLink(null);

            if (initializationError || !db) {
                setError("Database connection is not available.");
                setIsLoading(false);
                return;
            }

            try {
                // 1. Fetch user by handle
                const usersRef = collection(db, 'users');
                const userQuery = query(usersRef, where('handle', '==', `@${handle}`), limit(1));
                const userSnapshot = await getDocs(userQuery);

                if (userSnapshot.empty) {
                    throw new Error("User not found.");
                }
                
                const userDoc = userSnapshot.docs[0];
                const fetchedUserData = {
                    id: userDoc.id,
                    displayName: userDoc.data().displayName || 'Anonymous User',
                    handle: userDoc.data().handle,
                    points: userDoc.data().points || 0,
                    avatar: `https://source.unsplash.com/random/100x100?portrait,user&sig=${userDoc.id}`
                } as UserData;
                setUserData(fetchedUserData);
                
                // 2. Fetch user's posts
                try {
                    const postsRef = collection(db, 'feedItems');
                    const postsQuery = query(postsRef, where('userId', '==', fetchedUserData.id), orderBy('createdAt', 'desc'));
                    const postsSnapshot = await getDocs(postsQuery);
                    setPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostWithId)));
                } catch (e: any) {
                    console.error("Error fetching user posts:", e);
                    if (e.code === 'failed-precondition') {
                        setError("Query requires a database index.");
                        setIndexErrorLink(e.message.match(/https?:\/\/[^\s]+/)?.[0] || '');
                    } else {
                        setError("Could not load user's contributions.");
                    }
                }
            } catch (e: any) {
                console.error("Error fetching user profile:", e);
                setError(e.message || "An error occurred fetching the profile.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [handle]);

    if (isLoading) {
        return (
             <div className="flex items-center justify-center" style={{minHeight: 'calc(100vh - 200px)'}}>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    if (error && error !== "Query requires a database index.") {
        return (
            <div className="flex flex-col items-center justify-center text-center p-4" style={{minHeight: 'calc(100vh - 200px)'}}>
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">Profile Not Found</h2>
                <p className="text-muted-foreground max-w-md mt-2">The user profile for "@{handle}" does not exist or could not be loaded.</p>
            </div>
        )
    }

    if (!userData) {
         return <div className="flex items-center justify-center" style={{minHeight: 'calc(100vh - 200px)'}}><p>User not found.</p></div>;
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
                            <PenLine className="h-5 w-5 text-primary" />
                            <span className="font-bold">{userData.points.toLocaleString()}</span>
                            <span className="text-muted-foreground">Ink Points</span>
                        </div>
                    </div>
                </div>
            </Card>

            <h2 className="text-2xl font-bold mb-6">Contributions</h2>
            
            {error === "Query requires a database index." ? (
                 <Card className="mt-6 p-4 text-center text-sm bg-muted/50 border-destructive">
                    <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
                    <p className="font-bold text-destructive">Could Not Load Posts</p>
                    <p className="text-muted-foreground mt-2">This query can't be completed without a database index. This is a one-time setup for your project.</p>
                    {indexErrorLink && (
                        <div className="mt-4">
                            <p className='font-semibold'>Admin Action Required:</p>
                            <Button asChild className="mt-2" size="sm">
                                <a href={indexErrorLink} target="_blank" rel="noopener noreferrer">
                                    Create Index in Firebase <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    )}
                </Card>
            ) : posts.length > 0 ? (
                <div className="space-y-6">
                    {posts.map(post => (
                        <Card key={post.id} className="p-6">
                             <Link href={`/post/${post.id}`} className="block group">
                                <CardHeader className="p-0">
                                    <CardTitle className="group-hover:text-primary transition-colors">{post.headline}</CardTitle>
                                    <CardDescription className="pt-1">
                                        Posted {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'recently'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 pt-4">
                                     <ExpandableText text={post.content} />
                                    {post.imageUrl && (
                                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg mt-4">
                                            <Image src={post.imageUrl} alt={post.headline} fill className="object-cover" />
                                        </div>
                                    )}
                                </CardContent>
                            </Link>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="p-8 text-center text-muted-foreground">
                    <p>This user hasn't made any posts yet.</p>
                </Card>
            )}
        </section>
    );
}


export default function UserProfilePage() {
    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">
                <Suspense fallback={
                    <div className="flex items-center justify-center" style={{minHeight: 'calc(100vh - 200px)'}}>
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                }>
                    <UserProfilePageContent />
                </Suspense>
            </main>
            <SiteFooter />
        </div>
    );
}
