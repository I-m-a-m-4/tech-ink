
"use client";

import { Icons } from "@/components/icons";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { type SocialFeedItem } from "@/ai/schemas/social-feed-item-schema";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { Loader2, RefreshCw, Star, Plus, Bot, Eye, FileText, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SocialCube3d } from "@/components/social-cube-3d";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc, updateDoc, increment, addDoc, serverTimestamp, type Timestamp, onSnapshot, writeBatch } from "firebase/firestore";
import { Newspaper } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { analyzePost } from "@/ai/flows/analyze-post-flow";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSearchParams, useRouter } from 'next/navigation';
import ReactMarkdown from "react-markdown";

const BATCH_SIZE = 5;
const POST_CHARACTER_LIMIT = 1000;
const TRUNCATE_LENGTH = 350;

type SocialFeedItemWithId = SocialFeedItem & { 
    id: string;
    createdAt?: Timestamp;
    userId?: string;
    views?: number;
    comments: number;
};

type Comment = {
    id: string;
    text: string;
    author: string;
    avatar: string;
    userId: string;
    createdAt: Timestamp;
}

const addPostFormSchema = z.object({
  headline: z.string().min(10, { message: "Headline must be at least 10 characters." }).max(100, { message: "Headline must be less than 100 characters." }),
  content: z.string().min(20, { message: "Content must be at least 20 characters." }).max(POST_CHARACTER_LIMIT, { message: `Content must be less than ${POST_CHARACTER_LIMIT} characters.` }),
  url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }).optional().or(z.literal('')),
});
type AddPostFormValues = z.infer<typeof addPostFormSchema>;

const commentFormSchema = z.object({
    commentText: z.string().min(1, { message: "Comment cannot be empty." }).max(280, { message: "Comment is too long." }),
});
type CommentFormValues = z.infer<typeof commentFormSchema>;

const getDisplayTime = (item: SocialFeedItemWithId | Comment) => {
    if (item.createdAt && typeof item.createdAt.toDate === 'function') {
        return formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true });
    }
    return 'Just now';
};

const ExpandableText = ({ text }: { text: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const textContainerClasses = "mt-1 text-foreground/90 whitespace-pre-line prose prose-sm sm:prose-base dark:prose-invert max-w-none break-words";
    
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

const FeedItemCard = ({ item, onPostClick }: { item: SocialFeedItemWithId, onPostClick: (item: SocialFeedItemWithId) => void }) => {
    const { toast } = useToast();
    const { user, addPoints, likedPosts, addLike, removeLike } = useAuth();
    const [likeCount, setLikeCount] = useState(item.likes);

    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [analysisContent, setAnalysisContent] = useState('');
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    
    const cardRef = useRef<HTMLDivElement>(null);
    const displayTime = getDisplayTime(item);
    const isLiked = likedPosts.has(item.id);

    const handleLike = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "Login Required", description: "You must be logged in to like posts." });
            return;
        }

        const originalIsLiked = isLiked;
        const originalLikeCount = likeCount;

        try {
            if (originalIsLiked) {
                setLikeCount(c => c - 1);
                await removeLike(item.id, 'feedItems');
            } else {
                setLikeCount(c => c + 1);
                await addLike(item.id, 'feedItems');
                addPoints(1);
                toast({ title: "+1 Insight Point!", description: "You've earned a point for engaging with the community." });
            }
        } catch (error) {
             setLikeCount(originalLikeCount);
             toast({ variant: "destructive", title: "Something went wrong", description: "Could not update likes. Please try again." });
             console.error("Like error:", error);
        }
    };
    
    const handleShare = async () => {
       if (user) { addPoints(5); toast({ title: "+5 Insight Points!", description: "You've earned points for sharing." }); }
       if (typeof window === 'undefined') return;
       const shareUrl = `${window.location.origin}/feed?post=${item.id}`;
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
        toast({ title: "+10 Insight Points!", description: "You've earned points for your curiosity." });
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
            <Card ref={cardRef} className="bg-card/40 shadow-lg border-border/60 p-6 animate-in fade-in-50">
                <div className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={item.avatar} alt={item.author} />
                        <AvatarFallback>{item.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/u/${item.handle.substring(1)}`} className="font-bold hover:underline">{item.author}</Link>
                            <Link href={`/u/${item.handle.substring(1)}`} className="text-muted-foreground hover:underline">{item.handle}</Link>
                            <span className="text-muted-foreground hidden sm:inline">·</span>
                            <span className="text-muted-foreground">{displayTime}</span>
                        </div>
                        <div onClick={() => onPostClick(item)} className="group cursor-pointer">
                            <h3 className="mt-3 text-lg font-semibold group-hover:text-primary transition-colors">{item.headline}</h3>
                            <ExpandableText text={item.content} />
                             {item.imageUrl && (
                                <div className="relative aspect-video w-full overflow-hidden rounded-lg mt-4">
                                    <Image src={item.imageUrl} alt={item.headline} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-1 sm:gap-6 text-muted-foreground">
                            <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleLike}>
                                <Icons.heart className={`h-4 w-4 transition-all ${isLiked ? 'text-red-500 fill-current scale-110' : ''}`} />
                                <span>{likeCount}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => onPostClick(item)}>
                                <Icons.comment className="h-4 w-4" />
                                <span>{item.comments}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleShare}>
                                <Icons.share className="h-4 w-4" />
                                <span className="hidden sm:inline">Share</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleAnalyze}>
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
                    </div>
                </div>
            </Card>
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

const PinnedTopicCard = ({ item, onPostClick }: { item: SocialFeedItemWithId, onPostClick: (item: SocialFeedItemWithId) => void }) => {
    const { toast } = useToast();
    const { user, addPoints, likedPosts, addLike, removeLike } = useAuth();
    const [likeCount, setLikeCount] = useState(item.likes);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [analysisContent, setAnalysisContent] = useState('');
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const displayTime = getDisplayTime(item);
    const isLiked = likedPosts.has(item.id);

    const handleLike = async () => {
        if (!user) { toast({ variant: "destructive", title: "Login Required", description: "You must be logged in to like posts." }); return; }
        
        const originalIsLiked = isLiked;
        const originalLikeCount = likeCount;

        try {
            if (originalIsLiked) {
                setLikeCount(c => c - 1);
                await removeLike(item.id, 'dailyTopics');
            } else {
                setLikeCount(c => c + 1);
                await addLike(item.id, 'dailyTopics');
                addPoints(1);
                toast({ title: "+1 Insight Point!", description: "You've earned a point for engaging with the community." });
            }
        } catch (error) {
             setLikeCount(originalLikeCount);
             toast({ variant: "destructive", title: "Something went wrong", description: "Could not update likes. Please try again." });
        }
    };
    
    const handleShare = async () => {
        if (user) { addPoints(5); toast({ title: "+5 Insight Points!", description: "You've earned points for sharing." }); }
        if (typeof window === 'undefined') return;
        const shareUrl = `${window.location.origin}/feed?post=${item.id}`;
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
        toast({ title: "+10 Insight Points!", description: "You've earned points for your curiosity." });
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
            <Card className="bg-primary/10 border-primary/40 shadow-lg p-6 animate-in fade-in-50">
                <div className="flex gap-2 items-center mb-4">
                    <Star className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold text-primary">Topic of the Day</h2>
                </div>
                <div className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={item.avatar} alt={item.author} />
                        <AvatarFallback>{item.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/u/${item.handle.substring(1)}`} className="font-bold hover:underline">{item.author}</Link>
                            <Link href={`/u/${item.handle.substring(1)}`} className="text-muted-foreground hover:underline">{item.handle}</Link>
                            <span className="text-muted-foreground hidden sm:inline">·</span>
                            <span className="text-muted-foreground">{displayTime}</span>
                        </div>
                        <div onClick={() => onPostClick(item)} className="group cursor-pointer">
                            <h3 className="mt-4 text-xl font-semibold group-hover:text-primary transition-colors">{item.headline}</h3>
                            <ExpandableText text={item.content} />
                             {item.imageUrl && (
                                <div className="relative aspect-video w-full overflow-hidden rounded-lg mt-4">
                                    <Image src={item.imageUrl} alt={item.headline} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-1 sm:gap-6 text-muted-foreground">
                            <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleLike}>
                                <Icons.heart className={`h-4 w-4 transition-all ${isLiked ? 'text-red-500 fill-current scale-110' : ''}`} />
                                <span>{likeCount}</span>
                            </Button>
                             <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => onPostClick(item)}>
                                <Icons.comment className="h-4 w-4" />
                                <span>{item.comments}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleShare}>
                                <Icons.share className="h-4 w-4" />
                                <span className="hidden sm:inline">Share</span>
                            </Button>
                             <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={handleAnalyze}>
                                <Bot className="h-4 w-4" />
                                <span className="hidden sm:inline">Analyze</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
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
  const observer = useRef<IntersectionObserver>();
  const { toast } = useToast();
  const { user, profile, addPoints } = useAuth();
  
  const [activePost, setActivePost] = useState<SocialFeedItemWithId | null>(null);
  const [isPostDetailOpen, setIsPostDetailOpen] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const commentForm = useForm<CommentFormValues>({ resolver: zodResolver(commentFormSchema), defaultValues: { commentText: "" } });

  const addPostForm = useForm<AddPostFormValues>({ resolver: zodResolver(addPostFormSchema), defaultValues: { headline: "", content: "", url: "", imageUrl: "" } });
  const watchedImageUrl = addPostForm.watch('imageUrl');
  const watchedContent = addPostForm.watch('content');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const input = watchedImageUrl || '';
    const srcRegex = /<img[^>]+src="([^">]+)"/;
    const match = input.match(srcRegex);
    const potentialUrl = match ? match[1] : input;

    try {
        new URL(potentialUrl);
        setPreviewUrl(potentialUrl);
        if (match) {
            addPostForm.setValue('imageUrl', potentialUrl, { shouldValidate: true });
        }
    } catch (e) {
        setPreviewUrl(null);
    }
  }, [watchedImageUrl, addPostForm]);

  const handleOpenPostDetail = useCallback(async (post: SocialFeedItemWithId) => {
    setActivePost(post);
    setIsPostDetailOpen(true);
    
    if (!db) return;

    setIsCommentsLoading(true);
    const isTopicPost = post.id === pinnedTopic?.id;
    const collectionName = isTopicPost ? 'dailyTopics' : 'feedItems';
    const commentsRef = collection(db, collectionName, post.id, "comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"));
    try { 
        onSnapshot(q, (snapshot) => { 
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment))); 
            setIsCommentsLoading(false); 
        });
    } catch (error) { 
        toast({ variant: "destructive", title: "Failed to load comments." });
        setIsCommentsLoading(false); 
    }
  }, [pinnedTopic?.id, toast]);

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
        
        // Prevent pinned topic from appearing in the main feed
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
  
  useEffect(() => {
    if (isLoading) return;
    const postId = searchParams.get('post');
    if (postId) {
        const findPost = async () => {
            let post: SocialFeedItemWithId | null = null;
            if (pinnedTopic?.id === postId) {
                post = pinnedTopic;
            } else {
                post = allFeedItems.find(p => p.id === postId) || null;
            }

            if(post) {
                handleOpenPostDetail(post);
            } else if (db) { 
                const feedItemRef = doc(db, 'feedItems', postId);
                const topicItemRef = doc(db, 'dailyTopics', postId);
                const [feedSnap, topicSnap] = await Promise.all([getDoc(feedItemRef), getDoc(topicItemRef)]);
                if(feedSnap.exists()){
                     handleOpenPostDetail({id: feedSnap.id, ...feedSnap.data()} as SocialFeedItemWithId)
                } else if (topicSnap.exists()) {
                     handleOpenPostDetail({id: topicSnap.id, ...topicSnap.data()} as SocialFeedItemWithId)
                }
            }
             router.replace('/feed', { scroll: false });
        }
        findPost();
    }
  }, [isLoading, allFeedItems, pinnedTopic, searchParams, router, handleOpenPostDetail]);

  const onAddPostSubmit: SubmitHandler<AddPostFormValues> = async (values) => {
    if (!user || !profile || !db) { toast({ variant: "destructive", title: "You must be logged in to post." }); return; }
    try {
        await addDoc(collection(db, "feedItems"), {
            author: user.displayName || "Anonymous",
            handle: profile.handle,
            avatar: user.photoURL || `https://source.unsplash.com/random/100x100?portrait,user`,
            time: "Just now", platform: "TechInk", headline: values.headline, content: values.content,
            url: values.url || "#", 
            imageUrl: values.imageUrl || null,
            likes: 0, comments: 0, views: 0, createdAt: serverTimestamp(), userId: user.uid,
        });
        toast({ title: "Post created!", description: "Your post is now live on the feed." });
        addPoints(25);
        setIsAddPostOpen(false);
        addPostForm.reset();
        fetchFeed(true);
    } catch (error) {
        console.error("Error adding document: ", error);
        toast({ variant: "destructive", title: "Failed to create post", description: "Please try again." });
    }
  }

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

    const handlePostComment: SubmitHandler<CommentFormValues> = async (data) => {
        if (!user || !activePost || !db) return;
        
        const isTopicPost = activePost.id === pinnedTopic?.id;
        const collectionName = isTopicPost ? 'dailyTopics' : 'feedItems';
        
        const batch = writeBatch(db);
        const commentsRef = collection(db, collectionName, activePost.id, "comments");
        const postRef = doc(db, collectionName, activePost.id);
        const newCommentRef = doc(commentsRef);

        batch.set(newCommentRef, {
            text: data.commentText,
            author: user.displayName || "Anonymous",
            avatar: user.photoURL || `https://source.unsplash.com/random/100x100?portrait,user`,
            userId: user.uid,
            createdAt: serverTimestamp(),
        });
        batch.update(postRef, { comments: increment(1) });
        
        if (activePost.userId && activePost.userId !== user.uid) {
            const notificationRef = doc(collection(db, 'notifications'));
            batch.set(notificationRef, {
                recipientId: activePost.userId,
                senderId: user.uid,
                senderName: user.displayName || "Anonymous",
                type: 'comment',
                postId: activePost.id,
                postHeadline: activePost.headline,
                read: false,
                createdAt: serverTimestamp(),
            });
        }
        
        try {
            await batch.commit();

            addPoints(5);
            toast({ title: "Comment posted!" });
            commentForm.reset();
            
            const updateItemComments = (item: SocialFeedItemWithId) => item.id === activePost.id ? { ...item, comments: item.comments + 1} : item;
            setAllFeedItems(prev => prev.map(updateItemComments));
            setVisibleFeedItems(prev => prev.map(updateItemComments));
            if (isTopicPost) { setPinnedTopic(prev => prev ? { ...prev, comments: prev.comments + 1} : null); }
            setActivePost(prev => prev ? { ...prev, comments: prev.comments + 1} : null);

        } catch (error) { toast({ variant: "destructive", title: "Failed to post comment" }); }
    };

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
              {pinnedTopic && <PinnedTopicCard item={pinnedTopic} onPostClick={handleOpenPostDetail} />}
              {visibleFeedItems.map((item, index) => ( <div ref={visibleFeedItems.length === index + 1 ? lastItemElementRef : null} key={item.id}><FeedItemCard item={item} onPostClick={handleOpenPostDetail} /></div> ))}
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
                                            </div><Button variant="ghost" onClick={() => handleOpenPostDetail(topic)}>Read More <FileText className="ml-2 h-4 w-4" /></Button></Card>
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
            <DialogContent><DialogHeader><DialogTitle>Create a New Post</DialogTitle><DialogDescription>Share your latest thoughts and insights with the community.</DialogDescription></DialogHeader>
                 <Form {...addPostForm}><form onSubmit={addPostForm.handleSubmit(onAddPostSubmit)} className="space-y-4">
                        <FormField control={addPostForm.control} name="headline" render={({ field }) => ( <FormItem><FormLabel>Headline</FormLabel><FormControl><Input placeholder="e.g., My Thoughts on the Future of AI" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={addPostForm.control} name="content" render={({ field }) => ( 
                            <FormItem>
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Share your detailed thoughts here... Markdown is supported!" className="min-h-[200px]" {...field} />
                                </FormControl>
                                <FormDescription className="text-right">
                                    {(watchedContent?.length || 0)} / {POST_CHARACTER_LIMIT}
                                </FormDescription>
                                <FormMessage />
                            </FormItem> 
                        )}/>
                        <FormField control={addPostForm.control} name="url" render={({ field }) => ( <FormItem><FormLabel>Link (Optional)</FormLabel><FormControl><Input placeholder="https://example.com" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={addPostForm.control} name="imageUrl" render={({ field }) => ( 
                            <FormItem>
                                <FormLabel>Image URL or Embed Code (Optional)</FormLabel>
                                <FormControl><Input placeholder="Paste image URL or embed code..." {...field} /></FormControl>
                                {previewUrl && (
                                    <div className="mt-4 relative aspect-video w-full overflow-hidden rounded-md border">
                                        <Image src={previewUrl} alt="Image preview" fill className="object-cover" />
                                    </div>
                                )}
                                <FormMessage />
                            </FormItem> 
                        )}/>
                        <DialogFooter><Button type="button" variant="ghost" onClick={() => setIsAddPostOpen(false)}>Cancel</Button><Button type="submit" disabled={addPostForm.formState.isSubmitting}>{addPostForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Post</Button></DialogFooter>
                 </form></Form>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={isPostDetailOpen} onOpenChange={setIsPostDetailOpen}>
            <DialogContent className="max-w-2xl flex flex-col h-[90vh]">
                {activePost && (
                    <>
                        <DialogHeader>
                            <DialogTitle>{activePost.headline}</DialogTitle>
                            <DialogDescription>By {activePost.author} ({activePost.handle}) &bull; {getDisplayTime(activePost)}</DialogDescription>
                        </DialogHeader>
                        <Separator />
                        <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full pr-4">
                                 <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none whitespace-pre-line mt-4">
                                    <ReactMarkdown>{activePost.content}</ReactMarkdown>
                                </div>
                                {activePost.imageUrl && (
                                    <div className="relative aspect-video w-full overflow-hidden rounded-lg my-4">
                                        <Image src={activePost.imageUrl} alt={activePost.headline} fill className="object-cover" />
                                    </div>
                                )}
                                <Separator className="my-6" />
                                <h3 className="text-lg font-semibold mb-4">Comments</h3>
                                {isCommentsLoading ? (
                                    <div className="space-y-4">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="flex items-center space-x-4">
                                                <div className="rounded-full bg-muted h-10 w-10 animate-pulse"></div>
                                                <div className="space-y-2">
                                                    <div className="h-4 bg-muted rounded w-[250px] animate-pulse"></div>
                                                    <div className="h-4 bg-muted rounded w-[200px] animate-pulse"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : comments.length > 0 ? (
                                    <div className="space-y-4">
                                        {comments.map(comment => (
                                            <div key={comment.id} className="flex items-start gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={comment.avatar} />
                                                    <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm">{comment.author}</span>
                                                        <span className="text-xs text-muted-foreground">{getDisplayTime(comment)}</span>
                                                    </div>
                                                    <p className="text-sm text-foreground/90">{comment.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                        <p>No comments yet. Be the first to start the conversation!</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                        <Separator />
                        <div className="mt-auto pt-4">
                             {user ? (
                                <Form {...commentForm}>
                                    <form onSubmit={commentForm.handleSubmit(handlePostComment)} className="flex items-center gap-2">
                                        <FormField control={commentForm.control} name="commentText" render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input placeholder="Add a comment..." {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                        <Button type="submit" disabled={commentForm.formState.isSubmitting}>
                                            {commentForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                                        </Button>
                                    </form>
                                </Form>
                            ) : (
                                <div className="text-center">
                                    <Button asChild><Link href="/login">Log in to comment</Link></Button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
      <SiteFooter />
    </div>
  );
}

export default function FeedPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen w-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <FeedPageComponent />
        </Suspense>
    )
}

    