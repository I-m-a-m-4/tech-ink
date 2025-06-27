
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Loader2, Newspaper } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NewsCube3d } from "@/components/news-cube-3d";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Article } from "@/ai/flows/generate-articles-flow";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type ArticleWithId = Article & { id: string };

export default function NewsPage() {
  const [allArticles, setAllArticles] = useState<ArticleWithId[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<ArticleWithId[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
        if (!db) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const articlesCollection = collection(db, 'articles');
            const q = query(articlesCollection, orderBy('createdAt', 'desc'));
            const articlesSnapshot = await getDocs(q);
            const articlesList = articlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArticleWithId));

            setAllArticles(articlesList);
            setFilteredArticles(articlesList);
            const uniqueCategories = ["All", ...new Set(articlesList.map(article => article.category))];
            setCategories(uniqueCategories);

        } catch (error) {
            console.error("Failed to fetch news articles:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchArticles();
  }, []);

  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredArticles(allArticles);
    } else {
      setFilteredArticles(allArticles.filter(article => article.category === selectedCategory));
    }
  }, [selectedCategory, allArticles]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 py-12 md:py-24">
            <div className="mx-auto max-w-3xl">
                <div className="mx-auto mb-12 max-w-xl text-center">
                    <h1 className="text-4xl font-extrabold md:text-6xl animate-gradient">Latest In Tech</h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                    Explore the latest articles and discussions from the Tech Ink community.
                    </p>
                </div>

                {categories.length > 1 && (
                     <div className="relative mb-12">
                        <ScrollArea className="w-full whitespace-nowrap">
                            <div className="flex justify-center gap-2 pb-4">
                                {categories.map(category => (
                                    <Button 
                                        key={category}
                                        variant={selectedCategory === category ? 'default' : 'outline'}
                                        onClick={() => setSelectedCategory(category)}
                                        className="shrink-0"
                                    >
                                        {category}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                )}

                <div className="flex flex-col gap-8">
                    {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <Card key={index} className="bg-card rounded-2xl shadow-lg animate-pulse flex flex-col md:flex-row overflow-hidden">
                            <div className="h-64 md:h-auto md:w-1/3 bg-muted"></div>
                            <div className="p-6 flex-1">
                                <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                                <div className="h-4 bg-muted rounded w-full"></div>
                                <div className="h-4 bg-muted rounded w-5/6 mt-2"></div>
                            </div>
                        </Card>
                    ))
                    ) : filteredArticles.length > 0 ? (
                        filteredArticles.map((item) => {
                            const cardContent = (
                                <>
                                    <div className="relative h-64 w-full md:w-1/3 flex-shrink-0">
                                        <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                                    </div>
                                    <div className="p-6 flex flex-col justify-center">
                                        <p className="text-sm font-bold text-primary mb-2">{item.category}</p>
                                        <h3 className="text-xl font-bold text-card-foreground">{item.title}</h3>
                                        <p className="mt-2 text-muted-foreground line-clamp-2">{item.description}</p>
                                    </div>
                                </>
                            );
                            const commonCardClasses = "group flex flex-col md:flex-row w-full h-full overflow-hidden rounded-2xl shadow-lg transition-all hover:shadow-primary/20 bg-card";
                        
                            return (
                                <div key={item.id}>
                                {item.externalUrl ? (
                                    <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className={commonCardClasses}>
                                        {cardContent}
                                    </a>
                                ) : (
                                    <Link href={`/news/${item.id}`} className={commonCardClasses}>
                                      {cardContent}
                                    </Link>
                                )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full text-center py-12">
                             <Card className="max-w-md mx-auto p-8 text-center bg-card/50">
                                <Newspaper className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-xl font-semibold">No Articles Yet</h3>
                                <p className="mt-2 text-muted-foreground">
                                    There are no articles published in this category. Check back soon for new content!
                                </p>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </section>
        <section className="container mx-auto px-4 sm:px-6 py-12 md:py-24">
            <div className="mx-auto mb-12 max-w-2xl text-center">
                <h2 className="text-4xl font-extrabold">Global News Pulse</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    A 3D view of the world of tech news.
                </p>
            </div>
            <NewsCube3d />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
