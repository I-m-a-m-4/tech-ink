
'use server';
/**
 * @fileOverview An AI agent for answering questions about a specific dataset.
 *
 * - chatWithChart - A function that handles answering a user's question about chart data.
 * - ChatWithChartInput - The input type for the chatWithChart function.
 * - ChatWithChartOutput - The return type for the chatWithChart function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ChatWithChartInputSchema = z.object({
  chartData: z.string().describe('The JSON string representation of the chart data being discussed.'),
  question: z.string().describe("The user's question about the data."),
  title: z.string().describe("The title of the chart for context."),
});
export type ChatWithChartInput = z.infer<typeof ChatWithChartInputSchema>;

const ChatWithChartOutputSchema = z.object({
  answer: z.string().describe("A concise, data-driven answer to the user's question."),
});
export type ChatWithChartOutput = z.infer<typeof ChatWithChartOutputSchema>;

export async function chatWithChart(input: ChatWithChartInput): Promise<ChatWithChartOutput> {
  return chatWithChartFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithChartPrompt',
  input: {schema: ChatWithChartInputSchema},
  output: {schema: ChatWithChartOutputSchema},
  prompt: `You are a helpful and insightful data analyst AI. A user is asking a question about a specific chart.
Your task is to analyze the provided data and answer the user's question concisely.
Base your answer strictly on the data provided. Do not invent information.

Chart Title: {{{title}}}
Chart Data (JSON format):
\`\`\`json
{{{chartData}}}
\`\`\`

User's Question: "{{{question}}}"

Analyze the data and provide your answer.`,
});

const chatWithChartFlow = ai.defineFlow(
  {
    name: 'chatWithChartFlow',
    inputSchema: ChatWithChartInputSchema,
    outputSchema: ChatWithChartOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
