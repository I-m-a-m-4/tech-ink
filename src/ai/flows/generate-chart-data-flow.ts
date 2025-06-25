
'use server';
/**
 * @fileOverview An AI agent for generating chart data from a description.
 *
 * - generateChartData - A function that handles generating chart data and config.
 */

import {ai} from '@/ai/genkit';
import { GenerateChartDataInputSchema, GenerateChartDataOutputSchema, type GenerateChartDataInput, type GenerateChartDataOutput } from '@/ai/schemas/chart-data-schema';

export async function generateChartData(input: GenerateChartDataInput): Promise<GenerateChartDataOutput> {
  return generateChartDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChartDataPrompt',
  input: {schema: GenerateChartDataInputSchema},
  output: {schema: GenerateChartDataOutputSchema},
  prompt: `You are a data visualization expert and market analyst AI. Your task is to generate plausible data for a chart based on a title and description.
The data must be realistic and tell a story that aligns with the provided context.

The user wants a '{{{type}}}' chart.

**Context:**
- **Title:** {{{title}}}
- **Description:** {{{description}}}

**Your Task:**
Generate two JSON strings:
1.  **data**: A JSON string representing an array of objects. Each object is a data point. Use a "name" key for the x-axis labels. For other keys, use descriptive names.
2.  **config**: A JSON string representing the chart's configuration object. This object should map the data keys (from the data array) to a "label" for the chart legend and a "color" in HSL format (e.g., "hsl(var(--chart-1))", "hsl(var(--chart-2))").

**Example Output for a 'bar' chart:**
{
  "data": "[{\\"name\\":\\"AI/ML\\",\\"Startups\\":210},{\\"name\\":\\"FinTech\\",\\"Startups\\":45},{\\"name\\":\\"HealthTech\\",\\"Startups\\":30},{\\"name\\":\\"SaaS\\",\\"Startups\\":15}]",
  "config": "{\\"Startups\\":{\\"label\\":\\"Number of Startups\\",\\"color\\":\\"hsl(var(--chart-1))\\"}}"
}

**Important Rules:**
- The output MUST be a single valid JSON object with "data" and "config" keys, and their values must be STRINGS of valid JSON.
- Do not use a tool to search the web. Generate realistic data based on your training.
- The generated data and config should be directly usable with the Recharts library.

Now, generate the chart data based on the provided context.`,
});

const generateChartDataFlow = ai.defineFlow(
  {
    name: 'generateChartDataFlow',
    inputSchema: GenerateChartDataInputSchema,
    outputSchema: GenerateChartDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
