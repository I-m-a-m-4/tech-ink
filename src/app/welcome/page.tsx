
"use client";

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClientLink } from '@/components/client-link';
import { Rocket, Users, Target, Award } from 'lucide-react';
import { Confetti } from '@/components/confetti';

const Section = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1 text-primary">{icon}</div>
        <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="mt-1 text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                {children}
            </div>
        </div>
    </div>
);

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Confetti />
        <section className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            <Card className="bg-card/40 shadow-xl border-border/60">
              <CardHeader className="text-center">
                <h1 className="text-4xl font-extrabold md:text-5xl animate-gradient mt-4">Welcome to the Tech Ink Platform!</h1>
                <CardDescription className="text-lg mt-2">
                  An Insight Engine for the Future of Tech
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-8">
                
                <p className="text-center text-muted-foreground">
                  Hey everyone! Bime here. What started as our vibrant WhatsApp group is now evolving into something much more powerful: an **insight engine**. I've built this platform as our new home—a dedicated space to expand on the amazing conversations we would be having.
                </p>

                <Section icon={<Rocket className="h-6 w-6" />} title="What is 'Tech Ink'?">
                    <p>
                        This is our own private, micro-blogging platform, but with a twist. It's a place where we can not only share news but also analyze it with AI, explore data, and connect the dots. It’s a tool for turning information into deep understanding.
                    </p>
                </Section>
                
                <Section icon={<Users className="h-6 w-6" />} title="What It's For & What's Expected">
                    <p>
                        The goal is to be a true **insight engine**. This is where we can:
                    </p>
                    <ul>
                        <li>Post detailed thoughts, analyses, and tech discoveries on the <ClientLink href="/feed" className="text-primary underline">Live Feed</ClientLink>.</li>
                        <li>Use AI-powered tools to analyze complex topics and chart data.</li>
                        <li>Focus on the "why" behind the news, not just the "what".</li>
                    </ul>
                    <p>
                        What's expected of us is the same standard we've always had: **high-quality insights**. Share what you're learning, building, or thinking about. Ask tough questions. Challenge ideas respectfully.
                    </p>
                </Section>
                
                <Section icon={<Target className="h-6 w-6" />} title="My Role & The Future of Tech Ink">
                    <p>
                        As the builder of this platform, my role is to facilitate our growth. I'll be maintaining the site, adding new features (your suggestions are welcome!), and ensuring this remains a valuable space for all of us.
                    </p>
                    <p>
                        The potential for Tech Ink is immense. We can turn this into a go-to resource for genuine tech analysis, a launchpad for collaborative projects, and a powerful community of the next generation of tech leaders in Africa and beyond.
                    </p>
                </Section>

                <Section icon={<Award className="h-6 w-6" />} title="The Leaderboard Mission: A Race to Ownership">
                   <p>
                        This isn't just a community; it's an opportunity. As you'll see on the <ClientLink href="/leaderboard" className="text-primary underline">Leaderboard</ClientLink>, we have a mission: **The Race to 1 Million Ink Points**.
                   </p>
                   <p className="font-bold text-foreground">
                        The first two members to achieve this milestone will be rewarded with 5% equity each in Tech Ink Insights.
                   </p>
                   <p>
                        Your contributions—your posts, your likes, your analyses—don't just earn you points; they build your stake in our shared future. Every action fuels the insight engine and builds your ownership in what we create together.
                   </p>
                </Section>

                <div className="text-center pt-6">
                    <p className="text-xl font-bold">Let's start building.</p>
                    <Button asChild size="lg" className="mt-4">
                        <ClientLink href="/feed">
                            Go to the Feed
                        </ClientLink>
                    </Button>
                </div>

              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
