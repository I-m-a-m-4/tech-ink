
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, AlertTriangle, PenLine, Award, Rocket, Share2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserBadge, getRank } from "@/components/user-badge";
import type { UserData } from './page';
import { startLoader } from "@/lib/loader-events";

interface LeaderboardClientPageProps {
    initialUsers: UserData[];
    error: boolean;
}

const ranks = [
    { name: "Newcomer", points: 0 },
    { name: "Tinkerer", points: 1 },
    { name: "Contributor", points: 1000 },
    { name: "Analyst", points: 10000 },
    { name: "Prodigy", points: 50000 },
    { name: "Visionary", points: 100000 },
    { name: "Ink Master", points: 500000 },
    { name: "1 Million Ink", points: 1000000 },
];

const ShareCard = () => {
    const { toast } = useToast();
    const handleShare = async () => {
        const shareData = {
            title: 'Join the Race to 1 Million Ink!',
            text: 'The first two members to achieve 1M Ink Points on Tech Ink Insights will be rewarded with 5% equity. Join the community!',
            url: 'https://tech-ink.vercel.app/leaderboard'
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                 navigator.clipboard.writeText(shareData.url);
                 toast({ title: "Link Copied!", description: "Leaderboard link copied to your clipboard." });
            }
        } catch (error) {
            console.error('Error sharing:', error);
            toast({ variant: 'destructive', title: 'Could not share', description: 'An error occurred while trying to share.' });
        }
    };

    return (
        <Card className="bg-primary/10 border-primary/40 text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit">
                    <Rocket className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl pt-2">The Race to 1 Million Ink</CardTitle>
                <CardDescription className="text-foreground/80 text-base">
                    The first two members to achieve the rank of "1 Million Ink" will be rewarded with <span className="font-bold text-primary">5% equity</span> in Tech Ink Insights. This is our commitment to building this platform with our most dedicated community members.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" /> Share The Mission
                </Button>
            </CardContent>
        </Card>
    );
};

const RankingsExplanation = () => (
    <div className="space-y-8">
        <ShareCard />

        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Award className="h-6 w-6 text-primary" />
                    <CardTitle>Community Ranks & Badges</CardTitle>
                </div>
                <CardDescription>Earn Ink Points by contributing and climb the ranks to unlock new recognition.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {ranks.map(rank => (
                        <div key={rank.name} className="p-4 bg-muted/50 rounded-lg text-center flex flex-col items-center justify-center">
                            <UserBadge points={rank.points} size="lg" />
                            <p className={`font-bold text-lg mt-2`}>{rank.name}</p>
                            <p className="text-sm text-muted-foreground">{rank.points.toLocaleString()}+ Ink Points</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
);


export default function LeaderboardClientPage({ initialUsers, error }: LeaderboardClientPageProps) {
  const getMedal = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-400" />;
    if (rank === 2) return <Trophy className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-6 w-6 text-yellow-600" />;
    return <span className="font-bold text-lg">{rank}</span>;
  };

  const renderTableBody = () => {
    if (error) {
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
    
    if (initialUsers.length === 0) {
        return (
             <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                    The leaderboard is currently empty. Start contributing to get on the board!
                </TableCell>
            </TableRow>
        );
    }
    
    return initialUsers.map((user, index) => {
        const userRank = getRank(user.points || 0);
        return (
            <TableRow key={user.id} className={index < 3 ? 'bg-primary/5' : ''}>
                <TableCell className="text-center">
                    {getMedal(index + 1)}
                </TableCell>
                <TableCell>
                    <Link href={`/u/${user.handle.substring(1)}`} onClick={startLoader} className="flex items-center gap-3 group">
                        <Avatar>
                            <AvatarImage src={user.avatar} alt={user.handle} />
                            <AvatarFallback>{user.handle.charAt(1)}</AvatarFallback>
                        </Avatar>
                        <div>
                             <div className="flex items-center gap-1.5">
                                <p className="font-medium group-hover:text-primary group-hover:underline">{user.handle}</p>
                                <UserBadge points={user.points} />
                            </div>
                             <p className={`text-xs font-bold ${userRank.color}`}>{userRank.name}</p>
                        </div>
                    </Link>
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 font-bold">
                        <PenLine className="h-4 w-4 text-primary" />
                        <span>{(user.points || 0).toLocaleString()}</span>
                    </div>
                </TableCell>
            </TableRow>
        )
    });
  }

  return (
    <>
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px] text-center">Rank</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead className="text-right">Ink Points</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {renderTableBody()}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <div className="mt-16">
            <RankingsExplanation />
        </div>
    </>
  );
}
