
"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Wand2, Bot, User, BrainCircuit, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { analyzeProblem } from "@/ai/flows/analyze-problem-flow";
import type { AnalyzeProblemOutput } from "@/ai/schemas/analyze-problem-schema";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  problem: z.string()
    .min(50, { message: "Please provide at least 50 characters for a thorough analysis." })
    .max(5000, { message: "The problem description must be less than 5,000 characters." }),
});

const suggestions = [
  "Challenges and opportunities for developing a hyper-local logistics service in Lagos, Nigeria.",
  "The future of decentralized finance (DeFi) in Africa and its potential to leapfrog traditional banking.",
  "How can AI be effectively used to improve agricultural yields for small-scale farmers in emerging markets?",
  "What are the primary ethical concerns and regulatory hurdles for deploying autonomous drones for medical supply delivery in remote areas?",
];

export default function AnalysisPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeProblemOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, addPoints } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { problem: "" },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values) => {
    if (!user) {
      toast({ variant: "destructive", title: "Login Required", description: "You must be logged in to use the analysis tool." });
      return;
    }
    
    setIsLoading(true);
    setAnalysisResult(null);
    addPoints(20);

    try {
      const result = await analyzeProblem(values);
      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description: "Failed to analyze the problem. This could be due to an API key issue or network problem.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderResults = () => {
    if (!analysisResult) return null;
    
    return (
        <div className="space-y-6">
            <Card className="bg-card/40">
                <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
                <CardContent><div className="prose dark:prose-invert max-w-none"><ReactMarkdown>{analysisResult.summary}</ReactMarkdown></div></CardContent>
            </Card>
             <Card className="bg-card/40">
                <CardHeader><CardTitle>Deep Analysis</CardTitle></CardHeader>
                <CardContent><div className="prose dark:prose-invert max-w-none"><ReactMarkdown>{analysisResult.analysis}</ReactMarkdown></div></CardContent>
            </Card>
             <Card className="bg-card/40">
                <CardHeader><CardTitle>Potential Solutions & Approaches</CardTitle></CardHeader>
                <CardContent>
                    <ul className="list-disc pl-5 space-y-2">
                        {analysisResult.potentialSolutions.map((solution, index) => (
                            <li key={index} className="prose dark:prose-invert max-w-none"><ReactMarkdown>{solution}</ReactMarkdown></li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
            <section className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
                 <div className="mx-auto max-w-4xl">
                     <div className="mx-auto mb-12 text-center">
                        <BrainCircuit className="mx-auto h-12 w-12 text-primary" />
                        <h1 className="text-4xl font-extrabold md:text-6xl animate-gradient mt-4">Deep Analysis Engine</h1>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Describe a complex problem or topic, and our AI will provide a structured, in-depth analysis to guide your thinking.
                        </p>
                    </div>

                    <Card className="border-border/60 bg-card/40 shadow-xl">
                        <CardContent className="p-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="problem"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-semibold">Problem Statement</FormLabel>
                                    <FormControl>
                                    <Textarea
                                        placeholder="Describe the problem you want to analyze. Be as specific as possible. For example: 'Analyze the challenges and opportunities for developing a hyper-local logistics service in Lagos, Nigeria.'"
                                        className="min-h-[250px] resize-y bg-background/50 text-base"
                                        {...field}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading || !user} size="lg" className="w-full font-bold">
                                {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Analyzing... This may take a moment.
                                </>
                                ) : (
                                    <>
                                        <Wand2 className="mr-2 h-5 w-5" />
                                        Analyze Problem
                                    </>
                                )}
                            </Button>
                             {!user && (
                                <p className="text-center text-sm text-muted-foreground">
                                    <Link href="/login" className="underline text-primary">Log in</Link> to use the analysis engine.
                                </p>
                            )}
                            </form>
                        </Form>
                        </CardContent>
                    </Card>

                     <div className="mt-12">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-dashed border-border" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-background px-4 text-muted-foreground">OR</span>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <h3 className="text-lg font-semibold">Get inspired with a sample topic</h3>
                            <p className="text-muted-foreground text-sm">Click one to populate the text area above.</p>
                        </div>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {suggestions.map((s, i) => (
                            <Card key={i} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => {
                                form.setValue('problem', s);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}>
                                <p className="font-medium text-sm">{s}</p>
                            </Card>
                            ))}
                        </div>
                    </div>

                    {(isLoading || analysisResult) && (
                        <div className="mt-12">
                            <Separator />
                            <div className="py-8 text-center">
                                <h2 className="text-3xl font-bold">Analysis Results</h2>
                            </div>
                            {isLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-48 w-full" />
                                    <Skeleton className="h-32 w-full" />
                                </div>
                            ) : (
                                renderResults()
                            )}
                        </div>
                    )}
                </div>
            </section>
        </main>
        <SiteFooter />
    </div>
  );
}
