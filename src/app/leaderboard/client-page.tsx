
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
import { Trophy, AlertTriangle, PenLine } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import type { UserProfile } from "@/contexts/auth-context";

type UserData = UserProfile & {
    id: string;
    displayName: string;
    email: string;
    avatar?: string;
    points: number;
    handle: string;
};

interface LeaderboardClientPageProps {
    initialUsers: UserData[];
    error: boolean;
}

interface Rank {
    name: string;
    color: string;
}

const getRank = (points: number): Rank => {
    if (points >= 1000000) return { name: "1 Million Ink", color: "text-purple-400" };
    if (points >= 500000) return { name: "Ink Master", color: "text-amber-400" };
    if (points >= 100000) return { name: "Visionary", color: "text-cyan-400" };
    if (points >= 50000) return { name: "Prodigy", color: "text-emerald-400" };
    if (points >= 10000) return { name: "Analyst", color: "text-blue-400" };
    if (points >= 1000) return { name: "Contributor", color: "text-rose-400" };
    if (points > 0) return { name: "Tinkerer", color: "text-muted-foreground" };
    return { name: "Newcomer", color: "text-muted-foreground" };
};


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
                    <Link href={`/u/${user.handle.substring(1)}`} className="flex items-center gap-3 group">
                        <Avatar>
                            <AvatarImage src={user.avatar} alt={user.displayName} />
                            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium group-hover:text-primary group-hover:underline">{user.displayName}</p>
                            <p className="text-sm text-muted-foreground">{user.handle}</p>
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
  );
}
