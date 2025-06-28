
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Calendar, Share2, Loader2, Sparkles, Bot, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import type { ArticleWithId } from './page';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { chatWithArticle } from '@/ai/flows/chat-with-article-flow';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const chatFormSchema = z.object({
  question: z.string().min(5, { message: "Question must be at least 5 characters." }),
});

function ArticleInteraction({ article }: { article: ArticleWithId }) {
  const { user, addPoints } = useAuth();
  const { toast } = useToast();
  const [conversation, setConversation] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof chatFormSchema>>({
    resolver: zodResolver(chatFormSchema),
    defaultValues: { question: "" },
  });
  
  const predefinedPrompts = [
    { label: "Summarize the key points", prompt: "Summarize this article in a few key bullet points." },
    { label: "Explain key concepts", prompt: "Explain the key technical concepts or terms mentioned in this article in simple terms." },
    { label: "What's the potential impact?", prompt: "Based on the article, what is the potential future impact of this technology or event?" },
  ];
  
  const handleInteraction = async (question: string) => {
    if (!user) {
      toast({ variant: "destructive", title: "Login Required", description: "You must be logged in to interact with the AI." });
      return;
    }
    
    setIsLoading(true);
    setConversation(prev => [...prev, { role: 'user', text: question }]);
    addPoints(10);
    
    try {
      const result = await chatWithArticle({
        articleTitle: article.title,
        articleContent: article.content,
        question: question,
      });
      setConversation(prev => [...prev, { role: 'bot', text: result.answer }]);
    } catch (e) {
      setConversation(prev => [...prev, { role: 'bot', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const onFormSubmit: SubmitHandler<z.infer<typeof chatFormSchema>> = (values) => {
    handleInteraction(values.question);
    form.reset();
  };

  return (
    <div id="ai-interaction">
      <Card className="bg-card/40 shadow-lg border-border/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Interact with this Article</CardTitle>
              <CardDescription>Use our AI tools to understand this content better.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {predefinedPrompts.map((p) => (
              <Button key={p.label} variant="outline" size="sm" onClick={() => handleInteraction(p.prompt)} disabled={isLoading}>
                {p.label}
              </Button>
            ))}
          </div>

          {conversation.length > 0 && (
            <div className="space-y-4">
              {conversation.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'bot' ? '' : 'justify-end'}`}>
                  {msg.role === 'bot' && <div className="p-2 rounded-full bg-primary/20 flex-shrink-0"><Bot className="h-5 w-5 text-primary" /></div>}
                  <div className={`rounded-lg p-3 max-w-[90%] ${msg.role === 'bot' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                  </div>
                  {msg.role === 'user' && <div className="p-2 rounded-full bg-muted flex-shrink-0"><User className="h-5 w-5 text-foreground" /></div>}
                </div>
              ))}
              {isLoading && conversation[conversation.length - 1]?.role === 'user' && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/20"><Bot className="h-5 w-5 text-primary" /></div>
                  <div className="rounded-lg p-3 bg-muted flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
             <Form {...form}>
              <form onSubmit={form.handleSubmit(onFormSubmit)} className="flex items-center gap-2">
                <FormField control={form.control} name="question" render={({ field }) => (
                  <FormItem className="flex-1"><FormControl><Input placeholder="Ask a follow-up question..." {...field} /></FormControl></FormItem>
                )}/>
                <Button type="submit" disabled={isLoading} size="icon"><ArrowRight className="h-4 w-4" /></Button>
              </form>
            </Form>
          ) : (
            <div className="text-center py-4">
                <Button asChild><Link href="/login">Log in to ask your own questions</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ArticleClientPage({ article }: { article: ArticleWithId }) {
    const { toast } = useToast();
    
    const publishDate = article.createdAt
        ? new Date(article.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Recently published';

    const handleShare = async () => {
        if (typeof window === 'undefined') return;
        const shareUrl = window.location.href;
        if (navigator.share) {
            await navigator.share({ title: article.title, text: article.description, url: shareUrl }).catch(e => console.error(e));
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast({ title: "Link Copied!", description: "Article link copied to your clipboard." });
        }
    };
  
    return (
        <article className="container mx-auto max-w-3xl px-4 sm:px-6 py-12 md:py-24">
          <header className="mb-8">
            <div className="flex justify-between items-start">
                <Badge variant="outline" className="mb-4 text-primary border-primary">{article.category}</Badge>
                <Button onClick={handleShare} variant="outline" size="sm"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 text-balance">{article.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{publishDate}</span>
                </div>
            </div>
          </header>
          {article.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-lg mb-8">
                <Image src={article.imageUrl} alt={article.title} fill className="object-cover" priority sizes="100vw" />
            </div>
          )}
          <div className="prose prose-lg dark:prose-invert max-w-full">
            <ReactMarkdown
              components={{
                mark: ({node, ...props}) => <mark {...props} />
              }}
            >
                {article.content || article.description}
            </ReactMarkdown>
          </div>
          <Separator className="my-12" />
          <ArticleInteraction article={article} />
        </article>
    );
}
