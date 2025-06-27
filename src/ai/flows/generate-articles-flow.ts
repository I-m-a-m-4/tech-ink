
'use server';
/**
 * @fileOverview An AI agent for generating tech news articles.
 *
 * - generateArticles - A function that handles generating tech news articles.
 * - GenerateArticlesInput - The input type for the generateArticles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ArticleSchema, type Article } from '@/ai/schemas/article-schema';

// This export is necessary for the homepage to use the Article type.
export type { Article };

const GenerateArticlesOutputSchema = z.object({
  articles: z.array(ArticleSchema),
});
type GenerateArticlesOutput = z.infer<typeof GenerateArticlesOutputSchema>;


const GenerateArticlesInputSchema = z.object({
    count: z.number().describe('Number of articles to generate.'),
});
export type GenerateArticlesInput = z.infer<typeof GenerateArticlesInputSchema>;


export async function generateArticles(input: GenerateArticlesInput): Promise<GenerateArticlesOutput> {
  return generateArticlesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateArticlesPrompt',
  input: {schema: GenerateArticlesInputSchema},
  output: {schema: GenerateArticlesOutputSchema},
  prompt: `You are a world-class tech journalist AI with a knack for finding surprising, awe-inspiring, and slightly counter-intuitive stories in the tech world. Your task is to generate a list of fictional but deeply realistic and thought-provoking tech news articles that reflect the absolute latest trends and future possibilities.
Adopt a slightly informal, highly-engaging tone suitable for a Gen Z audience. Use contractions and avoid robotic, overly formal language. The goal is to sound like a very smart, passionate tech enthusiast, not a dry academic.

Generate {{{count}}} unique articles.

Focus on creating stories that would make a tech enthusiast say "wow." They should feel like they are from 6-12 months in the future, based on today's emerging technologies.

For each article, provide the following information in the specified JSON format:
- title: A compelling, curiosity-invoking title. Think big.
- description: A short, engaging summary (2-3 sentences) that hints at a surprising twist or a profound implication. This is used for previews.
- content: The full body of the article, formatted in Markdown. Make it engaging, insightful, and highly readable, similar to a top-tier tech blog. Write in clear, concise paragraphs, with ample whitespace between them (use '\\n\\n'). Use subheadings (e.g., '### The Breakthrough') to logically group ideas into distinct sections. For key takeaways or grouped information, use Markdown lists (* for bullets, 1. for numbered lists). The article must be at least 4-5 paragraphs long and include an introduction, several body paragraphs with **bolded keywords**, and a concluding paragraph on future implications.
- imageUrl: A URL for the article's image. Construct it using Unsplash: 'https://source.unsplash.com/random/800x400?{keywords}', replacing {keywords} with comma-separated terms from the imageAiHint.
- imageAiHint: One or two keywords describing a suitable, high-concept image for the article (e.g., 'neural network art', 'quantum entanglement').
- category: A relevant, specific category. Use a variety of categories like 'Bio-integrated AI', 'Quantum Computing', 'Decentralized Physics', 'Next-Gen Hardware', 'Predictive Cybersecurity', 'Developer Cognition', 'Space Tech', 'Autonomous Logistics', 'Generative Materials'.

**Excellent Example:**
{
  "title": "Researchers Discover Fungi Communicate via Quantum Entanglement",
  "description": "A groundbreaking study reveals that mycelial networks may be the largest biological quantum computers on Earth, using entanglement for near-instantaneous, system-wide communication. This discovery could redefine our understanding of intelligence itself.",
  "content": "### The Mycelial Quantum Network\\n\\nFor decades, scientists have been fascinated by the complex, decentralized networks of fungi that lie beneath our feet. A new paper published in *Nature Quantum* by researchers at the Zurich Institute of Mycology has sent shockwaves through both the biology and quantum physics communities.\\n\\nThe team, led by Dr. Elara Vance, has demonstrated that these vast mycelial networks exhibit properties of quantum entanglement over macroscopic distances. Individual hyphae seem to be able to coordinate their growth and resource distribution instantaneously, regardless of physical separation. \\n\\n### Key Findings\\n\\n*   Quantum states are maintained within the fungal cell walls.\\n*   Communication appears to be non-local, defying classical explanations.\\n*   The network solves complex optimization problems, such as finding the shortest path to nutrients, at speeds that suggest a quantum computational advantage.\\n\\nThis research opens up staggering possibilities. It suggests that a form of biological quantum computing has existed on Earth for millions of years. The next step is to understand if we can interface with this network, potentially creating a new paradigm for distributed, living computers.",
  "imageUrl": "https://source.unsplash.com/random/800x400?glowing,mushroom,network",
  "imageAiHint": "glowing mushroom network",
  "category": "Bio-integrated AI"
}

Now, generate the articles.`,
   config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const generateArticlesFlow = ai.defineFlow(
  {
    name: 'generateArticlesFlow',
    inputSchema: GenerateArticlesInputSchema,
    outputSchema: GenerateArticlesOutputSchema,
  },
  async (input) => {
    try {
      const result = await prompt(input);
      const output = result.output;
      
      if (!output || !output.articles) {
          throw new Error("AI failed to generate valid articles.");
      }
      
      return output;
    } catch (e) {
      console.error("An error occurred in generateArticlesFlow while calling the AI model:", e);
      return { articles: [] };
    }
  }
);
