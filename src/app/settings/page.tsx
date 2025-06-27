
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateProfile, deleteUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs, orderBy, deleteDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { SiteHeader } from '@/components/site-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Loader2, PenLine, User as UserIcon, Mail, AtSign, Trash2, Heart, MessageCircle, Eye, Edit, Shield } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { type SocialFeedItem } from '@/ai/schemas/social-feed-item-schema';
import { formatDistanceToNow } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50, { message: "Display name must be less than 50 characters." }),
  handle: z.string()
    .min(3, { message: "Handle must be at least 3 characters." })
    .max(20, { message: "Handle must be less than 20 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Handle can only contain letters, numbers, and underscores." }),
  publicName: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type SocialFeedItemWithId = SocialFeedItem & { id: string; createdAt?: any };

export default function SettingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myPosts, setMyPosts] = useState<SocialFeedItemWithId[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      handle: '',
      publicName: true,
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user && profile) {
      form.reset({
        displayName: user.displayName || '',
        handle: profile.handle.startsWith('@') ? profile.handle.substring(1) : profile.handle,
        publicName: profile.publicName !== false,
      });
    }
  }, [user, profile, authLoading, router, form]);

  useEffect(() => {
    if (!user || !db) return;
    
    const fetchUserPosts = async () => {
        setIsLoadingPosts(true);
        try {
            const q = query(
                collection(db, 'feedItems'), 
                where('userId', '==', user.uid), 
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialFeedItemWithId));
            setMyPosts(posts);
        } catch (error) {
            console.error("Error fetching user posts:", error);
            toast({ variant: "destructive", title: "Failed to load your posts." });
        } finally {
            setIsLoadingPosts(false);
        }
    };

    fetchUserPosts();
  }, [user, toast]);

  const handleDeletePost = async (postId: string) => {
    if (!db) return;

    try {
        await deleteDoc(doc(db, 'feedItems', postId));
        setMyPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
        toast({ title: "Post deleted successfully." });
    } catch (error) {
        console.error("Error deleting post:", error);
        toast({ variant: "destructive", title: "Failed to delete post." });
    }
  };


  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!user || !auth.currentUser) return;
    setIsSubmitting(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: data.displayName,
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        handle: data.handle.startsWith('@') ? data.handle : `@${data.handle}`,
        displayName: data.displayName,
        publicName: data.publicName,
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-12 md:py-16">
          <div className="mb-8">
            <h1 className="text-4xl font-black">Account Settings</h1>
            <p className="text-muted-foreground">Manage your profile and account information.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Stats</CardTitle>
                        <CardDescription>A quick look at your engagement.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <PenLine className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-bold text-2xl">{profile?.points ?? 0}</p>
                                <p className="text-sm text-muted-foreground">Ink Points</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your public display name and view your email.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                <Input placeholder="Your display name" className="pl-9" {...field} />
                                </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="handle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Handle</FormLabel>
                            <div className="relative">
                                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                <Input placeholder="your_handle" className="pl-9" {...field} />
                                </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email Address</label>
                           <div className="relative mt-2">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input value={user.email || ''} readOnly disabled className="pl-9" />
                            </div>
                          <p className="text-xs text-muted-foreground mt-2">Your email address cannot be changed.</p>
                      </div>
                      <Separator />
                        <FormField
                            control={form.control}
                            name="publicName"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Show Full Name Publicly</FormLabel>
                                        <FormDescription>Allow other users to see your full name on your profile and leaderboard.</FormDescription>
                                    </div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}
                        />
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
            <Separator className="my-12" />
             <div>
                <h2 className="text-2xl font-bold mb-4">My Contributions</h2>
                <Card>
                    <CardContent className="p-6">
                        {isLoadingPosts ? (
                             <div className="text-center text-muted-foreground py-8">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                <p className="mt-2">Loading your posts...</p>
                            </div>
                        ) : myPosts.length > 0 ? (
                            <div className="space-y-4">
                                {myPosts.map(post => (
                                    <Card key={post.id} className="p-4 flex items-center justify-between">
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-semibold truncate">{post.headline}</p>
                                            <p className="text-sm text-muted-foreground truncate">{post.content}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Posted {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : ''}
                                            </p>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                    <span className="sr-only">Delete post</span>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete your post from the feed.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))} onClick={() => handleDeletePost(post.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                <p>You haven't made any posts yet.</p>
                                <Button variant="link" asChild className="mt-2"><a href="/feed">Start a conversation</a></Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
