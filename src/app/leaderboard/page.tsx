
"use client";

import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, initializationError } from '@/lib/firebase';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import type { UserProfile } from '@/contexts/auth-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gem, Trophy, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
    console.error("Firebase not initialized, skipping getTopUsers.");
    return { data: [], error: true };
  }
  try {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, orderBy('points', 'desc'), limit(100));
    const usersSnapshot = await getDocs(q);

    if (!usersSnapshot.empty) {
        const data = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                displayName: data.displayName || 'Anonymous User',
                handle: data.handle || '@anonymous',
                points: data.points || 0,
                email: data.email,
                avatar: data.avatar || `https://source.unsplash.com/random/100x100?portrait,user&sig=${doc.id}`
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

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    getTopUsers().then(result => {
        setUsers(result.data);
        setHasError(result.error);
        setIsLoading(false);
    });
  }, []);

  const getMedal = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-400" />;
    if (rank === 2) return <Trophy className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-6 w-6 text-yellow-600" />;
    return <span className="font-bold text-lg">{rank}</span>;
  };

  const renderTableBody = () => {
    if (isLoading) {
        return (
            <TableRow>
                <TableCell colSpan={3} className="text-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Fetching leaderboard...</p>
                </TableCell>
            </TableRow>
        );
    }

    if (hasError) {
        return (
            <TableRow>
                <TableCell colSpan={3} className="text-center h-48">
                    <AlertTriangle className="h-8 w-8 mx-auto text-destructive" />
                    <p className="mt-2 font-semibold">Leaderboard Currently Unavailable</p>
                    <p className="text-sm text-muted-foreground">We're unable to load the rankings at this time. Please try again later.</p>
                </TableCell>
            </TableRow>
        );
    }
    
    if (users.length === 0) {
        return (
             <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                    The leaderboard is currently empty. Start contributing to get on the board!
                </TableCell>
            </TableRow>
        );
    }
    
    return users.map((user, index) => (
        <TableRow key={user.id} className={index < 3 ? 'bg-primary/5' : ''}>
            <TableCell className="text-center">
                {getMedal(index + 1)}
            </TableCell>
            <TableCell>
                <Link href={`/u/${user.handle.substring(1)}`} className="flex items-center gap-3 group">
                    <Avatar>
                        <AvatarImage src={user.avatar} alt={user.displayName} />
                        <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium group-hover:text-primary group-hover:underline">{user.displayName}</p>
                        <p className="text-sm text-muted-foreground">{user.handle}</p>
                    </div>
                </Link>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2 font-bold">
                    <Gem className="h-4 w-4 text-primary" />
                    <span>{(user.points || 0).toLocaleString()}</span>
                </div>
            </TableCell>
        </TableRow>
    ));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 py-12 md:py-24">
            <div className="mx-auto max-w-4xl">
                <div className="mx-auto mb-12 max-w-xl text-center">
                    <h1 className="text-4xl font-black md:text-6xl animate-gradient">Community Leaderboard</h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        See who's making the biggest impact. Earn points by posting, liking, and analyzing content.
                    </p>
                </div>
                
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px] text-center">Rank</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-right">Insight Points</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {renderTableBody()}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
