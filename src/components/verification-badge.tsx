
"use client";

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { UserBadge as UserBadgeType } from '@/app/u/[handle]/page';

const BlueBadge = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <radialGradient id="blue_badge_grad" cx="50%" cy="50%" r="50%" fx="25%" fy="25%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#2563EB" />
            </radialGradient>
            <filter id="blue_badge_shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.3"/>
            </filter>
        </defs>
        <g filter="url(#blue_badge_shadow)">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="url(#blue_badge_grad)"/>
            <path d="M9 12.5L11.5 15L16 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
    </svg>
);

const GreyBadge = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="grey_badge_grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
            <filter id="grey_badge_shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.3"/>
            </filter>
        </defs>
        <g filter="url(#grey_badge_shadow)">
            <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="url(#grey_badge_grad)" stroke="#475569" strokeWidth="0.5"/>
            <path d="M12 2L12 23" stroke="#64748B" strokeOpacity="0.5" strokeWidth="0.5"/>
            <path d="M12 11.1L15.5 13.5L12 15.9L8.5 13.5L12 11.1Z" fill="#CBD5E0" stroke="#475569" strokeWidth="0.5"/>
        </g>
    </svg>
);

const OrangeBadge = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <radialGradient id="orange_badge_grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FDBA74"/>
                <stop offset="100%" stopColor="#F97316"/>
            </radialGradient>
            <filter id="orange_badge_shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.3"/>
            </filter>
        </defs>
        <g filter="url(#orange_badge_shadow)">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#orange_badge_grad)"/>
            <path d="M12 2l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" fill="black" fillOpacity="0.1"/>
        </g>
    </svg>
);

interface VerificationBadgeProps {
    badge: UserBadgeType;
    className?: string;
}

export const VerificationBadge = ({ badge, className }: VerificationBadgeProps) => {
    if (!badge) return null;

    const badgeMap: { [key in Exclude<UserBadgeType, null>]: { component: React.ComponentType<{ className?: string }>, tooltip: string } } = {
        blue: { component: BlueBadge, tooltip: "Verified Account" },
        grey: { component: GreyBadge, tooltip: "Community Veteran" },
        orange: { component: OrangeBadge, tooltip: "Top Contributor" },
    };

    const { component: Icon, tooltip } = badgeMap[badge];
    
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={cn("inline-flex items-center justify-center h-5 w-5", className)}>
                        <Icon className="h-full w-full" />
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
