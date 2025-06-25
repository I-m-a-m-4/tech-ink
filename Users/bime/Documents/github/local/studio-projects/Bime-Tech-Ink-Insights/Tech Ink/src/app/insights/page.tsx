
"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Insight } from "@/ai/flows/generate-insights-flow";
import { InsightItem } from "@/components/insight-item";
import { DataInsight3d } from "@/components/data-insight-3d";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { Card } from "@/components/ui/card";
import { BarChart as BarChartIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const BATCH_SIZE = 3;
type InsightWithId = Insight & { id: string };

function InsightsPageComponent() {
  const [allInsights, setAllInsights] = useState<InsightWithId[]>([]);
  const [visibleInsights, setVisibleInsights] = useState<InsightWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver>();
  const { toast } = useToast();
  
  const [selectedInsight, setSelectedInsight] = useState<InsightWithId | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const loadMoreInsights = useCallback(() => {
    const currentLength = visibleInsights.length;
    const nextInsights = allInsights.slice(currentLength, currentLength + BATCH_SIZE);
    setVisibleInsights(prev => [...prev, ...nextInsights]);
    if (currentLength + BATCH_SIZE >= allInsights.length) {
      setHasMore(false);
    }
  }, [allInsights, visibleInsights.length]);
  
  useEffect(() => {
    const fetchInitialInsights = async () => {
        setIsLoading(true);
        try {
            if (!db) throw new Error("DB not available");
            const insightsCollection = collection(db, 'insights');
            const q = query(insightsCollection, orderBy('createdAt', 'desc'));
            const insightsSnapshot = await getDocs(q);
            const insightsList = insightsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InsightWithId));
            
            setAllInsights(insightsList);
            setVisibleInsights(insightsList.slice(0, BATCH_SIZE));
            setHasMore(insightsList.length > BATCH_SIZE);
            if (insightsList.length === 0) {
              setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to fetch insights:", error);
            toast({
                variant: "destructive",
                title: "Failed to load insights",
                description: "There was an issue fetching insights. Please try refreshing.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    fetchInitialInsights();
  }, [toast]);
  
  useEffect(() => {
      const insightId = searchParams.get('insight');
      if (insightId && !isLoading) {
          const findAndSetInsight = async () => {
              let insight = allInsights.find(i => i.id === insightId);
              if (!insight && db) {
                  const docSnap = await getDoc(doc(db, 'insights', insightId));
                  if(docSnap.exists()) {
                      insight = { id: docSnap.id, ...docSnap.data() } as InsightWithId;
                  }
              }
              if (insight) {
                  setSelectedInsight(insight);
              } else {
                  toast({ variant: "destructive", title: "Insight not found."});
              }
              router.replace('/insights', { scroll: false });
          }
          findAndSetInsight();
      }
  }, [searchParams, isLoading, allInsights, router, toast]);

  const lastInsightElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreInsights();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, loadMoreInsights]);

  return (
    <>
      <main className="flex-1">
        <section className="container mx-auto px-4 py-12 sm:px-6 md:py-24">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h1 className="text-4xl font-black md:text-6xl animate-gradient">Data-Driven Insights</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Explore charts and quotes about the tech world, curated by our team.
            </p>
          </div>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl flex flex-col gap-8">
                {visibleInsights.map((insight, index) => {
                const isLastElement = visibleInsights.length === index + 1;
                return (
                    <div ref={isLastElement ? lastInsightElementRef : null} key={insight.id}>
                        <InsightItem insight={insight} />
                    </div>
                );
                })}
            </div>

            {isLoading && (
                <div className="text-center py-12 flex justify-center items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-muted-foreground">Loading insights...</span>
                </div>
            )}

            {!isLoading && allInsights.length === 0 && (
                <div className="text-center py-12">
                     <Card className="max-w-md mx-auto p-8 text-center bg-card/50">
                        <BarChartIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-semibold">No Insights Yet</h3>
                        <p className="mt-2 text-muted-foreground">
                            There are no insights published yet. Check back soon for new content!
                        </p>
                    </Card>
                </div>
            )}
            {!isLoading && !hasMore && visibleInsights.length > 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">You've reached the end of the insights.</p>
                </div>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 sm:px-6 md:py-24">
            <div className="mx-auto mb-12 max-w-2xl text-center">
                <h2 className="text-4xl font-black">A 3D View of Data</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Interact with data in a new dimension.
                </p>
            </div>
            <DataInsight3d />
        </section>
      </main>

      <Dialog open={!!selectedInsight} onOpenChange={(isOpen) => !isOpen && setSelectedInsight(null)}>
        <DialogContent className="max-w-3xl">
            {selectedInsight && <InsightItem insight={selectedInsight} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function InsightsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
        <InsightsPageComponent />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
