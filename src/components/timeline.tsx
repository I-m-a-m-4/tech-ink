
"use client";

import type { TimelineEvent } from "@/ai/schemas/timeline-schema";

interface TimelineProps {
    events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
    return (
        <div className="relative">
            {/* The vertical line */}
            <div className="absolute left-4 top-0 h-full w-0.5 bg-border -translate-x-1/2"></div>
            
            <div className="space-y-12">
                {events.map((event, index) => (
                    <div key={index} className="relative flex items-start gap-6">
                        {/* The dot on the timeline */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary ring-8 ring-background">
                            <div className="h-3 w-3 rounded-full bg-primary-foreground" />
                        </div>
                        <div className="flex-1 pt-1">
                            <p className="text-sm font-semibold text-primary">{event.year}</p>
                            <h3 className="mt-1 text-xl font-bold text-foreground">{event.title}</h3>
                            <p className="mt-2 text-muted-foreground">{event.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
