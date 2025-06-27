
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db, initializationError } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import { type Metadata, type ResolvingMetadata } from 'next';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Icons } from '@/components/icons';
import { PostComments } from './comments-client';
import type { PostWithId } from '@/types/post';
import { ClientLink } from '@/components/client-link';

async function getPost(id: string): Promise<PostWithId | null> {
  if (initializationError || !db) return null;

  try {
    let docSnap = await getDoc(doc(db, "feedItems", id));
    let collectionName: 'feedItems' | 'dailyTopics' = 'feedItems';

    if (!docSnap.exists()) {
      docSnap = await getDoc(doc(db, "dailyTopics", id));
      collectionName = 'dailyTopics';
    }

    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : undefined,
        collectionName,
        likes: data.likes || 0,
    } as PostWithId;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }, parent: ResolvingMetadata): Promise<Metadata> {
  const post = await getPost(params.id);
  
  if (!post) {
    return { title: 'Post Not Found' }
  }

  const parentMetadata = await parent;
  const siteConfig = {
    name: "Tech Ink Insights",
    url: "https://tech-ink.web.app",
    ogImage: "https://res.cloudinary.com/dd1czj85j/image/upload/v1750851092/WhatsApp_Image_2025-06-23_at_11.34.37_c2bbc731_epfvrj.jpg",
    description: "An insight engine, not just a news site...",
  };
  
  const ogImage = post.imageUrl 
    ? [{ url: post.imageUrl, width: 1200, height: 630, alt: post.headline }]
    : parentMetadata.openGraph?.images || [{ url: siteConfig.ogImage }];

  const description = post.content ? post.content.substring(0, 155) + (post.content.length > 155 ? '...' : '') : post.headline;


  return {
    title: post.headline,
    description: description,
    openGraph: {
      title: post.headline,
      description: description,
      url: `${siteConfig.url}/post/${post.id}`,
      images: ogImage,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.headline,
      description: description,
      images: ogImage.map(i => i.url),
    }
  }
}

export default async function PostPage({ params }: { params: { id: string }}) {
    const post = await getPost(params.id);

    if (!post) {
        notFound();
    }
    
    const displayTime = post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Just now';

    const PlatformIcon = () => {
        switch (post.platform) {
            case 'Twitter': return <Icons.twitter className="h-5 w-5" />;
            case 'YouTube': return <Icons.youtube className="h-5 w-5" />;
            case 'Instagram': return <Icons.instagram className="h-5 w-5" />;
            case 'TechInk': return <Icons.pen className="h-5 w-5" />;
            default: return null;
        }
    };
    
    return (
         <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">
                 <Suspense fallback={
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                }>
                    <article className="container mx-auto max-w-3xl px-4 sm:px-6 py-12 md:py-16">
                        <Card className="bg-card/40 shadow-lg border-border/60 p-6 sm:p-8">
                            <header className="flex items-start gap-4 mb-4">
                                <Avatar>
                                    <AvatarImage src={post.avatar} alt={post.author} />
                                    <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <ClientLink href={`/u/${post.handle.substring(1)}`} className="font-bold hover:underline">{post.handle}</ClientLink>
                                        <span className="text-muted-foreground hidden sm:inline">·</span>
                                        <span className="text-muted-foreground">{displayTime}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <PlatformIcon />
                                    <span>{post.platform}</span>
                                </div>
                            </header>
                            
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 text-balance">{post.headline}</h1>
                            
                            {post.content && (
                              <div className="prose dark:prose-invert max-w-full mb-6">
                                  <ReactMarkdown>{post.content}</ReactMarkdown>
                              </div>
                            )}

                            {post.imageUrl && (
                                <div className="relative aspect-video w-full overflow-hidden rounded-lg my-6 shadow-lg">
                                    <Image src={post.imageUrl} alt={post.headline} fill sizes="100vw" className="object-cover" />
                                </div>
                            )}

                            <PostComments post={post} />
                        </Card>
                    </article>
                </Suspense>
            </main>
            <SiteFooter />
        </div>
    )
}
