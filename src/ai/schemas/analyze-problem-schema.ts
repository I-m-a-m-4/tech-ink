
/**
 * @fileOverview Defines the Zod schemas and TypeScript types for the problem analysis feature.
 */
import {z} from 'zod';

export const AnalyzeProblemInputSchema = z.object({
  problem: z.string().describe('A detailed description of the problem or topic to be analyzed.'),
});
export type AnalyzeProblemInput = z.infer<typeof AnalyzeProblemInputSchema>;

export const AnalyzeProblemOutputSchema = z.object({
  summary: z.string().describe("A concise, high-level summary of the entire analysis, like an executive summary."),
  analysis: z.string().describe("A detailed, in-depth analysis of the problem, formatted in Markdown. It should break down the problem into its core components, discuss the context, challenges, and opportunities."),
  potentialSolutions: z.array(z.string()).describe("A list of 3-5 potential solutions, strategies, or next steps to address the problem."),
});
export type AnalyzeProblemOutput = z.infer<typeof AnalyzeProblemOutputSchema>;
