
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, initializationError } from '@/lib/firebase';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

type TimelineIndexItem = {
    id: string;
    topic: string;
    eventCount: number;
}

async function getTimelines(): Promise<TimelineIndexItem[]> {
  if (initializationError || !db) return [];
  try {
    const timelinesCollection = collection(db, 'timelines');
    const q = query(timelinesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        topic: doc.data().topic,
        eventCount: doc.data().events.length,
    }));
  } catch (error) {
    console.error("Error fetching timelines:", error);
    return [];
  }
}

export default async function TimelinesIndexPage() {
  const timelines = await getTimelines();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 py-12 md:py-24">
            <div className="mx-auto max-w-4xl">
                <div className="mx-auto mb-12 max-w-xl text-center">
                    <Clock className="mx-auto h-12 w-12 text-primary" />
                    <h1 className="text-4xl font-extrabold md:text-6xl animate-gradient mt-4">Tech Timelines</h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Explore chronological histories of the technologies shaping our world.
                    </p>
                </div>

                {timelines.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {timelines.map(timeline => (
                            <Link href={`/timelines/${timeline.id}`} key={timeline.id} className="block">
                                <Card className="h-full hover:border-primary transition-colors">
                                    <CardHeader>
                                        <CardTitle>{timeline.topic}</CardTitle>
                                        <CardDescription>{timeline.eventCount} key events</CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Card className="p-8 text-center text-muted-foreground">
                        <h3 className="text-xl font-semibold">No Timelines Yet</h3>
                        <p className="mt-2">Check back soon for deep dives into the history of tech.</p>
                    </Card>
                )}
            </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
