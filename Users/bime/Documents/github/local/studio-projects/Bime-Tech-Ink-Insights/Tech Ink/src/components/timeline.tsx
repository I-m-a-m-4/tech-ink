
"use client";

import { type TimelineEvent } from "@/ai/schemas/timeline-schema";
import { motion } from 'framer-motion';
import { Briefcase } from "lucide-react";

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="relative wrap overflow-hidden p-10 h-full">
      <div className="border-2-2 absolute border-primary/30 h-full border" style={{left: '50%'}}></div>
      {events.map((event, index) => (
        <div key={index} className={`mb-8 flex justify-between items-center w-full ${index % 2 === 0 ? 'flex-row-reverse left-timeline' : 'right-timeline'}`}>
          <div className="order-1 w-5/12"></div>
          <div className="z-20 flex items-center order-1 bg-primary shadow-xl w-12 h-12 rounded-full">
            <h1 className="mx-auto font-semibold text-lg text-primary-foreground">{event.year}</h1>
          </div>
          <motion.div 
            className="order-1 bg-card rounded-lg shadow-xl w-5/12 px-6 py-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-bold text-card-foreground text-xl">{event.title}</h3>
            <p className="text-sm leading-snug tracking-wide text-muted-foreground mt-2">{event.description}</p>
          </motion.div>
        </div>
      ))}
    </div>
  );
}
