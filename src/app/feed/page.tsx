
"use client";

import { Icons } from "@/components/icons";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { type SocialFeedItem, type Poll } from "@/ai/schemas/social-feed-item-schema";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { Loader2, RefreshCw, Star, Plus, Bot, Eye, FileText, Search, ImageUp, BarChart3, Trash2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SocialCube3d } from "@/components/social-cube-3d";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, type Timestamp, onSnapshot } from "firebase/firestore";
import { Newspaper } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm, SubmitHandler, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { analyzePost } from "@/ai/flows/analyze-post-flow";
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ClientLink } from "@/components/client-link";
import { motion } from 'framer-motion';


const BATCH_SIZE = 5;
const POST_CHARACTER_LIMIT = 600;
const TRUNCATE_LENGTH = 350;

type SocialFeedItemWithId = SocialFeedItem & { 
    id: string;
    createdAt?: Timestamp;
    userId?: string;
    views?: number;
    comments: number;
    poll?: Poll;
};

const addPostFormSchema = z.object({
  headline: z.string().min(10, { message: "Headline or Poll Question must be at least 10 characters." }).max(100, { message: "Headline/Question must be less than 100 characters." }),
  content: z.string().max(POST_CHARACTER_LIMIT, { message: `Content must be less than ${POST_CHARACTER_LIMIT} characters.` }).optional(),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
  poll: z.object({
    options: z.array(z.object({ text: z.string().min(1, "Option cannot be empty").max(80, "Option is too long") })).min(2, "A poll must have at least 2 options.").max(4, "A poll can have at most 4 options."),
  }).optional(),
}).superRefine((data, ctx) => {
    if (!data.poll && (!data.content || data.content.length < 20)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["content"],
            message: "Content must be at least 20 characters for a regular post.",
        });
    }
});
type AddPostFormValues = z.infer<typeof addPostFormSchema>;

const getDisplayTime = (item: SocialFeedItemWithId) => {
    if (item.createdAt && typeof item.createdAt.toDate === 'function') {
        return formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true });
    }
    return 'Just now';
};

const ExpandableText = ({ text }: { text: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const textContainerClasses = "mt-2 text-foreground/90 whitespace-pre-line prose prose-sm dark:prose-invert max-w-none break-words";
    
    if (text.length <= TRUNCATE_LENGTH) {
        return <div className={textContainerClasses}><ReactMarkdown>{text}</ReactMarkdown></div>;
    }

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsExpanded(true);
    }

    return (
        <>
            <div className={textContainerClasses}>
                <ReactMarkdown>{isExpanded ? text : `${text.substring(0, TRUNCATE_LENGTH)}...`}</ReactMarkdown>
            </div>
            {!isExpanded && (
                <Button variant="link" className="px-0 h-auto -mt-2 text-sm" onClick={handleClick}>
                    Read More
                </Button>
            )}
        </>
    );
};

const FeedItemCard = ({ item, onViewImage }: { item: SocialFeedItemWithId; onViewImage: (src: string) => void }) => {
    const { toast } = useToast();
    const { user, addPoints, likedPosts, addLike, removeLike, votedOnPolls, voteOnPoll } = useAuth();
    const [likeCount, setLikeCount] = useState(item.likes);

    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [analysisContent, setAnalysisContent] = useState('');
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    
    const displayTime = getDisplayTime(item);
    const isLiked = likedPosts.has(item.id);
    const hasVotedOnThisPoll = votedOnPolls.has(item.id);
    const [pollState, setPollState] = useState(item.poll);

    useEffect(() => {
        setPollState(item.poll);
    }, [item.poll]);
    
    const handleVote = async (optionText: string) => {
        if (!user) { toast({ variant: "destructive", title: "Login Required" }); return; }
        if (!pollState) return;

        try {
            await voteOnPoll(item.id, 'feedItems', optionText);
            setPollState(currentPoll => {
                if (!currentPoll) return undefined;
                return {
                    ...currentPoll,
                    options: {
                        ...currentPoll.options,
                        [optionText]: (currentPoll.options[optionText] || 0) + 1,
                    },
                };
            });
        } catch (error: any) {
            console.error("Vote error:", error);
            toast({ variant: "destructive", title: "Vote Failed", description: error.message || "An error occurred." });
        }
    };
    
    const handleFooterAction = (e: React.MouseEvent, action: (() => void) | (() => Promise<void>)) => {
        e.stopPropagation();
        e.preventDefault();
        action();
    }

    const handleLike = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "Login Required", description: "You must be logged in to like posts." });
            return;
        }

        try {
            if (isLiked) {
                setLikeCount(c => c - 1);
                await removeLike(item.id, 'feedItems');
            } else {
                setLikeCount(c => c + 1);
                await addLike(item.id, 'feedItems');
                addPoints(1);
            }
        } catch (error) {
             setLikeCount(item.likes); // Revert to original count on error
             toast({ variant: "destructive", title: "Something went wrong", description: "Could not update likes. Please try again." });
             console.error("Like error:", error);
        }
    };
    
    const handleShare = async () => {
       if (user) { addPoints(5); }
       if (typeof window === 'undefined') return;
       const shareUrl = `${window.location.origin}/post/${item.id}`;
       const shareText = `${item.headline} - ${item.content ? item.content.substring(0, 150) : ''}${item.content && item.content.length > 150 ? '...' : ''}`;
       if (navigator.share) {
           await navigator.share({ title: item.headline, text: shareText, url: shareUrl }).catch(error => console.error('Error sharing:', error));
       } else {
           navigator.clipboard.writeText(shareUrl);
           toast({ title: "Link Copied!", description: "A link to the post has been copied to your clipboard." });
       }
    };

    const handleAnalyze = async () => {
        if (!user) { toast({ variant: "destructive", title: "Login Required", description: "You must be logged in to analyze posts." }); return; }
        setIsAnalysisOpen(true);
        setIsAnalysisLoading(true);
        addPoints(10);
        try {
            const result = await analyzePost({ headline: item.headline, content: item.content ?? '' });
            setAnalysisContent(result.analysis);
        } catch (e) {
            setAnalysisContent("Sorry, I was unable to analyze this post at the moment.");
            toast({ variant: "destructive", title: "Analysis Failed", description: "An error occurred." });
        } finally {
            setIsAnalysisLoading(false);
        }
    }

    const PlatformIcon = () => {
        switch (item.platform) {
            case 'Twitter': return <Icons.twitter className="h-5 w-5" />;
            case 'YouTube': return <Icons.youtube className="h-5 w-5" />;
            case 'Instagram': return <Icons.instagram className="h-5 w-5" />;
            case 'TechInk': return <Icons.pen className="h-5 w-5" />;
            default: return null;
        }
    };

    return (
        <>
            <ClientLink href={`/post/${item.id}`} className="block group">
                <Card className="bg-card/40 shadow-lg border-border/60 p-0 animate-in fade-in-50 overflow-hidden transition-all hover:border-primary">
                    <div className="p-6 pb-4">
                        <div className="flex items-start gap-4">
                            <Avatar>
                                <AvatarImage src={item.avatar} alt={item.handle} />
                                <AvatarFallback>{item.handle.charAt(1)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <ClientLink href={`/u/${item.handle.substring(1)}`} className="font-bold hover:underline">{item.handle}</ClientLink>
                                    <span className="text-muted-foreground hidden sm:inline">·</span>
                                    <span className="text-muted-foreground">{displayTime}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 pt-0 pb-4">
                        <h3 className="mt-2 text-lg font-semibold group-hover:text-primary transition-colors">{item.headline}</h3>
                        {item.content && <ExpandableText text={item.content} />}
                        {item.imageUrl && (
                             <button className="mt-4 relative w-full h-[300px] sm:h-96 overflow-hidden rounded-lg group" onClick={(e) => handleFooterAction(e, () => onViewImage(item.imageUrl!))}>
                                <Image src={item.imageUrl} alt={item.headline} fill sizes="100vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            </button>
                        )}
                        {pollState && (
                            <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                                <PollDisplay poll={pollState} userVote={votedOnPolls.get(item.id)} onVote={handleVote} hasVoted={hasVotedOnThisPoll} />
                            </div>
                        )}
                    </div>
                    <CardFooter className="p-6 pt-0 border-t mt-4" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                        <div className="w-full flex flex-wrap items-center gap-1 sm:gap-6 text-muted-foreground">
                            <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={(e) => handleFooterAction(e, handleLike)}>
                                <Icons.heart className={`h-4 w-4 transition-all ${isLiked ? 'text-red-500 fill-current scale-110' : ''}`} />
                                <span>{likeCount}</span>
                            </Button>
                            <ClientLink href={`/post/${item.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), "flex items-center gap-2")}>
                                <Icons.comment className="h-4 w-4" />
                                <span>{item.comments}</span>
                            </ClientLink>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={(e) => handleFooterAction(e, handleShare)}>
                                <Icons.share className="h-4 w-4" />
                                <span className="hidden sm:inline">Share</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={(e) => handleFooterAction(e, handleAnalyze)}>
                                <Bot className="h-4 w-4" />
                                <span className="hidden sm:inline">Analyze</span>
                            </Button>
                            {user && user.uid === item.userId && item.views !== undefined && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Eye className="h-4 w-4" />
                                    <span>{item.views.toLocaleString()} views</span>
                                </div>
                            )}
                            <div className="flex-grow" />
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <PlatformIcon />
                                <span>{item.platform}</span>
                            </div>
                        </div>
                    </CardFooter>
                </Card>
            </ClientLink>
            <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>AI Deep Dive</DialogTitle>
                        <DialogDescription>An AI-powered analysis of the post: "{item.headline}"</DialogDescription>
                    </DialogHeader>
                    {isAnalysisLoading ? (
                         <div className="space-y-3 py-8">
                            <div className="h-4 bg-muted/80 rounded animate-pulse w-full"></div>
                            <div className="h-4 bg-muted/80 rounded animate-pulse w-[90%]"></div>
                            <div className="h-4 bg-muted/80 rounded animate-pulse w-[80%]"></div>
                        </div>
                    ) : (
                         <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto whitespace-pre-line">{analysisContent}</div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

const PinnedTopicCard = ({ item, onViewImage }: { item: SocialFeedItemWithId; onViewImage: (src: string) => void }) => {
    const { toast } = useToast();
    const { user, addPoints, likedPosts, addLike, removeLike } = useAuth();
    const [likeCount, setLikeCount] = useState(item.likes);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [analysisContent, setAnalysisContent] = useState('');
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const displayTime = getDisplayTime(item);
    const isLiked = likedPosts.has(item.id);

    const handleFooterAction = (e: React.MouseEvent, action: (() => void) | (() => Promise<void>)) => {
        e.stopPropagation();
        e.preventDefault();
        action();
    }

    const handleLike = async () => {
        if (!user) { toast({ variant: "destructive", title: "Login Required", description: "You must be logged in to like posts." }); return; }
        
        try {
            if (isLiked) {
                setLikeCount(c => c - 1);
                await removeLike(item.id, 'dailyTopics');
            } else {
                setLikeCount(c => c + 1);
                await addLike(item.id, 'dailyTopics');
                addPoints(1);
            }
        } catch (error) {
             setLikeCount(item.likes);
             toast({ variant: "destructive", title: "Something went wrong", description: "Could not update likes. Please try again." });
        }
    };
    
    const handleShare = async () => {
        if (user) { addPoints(5); }
        if (typeof window === 'undefined') return;
        const shareUrl = `${window.location.origin}/post/${item.id}`;
        const shareText = `${item.headline} - ${item.content.substring(0, 150)}${item.content.length > 150 ? '...' : ''}`;
        if (navigator.share) {
            await navigator.share({ title: item.headline, text: shareText, url: shareUrl }).catch(error => console.error('Error sharing:', error));
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast({ title: "Link Copied!", description: "A link to the post has been copied to your clipboard." });
        }
    };

    const handleAnalyze = async () => {
        if (!user) { toast({ variant: "destructive", title: "Login Required", description: "You must be logged in to analyze posts." }); return; }
        setIsAnalysisOpen(true);
        setIsAnalysisLoading(true);
        addPoints(10);
        try {
            const result = await analyzePost({ headline: item.headline, content: item.content });
            setAnalysisContent(result.analysis);
        } catch (e) {
            setAnalysisContent("Sorry, I was unable to analyze this post at the moment.");
            toast({ variant: "destructive", title: "Analysis Failed", description: "An error occurred." });
        } finally {
            setIsAnalysisLoading(false);
        }
    }

    return (
        <>
            <ClientLink href={`/post/${item.id}`} className="block group">
                <Card className="bg-primary/10 border-primary/40 shadow-lg p-0 animate-in fade-in-50 overflow-hidden transition-all hover:border-primary">
                    <div className="p-6 pb-4">
                        <div className="flex gap-2 items-center">
                            <Star className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-bold text-primary">Topic of the Day</h2>
                        </div>
                        <div className="flex items-start gap-4 pt-2">
                            <Avatar>
                                <AvatarImage src={item.avatar} alt={item.handle} />
                                <AvatarFallback>{item.handle.charAt(1)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <ClientLink href={`/u/${item.handle.substring(1)}`} className="font-bold hover:underline">{item.handle}</ClientLink>
                                    <span className="text-muted-foreground hidden sm:inline">·</span>
                                    <span className="text-muted-foreground">{displayTime}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pt-0 pb-4">
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">{item.headline}</h3>
                        <ExpandableText text={item.content} />
                        {item.imageUrl && (
                            <button className="mt-4 relative w-full h-96 sm:h-[500px] overflow-hidden rounded-lg group" onClick={(e) => handleFooterAction(e, () => onViewImage(item.imageUrl!))}>
                                <Image src={item.imageUrl} alt={item.headline} fill sizes="100vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            </button>
                        )}
                    </div>

                    <CardFooter className="p-6 pt-0 border-t mt-4" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                        <div className="w-full flex flex-wrap items-center gap-1 sm:gap-6 text-muted-foreground">
                            <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={(e) => handleFooterAction(e, handleLike)}>
                                <Icons.heart className={`h-4 w-4 transition-all ${isLiked ? 'text-red-500 fill-current scale-110' : ''}`} />
                                <span>{likeCount}</span>
                            </Button>
                             <ClientLink href={`/post/${item.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), "flex items-center gap-2")}>
                                <Icons.comment className="h-4 w-4" />
                                <span>{item.comments}</span>
                            </ClientLink>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={(e) => handleFooterAction(e, handleShare)}>
                                <Icons.share className="h-4 w-4" />
                                <span className="hidden sm:inline">Share</span>
                            </Button>
                             <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={(e) => handleFooterAction(e, handleAnalyze)}>
                                <Bot className="h-4 w-4" />
                                <span className="hidden sm:inline">Analyze</span>
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </ClientLink>
            <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>AI Deep Dive</DialogTitle><DialogDescription>An AI-powered analysis of the post: "{item.headline}"</DialogDescription></DialogHeader>
                    {isAnalysisLoading ? (
                         <div className="space-y-3 py-8"><div className="h-4 bg-muted/80 rounded animate-pulse w-full"></div><div className="h-4 bg-muted/80 rounded animate-pulse w-[90%]"></div><div className="h-4 bg-muted/80 rounded animate-pulse w-[80%]"></div></div>
                    ) : (
                         <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto whitespace-pre-line">{analysisContent}</div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

function FeedPageComponent() {
  const [allFeedItems, setAllFeedItems] = useState<SocialFeedItemWithId[]>([]);
  const [visibleFeedItems, setVisibleFeedItems] = useState<SocialFeedItemWithId[]>([]);
  const [pinnedTopic, setPinnedTopic] = useState<SocialFeedItemWithId | null>(null);
  const [topicHistory, setTopicHistory] = useState<SocialFeedItemWithId[]>([]);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver>();
  const { toast } = useToast();
  const { user, profile, addPoints } = useAuth();
  
  const [showPoll, setShowPoll] = useState(false);
  const addPostForm = useForm<AddPostFormValues>({ resolver: zodResolver(addPostFormSchema), defaultValues: { headline: "", content: "", imageUrl: "", poll: { options: [{text: ""}, {text: ""}] } } });
  const [isUploading, setIsUploading] = useState(false);
  
  const { fields, append, remove } = useFieldArray({
    control: addPostForm.control,
    name: "poll.options",
  });

  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (!db) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    if (isRefresh) { setAllFeedItems([]); setVisibleFeedItems([]); setPinnedTopic(null); setTopicHistory([]); }
    try {
        const dailyTopicsQuery = query(collection(db, 'dailyTopics'), orderBy('createdAt', 'desc'));
        const feedItemsQuery = query(collection(db, 'feedItems'), orderBy('createdAt', 'desc'));
        const [dailyTopicsSnapshot, feedItemsSnapshot] = await Promise.all([getDocs(dailyTopicsQuery), getDocs(feedItemsQuery)]);
        
        const dailyTopicsList = dailyTopicsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), comments: doc.data().comments || 0 } as SocialFeedItemWithId));
        let currentPinnedTopic: SocialFeedItemWithId | null = null;
        if (dailyTopicsList.length > 0) {
            currentPinnedTopic = dailyTopicsList[0];
            setPinnedTopic(currentPinnedTopic);
            setTopicHistory(dailyTopicsList.slice(1));
        } else {
            setPinnedTopic(null);
            setTopicHistory([]);
        }

        let feedItemsList = feedItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialFeedItemWithId));
        
        if (currentPinnedTopic) {
            feedItemsList = feedItemsList.filter(item => item.id !== currentPinnedTopic!.id);
        }

        setAllFeedItems(feedItemsList);
        setVisibleFeedItems(feedItemsList.slice(0, BATCH_SIZE));
        setHasMore(feedItemsList.length > BATCH_SIZE);

    } catch (error) {
        console.error("Failed to fetch feed items:", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const handleTogglePoll = () => {
    setShowPoll(prev => {
        const isNowShowingPoll = !prev;
        if (isNowShowingPoll) {
            addPostForm.setValue('content', '');
            addPostForm.clearErrors('content');
        } else {
            addPostForm.setValue('poll', undefined);
        }
        return isNowShowingPoll;
    });
  };

  const onAddPostSubmit: SubmitHandler<AddPostFormValues> = async (values) => {
    if (!user || !profile || !db) { toast({ variant: "destructive", title: "You must be logged in to post." }); return; }
    try {
        const postData: Partial<SocialFeedItem> = {
            author: user.displayName || "Anonymous",
            handle: profile.handle,
            avatar: user.photoURL || `https://source.unsplash.com/random/100x100?portrait,user`,
            time: "Just now", platform: "TechInk", headline: values.headline, content: values.content || "",
            url: "#", 
            likes: 0, comments: 0, views: 0,
            userId: user.uid,
        };

        if (values.imageUrl) {
            postData.imageUrl = values.imageUrl;
        }

        if(showPoll && values.poll && values.poll.options.length >= 2) {
            postData.content = "";
            const pollOptionsMap: { [key: string]: number } = {};
            for (const option of values.poll.options) {
                if (option.text) {
                    pollOptionsMap[option.text] = 0;
                }
            }
            postData.poll = { options: pollOptionsMap, voters: {} };
        } else {
             postData.poll = undefined;
        }

        await addDoc(collection(db, "feedItems"), { ...postData, createdAt: serverTimestamp() });

        toast({ title: "Post created!", description: "Your post is now live on the feed." });
        addPoints(25);
        setIsAddPostOpen(false);
        addPostForm.reset();
        setShowPoll(false);
        fetchFeed(true);
    } catch (error) {
        console.error("Error adding document: ", error);
        toast({ variant: "destructive", title: "Failed to create post", description: "Please try again." });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!process.env.NEXT_PUBLIC_IMGBB_API_KEY) {
        toast({ variant: "destructive", title: "Image Upload Disabled", description: "This feature is not configured." });
        return;
    }
    
    setIsUploading(true);
    toast({ title: "Uploading image..." });

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            addPostForm.setValue('imageUrl', result.data.url, { shouldValidate: true });
            toast({ title: "Success", description: "Image uploaded and URL is set." });
        } else {
            throw new Error(result.error?.message || 'Image upload failed.');
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Image Upload Failed", description: error.message });
    } finally {
        setIsUploading(false);
    }
};

  const loadMoreFeedItems = useCallback(() => {
    if (isLoading) return;
    const currentLength = visibleFeedItems.length;
    const nextItems = allFeedItems.slice(currentLength, currentLength + BATCH_SIZE);
    setVisibleFeedItems(prev => [...prev, ...nextItems]);
    if (currentLength + BATCH_SIZE >= allFeedItems.length) {
        setHasMore(false);
    }
  }, [allFeedItems, visibleFeedItems.length, isLoading]);

  const lastItemElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => { if (entries[0].isIntersecting && hasMore) { loadMoreFeedItems(); } });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, loadMoreFeedItems]);

  const filteredTopicHistory = topicHistory.filter(topic => 
      topic.headline.toLowerCase().includes(historySearchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-12 max-w-xl text-center"><h1 className="text-4xl font-extrabold md:text-6xl animate-gradient">Live Tech Feed</h1><p className="mt-4 text-lg text-muted-foreground">A curated feed of the latest buzz from across the tech world, managed by our team.</p><Button onClick={() => fetchFeed(true)} disabled={isLoading} className="mt-6"><RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />Refresh Feed</Button></div>
            <div className="flex flex-col gap-8">
              {pinnedTopic && <PinnedTopicCard item={pinnedTopic} onViewImage={setImageToView} />}
              {visibleFeedItems.map((item, index) => ( <div ref={visibleFeedItems.length === index + 1 ? lastItemElementRef : null} key={item.id}><FeedItemCard item={item} onViewImage={setImageToView} /></div> ))}
            </div>
            {isLoading && ( <div className="text-center py-12 flex justify-center items-center gap-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="text-muted-foreground">Loading new content...</span></div> )}
            {!isLoading && allFeedItems.length === 0 && !pinnedTopic && ( <div className="text-center py-12"><Card className="max-w-md mx-auto p-8 text-center bg-card/50"><Newspaper className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-xl font-semibold">The Feed is Quiet</h3><p className="mt-2 text-muted-foreground">There are no posts in the feed right now. Be the first to post!</p></Card></div> )}
            {!isLoading && !hasMore && visibleFeedItems.length > 0 && ( <div className="text-center py-12"><p className="text-muted-foreground">You've reached the end of the feed.</p></div> )}
          </div>
        </section>

        {topicHistory.length > 0 && (
            <section className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
                <div className="mx-auto max-w-3xl">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger><h2 className="text-2xl font-bold">Past Deep Dives</h2></AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-4 pt-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search past topics..."
                                            value={historySearchTerm}
                                            onChange={(e) => setHistorySearchTerm(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    {filteredTopicHistory.length > 0 ? (
                                        filteredTopicHistory.map(topic => (
                                            <Card key={topic.id} className="p-4 flex justify-between items-center"><div className="flex-1 mr-4">
                                                <h3 className="font-semibold truncate">{topic.headline}</h3>
                                                <p className="text-sm text-muted-foreground">{getDisplayTime(topic)}</p>
                                            </div><Button variant="ghost" asChild><ClientLink href={`/post/${topic.id}`}>Read More <FileText className="ml-2 h-4 w-4" /></ClientLink></Button></Card>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground text-center py-4">No topics found matching your search.</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </section>
        )}
        
        <section className="container mx-auto px-4 sm:px-6 py-12 md:py-24"><div className="mx-auto mb-12 max-w-2xl text-center"><h2 className="text-4xl font-extrabold">Social Pulse</h2><p className="mt-4 text-lg text-muted-foreground">A 3D view of the social sphere.</p></div><SocialCube3d /></section>
      </main>

       {user && (
          <Dialog open={isAddPostOpen} onOpenChange={setIsAddPostOpen}>
            <DialogTrigger asChild><Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg" size="icon"><Plus className="h-8 w-8" /><span className="sr-only">Add Post</span></Button></DialogTrigger>
            <DialogContent className="max-w-2xl flex flex-col h-full max-h-[90vh] p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>{showPoll ? 'Create a New Poll' : 'Create a New Post'}</DialogTitle>
                    <DialogDescription>Share your latest thoughts and insights with the community.</DialogDescription>
                </DialogHeader>
                 <Form {...addPostForm}>
                    <form onSubmit={addPostForm.handleSubmit(onAddPostSubmit)} id="add-post-form" className="flex-1 flex flex-col overflow-hidden">
                        <ScrollArea className="flex-1 p-6 pt-0">
                            <div className="space-y-4">
                                <FormField control={addPostForm.control} name="headline" render={({ field }) => ( <FormItem><Input className="border-0 border-b rounded-none focus-visible:ring-0 text-lg px-0" placeholder={showPoll ? "Ask a question..." : "Post Headline..."} {...field} /></FormItem> )}/>
                                {!showPoll && (
                                    <FormField control={addPostForm.control} name="content" render={({ field }) => ( 
                                        <FormItem>
                                            <Textarea placeholder="Share your detailed thoughts here... Markdown is supported and you can paste links!" className="border-0 focus-visible:ring-0 min-h-[150px] px-0" {...field} />
                                            <FormDescription className="text-right">
                                                {(field.value?.length || 0)} / {POST_CHARACTER_LIMIT}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem> 
                                    )}/>
                                )}
                                {showPoll && (
                                    <Card className="p-4 bg-muted/50">
                                        <div className="space-y-2">
                                            {fields.map((field, index) => (
                                                <FormField key={field.id} control={addPostForm.control} name={`poll.options.${index}.text`} render={({ field }) => (
                                                    <FormItem className="flex items-center gap-2">
                                                        <Input placeholder={`Option ${index + 1}`} {...field} className="bg-background" />
                                                         {fields.length > 2 && <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                                                    </FormItem>
                                                )} />
                                            ))}
                                            {fields.length < 4 && <Button type="button" variant="ghost" onClick={() => append({ text: "" })}>Add Option</Button>}
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </ScrollArea>
                        <div className="p-6 pt-2 border-t mt-auto flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                    <label htmlFor="image-upload" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "cursor-pointer")}>
                                        <ImageUp className="h-5 w-5" />
                                        <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                                    </label>
                                </TooltipTrigger><TooltipContent><p>Upload Image</p></TooltipContent></Tooltip></TooltipProvider>
                                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" onClick={handleTogglePoll}>
                                        <BarChart3 className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger><TooltipContent><p>{showPoll ? 'Switch to Post' : 'Add Poll'}</p></TooltipContent></Tooltip></TooltipProvider>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsAddPostOpen(false)}>Cancel</Button>
                                <Button type="submit" form="add-post-form" disabled={addPostForm.formState.isSubmitting}>{addPostForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Post</Button>
                            </div>
                        </div>
                    </form>
                 </Form>
            </DialogContent>
          </Dialog>
        )}
        <Dialog open={!!imageToView} onOpenChange={(isOpen) => !isOpen && setImageToView(null)}>
            <DialogContent className="max-w-[90vw] max-h-[90vh] w-auto h-auto bg-transparent border-none shadow-none p-0">
                {imageToView && <Image src={imageToView} alt="Full view" width={1920} height={1080} className="w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain rounded-lg" />}
            </DialogContent>
        </Dialog>
      <SiteFooter />
    </div>
  );
}

const PollDisplay = ({ poll, userVote, onVote, hasVoted }: { poll: Poll; userVote: string | undefined, onVote: (option: string) => void; hasVoted: boolean; }) => {
    const totalVotes = Object.values(poll.options).reduce((acc, votes) => acc + votes, 0);
  
    return (
      <div className="mt-4 space-y-2">
        {Object.entries(poll.options).map(([optionText, votes], index) => {
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isThisTheVotedOption = userVote === optionText;

            if (hasVoted) {
                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        className="relative w-full h-10 flex items-center rounded-md overflow-hidden border"
                    >
                        <motion.div
                            className="absolute h-full bg-primary/20 rounded-md"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%`}}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                        <div className="relative z-10 flex items-center justify-between w-full px-4">
                            <div className="flex items-center gap-2 font-semibold">
                               {isThisTheVotedOption && <CheckCircle2 className="h-4 w-4 text-primary" />} 
                               <span>{optionText}</span>
                            </div>
                            <span className="font-bold">{percentage}%</span>
                        </div>
                    </motion.div>
                );
            }
    
            return (
                 <motion.div key={index} whileTap={{ scale: 0.98 }}>
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => onVote(optionText)}
                    >
                        {optionText}
                    </Button>
                </motion.div>
            );
        })}
      </div>
    );
  };

export default function FeedPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen w-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <FeedPageComponent />
        </Suspense>
    )
}
