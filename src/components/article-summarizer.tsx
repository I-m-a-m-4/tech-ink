
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { summarizeArticle } from "@/ai/flows/summarize-tech-articles";
import { Separator } from "./ui/separator";

const formSchema = z.object({
  articleText: z.string()
    .min(200, { message: "Article text must be at least 200 characters long." })
    .max(15000, { message: "Article text must be less than 15,000 characters." }),
});

export function ArticleSummarizer() {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      articleText: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSummary("");
    try {
      const result = await summarizeArticle(values);
      setSummary(result.summary);
    } catch (error) {
      console.error("Summarization error:", error);
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description: "Failed to summarize the article. This could be due to an API key issue or network problem.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <Card className="border-border/60 bg-card/40 shadow-xl">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="articleText"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the full text of a tech article here and let our AI do the rest..."
                        className="min-h-[250px] resize-y bg-background/50 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} size="lg" className="w-full font-bold">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  "Summarize Article"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {(isLoading || summary) && (
        <Card className="border-border/60 bg-card/40 shadow-xl animate-in fade-in-50">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Here is the AI-generated summary of your article.</CardDescription>
          </CardHeader>
          <Separator className="mx-6 w-auto" />
          <CardContent className="p-6 pt-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 bg-muted/80 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-muted/80 rounded animate-pulse w-[90%]"></div>
                <div className="h-4 bg-muted/80 rounded animate-pulse w-[80%]"></div>
                <div className="h-4 bg-muted/80 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-muted/80 rounded animate-pulse w-[70%]"></div>
              </div>
            ) : (
              <p className="text-lg text-foreground/90 whitespace-pre-wrap leading-relaxed">{summary}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
