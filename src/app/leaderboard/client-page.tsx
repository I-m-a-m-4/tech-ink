
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
import { Gem, Trophy, AlertTriangle } from 'lucide-react';
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
    
    return initialUsers.map((user, index) => (
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
  );
}
