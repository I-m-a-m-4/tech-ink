
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Bar, BarChart, Line, LineChart, Area, AreaChart, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { ArrowRight, Bot, Loader2, User, Quote as QuoteIcon, Share2, AlertTriangle } from "lucide-react";
import { type Insight } from "@/ai/flows/generate-insights-flow";
import { chatWithChart } from "@/ai/flows/chat-with-chart-flow";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./ui/separator";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

const chatFormSchema = z.object({
  question: z.string().min(5, { message: "Question must be at least 5 characters." }),
});

interface InsightItemProps {
  insight: Insight & { id: string };
}

export function InsightItem({ insight }: InsightItemProps) {
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conversation, setConversation] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const { toast } = useToast();
  const { user, addPoints } = useAuth();

  const form = useForm<z.infer<typeof chatFormSchema>>({
    resolver: zodResolver(chatFormSchema),
    defaultValues: { question: "" },
  });

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/insights?insight=${insight.id}`;
    if (navigator.share) {
        await navigator.share({ title: insight.title, text: insight.description, url: shareUrl }).catch(error => console.error('Error sharing:', error));
    } else {
        navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link Copied!", description: "A link to this insight has been copied." });
    }
 };

  async function onChatSubmit(values: z.infer<typeof chatFormSchema>) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Login Required",
            description: "You must be logged in to ask the AI questions.",
        });
        return;
    }
    
    setIsChatLoading(true);
    setConversation(prev => [...prev, { role: 'user', text: values.question }]);
    
    addPoints(10);

    try {
      const result = await chatWithChart({
        question: values.question,
        chartData: JSON.stringify(insight.data),
        title: insight.title,
      });
      setConversation(prev => [...prev, { role: 'bot', text: result.answer }]);
      form.reset();
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description: "Failed to get an answer. Please try again.",
      });
      // remove the user question on error
      setConversation(prev => prev.slice(0, -1));
    } finally {
      setIsChatLoading(false);
    }
  }

  const renderChart = () => {
    if (!insight.data || !Array.isArray(insight.data) || insight.data.length === 0) {
        return null; // Should be caught by renderContent, but as a safeguard.
    }
    const dataKeys = Object.keys(insight.data[0]).filter(k => k !== 'name');

    switch (insight.type) {
      case 'bar':
        return (
          <BarChart data={insight.data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Legend />
            {dataKeys.map((key) => (
              <Bar key={key} dataKey={key} fill={`var(--color-${key.replace(/[^a-zA-Z0-9]/g, '')})`} radius={4} />
            ))}
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={insight.data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Legend />
            {dataKeys.map((key) => (
                <Line key={key} type="monotone" dataKey={key} stroke={`var(--color-${key.replace(/[^a-zA-Z0-9]/g, '')})`} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        );
      case 'area':
        return (
            <AreaChart data={insight.data}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Legend />
                {dataKeys.map((key) => (
                    <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={`var(--color-${key.replace(/[^a-zA-Z0-9]/g, '')})`} fill={`var(--color-${key.replace(/[^a-zA-Z0-9]/g, '')})`} fillOpacity={0.4} />
                ))}
            </AreaChart>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (insight.type === 'quote' && insight.quote) {
      return (
        <blockquote className="border-l-4 border-primary pl-6 italic text-lg">
          "{insight.quote.text}"
          <footer className="mt-2 text-sm text-muted-foreground not-italic">— {insight.quote.author}</footer>
        </blockquote>
      );
    }
    
    if (insight.type !== 'quote' && (!insight.data || !Array.isArray(insight.data) || insight.data.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground bg-muted/50 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                <p className="font-semibold">Chart Data Not Available</p>
                <p className="text-sm">The data for this insight could not be loaded.</p>
            </div>
        );
    }

    const dataKeys = Object.keys(insight.data[0]).filter(k => k !== 'name');

    let chartConfig: ChartConfig = {};
    try {
        const parsedConfig = typeof insight.config === 'string' ? JSON.parse(insight.config) : insight.config;
        const augmentedConfig: { [key: string]: any } = parsedConfig ? JSON.parse(JSON.stringify(parsedConfig)) : {};
        dataKeys.forEach((key, index) => {
            if (!augmentedConfig[key]) {
                augmentedConfig[key] = { label: key };
            }
            if (!augmentedConfig[key].color) {
                augmentedConfig[key].color = `hsl(var(--chart-${(index % 5) + 1}))`;
            }
        });

        chartConfig = Object.fromEntries(
            Object.entries(augmentedConfig).map(([key, value]) => [key.replace(/[^a-zA-Z0-9]/g, ''), value])
        );
    } catch (e) {
         console.error("Failed to parse chart config:", e);
         // Gracefully handle the error by creating a default config
         dataKeys.forEach((key, index) => {
            chartConfig[key.replace(/[^a-zA-Z0-9]/g, '')] = {
                label: key,
                color: `hsl(var(--chart-${(index % 5) + 1}))`
            }
         });
    }

    return (
      <ScrollArea className="w-full whitespace-nowrap md:whitespace-normal">
        <ChartContainer config={chartConfig} className="h-[300px] w-full min-w-[500px] md:min-w-0">
          {renderChart()}
        </ChartContainer>
        <ScrollBar orientation="horizontal" className="md:hidden" />
      </ScrollArea>
    );
  };

  return (
    <Card className="bg-card/40 shadow-lg border-border/60 animate-in fade-in-50">
      <CardHeader>
        <div className="flex justify-between items-center">
            {insight.type === 'quote' ? (
                <div className="flex items-center gap-2">
                <QuoteIcon className="h-6 w-6 text-primary flex-shrink-0" />
                <CardTitle>{insight.title}</CardTitle>
                </div>
            ) : (
                <CardTitle>{insight.title}</CardTitle>
            )}
             <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
                <span className="sr-only">Share Insight</span>
            </Button>
        </div>
        <CardDescription className="pt-1">{insight.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
      {insight.type !== 'quote' && (
        <>
            <Separator className="mx-6 w-auto" />
            <div className="p-6">
                <h4 className="font-semibold text-sm mb-4">Ask AI about this chart</h4>
                <div className="space-y-4">
                    {conversation.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'bot' ? '' : 'justify-end'}`}>
                            {msg.role === 'bot' && <div className="p-2 rounded-full bg-primary/20"><Bot className="h-5 w-5 text-primary" /></div>}
                            <div className={`rounded-lg p-3 max-w-[80%] ${msg.role === 'bot' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                             {msg.role === 'user' && <div className="p-2 rounded-full bg-muted"><User className="h-5 w-5 text-foreground" /></div>}
                        </div>
                    ))}
                    {isChatLoading && conversation[conversation.length - 1]?.role === 'user' && (
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-primary/20"><Bot className="h-5 w-5 text-primary" /></div>
                            <div className="rounded-lg p-3 bg-muted flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>
                {user ? (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onChatSubmit)} className="mt-4 flex items-center gap-2">
                            <FormField
                                control={form.control}
                                name="question"
                                render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <Input placeholder="e.g., Which item is the highest?" {...field} />
                                    </FormControl>
                                </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isChatLoading} size="icon">
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </form>
                    </Form>
                ) : (
                    <div className="mt-4 text-center">
                        <Button asChild><Link href="/login">Log in to ask the AI</Link></Button>
                    </div>
                )}
            </div>
        </>
      )}
    </Card>
  );
}
