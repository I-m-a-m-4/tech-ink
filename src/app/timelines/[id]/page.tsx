
import { doc, getDoc } from 'firebase/firestore';
import { db, initializationError } from '@/lib/firebase';
import type { TimelineEvent } from '@/ai/schemas/timeline-schema';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Timeline } from '@/components/timeline';
import { Clock } from 'lucide-react';

type Props = {
  params: { id: string };
};

type TimelineData = {
    id: string;
    topic: string;
    events: TimelineEvent[];
    createdAt?: any;
}

async function getTimeline(id: string): Promise<TimelineData | null> {
  if (initializationError || !db) return null;
  try {
    const docRef = doc(db, "timelines", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as TimelineData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return null;
  }
}


export default async function TimelinePage({ params }: Props) {
  const timeline = await getTimeline(params.id);

  if (!timeline) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 py-12 md:py-24">
            <div className="mx-auto mb-12 max-w-2xl text-center">
                <Clock className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-4xl font-extrabold md:text-6xl animate-gradient mt-4">{timeline.topic}</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    A chronological journey through the key milestones of {timeline.topic.toLowerCase()}.
                </p>
            </div>
            <div className="mx-auto max-w-4xl">
               <Timeline events={timeline.events} />
            </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
