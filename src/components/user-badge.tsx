
"use client";

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// --- Custom SVG Badge Components ---

const NewcomerBadge = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="newcomer_grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#CBD5E0" />
                <stop offset="100%" stopColor="#A0AEC0" />
            </linearGradient>
        </defs>
        <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="url(#newcomer_grad)" stroke="#4A5568" strokeWidth="1" />
        <path d="M12 3.4L18.5 6.2V12C18.5 16.7 12 19.8 12 19.8V3.4Z" fill="black" fillOpacity="0.1" />
    </svg>
);

const TinkererBadge = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <radialGradient id="tinker_grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#94A3B8" />
            </radialGradient>
        </defs>
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="url(#tinker_grad)" stroke="#64748B" strokeWidth="1"/>
    </svg>
);

const ContributorBadge = ({ className }: { className?: string }) => (
     <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="contrib_grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FECDD3" />
                <stop offset="100%" stopColor="#F472B6" />
            </linearGradient>
        </defs>
        <path d="M2.92893 21.0711C2.53841 20.6805 2.53841 20.0474 2.92893 19.6569L12 10.5858L13.4142 12L4.34315 21.0711C3.95262 21.4616 3.31946 21.4616 2.92893 21.0711Z" fill="#E11D48"/>
        <path d="M13.4142 12L12 10.5858L16.2426 6.34315L20.4853 10.5858L13.4142 12Z" fill="url(#contrib_grad)" stroke="#BE123C" strokeWidth="1" />
        <path d="M16.2426 6.34315L17.6569 4.92893C18.4379 4.14788 19.7042 4.14788 20.4853 4.92893C21.2663 5.71 21.2663 6.97631 20.4853 7.75736L19.0711 9.17157L16.2426 6.34315Z" fill="url(#contrib_grad)" stroke="#BE123C" strokeWidth="1"/>
    </svg>
);

const AnalystBadge = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <radialGradient id="analyst_grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#93C5FD"/>
                <stop offset="100%" stopColor="#2563EB"/>
            </radialGradient>
        </defs>
        <path d="M12,6V3M12,21V18M21,12H18M6,12H3M7.75,7.75L5.6,5.6M16.25,16.25L18.4,18.4M7.75,16.25L5.6,18.4M16.25,7.75L18.4,5.6" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 9.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0z" fill="url(#analyst_grad)" stroke="#1D4ED8" strokeWidth="1.5" />
        <circle cx="12" cy="9.5" r="1.5" fill="#DBEAFE"/>
    </svg>
);

const ProdigyBadge = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="prodigy_grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6EE7B7"/>
                <stop offset="100%" stopColor="#059669"/>
            </linearGradient>
             <linearGradient id="prodigy_flame" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDE047"/>
                <stop offset="100%" stopColor="#F97316"/>
            </linearGradient>
        </defs>
        <path d="M12 2L20 12H4L12 2Z" fill="#A7F3D0"/>
        <path d="M12 2L18 10H6L12 2Z" fill="url(#prodigy_grad)" stroke="#047857" strokeWidth="1" />
        <path d="M7 11h10v3H7z" fill="#34D399"/>
        <path d="M9 14h6l-1 2h-4l-1-2z" fill="#059669"/>
        <path d="M10 16h4v6l-2 2-2-2v-6z" fill="url(#prodigy_flame)"/>
    </svg>
);

const VisionaryBadge = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="vision_grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#67E8F9"/>
                <stop offset="100%" stopColor="#06B6D4"/>
            </linearGradient>
        </defs>
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" fill="url(#vision_grad)" stroke="#0891B2" strokeWidth="1" strokeLinejoin="round"/>
        <circle cx="6" cy="18" r="1.5" fill="#CFFAFE"/>
        <circle cx="12" cy="18" r="1.5" fill="#CFFAFE"/>
        <circle cx="18" cy="18" r="1.5" fill="#CFFAFE"/>
    </svg>
);

const InkMasterBadge = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M6 3h12l4 6-10 12L2 9l4-6z" fill="#FBBF24" stroke="#B45309" strokeWidth="1"/>
        <path d="M6 3l6 18L2 9l4-6z" fill="#F59E0B" fillOpacity="0.8"/>
        <path d="M18 3l-6 18L22 9l-4-6z" fill="#D97706" fillOpacity="0.8"/>
        <path d="M2 9h20" stroke="#FBBF24" strokeWidth="0.5" />
        <path d="M12 21L8 9h8L12 21z" fill="#FFFBEB" fillOpacity="0.7"/>
    </svg>
);

const OneMillionBadge = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <radialGradient id="onemillion_grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E9D5FF"/>
                <stop offset="100%" stopColor="#A855F7"/>
            </radialGradient>
            <filter id="onemillion_glow">
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.7" />
            </filter>
        </defs>
        <g filter="url(#onemillion_glow)">
            <path d="M12 2l2.35 7.18H22l-6 4.36 2.35 7.18L12 16.36l-6.35 4.36L8 13.54l-6-4.36h7.65L12 2z" fill="url(#onemillion_grad)" stroke="#9333EA" strokeWidth="1"/>
        </g>
    </svg>
);


// --- Main Badge Logic ---

interface Rank {
    name: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
}

export const getRank = (points: number): Rank => {
    if (points >= 1000000) return { name: "1 Million Ink", color: "text-purple-400", icon: OneMillionBadge };
    if (points >= 500000) return { name: "Ink Master", color: "text-amber-500", icon: InkMasterBadge };
    if (points >= 100000) return { name: "Visionary", color: "text-cyan-400", icon: VisionaryBadge };
    if (points >= 50000) return { name: "Prodigy", color: "text-emerald-400", icon: ProdigyBadge };
    if (points >= 10000) return { name: "Analyst", color: "text-blue-400", icon: AnalystBadge };
    if (points >= 1000) return { name: "Contributor", color: "text-rose-400", icon: ContributorBadge };
    if (points > 0) return { name: "Tinkerer", color: "text-slate-400", icon: TinkererBadge };
    return { name: "Newcomer", color: "text-slate-500", icon: NewcomerBadge };
};

interface UserBadgeProps {
    points: number;
    size?: 'sm' | 'md' | 'lg';
}

export const UserBadge = ({ points, size = 'sm' }: UserBadgeProps) => {
    // Show badges for all ranks including Newcomer if they have 0 points
    const rank = getRank(points);
    const Icon = rank.icon;

    const sizeClasses = {
        sm: 'h-5 w-5',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
    }
    
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center">
                        <Icon className={cn(sizeClasses[size])} />
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p className={cn("font-semibold", rank.color)}>{rank.name}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
