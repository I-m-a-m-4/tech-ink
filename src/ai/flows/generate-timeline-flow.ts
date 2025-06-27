
'use server';
/**
 * @fileOverview An AI agent for generating a tech timeline.
 *
 * - generateTimeline - A function that handles generating timeline events.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { TimelineEventSchema } from '@/ai/schemas/timeline-schema';

const GenerateTimelineInputSchema = z.object({
  topic: z.string().describe("The topic for the timeline, e.g., 'History of AI' or 'The Rise of Quantum Computing'."),
});
export type GenerateTimelineInput = z.infer<typeof GenerateTimelineInputSchema>;

const GenerateTimelineOutputSchema = z.object({
  events: z.array(TimelineEventSchema),
});
export type GenerateTimelineOutput = z.infer<typeof GenerateTimelineOutputSchema>;

export async function generateTimeline(input: GenerateTimelineInput): Promise<GenerateTimelineOutput> {
  return generateTimelineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTimelinePrompt',
  input: {schema: GenerateTimelineInputSchema},
  output: {schema: GenerateTimelineOutputSchema},
  prompt: `You are a tech historian AI. Your task is to generate a chronological timeline of key milestones for a given technology topic.
The timeline should be factual, insightful, and highlight the most significant events. Generate between 5 and 10 key events.

Topic: {{{topic}}}

For each event, provide:
- year: The year the event occurred (as a string).
- title: A short, compelling title for the milestone.
- description: A concise (1-2 sentences) explanation of the event and its significance.

Example for 'History of the Internet':
{
  "events": [
    { "year": "1969", "title": "ARPANET Goes Live", "description": "The precursor to the modern internet, connecting four university computers. It demonstrated the feasibility of packet switching." },
    { "year": "1983", "title": "TCP/IP Protocol Standardized", "description": "The adoption of the Transmission Control Protocol and Internet Protocol created a stable and universal language for computers to communicate." },
    { "year": "1991", "title": "The World Wide Web is Born", "description": "Tim Berners-Lee introduces the WWW, including HTML, URI, and HTTP, making the internet accessible to a broader audience." }
  ]
}

Now, generate the timeline for the provided topic.`,
});

const generateTimelineFlow = ai.defineFlow(
  {
    name: 'generateTimelineFlow',
    inputSchema: GenerateTimelineInputSchema,
    outputSchema: GenerateTimelineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
