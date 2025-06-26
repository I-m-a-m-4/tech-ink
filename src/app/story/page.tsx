
"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { RetroTv3d } from '@/components/retro-tv-3d';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';

const StoryText = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2']
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.2, 1, 0.2]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 1], ['30px', '-30px']);

  return (
    <motion.p
      ref={ref}
      style={{ opacity, scale, y }}
      className="text-lg md:text-xl text-foreground max-w-2xl mx-auto text-balance text-center"
    >
      {children}
    </motion.p>
  );
};

const storyPageContent = [
  "class TechInk {",
  "  constructor() {",
  "    this.mission = 'Clarity';",
  "    this.tools = ['AI', 'Data'];",
  "  }",
  " ",
  "  run() {",
  "    console.log('Insight Engine...');",
  "    this.community.engage();",
  "  }",
  "}",
  " ",
  "// Tech News 🔥 Data Talks",
];


export default function StoryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-extrabold md:text-7xl animate-gradient"
            >
              The Story of Tech Ink
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }} 
              className="mt-6 text-xl text-muted-foreground text-balance"
            >
              It started with a goal, a flicker of code, and a lot of questions.
            </motion.p>
          </div>

          <div className="h-[400px] md:h-[500px] my-16 md:my-24 max-w-2xl mx-auto">
            <RetroTv3d content={storyPageContent} />
          </div>

          <div className="space-y-16">
            <StoryText>
              My name is <span className="font-bold text-primary">Bime</span>. I'm a Part 2 Electrical & Electronics Engineering student, a software developer, and a tech enthusiast with a burning ambition: to build the next unicorn startup. To build something that truly solves a problem.
            </StoryText>

            <StoryText>
              The path to a great idea, however, is rarely a straight line. I found myself at my faculty's symposium, listening to the CTO of AFEX. He talked about the immense power of data, but more importantly, about context. He explained why a brilliant solution like Stripe or DoorDash might not work in Africa, while local champions like Paystack and Chowdeck thrive. They understand the culture.
            </StoryText>
            
            <StoryText>
             A realization struck me. The biggest challenge wasn&apos;t just a lack of problems to solve, but the profound difficulty in finding like-minded people to explore them with. I was looking for a community to truly &quot;rub minds&quot; with—the builders, the thinkers, the dreamers—but the online world felt too noisy for the deep, meaningful conversations that spark real innovation. I hope we build a strong community as time goes on.
            </StoryText>
            
            <StoryText>
              And so, Tech Ink was born. First as a quiet WhatsApp group, an idea held close. Staring at the code editor late one night, a familiar hesitation crept in. That whisper of doubt before you share something new with the world. Is it good enough? Will anyone care?
            </StoryText>

            <StoryText>
              But the dream of building this community—this insight engine—was stronger than any doubt. I realized the world doesn&apos;t need another perfect, polished product from day one. It needs passionate people willing to start, to build in public, and to learn together. This platform isn&apos;t just a project; it&apos;s an invitation. It&apos;s our starting line to create something big, together.
            </StoryText>
          </div>

          <div className="mt-24 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            >
              <h2 className="text-3xl md:text-4xl font-extrabold">Let's Build This Thing. Together.</h2>
              <p className="mt-4 max-w-xl mx-auto text-muted-foreground text-lg">
                Join the conversation. Share your insights. Be part of the foundation.
              </p>
              <Button asChild size="lg" className="mt-8">
                <Link href="https://chat.whatsapp.com/CbCQukJJUBIJv3hbx7Qin1" target="_blank" rel="noopener noreferrer">
                  Join the WhatsApp Community <Icons.message className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>

        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
