
'use server';
/**
 * @fileOverview An AI agent for generating data-driven tech insights.
 *
 * - generateInsights - A function that generates a list of insights including charts and quotes.
 * - Insight - The type for a single insight.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InsightSchema = z.object({
    type: z.enum(['bar', 'line', 'area', 'quote']).describe("The type of insight: 'bar' chart, 'line' chart, 'area' chart, or 'quote'."),
    title: z.string().describe("The title of the insight."),
    description: z.string().describe("A brief description of the insight and its potential future implications."),
    data: z.array(z.record(z.any())).optional().describe("An array of data objects for the chart. Required if type is not 'quote'."),
    quote: z.object({
        text: z.string(),
        author: z.string(),
    }).optional().describe("The quote object. Required if type is 'quote'."),
    config: z.record(z.object({
        label: z.string(),
        color: z.string().describe("A color in HSL format, e.g., hsl(var(--chart-1))"),
    })).optional().describe("Configuration for the chart, mapping data keys to labels and colors."),
});
export type Insight = z.infer<typeof InsightSchema>;

const GenerateInsightsOutputSchema = z.object({
    insights: z.array(InsightSchema),
});
export type GenerateInsightsOutput = z.infer<typeof GenerateInsightsOutputSchema>;

const GenerateInsightsInputSchema = z.object({
    count: z.number().describe('Number of insights to generate.'),
});
export type GenerateInsightsInput = z.infer<typeof GenerateInsightsInputSchema>;

export async function generateInsights(input: GenerateInsightsInput): Promise<GenerateInsightsOutput> {
  return generateInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInsightsPrompt',
  input: {schema: GenerateInsightsInputSchema},
  output: {schema: GenerateInsightsOutputSchema},
  prompt: `You are a world-class tech market analyst AI. Your task is to generate a series of data-driven insights based on fictional, recent developments in the technology sector. Your insights should be knowledgeable, spark innovation, and make the user feel smarter.
Adopt a slightly informal, highly-engaging tone suitable for a Gen Z audience. Use contractions and avoid robotic, overly formal language. The goal is to sound like a very smart, passionate tech enthusiast, not a dry academic.

Generate {{{count}}} unique insights.

For each insight, you must provide:
1.  A 'type': either 'bar', 'line', 'area', or 'quote'.
2.  A 'title': a compelling headline for the insight.
3.  A 'description': a short paragraph explaining the insight, what it means for the future, and why it's significant.
4.  If the type is a chart ('bar', 'line', 'area'):
    - 'data': An array of JSON objects suitable for a charting library like Recharts. Each object in the array represents a point on the chart. Use a 'name' key for the x-axis label.
    - 'config': A JSON object mapping the data keys to a 'label' for the legend and a 'color' in HSL format (e.g., "hsl(var(--chart-1))", "hsl(var(--chart-2))", etc.).
5.  If the type is 'quote':
    - 'quote': An object with 'text' and 'author' (the author can be a fictional tech leader or thinker).

Create diverse and interesting insights covering topics like AI, Quantum Computing, Web3, Cybersecurity, Developer Productivity, and Hardware advancements. Ensure the data you generate tells a clear, powerful story that matches the title and description.

Example for a bar chart about startup trends:
{
  "type": "bar",
  "title": "Over Two-Thirds of YC's Latest Batch are AI-Native",
  "description": "An analysis of Y-Combinator's most recent cohort reveals a staggering trend: 68% of accepted startups are building AI-native products, not just using AI as a feature. This signals a major shift in venture capital focus away from SaaS and towards foundational AI infrastructure and applications. What it means for the future: a Cambrian explosion of AI-first companies is imminent, potentially leading to a market consolidation within 5 years as the best models win.",
  "data": [
    { "name": "AI/ML", "Startups": 210 },
    { "name": "FinTech", "Startups": 45 },
    { "name": "HealthTech", "Startups": 30 },
    { "name": "SaaS", "Startups": 15 }
  ],
  "config": {
    "Startups": { "label": "Number of Startups", "color": "hsl(var(--chart-1))" }
  }
}

Example for a quote:
{
  "type": "quote",
  "title": "On the True Latency of Code",
  "description": "A thought-provoking take from a leading developer philosopher on the hidden costs of software development.",
  "quote": {
    "text": "The greatest latency in software isn't network, but cognition. The time it takes for a new developer to understand a codebase is the true measure of its efficiency.",
    "author": "Dr. Alistair Finch, Fictional Developer Philosopher"
  }
}

Now, generate the insights.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
       {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
       {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
});

const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateInsightsFlow',
    inputSchema: GenerateInsightsInputSchema,
    outputSchema: GenerateInsightsOutputSchema,
  },
  async (input) => {
    try {
        const result = await prompt(input);
        const output = result.output;
        
        if (!output || !output.insights) {
            throw new Error("AI failed to generate valid insights.");
        }
        
        return output;
    } catch (e) {
        console.error("An error occurred in generateInsightsFlow while calling the AI model:", e);
        return { insights: [] };
    }
  }
);
