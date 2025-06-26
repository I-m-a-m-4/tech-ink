
"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gem, Share2, AlertTriangle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import type { PageData } from './page';
import Image from 'next/image';

interface UserProfileClientPageProps {
    handle: string;
    initialData: PageData;
}

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

export default function UserProfileClientPage({ handle, initialData }: UserProfileClientPageProps) {
    const { userData, posts, error, indexErrorLink } = initialData;

    // Error State
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
        // This case should be covered by the error above, but as a fallback.
        return <div className="flex flex-col items-center justify-center text-center p-4" style={{minHeight: 'calc(100vh - 200px)'}}><p>User not found.</p></div>;
    }
    
    // Main Content
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
                            <Link href={`/feed?post=${post.id}`} className="block group">
                                <CardHeader className="p-0">
                                    <CardTitle className="group-hover:text-primary transition-colors">{post.headline}</CardTitle>
                                    <CardDescription className="pt-1">
                                        Posted {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'recently'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 pt-4">
                                    {post.imageUrl && (
                                        <div className="relative aspect-video w-full overflow-hidden rounded-lg my-4">
                                            <Image src={post.imageUrl} alt={post.headline} fill className="object-cover" />
                                        </div>
                                    )}
                                    <div className="text-foreground/90 whitespace-pre-line prose dark:prose-invert max-w-none"><ReactMarkdown>{post.content}</ReactMarkdown></div>
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
