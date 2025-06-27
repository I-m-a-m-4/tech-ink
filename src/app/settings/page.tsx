
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, PenLine, User as UserIcon, Mail, AtSign, Trash2, Heart, MessageCircle, Eye, Edit } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { type SocialFeedItem } from '@/ai/schemas/social-feed-item-schema';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50, { message: "Display name must be less than 50 characters." }),
  handle: z.string()
    .min(3, { message: "Handle must be at least 3 characters." })
    .max(20, { message: "Handle must be less than 20 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Handle can only contain letters, numbers, and underscores." }),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

const postEditSchema = z.object({
  headline: z.string().min(10, { message: "Headline must be at least 10 characters." }).max(100),
  content: z.string().min(20, { message: "Content must be at least 20 characters." }).max(10000),
});
type PostEditFormValues = z.infer<typeof postEditSchema>;

type SocialFeedItemWithId = SocialFeedItem & { id: string; createdAt?: any };

export default function SettingsPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myPosts, setMyPosts] = useState<SocialFeedItemWithId[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [editingPost, setEditingPost] = useState<SocialFeedItemWithId | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { displayName: '', handle: '' },
  });

  const editPostForm = useForm<PostEditFormValues>({
    resolver: zodResolver(postEditSchema),
    defaultValues: { headline: '', content: '' },
  });

  const fetchUserPosts = useCallback(async () => {
    if (!user || !db) return;
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
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user && profile) {
      profileForm.reset({
        displayName: user.displayName || '',
        handle: profile.handle.startsWith('@') ? profile.handle.substring(1) : profile.handle,
      });
      fetchUserPosts();
    }
  }, [user, profile, authLoading, router, profileForm, fetchUserPosts]);

  const onProfileSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!user || !auth.currentUser || !db) return;
    setIsSubmitting(true);
    try {
      await updateProfile(auth.currentUser, { displayName: data.displayName });
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        handle: data.handle.startsWith('@') ? data.handle : `@${data.handle}`,
        displayName: data.displayName,
      });
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message || "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (post: SocialFeedItemWithId) => {
    setEditingPost(post);
    editPostForm.reset({
      headline: post.headline,
      content: post.content,
    });
  };

  const closeEditDialog = () => {
    setEditingPost(null);
  };
  
  const onEditSubmit: SubmitHandler<PostEditFormValues> = async (data) => {
    if (!editingPost || !db) return;
    setIsEditSubmitting(true);
    try {
      const postRef = doc(db, 'feedItems', editingPost.id);
      await updateDoc(postRef, data);
      toast({ title: "Post updated successfully!" });
      setMyPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...data } : p));
      closeEditDialog();
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to update post." });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, 'feedItems', postId));
        setMyPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
        toast({ title: "Post deleted successfully." });
    } catch (error) {
        toast({ variant: "destructive", title: "Failed to delete post." });
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!user || !auth.currentUser || !db) {
        toast({ variant: "destructive", title: "You must be logged in." });
        return;
    }
    setIsDeleting(true);
    try {
        const batch = writeBatch(db);
        const userRef = doc(db, 'users', user.uid);
        batch.delete(userRef);
        
        if (profile?.handle) {
            const handleRef = doc(db, 'handles', profile.handle.replace('@', ''));
            batch.delete(handleRef);
        }

        const postsSnapshot = await getDocs(query(collection(db, 'feedItems'), where('userId', '==', user.uid)));
        postsSnapshot.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        await deleteUser(auth.currentUser);

        toast({ title: "Account Deleted", description: "Your account and data have been removed." });
        router.push('/');
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: error.code === 'auth/requires-recent-login' ? "Please log out and log back in to perform this action." : "An error occurred.",
        });
    } finally {
        setIsDeleting(false);
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
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <FormField control={profileForm.control} name="displayName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <div className="relative"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input placeholder="Your display name" className="pl-9" {...field} /></FormControl></div>
                            <FormMessage />
                          </FormItem>
                      )} />
                       <FormField control={profileForm.control} name="handle" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Handle</FormLabel>
                            <div className="relative"><AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input placeholder="your_handle" className="pl-9" {...field} /></FormControl></div>
                            <FormMessage />
                          </FormItem>
                       )} />
                      <div>
                          <label className="text-sm font-medium">Email Address</label>
                           <div className="relative mt-2"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={user.email || ''} readOnly disabled className="pl-9" /></div>
                          <p className="text-xs text-muted-foreground mt-2">Your email address cannot be changed.</p>
                      </div>
                      <div className="flex justify-end"><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button></div>
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
                        {isLoadingPosts ? (<div className="text-center text-muted-foreground py-8"><Loader2 className="mx-auto h-8 w-8 animate-spin" /><p className="mt-2">Loading your posts...</p></div>) 
                        : myPosts.length > 0 ? (
                            <div className="space-y-4">
                                {myPosts.map(post => (
                                    <Card key={post.id} className="p-4">
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-semibold truncate">{post.headline}</p>
                                            <p className="text-sm text-muted-foreground truncate">{post.content}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Posted {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : ''}</p>
                                        </div>
                                        <Separator className="my-3" />
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5"><Heart className="h-4 w-4" /> {post.likes}</span>
                                                <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {post.comments}</span>
                                                {post.views !== undefined && <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {post.views}</span>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Dialog onOpenChange={(open) => !open && closeEditDialog()}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}><Edit className="h-4 w-4" /></Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Post</DialogTitle>
                                                            <DialogDescription>Make changes to your post here. Click save when you're done.</DialogDescription>
                                                        </DialogHeader>
                                                        <Form {...editPostForm}>
                                                            <form onSubmit={editPostForm.handleSubmit(onEditSubmit)} className="space-y-4">
                                                                <FormField control={editPostForm.control} name="headline" render={({ field }) => (<FormItem><FormLabel>Headline</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                                <FormField control={editPostForm.control} name="content" render={({ field }) => (<FormItem><FormLabel>Content</FormLabel><FormControl><Textarea className="min-h-[200px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                                <div className="flex justify-end gap-2"><DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose><Button type="submit" disabled={isEditSubmitting}>{isEditSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button></div>
                                                            </form>
                                                        </Form>
                                                    </DialogContent>
                                                </Dialog>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete your post.</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))} onClick={() => handleDeletePost(post.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (<div className="text-center text-muted-foreground py-8"><p>You haven't made any posts yet.</p><Button variant="link" asChild className="mt-2"><a href="/feed">Start a conversation</a></Button></div>)}
                    </CardContent>
                </Card>
            </div>
             <Separator className="my-12" />
             <div className="mt-8">
                <Card className="border-destructive/50">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Delete My Account</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your account, your posts, and remove all of your data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))} onClick={handleDeleteAccount} disabled={isDeleting}>
                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Yes, delete my account
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
             </div>
        </div>
      </main>
    </div>
  );
}
