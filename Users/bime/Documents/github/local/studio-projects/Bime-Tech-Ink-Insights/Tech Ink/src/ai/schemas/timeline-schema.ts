
/**
 * @fileOverview Defines the Zod schema and TypeScript type for a timeline event.
 */
import {z} from 'genkit';

export const TimelineEventSchema = z.object({
  year: z.string().describe("The year the event occurred."),
  title: z.string().describe("The title of the timeline event."),
  description: z.string().describe("A short description of the event and its significance."),
});

export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
