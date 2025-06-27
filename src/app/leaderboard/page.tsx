
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, initializationError } from '@/lib/firebase';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import type { UserProfile } from '@/contexts/auth-context';
import LeaderboardClientPage from './client-page';
import { Suspense } from 'react';
import { Award, BarChart, Rocket, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const revalidate = 0; // Ensures fresh data on every request

type UserData = UserProfile & {
    id: string;
    displayName: string;
    email: string;
    avatar?: string;
    points: number;
    handle: string;
};

async function getTopUsers(): Promise<{ data: UserData[], error: boolean }> {
  if (initializationError || !db) {
    return { data: [], error: true };
  }
  try {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, orderBy('points', 'desc'), limit(100));
    const usersSnapshot = await getDocs(q);

    if (!usersSnapshot.empty) {
        const data = usersSnapshot.docs.map(doc => {
            const docData = doc.data();
            return {
                id: doc.id,
                displayName: docData.displayName || 'Anonymous User',
                handle: docData.handle || '@anonymous',
                points: docData.points || 0,
                email: docData.email,
                avatar: docData.avatar || `https://source.unsplash.com/random/100x100?portrait,user&sig=${doc.id}`
            };
        }) as UserData[];
        return { data, error: false };
    }
    return { data: [], error: false };
  } catch (error) {
    console.error("Error fetching users for leaderboard:", error);
    return { data: [], error: true };
  }
}

export default async function LeaderboardPage() {
  const { data: users, error } = await getTopUsers();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
            <div className="mx-auto max-w-4xl">
                <div className="mx-auto mb-12 max-w-xl text-center">
                    <BarChart className="mx-auto h-12 w-12 text-primary" />
                    <h1 className="text-4xl font-extrabold md:text-6xl animate-gradient mt-4">Community Leaderboard</h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        See who's making the biggest impact. Earn points by posting, liking, and analyzing content.
                    </p>
                </div>
                
                <Suspense fallback={<Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />}>
                   <LeaderboardClientPage initialUsers={users} error={error} />
                </Suspense>
            </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

    