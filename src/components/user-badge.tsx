
"use client";

import { Icons } from './icons';
import { cn } from '@/lib/utils';

interface Rank {
    name: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
}

export const getRank = (points: number): Rank => {
    if (points >= 1000000) return { name: "1 Million Ink", color: "text-purple-400", icon: Icons.star };
    if (points >= 500000) return { name: "Ink Master", color: "text-amber-400", icon: Icons.gem };
    if (points >= 100000) return { name: "Visionary", color: "text-cyan-400", icon: Icons.crown };
    if (points >= 50000) return { name: "Prodigy", color: "text-emerald-400", icon: Icons.rocket };
    if (points >= 10000) return { name: "Analyst", color: "text-blue-400", icon: Icons.brainCircuit };
    if (points >= 1000) return { name: "Contributor", color: "text-rose-400", icon: Icons.pen };
    if (points > 0) return { name: "Tinkerer", color: "text-gray-400", icon: Icons.sparkle };
    return { name: "Newcomer", color: "text-gray-500", icon: Icons.shieldHalf };
};

interface UserBadgeProps {
    points: number;
    size?: 'sm' | 'md' | 'lg';
}

export const UserBadge = ({ points, size = 'sm' }: UserBadgeProps) => {
    if (points < 1) return null; // No badge for Newcomers
    const rank = getRank(points);
    const Icon = rank.icon;

    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-8 w-8',
    }
    
    return (
        <Icon className={cn(sizeClasses[size], rank.color)} title={rank.name} />
    );
};
