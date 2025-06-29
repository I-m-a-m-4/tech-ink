
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { type Poll } from '@/ai/schemas/social-feed-item-schema';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { CheckCircle2, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PollDisplayProps {
    postId: string;
    poll: Poll;
    collectionName: 'feedItems' | 'dailyTopics';
    createdAt: string; // ISO string
}

function formatTimeLeft(ms: number) {
    if (ms <= 0) return "Poll ended";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h left`;
    if (minutes > 0) return `${minutes}m left`;
    return "<1m left";
}

export const PollDisplay = ({ postId, poll, collectionName, createdAt }: PollDisplayProps) => {
    const { user, votedOnPolls, voteOnPoll } = useAuth();
    const { toast } = useToast();
    const [currentPoll, setCurrentPoll] = useState(poll);
    const [timeLeft, setTimeLeft] = useState(0);

    const pollEndTime = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;
    const hasEnded = timeLeft <= 0;

    useEffect(() => {
        setCurrentPoll(poll);
    }, [poll]);

    useEffect(() => {
        const calculateTimeLeft = () => Date.now() < pollEndTime ? pollEndTime - Date.now() : 0;
        setTimeLeft(calculateTimeLeft());
        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [pollEndTime]);
    
    const userVote = user ? (currentPoll.voters?.[user.uid] || votedOnPolls.get(postId)) : undefined;

    const handleVote = async (optionText: string) => {
        if (!user) {
            toast({ variant: "destructive", title: "Login Required" });
            return;
        }
        if (hasEnded) {
            toast({ variant: "destructive", title: "Poll has ended" });
            return;
        }
        
        const oldPollState = currentPoll;
        const newVoters = { ...(oldPollState.voters || {}), [user.uid]: optionText };
        const newOptions = { ...oldPollState.options };

        const oldVote = oldPollState.voters?.[user.uid];
        if (oldVote && oldVote !== optionText) {
            newOptions[oldVote] = Math.max(0, (newOptions[oldVote] || 0) - 1);
        }
        if (oldVote !== optionText) {
            newOptions[optionText] = (newOptions[optionText] || 0) + 1;
        }

        // Optimistic UI update
        setCurrentPoll({ options: newOptions, voters: newVoters });

        try {
            await voteOnPoll(postId, collectionName, optionText);
        } catch (error: any) {
            // Revert on failure
            setCurrentPoll(oldPollState);
            toast({ variant: "destructive", title: "Vote Failed", description: error.message || "An error occurred." });
        }
    };
    
    const totalVotes = Object.values(currentPoll.options).reduce((acc, votes) => acc + votes, 0);
    const hasVoted = !!userVote;

    return (
        <div className="mt-4 space-y-2">
            <AnimatePresence>
                {Object.entries(currentPoll.options).map(([optionText, votes]) => {
                    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const isVotedOption = userVote === optionText;

                    return (
                        <motion.div
                            key={optionText}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative w-full"
                        >
                            <Button
                                variant="outline"
                                className="w-full h-10 flex items-center rounded-md overflow-hidden border justify-between px-4 transition-colors"
                                onClick={() => handleVote(optionText)}
                                disabled={hasEnded || !user}
                            >
                                <motion.div
                                    className={cn("absolute top-0 left-0 h-full rounded-md", isVotedOption ? 'bg-primary' : 'bg-primary/20')}
                                    initial={{ width: 0 }}
                                    animate={{ width: hasVoted || hasEnded ? `${percentage}%` : '0%'}}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                />
                                <div className="relative z-10 flex items-center gap-2 font-semibold">
                                   {isVotedOption && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />} 
                                   <span className={isVotedOption ? 'text-primary-foreground' : ''}>{optionText}</span>
                                </div>
                                {(hasVoted || hasEnded) && (
                                    <span className={cn("relative z-10 font-bold", isVotedOption ? 'text-primary-foreground' : '')}>{percentage}%</span>
                                )}
                            </Button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
            <div className="text-xs text-muted-foreground flex items-center justify-between pt-2">
                <span>{totalVotes} votes</span>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <span className="flex items-center gap-1">
                                <Timer className="h-3 w-3"/>
                                {formatTimeLeft(timeLeft)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Poll ends on {new Date(pollEndTime).toLocaleString()}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
};
