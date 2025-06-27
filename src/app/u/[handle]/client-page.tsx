
"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PenLine, Share2, AlertTriangle, ExternalLink, BadgeCheck, Shield, Flame, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import type { PageData, PostWithId, UserBadge } from './page';
import Image from 'next/image';
import { useState } from 'react';
import { UserBadge as RankBadge, getRank } from '@/components/user-badge';
import { formatDistanceToNow } from 'date-fns';

interface UserProfileClientPageProps {
    handle: string;
    initialData: PageData;
}

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
                <Button variant="link" className="px-0 h-auto -mt-2 text-sm" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsExpanded(true); }}>
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

const VerificationBadge = ({ badge }: { badge: UserBadge }) => {
    if (!badge) return null;
    
    const badgeStyles: { [key in UserBadge]: string } = {
        blue: 'text-blue-500 fill-blue-500',
        grey: 'text-gray-500 fill-gray-500',
        orange: 'text-orange-500 fill-orange-500',
    };

    const badgeInfo: { [key in UserBadge]: string } = {
        blue: 'Verified Blue',
        grey: 'Verified Grey',
        orange: 'Verified Orange',
    }

    return <BadgeCheck className={`h-5 w-5 ${badgeStyles[badge]}`} title={badgeInfo[badge]} />;
}

export default function UserProfileClientPage({ handle, initialData }: UserProfileClientPageProps) {
    const { userData, posts, error, indexErrorLink } = initialData;
    const userRank = userData ? getRank(userData.points) : null;

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
        return <div className="flex flex-col items-center justify-center text-center p-4" style={{minHeight: 'calc(100vh - 200px)'}}><p>User not found.</p></div>;
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
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                        <h1 className="text-3xl font-bold">{userData.displayName}</h1>
                        <VerificationBadge badge={userData.badge} />
                    </div>
                    <p className="text-lg text-muted-foreground">{userData.handle}</p>
                    <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <div className="flex items-center gap-2">
                            <PenLine className="h-5 w-5 text-primary" />
                            <span className="font-bold">{userData.points.toLocaleString()}</span>
                            <span className="text-muted-foreground">Ink Points</span>
                        </div>
                        {userRank && (
                             <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">&bull;</span>
                                <RankBadge points={userData.points} />
                                <span className={`font-bold`}>{userRank.name}</span>
                            </div>
                        )}
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
                        <Card key={post.id} className="p-6 transition-all hover:border-primary/50">
                            <Link href={`/post/${post.id}`} className="block group">
                                <CardHeader className="p-0">
                                    <CardTitle className="group-hover:text-primary transition-colors">{post.headline}</CardTitle>
                                    <CardDescription className="pt-1">
                                        Posted {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'recently'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 pt-4">
                                     <ExpandableText text={post.content} />
                                    {post.imageUrl && (
                                        <div className="relative w-full overflow-hidden rounded-lg mt-4 max-h-[300px] sm:max-h-[500px]">
                                            <Image src={post.imageUrl} alt={post.headline} fill className="object-cover" />
                                        </div>
                                    )}
                                     {post.url && post.url !== '#' && (
                                        <div className="mt-4">
                                            <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors flex items-center gap-3">
                                                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-primary underline truncate">{post.url}</span>
                                            </div>
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
