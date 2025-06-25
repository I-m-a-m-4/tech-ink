
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { generateBriefing } from '@/ai/flows/generate-briefing-flow';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';


export default function BriefingPage() {
    const { user, loading: authLoading } = useAuth();
    const [briefing, setBriefing] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchOrCreateBriefing = async () => {
            if (!db) {
                setError("Database connection is not available.");
                setIsLoading(false);
                return;
            }

            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const briefingRef = doc(db, 'briefings', `${user.uid}_${today}`);

            try {
                const docSnap = await getDoc(briefingRef);

                if (docSnap.exists()) {
                    setBriefing(docSnap.data().briefing);
                } else {
                    const result = await generateBriefing({ userId: user.uid });
                    if (result.briefing) {
                        await setDoc(briefingRef, {
                            briefing: result.briefing,
                            createdAt: serverTimestamp()
                        });
                        setBriefing(result.briefing);
                    } else {
                        throw new Error("AI failed to generate a briefing.");
                    }
                }
            } catch (e: any) {
                console.error("Error fetching or creating briefing:", e);
                setError("Sorry, we couldn't generate your briefing at this time. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrCreateBriefing();
    }, [user, authLoading]);

    const renderContent = () => {
        if (isLoading || authLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <h3 className="text-xl font-semibold">Crafting Your Briefing...</h3>
                    <p className="text-muted-foreground mt-2">Our AI is analyzing the latest insights just for you.</p>
                </div>
            );
        }

        if (!user) {
             return (
                <div className="text-center p-8">
                    <h3 className="text-xl font-semibold">Access Your Briefing</h3>
                    <p className="text-muted-foreground mt-2">Log in to receive your personalized daily tech summary.</p>
                    <Button asChild className="mt-4"><a href="/login">Login</a></Button>
                </div>
            );
        }

        if (error) {
            return <div className="p-8 text-center text-destructive">{error}</div>;
        }

        if (briefing) {
            return (
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <ReactMarkdown>{briefing}</ReactMarkdown>
                </div>
            )
        }

        return null;
    }

    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">
                <section className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
                    <div className="mx-auto max-w-4xl">
                        <div className="mx-auto mb-12 text-center">
                            <BrainCircuit className="mx-auto h-12 w-12 text-primary" />
                            <h1 className="text-4xl font-black md:text-6xl animate-gradient mt-4">Your Daily Briefing</h1>
                            <p className="mt-4 text-lg text-muted-foreground">
                                A personalized summary of tech news and insights, just for you.
                            </p>
                        </div>

                        <Card className="shadow-xl">
                            <CardContent className="p-6 md:p-8">
                               {renderContent()}
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}

