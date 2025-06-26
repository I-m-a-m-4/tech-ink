
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, writeBatch, doc, increment, type Timestamp } from "firebase/firestore";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from "@/components/ui/separator";
import Link from 'next/link';
import type { PostWithId } from './page';

type Comment = {
    id: string;
    text: string;
    author: string;
    avatar: string;
    userId: string;
    createdAt: Timestamp;
}

const commentFormSchema = z.object({
    commentText: z.string().min(1, { message: "Comment cannot be empty." }).max(280, { message: "Comment is too long." }),
});
type CommentFormValues = z.infer<typeof commentFormSchema>;

const getDisplayTime = (item: Comment) => {
    if (item.createdAt && typeof item.createdAt.toDate === 'function') {
        return formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true });
    }
    return 'Just now';
};


export function PostComments({ post }: { post: PostWithId }) {
    const { user, addPoints } = useAuth();
    const { toast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const commentForm = useForm<CommentFormValues>({ 
        resolver: zodResolver(commentFormSchema), 
        defaultValues: { commentText: "" } 
    });

    useEffect(() => {
        if (!db) return;
        const commentsRef = collection(db, post.collectionName, post.id, "comments");
        const q = query(commentsRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => { 
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment))); 
            setIsLoading(false); 
        }, (error) => {
            console.error("Error fetching comments:", error);
            toast({ variant: "destructive", title: "Failed to load comments." });
            setIsLoading(false); 
        });

        return () => unsubscribe();
    }, [post.id, post.collectionName, toast]);

    const handlePostComment: SubmitHandler<CommentFormValues> = async (data) => {
        if (!user || !db) return;
        
        const batch = writeBatch(db);
        const postRef = doc(db, post.collectionName, post.id);
        const newCommentRef = doc(collection(db, post.collectionName, post.id, "comments"));

        batch.set(newCommentRef, {
            text: data.commentText,
            author: user.displayName || "Anonymous",
            avatar: user.photoURL || `https://source.unsplash.com/random/100x100?portrait,user`,
            userId: user.uid,
            createdAt: serverTimestamp(),
        });
        batch.update(postRef, { comments: increment(1) });
        
        try {
            await batch.commit();
            addPoints(5);
            toast({ title: "Comment posted!" });
            commentForm.reset();
        } catch (error) { 
            console.error("Comment post error:", error);
            toast({ variant: "destructive", title: "Failed to post comment" }); 
        }
    };

    return (
        <div>
            <Separator className="my-6" />
            <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>
            
            <div className="mb-6">
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
                            <Button type="submit" disabled={commentForm.formState.isSubmitting} size="icon">
                                {commentForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </form>
                    </Form>
                ) : (
                    <div className="text-center">
                        <Button asChild><Link href="/login">Log in to comment</Link></Button>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <div className="rounded-full bg-muted h-10 w-10 animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
                                <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
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
        </div>
    );
}

