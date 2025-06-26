
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Article } from '@/ai/schemas/article-schema';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import { type Metadata, type ResolvingMetadata } from 'next';
import ArticleClientPage from './client-page';

// The createdAt property will be a string to be serializable for client components
export type ArticleWithId = Omit<Article, 'createdAt'> & { 
  id: string; 
  createdAt?: string; 
};

const siteConfig = {
  ogImage: "https://i.ibb.co/9vZd2pM/techink.jpg",
};

async function getArticle(id: string): Promise<ArticleWithId | null> {
  try {
    if (!db) return null;
    const docRef = doc(db, "articles", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    const articleData: any = { id: docSnap.id, ...data };

    // Convert Firestore Timestamp to a serializable ISO string BEFORE passing to client
    if (data.createdAt && data.createdAt instanceof Timestamp) {
      articleData.createdAt = data.createdAt.toDate().toISOString();
    }

    return articleData as ArticleWithId;

  } catch (error) {
    console.error("Error fetching article:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }, parent: ResolvingMetadata): Promise<Metadata> {
  const id = params.id;
  const article = await getArticle(id);
  const previousImages = (await parent).openGraph?.images || [];

  if (!article) {
    return {
      title: 'Article Not Found',
    }
  }
  
  const ogImage = article.imageUrl ? [ { url: article.imageUrl, width: 800, height: 400, alt: article.title } ] : [ { url: siteConfig.ogImage, width: 1200, height: 630, alt: "Tech Ink Insights" } ];

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      images: [...ogImage, ...previousImages],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: ogImage.map(i => i.url),
    }
  }
}


export default async function Page({ params }: { params: { id: string }}) {
    const article = await getArticle(params.id);

    if (!article) {
        notFound();
    }
    
    return (
         <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">
                 <Suspense fallback={
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                }>
                    <ArticleClientPage article={article} />
                </Suspense>
            </main>
            <SiteFooter />
        </div>
    )
}
