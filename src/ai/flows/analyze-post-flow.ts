
'use server';
/**
 * @fileOverview An AI agent for analyzing a social media post.
 *
 * - analyzePost - A function that handles analyzing a post's content.
 * - AnalyzePostInput - The input type for the analyzePost function.
 * - AnalyzePostOutput - The return type for the analyzePost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePostInputSchema = z.object({
  headline: z.string().describe("The headline of the post."),
  content: z.string().describe('The content of the post to be analyzed.'),
});
export type AnalyzePostInput = z.infer<typeof AnalyzePostInputSchema>;

const AnalyzePostOutputSchema = z.object({
  analysis: z.string().describe("A detailed, insightful analysis of the post's content."),
});
export type AnalyzePostOutput = z.infer<typeof AnalyzePostOutputSchema>;

export async function analyzePost(input: AnalyzePostInput): Promise<AnalyzePostOutput> {
  return analyzePostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePostPrompt',
  input: {schema: AnalyzePostInputSchema},
  output: {schema: AnalyzePostOutputSchema},
  prompt: `You are an expert tech analyst AI. A user wants to understand a topic more deeply based on a social media post.
Your task is to provide a detailed analysis of the post's content.

Your analysis should:
1.  Explain the key concepts mentioned in simple terms.
2.  Discuss the potential impact or significance of the topic.
3.  Provide some related context, interesting facts, or future outlook.
4.  The analysis should be structured, insightful, and easy to read. Use markdown for formatting if needed.

Post Headline: {{{headline}}}
Post Content:
{{{content}}}

Now, generate the analysis.`,
});

const analyzePostFlow = ai.defineFlow(
  {
    name: 'analyzePostFlow',
    inputSchema: AnalyzePostInputSchema,
    outputSchema: AnalyzePostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
