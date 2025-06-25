
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, DocumentData, setDoc, getDoc, limit, writeBatch } from 'firebase/firestore';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useForm, SubmitHandler } from 'react-hook-form';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Loader2, Trash2, Edit, PlusCircle, LogIn, Bot, User as UserIcon, Star, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateArticles } from '@/ai/flows/generate-articles-flow';
import type { Article } from '@/ai/schemas/article-schema';
import { type Insight } from '@/ai/flows/generate-insights-flow';
import { type SocialFeedItem } from '@/ai/schemas/social-feed-item-schema';
import { type TimelineEvent } from '@/ai/schemas/timeline-schema';
import { generateTopicOfTheDay } from '@/ai/flows/generate-topic-of-the-day-flow';
import { generateTimeline } from '@/ai/flows/generate-timeline-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { generateChartData } from '@/ai/flows/generate-chart-data-flow';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';

const IMGBB_API_KEY = (process.env.NEXT_PUBLIC_IMGBB_API_KEY || "").trim();
const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "bimex4@gmail.com").toLowerCase();

type ArticleWithId = Article & { id: string };
type InsightWithId = Insight & { id: string };
type SocialFeedItemWithId = SocialFeedItem & { id: string, views?: number, userId?: string, comments: number };
type TimelineData = { id: string; topic: string; events: TimelineEvent[]; createdAt?: any; };

const SkeletonCard = () => (
    <Card>
        <Skeleton className="rounded-t-lg aspect-video" />
        <CardHeader>
            <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
        </CardContent>
        <CardFooter className="border-t flex justify-end gap-2 pt-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
        </CardFooter>
    </Card>
);

const newsCategories = [
    'Bio-integrated AI', 
    'Quantum Computing', 
    'Decentralized Physics', 
    'Next-Gen Hardware', 
    'Predictive Cybersecurity', 
    'Developer Cognition', 
    'Space Tech', 
    'Autonomous Logistics', 
    'Generative Materials', 
    'AI & ML', 
    'Cybersecurity', 
    'Developer Tools', 
    'Web3 & Blockchain', 
    'Hardware & Gadgets'
];


// --- News Manager Component ---
const NewsManager = () => {
    const [articles, setArticles] = useState<ArticleWithId[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editingArticle, setEditingArticle] = useState<ArticleWithId | null>(null);
    const { toast } = useToast();
    const form = useForm<Article>();

    const fetchArticles = useCallback(async () => {
        if (!db) return;
        setIsLoading(true);
        try {
            const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArticleWithId)));
        } catch (error) {
            console.error("Error fetching articles: ", error);
            toast({ variant: "destructive", title: "Failed to fetch articles." });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (db) fetchArticles();
    }, [fetchArticles]);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!IMGBB_API_KEY) {
            toast({ variant: "destructive", title: "Image Upload Disabled", description: "Please configure an ImgBB API key in your environment variables." });
            return;
        }

        setIsUploading(true);
        toast({ title: "Uploading image..." });

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                form.setValue('imageUrl', result.data.url);
                toast({ title: "Success", description: "Image uploaded and URL is set." });
            } else {
                throw new Error(result.error?.message || 'Image upload failed. Check API key or console for details.');
            }
        } catch (error: any) {
            console.error("ImgBB upload error:", error);
            toast({ variant: "destructive", title: "Image Upload Failed", description: "This is likely due to an invalid ImgBB API key. Please check your key in the .env.local file and restart the server." });
        } finally {
            setIsUploading(false);
        }
    };


    const onSubmit: SubmitHandler<Article> = async (data) => {
        if (!db) return;
        setIsSubmitting(true);
        try {
            const dataToSave: Partial<Article> & { createdAt?: any } = { ...data };
            if (!dataToSave.externalUrl) {
                delete dataToSave.externalUrl;
            }

            if (editingArticle) {
                const articleRef = doc(db, 'articles', editingArticle.id);
                await updateDoc(articleRef, dataToSave);
                toast({ title: "Success", description: "Article updated." });
            } else {
                dataToSave.createdAt = serverTimestamp();
                await addDoc(collection(db, 'articles'), dataToSave);
                toast({ title: "Success", description: "Article added." });
            }
            fetchArticles();
            closeDialog();
        } catch (error) {
            console.error("Error saving article: ", error);
            toast({ variant: "destructive", title: "Failed to save article." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateArticles = async () => {
        if (!db) return;
        setIsGenerating(true);
        toast({ title: "🤖 AI is at work...", description: "Generating 9 new articles. This might take a moment." });
        try {
            const { articles: generatedArticles } = await generateArticles({ count: 9 });
            if (!generatedArticles || generatedArticles.length === 0) {
                throw new Error("AI failed to generate articles.");
            }
    
            const articlePromises = generatedArticles.map(article => 
                addDoc(collection(db, 'articles'), { ...article, createdAt: serverTimestamp() })
            );
            await Promise.all(articlePromises);
            
            toast({ title: "✅ Success!", description: "9 new articles have been added to Firestore." });
            fetchArticles();
        } catch (error: any) {
            console.error("Error generating articles with AI: ", error);
            const description = error.message?.toLowerCase().includes('api key') 
                ? "This is likely due to an invalid Google AI API key. Please check your GOOGLE_API_KEY in the .env.local file and restart the server."
                : "Could not generate new articles. Please check the server console for more details.";
            toast({ 
                variant: "destructive", 
                title: "AI Generation Failed", 
                description
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEdit = (article: ArticleWithId) => {
        setEditingArticle(article);
        form.setValue('title', article.title);
        form.setValue('description', article.description);
        form.setValue('content', article.content || '');
        form.setValue('imageUrl', article.imageUrl);
        form.setValue('imageAiHint', article.imageAiHint);
        form.setValue('category', article.category);
        form.setValue('externalUrl', article.externalUrl || '');
    };

    const handleDelete = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'articles', id));
            toast({ title: "Success", description: "Article deleted." });
            fetchArticles();
        } catch (error) {
            console.error("Error deleting article:", error);
            toast({ variant: "destructive", title: "Failed to delete article." });
        }
    };

    const closeDialog = () => {
        setEditingArticle(null);
        form.reset();
        document.getElementById('news-dialog-close')?.click();
    };

    const ArticleForm = () => (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., AI Achieves Sentience" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description (for previews)</FormLabel><FormControl><Textarea placeholder="A short summary for previews..." {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="content" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Full Article Content</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Full article content..." className="min-h-[300px] text-sm" {...field} />
                        </FormControl>
                        <FormDescription>Markdown is supported for formatting (e.g., ### for headings, ** for bold, * for lists).</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="externalUrl" render={({ field }) => ( <FormItem><FormLabel>External URL (Optional)</FormLabel><FormControl><Input placeholder="https://example.com/full-article" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                
                <div>
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input id="imageUrl" placeholder="https://source.unsplash.com/random/800x400?tech" {...form.register('imageUrl', { required: true })} disabled={isUploading} />
                </div>
                <div>
                    <Label htmlFor="imageUpload">Or Upload Image</Label>
                    <Input id="imageUpload" type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading || isSubmitting} className="file:text-primary file:font-semibold" />
                    {isUploading && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> 
                            Uploading, please wait...
                        </p>
                    )}
                </div>
                
                <FormField control={form.control} name="imageAiHint" render={({ field }) => ( <FormItem><FormLabel>Image AI Hint</FormLabel><FormControl><Input placeholder="e.g., quantum computer" {...field} /></FormControl><FormMessage /></FormItem> )}/>

                <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                         <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {newsCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={closeDialog}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting || isUploading}>
                        {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingArticle ? 'Update' : 'Add'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );

    return (
        <div>
            <div className="flex flex-wrap gap-4 mb-8">
                <Dialog onOpenChange={(open) => !open && closeDialog()}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Manually</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingArticle ? 'Edit' : 'Add'} News Article</DialogTitle>
                            <DialogDescription>Fill in the details for the article. Click the save button when you're done.</DialogDescription>
                        </DialogHeader>
                        <ArticleForm />
                    </DialogContent>
                    <DialogClose id="news-dialog-close" className="hidden" />
                </Dialog>
                <Button onClick={handleGenerateArticles} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Generate with AI
                </Button>
            </div>

            {isLoading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : articles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map((article) => (
                        <Card key={article.id} className="flex flex-col">
                            <CardHeader>
                                <img src={article.imageUrl} alt={article.title} className="rounded-t-lg object-cover aspect-video" />
                                <CardTitle className="pt-4">{article.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground line-clamp-3">{article.description}</p>
                                <p className="text-sm font-bold mt-2 text-primary">{article.category}</p>
                            </CardContent>
                            <CardFooter className="border-t flex justify-end gap-2 pt-4">
                                <Dialog onOpenChange={(open) => !open && closeDialog()}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => handleEdit(article)}><Edit className="h-4 w-4" /></Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Edit News Article</DialogTitle>
                                            <DialogDescription>Make changes to this article. Click the update button when you're done.</DialogDescription>
                                        </DialogHeader>
                                        <ArticleForm />
                                    </DialogContent>
                                </Dialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete this article.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))} onClick={() => handleDelete(article.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-center py-12">No news articles found. Use the buttons above to add some.</p>
            )}
        </div>
    );
};

// --- Insights Manager Component ---
const InsightsManager = () => {
    const [insights, setInsights] = useState<InsightWithId[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingChart, setIsGeneratingChart] = useState(false);
    const [editingInsight, setEditingInsight] = useState<InsightWithId | null>(null);
    const { toast } = useToast();
    const { register, handleSubmit, reset, setValue, watch } = useForm<Omit<InsightWithId, 'id'>>();
    
    const watchedType = watch('type', 'quote');
    const watchedTitle = watch('title');
    const watchedDescription = watch('description');


    const fetchInsights = useCallback(async () => {
        if (!db) return;
        setIsLoading(true);
        try {
            const q = query(collection(db, 'insights'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            setInsights(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InsightWithId)));
        } catch (error) {
            console.error("Error fetching insights: ", error);
            toast({ variant: "destructive", title: "Failed to fetch insights." });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (db) fetchInsights();
    }, [fetchInsights]);

    const handleGenerateChart = async () => {
        if (!watchedTitle || !watchedDescription || watchedType === 'quote') return;
        setIsGeneratingChart(true);
        toast({ title: "🤖 AI is generating your chart...", description: "This might take a moment." });
        try {
            const result = await generateChartData({
                title: watchedTitle,
                description: watchedDescription,
                type: watchedType
            });
            setValue('data', JSON.stringify(JSON.parse(result.data), null, 2));
            setValue('config', JSON.stringify(JSON.parse(result.config), null, 2));
            toast({ title: "✅ Chart Data Generated!", description: "The data and config fields have been populated." });
        } catch (e: any) {
            console.error("Error generating chart data:", e);
            const description = e.message?.toLowerCase().includes('api key') 
                ? "This is likely due to an invalid Google AI API key. Please check your GOOGLE_API_KEY in the .env.local file and restart the server."
                : "Could not generate chart data. Please check the server console for more details.";
            toast({ 
                variant: "destructive", 
                title: "AI Generation Failed", 
                description
            });
        } finally {
            setIsGeneratingChart(false);
        }
    }

    const onSubmit: SubmitHandler<any> = async (data) => {
        if (!db) return;
        setIsSubmitting(true);
        try {
            let insightData: Partial<Insight> & { createdAt?: any } = {...data};
            // Safely parse JSON fields
            if (insightData.type !== 'quote') {
                try {
                    insightData.data = JSON.parse(insightData.data);
                    insightData.config = JSON.parse(insightData.config);
                } catch (e) {
                    toast({ variant: "destructive", title: "Invalid JSON", description: "Please check the format of the data and config fields." });
                    setIsSubmitting(false);
                    return;
                }
            } else {
                delete insightData.data;
                delete insightData.config;
            }

            if (editingInsight) {
                const insightRef = doc(db, 'insights', editingInsight.id);
                await updateDoc(insightRef, insightData);
                toast({ title: "Success", description: "Insight updated." });
            } else {
                insightData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'insights'), insightData);
                toast({ title: "Success", description: "Insight added." });
            }
            fetchInsights();
            closeDialog();
        } catch (error) {
            console.error("Error saving insight: ", error);
            toast({ variant: "destructive", title: "Failed to save insight." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleEdit = (insight: InsightWithId) => {
        setEditingInsight(insight);
        setValue('title', insight.title);
        setValue('description', insight.description);
        setValue('type', insight.type);
        if (insight.type === 'quote' && insight.quote) {
            setValue('quote.text', insight.quote.text);
            setValue('quote.author', insight.quote.author);
        } else {
            setValue('data', JSON.stringify(insight.data, null, 2));
            setValue('config', JSON.stringify(insight.config, null, 2));
        }
    };

    const handleDelete = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'insights', id));
            toast({ title: "Success", description: "Insight deleted." });
            fetchInsights();
        } catch (error) {
            console.error("Error deleting insight:", error);
            toast({ variant: "destructive", title: "Failed to delete insight." });
        }
    };
    
    const closeDialog = () => {
        setEditingInsight(null);
        reset();
        document.getElementById('insight-dialog-close')?.click();
    };

    const InsightForm = () => (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input placeholder="e.g., Developer Productivity Trends" {...register('title', { required: true })} />
            <Textarea placeholder="An analysis of recent trends in the developer tool market..." {...register('description', { required: true })} />
             <div>
                <Label>Type</Label>
                <Select onValueChange={(v: any) => setValue('type', v)} defaultValue={watchedType}>
                    <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="quote">Quote</SelectItem>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="area">Area Chart</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            {watchedType === 'quote' ? (
                <>
                    <Input placeholder="The future is already here – it's just not evenly distributed." {...register('quote.text')} />
                    <Input placeholder="e.g., William Gibson" {...register('quote.author')} />
                </>
            ) : (
                <>
                    <Button type="button" onClick={handleGenerateChart} disabled={isGeneratingChart || !watchedTitle || !watchedDescription}>
                        {isGeneratingChart ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                        Generate Chart with AI
                    </Button>
                    <Textarea placeholder='e.g., [{"name":"2022","value":10}]' {...register('data')} className="min-h-[150px] font-mono text-xs" />
                    <Textarea placeholder='e.g., {"value":{"label":"Productivity"}}' {...register('config')} className="min-h-[150px] font-mono text-xs" />
                </>
            )}

            <DialogFooter>
                <Button type="button" variant="ghost" onClick={closeDialog}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingInsight ? 'Update' : 'Add'}
                </Button>
            </DialogFooter>
        </form>
    );

    return (
        <div>
            <Dialog onOpenChange={(open) => !open && closeDialog()}>
                <DialogTrigger asChild>
                    <Button className="mb-8"><PlusCircle className="mr-2 h-4 w-4" /> Add Insight</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingInsight ? 'Edit' : 'Add'} Insight</DialogTitle>
                        <DialogDescription>Create or edit a data insight. This can be a chart or a quote.</DialogDescription>
                    </DialogHeader>
                    <InsightForm />
                </DialogContent>
                <DialogClose id="insight-dialog-close" className="hidden" />
            </Dialog>

             {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : insights.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {insights.map((insight) => (
                        <Card key={insight.id} className="flex flex-col">
                            <CardHeader><CardTitle>{insight.title}</CardTitle></CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground">{insight.description}</p>
                                <p className="text-sm font-bold mt-2 text-primary capitalize">{insight.type}</p>
                            </CardContent>
                            <CardFooter className="border-t flex justify-end gap-2 pt-4">
                                <Dialog onOpenChange={(open) => !open && closeDialog()}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => handleEdit(insight)}><Edit className="h-4 w-4" /></Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Edit Insight</DialogTitle>
                                            <DialogDescription>Make changes to this insight. Click the update button when you're done.</DialogDescription>
                                        </DialogHeader>
                                        <InsightForm />
                                    </DialogContent>
                                </Dialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete this insight.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))} onClick={() => handleDelete(insight.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-center py-12">No insights found.</p>
            )}
        </div>
    );
};

// --- Feed Manager Component ---
const FeedManager = () => {
    const [feedItems, setFeedItems] = useState<SocialFeedItemWithId[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editingItem, setEditingItem] = useState<SocialFeedItemWithId | null>(null);
    const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
    const [currentTopic, setCurrentTopic] = useState<SocialFeedItemWithId | null>(null);
    const { toast } = useToast();
    const { register, handleSubmit, reset, setValue } = useForm<Omit<SocialFeedItemWithId, 'id'>>();
    const [postFilter, setPostFilter] = useState('all'); // 'all', 'user', 'admin'

    const fetchFeedItems = useCallback(async () => {
        if (!db) return;
        setIsLoading(true);
        try {
            const q = query(collection(db, 'feedItems'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            setFeedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialFeedItemWithId)));
        } catch (error) {
            console.error("Error fetching feed items: ", error);
            toast({ variant: "destructive", title: "Failed to fetch feed items." });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const filteredFeedItems = useMemo(() => {
        if (postFilter === 'user') {
            return feedItems.filter(item => !!item.userId);
        }
        if (postFilter === 'admin') {
            return feedItems.filter(item => !item.userId);
        }
        return feedItems;
    }, [feedItems, postFilter]);

    const fetchCurrentTopic = useCallback(async () => {
        if (!db) return;
        try {
            const q = query(collection(db, 'dailyTopics'), orderBy('createdAt', 'desc'), limit(1));
            const topicSnap = await getDocs(q);
            if (!topicSnap.empty) {
                const latestTopic = topicSnap.docs[0];
                setCurrentTopic({ id: latestTopic.id, ...latestTopic.data() } as SocialFeedItemWithId);
            } else {
                setCurrentTopic(null);
            }
        } catch (error) {
            console.error("Error fetching current topic: ", error);
        }
    }, []);

    useEffect(() => {
        if(db) {
            fetchFeedItems();
            fetchCurrentTopic();
        }
    }, [fetchFeedItems, fetchCurrentTopic]);

    const handleGenerateTopic = async () => {
        if (!db) return;
        setIsGeneratingTopic(true);
        toast({ title: "🤖 Generating Topic of the Day...", description: "The AI is crafting a featured post. This may take a moment." });
        try {
            const post = await generateTopicOfTheDay({ theme: "Visionary Tech Leaders and Companies" });
            const dailyTopicsCollection = collection(db, 'dailyTopics');
            await addDoc(dailyTopicsCollection, { ...post, createdAt: serverTimestamp() });
            
            toast({ title: "✅ Success!", description: "New Topic of the Day has been generated and will appear at the top of the feed." });
            fetchCurrentTopic(); // Refresh the displayed topic
        } catch (error: any) {
            console.error("Error generating Topic of the Day:", error);
            const description = error.message?.toLowerCase().includes('api key') 
                ? "This is likely due to an invalid Google AI API key. Please check your GOOGLE_API_KEY in the .env.local file and restart the server."
                : "Could not generate the featured post. Please check the server console for more details.";
            toast({ 
                variant: "destructive", 
                title: "AI Generation Failed", 
                description
            });
        } finally {
            setIsGeneratingTopic(false);
        }
    };
    
    const handlePin = async (itemToPin: SocialFeedItemWithId) => {
        if (!db) return;
        try {
            const { id: oldId, ...postData } = itemToPin;
            const newTopicData = { ...postData, createdAt: serverTimestamp() }; 
    
            const batch = writeBatch(db);
            const newTopicRef = doc(collection(db, 'dailyTopics'));
            batch.set(newTopicRef, newTopicData);
    
            // Delete the original post from the 'feedItems' collection if it was a user post
            if (itemToPin.userId) {
                batch.delete(doc(db, 'feedItems', oldId));
            }
    
            await batch.commit();
            
            toast({ title: "Success!", description: "Post has been pinned as the new Topic of the Day." });
            fetchFeedItems();
            fetchCurrentTopic();
        } catch (error) {
            console.error("Error pinning post:", error);
            toast({ variant: "destructive", title: "Pinning Failed", description: "Could not pin the post." });
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!IMGBB_API_KEY) {
            toast({ variant: "destructive", title: "Image Upload Disabled", description: "Please configure an ImgBB API key in your environment variables." });
            return;
        }

        setIsUploading(true);
        toast({ title: "Uploading image..." });

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                setValue('imageUrl', result.data.url);
                toast({ title: "Success", description: "Image uploaded and URL is set." });
            } else {
                throw new Error(result.error?.message || 'Image upload failed.');
            }
        } catch (error: any) {
            console.error("ImgBB upload error:", error);
            toast({ variant: "destructive", title: "Image Upload Failed", description: "This is likely due to an invalid ImgBB API key. Please check your key in the .env.local file and restart the server." });
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit: SubmitHandler<any> = async (data) => {
        if (!db) return;
        setIsSubmitting(true);
        try {
            const payload: Partial<SocialFeedItem> = { 
                ...data,
                author: "Bime",
                handle: "@bime",
                time: "Just now",
                avatar: "https://source.unsplash.com/random/100x100?portrait,man" // Static avatar for admin
            };
            
            if (editingItem) {
                await updateDoc(doc(db, 'feedItems', editingItem.id), payload);
                toast({ title: "Success", description: "Feed item updated." });
            } else {
                await addDoc(collection(db, 'feedItems'), { 
                    ...payload, 
                    likes: 0, 
                    comments: 0, 
                    views: 0,
                    createdAt: serverTimestamp() 
                });
                toast({ title: "Success", description: "Feed item added." });
            }
            fetchFeedItems();
            closeDialog();
        } catch (error) {
            console.error("Error saving feed item: ", error);
            toast({ variant: "destructive", title: "Failed to save feed item." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (item: SocialFeedItemWithId) => {
        setEditingItem(item);
        const { id, createdAt, likes, comments, views, ...formData } = item;
        Object.keys(formData).forEach(key => {
            setValue(key as keyof typeof formData, formData[key as keyof typeof formData]);
        });
    };

    const handleDelete = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'feedItems', id));
            toast({ title: "Success", description: "Feed item deleted." });
            fetchFeedItems();
        } catch (error) {
            console.error("Error deleting feed item:", error);
            toast({ variant: "destructive", title: "Failed to delete feed item." });
        }
    };
    
    const closeDialog = () => {
        setEditingItem(null);
        reset();
        document.getElementById('feed-dialog-close')?.click();
    };

    const FeedForm = () => (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input placeholder="e.g., My Thoughts on the New Framework" {...register('headline')} />
            <Textarea placeholder="Share the details of the post here..." {...register('content')} />
            <div>
                <Label>Platform</Label>
                <Select onValueChange={(v: any) => setValue('platform', v)} defaultValue={editingItem?.platform}>
                    <SelectTrigger><SelectValue placeholder="Platform" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Twitter">Twitter</SelectItem>
                        <SelectItem value="YouTube">YouTube</SelectItem>
                        <SelectItem value="Instagram">Instagram</SelectItem>
                        <SelectItem value="TechInk">TechInk</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Input placeholder="e.g., https://twitter.com/post/123" {...register('url')} />
            <div>
                <Label htmlFor="feedImageUrl">Image URL (Optional)</Label>
                <Input id="feedImageUrl" placeholder="https://source.unsplash.com/random/800x400?code" {...register('imageUrl')} disabled={isUploading} />
            </div>
            <div>
                <Label htmlFor="feedImageUpload">Or Upload Image</Label>
                <Input id="feedImageUpload" type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading || isSubmitting} className="file:text-primary file:font-semibold" />
                {isUploading && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> 
                        Uploading, please wait...
                    </p>
                )}
            </div>
            <Input placeholder="e.g., abstract code" {...register('imageAiHint')} />

            <DialogFooter>
                <Button type="button" variant="ghost" onClick={closeDialog}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || isUploading}>
                    {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingItem ? 'Update' : 'Add'}
                </Button>
            </DialogFooter>
        </form>
    );

    return (
        <div>
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Topic of the Day</CardTitle>
                    <CardDescription>Generate a new featured post that will be pinned to the top of the main feed page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleGenerateTopic} disabled={isGeneratingTopic}>
                        {isGeneratingTopic ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                        Generate & Pin New Topic
                    </Button>
                    {currentTopic && (
                        <div className="mt-4 rounded-lg border p-4 bg-muted/50">
                            <p className="text-sm text-muted-foreground">Current Pinned Topic</p>
                            <p className="font-semibold">{currentTopic.headline}</p>
                            <p className="text-xs text-muted-foreground">by {currentTopic.author}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className='flex justify-between items-center mb-8'>
                <Dialog onOpenChange={(open) => !open && closeDialog()}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Feed Item Manually</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingItem ? 'Edit' : 'Add'} Feed Item</DialogTitle>
                            <DialogDescription>Create or edit a feed item. This will be posted under the admin account.</DialogDescription>
                        </DialogHeader>
                        <FeedForm />
                    </DialogContent>
                    <DialogClose id="feed-dialog-close" className="hidden" />
                </Dialog>
                <div className="flex gap-2">
                    <Button variant={postFilter === 'all' ? 'default' : 'outline'} onClick={() => setPostFilter('all')}>All</Button>
                    <Button variant={postFilter === 'user' ? 'default' : 'outline'} onClick={() => setPostFilter('user')}>User</Button>
                    <Button variant={postFilter === 'admin' ? 'default' : 'outline'} onClick={() => setPostFilter('admin')}>Admin/AI</Button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : filteredFeedItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredFeedItems.map((item) => (
                        <Card key={item.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <img src={item.avatar ?? undefined} alt={item.author} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <CardTitle className="text-base">{item.author}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{item.handle}</p>
                                        </div>
                                    </div>
                                     <div title={item.userId ? "User Post" : "Admin/AI Post"}>
                                        {item.userId ? <UserIcon className="h-5 w-5 text-muted-foreground" /> : <Bot className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <h4 className="font-semibold mb-2">{item.headline}</h4>
                                <p className="text-muted-foreground line-clamp-4">{item.content}</p>
                                <div className="text-xs text-muted-foreground mt-4 flex gap-4">
                                    <span>Likes: {item.likes}</span>
                                    <span>Comments: {item.comments}</span>
                                    <span>Views: {item.views || 0}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t flex justify-end gap-2 pt-4">
                                {item.userId && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="icon" title="Pin as Topic of the Day"><Star className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Pin this Post?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will make this post the new "Topic of the Day" and pin it to the top of the feed for everyone. The original post will be removed.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handlePin(item)}>Pin Post</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                                <Dialog onOpenChange={(open) => !open && closeDialog()}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader><DialogTitle>Edit Feed Item</DialogTitle><DialogDescription>Make changes to this post. Note: You are editing as an admin.</DialogDescription></DialogHeader>
                                        <FeedForm />
                                    </DialogContent>
                                </Dialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete this feed item.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))} onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                 <p className="text-muted-foreground text-center py-12">No feed items found for this filter.</p>
            )}
        </div>
    );
};

// --- Timelines Manager Component ---
const TimelinesManager = () => {
    const [timelines, setTimelines] = useState<TimelineData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const { register, handleSubmit, reset } = useForm<{ topic: string }>();

    const fetchTimelines = useCallback(async () => {
        if (!db) return;
        setIsLoading(true);
        try {
            const q = query(collection(db, 'timelines'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            setTimelines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimelineData)));
        } catch (error) {
            console.error("Error fetching timelines: ", error);
            toast({ variant: "destructive", title: "Failed to fetch timelines." });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (db) fetchTimelines();
    }, [fetchTimelines]);

    const onSubmit: SubmitHandler<{ topic: string }> = async ({ topic }) => {
        if (!db) return;
        setIsGenerating(true);
        toast({ title: "🤖 AI is crafting a timeline...", description: `Generating a timeline for "${topic}". This might take a moment.` });
        try {
            const { events } = await generateTimeline({ topic });
            if (!events || events.length === 0) {
                throw new Error("AI failed to generate timeline events.");
            }
            
            await addDoc(collection(db, 'timelines'), { 
                topic, 
                events, 
                createdAt: serverTimestamp() 
            });
            
            toast({ title: "✅ Success!", description: `Timeline for "${topic}" has been generated and saved.` });
            fetchTimelines();
            reset();
        } catch (error: any) {
            console.error("Error generating timeline with AI: ", error);
            const description = error.message?.toLowerCase().includes('api key') 
                ? "This is likely due to an invalid Google AI API key."
                : "Could not generate timeline. Please check the console.";
            toast({ variant: "destructive", title: "AI Generation Failed", description });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'timelines', id));
            toast({ title: "Success", description: "Timeline deleted." });
            setTimelines(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error("Error deleting timeline:", error);
            toast({ variant: "destructive", title: "Failed to delete timeline." });
        }
    };

    return (
        <div>
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Create New Timeline</CardTitle>
                    <CardDescription>Enter a topic, and the AI will generate a historical timeline with key events.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-4">
                        <Input placeholder="e.g., The History of Artificial Intelligence" {...register('topic', { required: true })} disabled={isGenerating} />
                        <Button type="submit" disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                            Generate
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : timelines.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {timelines.map((timeline) => (
                        <Card key={timeline.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    {timeline.topic}
                                </CardTitle>
                                <CardDescription>{timeline.events.length} key events</CardDescription>
                            </CardHeader>
                            <CardFooter className="border-t flex justify-end gap-2 pt-4 mt-auto">
                                <Button asChild variant="outline" size="sm"><Link href={`/timelines/${timeline.id}`} target="_blank">View</Link></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete this timeline.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))} onClick={() => handleDelete(timeline.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-center py-12">No timelines found. Create one above.</p>
            )}
        </div>
    );
};

const AdminDashboard = () => (
    <main className="container mx-auto px-4 py-12 sm:px-6">
        <div className="mb-8">
            <h1 className="text-4xl font-black">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage all content across the site.</p>
        </div>
        <Tabs defaultValue="news" className="w-full">
            <TabsList>
                <TabsTrigger value="news">News Articles</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="feed">Social Feed</TabsTrigger>
                <TabsTrigger value="timelines">Timelines</TabsTrigger>
            </TabsList>
            <TabsContent value="news" className="py-6">
                <NewsManager />
            </TabsContent>
            <TabsContent value="insights" className="py-6">
                <InsightsManager />
            </TabsContent>
            <TabsContent value="feed" className="py-6">
                <FeedManager />
            </TabsContent>
            <TabsContent value="timelines" className="py-6">
                <TimelinesManager />
            </TabsContent>
        </Tabs>
    </main>
);

const AdminLogin = ({ handleAuth, authError, isLoggingIn }: { handleAuth: (e: React.FormEvent<HTMLFormElement>) => void, authError: string, isLoggingIn: boolean }) => (
    <div className="flex items-center justify-center h-screen bg-background p-4">
        <Card className="w-full max-w-sm p-6">
            <form onSubmit={handleAuth}>
                <CardHeader className="text-center">
                    <CardTitle>Admin Access</CardTitle>
                    <CardDescription>Enter admin credentials to manage content.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input 
                        type="email"
                        name="email"
                        placeholder="admin@example.com"
                        required
                    />
                    <Input 
                        type="password"
                        name="password"
                        placeholder="Password"
                        required
                    />
                    {authError && <p className="text-sm text-destructive">{authError}</p>}
                    <Button type="submit" className="w-full" disabled={isLoggingIn}>
                        {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                        Enter
                    </Button>
                </CardContent>
            </form>
        </Card>
    </div>
);

const AccessDenied = ({ onSignOut }: { onSignOut: () => void }) => (
     <div className="flex flex-col items-center justify-center h-screen bg-background p-4">
        <Card className="w-full max-w-sm p-8 text-center">
             <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>You are not authorized to view this page. Please sign in with an admin account.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={onSignOut}>Sign Out</Button>
            </CardContent>
        </Card>
      </div>
)

export default function AdminPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth) {
      toast({ variant: "destructive", title: "Auth not configured." });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    setIsLoggingIn(true);
    setAuthError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener in useAuth will handle the state update.
      if (userCredential.user.email?.toLowerCase() !== ADMIN_EMAIL) {
        setAuthError("This user is not an administrator.");
        await signOut();
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      setAuthError("Invalid email or password. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  if (authLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {user && user.email?.toLowerCase() === ADMIN_EMAIL ? (
        <AdminDashboard />
      ) : user ? (
        <AccessDenied onSignOut={signOut} />
      ) : (
        <AdminLogin handleAuth={handleAuth} authError={authError} isLoggingIn={isLoggingIn} />
      )}
      <SiteFooter />
    </div>
  );
}
