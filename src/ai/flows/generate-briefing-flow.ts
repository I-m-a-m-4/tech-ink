
'use server';
/**
 * @fileOverview An AI agent for generating a personalized daily briefing.
 *
 * - generateBriefing - A function that handles generating the briefing.
 * - GenerateBriefingInput - The input type for the generateBriefing function.
 * - GenerateBriefingOutput - The return type for the generateBriefing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBriefingInputSchema = z.object({
  userId: z.string().describe("The ID of the user requesting the briefing."),
});
export type GenerateBriefingInput = z.infer<typeof GenerateBriefingInputSchema>;

const GenerateBriefingOutputSchema = z.object({
  briefing: z.string().describe("The personalized daily briefing content in Markdown format."),
});
export type GenerateBriefingOutput = z.infer<typeof GenerateBriefingOutputSchema>;

export async function generateBriefing(input: GenerateBriefingInput): Promise<GenerateBriefingOutput> {
  return generateBriefingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBriefingPrompt',
  input: {schema: GenerateBriefingInputSchema},
  output: {schema: GenerateBriefingOutputSchema},
  prompt: `You are a personal AI assistant for a user on the Tech Ink Insights platform. Your task is to generate a concise, insightful, and personalized daily briefing about the world of technology.

The user's ID is {{{userId}}}, but for now, generate a general briefing that would be interesting to any tech enthusiast.

The briefing should be formatted in Markdown and include:
1.  A short, welcoming introduction.
2.  A "Top Story" section with a 1-2 paragraph summary of a major fictional tech event.
3.  A "Quick Hits" section with 2-3 bullet points on other interesting fictional tech news.
4.  A "Food for Thought" section with a thought-provoking question or quote about technology's impact on society.
5.  A friendly closing.

Make the content feel futuristic, insightful, and exclusive to the Tech Ink Insights platform.`,
});

const generateBriefingFlow = ai.defineFlow(
  {
    name: 'generateBriefingFlow',
    inputSchema: GenerateBriefingInputSchema,
    outputSchema: GenerateBriefingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
