
"use client";

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Calendar, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import type { ArticleWithId } from './page';

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
                <Image src={article.imageUrl} alt={article.title} fill className="object-cover" priority />
            </div>
          )}
          <div className="prose prose-lg dark:prose-invert max-w-full">
            <ReactMarkdown>{article.content || article.description}</ReactMarkdown>
          </div>
        </article>
    );
}
