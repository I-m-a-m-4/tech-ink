
'use server';
/**
 * @fileOverview An AI agent for providing deep analysis on a given problem.
 *
 * - analyzeProblem - A function that handles the problem analysis process.
 */

import {ai} from '@/ai/genkit';
import { 
    AnalyzeProblemInputSchema,
    AnalyzeProblemOutputSchema,
    type AnalyzeProblemInput, 
    type AnalyzeProblemOutput 
} from '@/ai/schemas/analyze-problem-schema';

export async function analyzeProblem(input: AnalyzeProblemInput): Promise<AnalyzeProblemOutput> {
  return analyzeProblemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeProblemPrompt',
  input: {schema: AnalyzeProblemInputSchema},
  output: {schema: AnalyzeProblemOutputSchema},
  prompt: `You are an expert consultant, strategist, and market analyst AI. A user has provided a problem statement and requires a deep, structured analysis.

Your task is to provide a comprehensive breakdown of the problem. Your response MUST be structured into three parts:
1.  **summary**: An executive summary. A short, powerful paragraph that gives the most important takeaway from the full analysis.
2.  **analysis**: A detailed analysis. Use Markdown for clear formatting. Break down the problem into its constituent parts. Discuss the current landscape, key players, underlying technology, market forces, challenges, and opportunities. Be insightful and forward-looking.
3.  **potentialSolutions**: A bulleted list of 3 to 5 actionable and creative potential solutions, next steps, or strategic approaches to the problem.

Problem Statement:
"{{{problem}}}"

Now, generate your comprehensive analysis in the specified JSON format.`,
});

const analyzeProblemFlow = ai.defineFlow(
  {
    name: 'analyzeProblemFlow',
    inputSchema: AnalyzeProblemInputSchema,
    outputSchema: AnalyzeProblemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
