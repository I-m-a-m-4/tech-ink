
'use server';
/**
 * @fileOverview An AI agent for generating a social media feed.
 *
 * - generateFeed - A function that handles generating social media feed items.
 * - SocialFeedItem - The type for a single feed item.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { SocialFeedItemSchema } from '@/ai/schemas/social-feed-item-schema';

const GenerateFeedOutputSchema = z.object({
  feedItems: z.array(SocialFeedItemSchema),
});
type GenerateFeedOutput = z.infer<typeof GenerateFeedOutputSchema>;

const GenerateFeedInputSchema = z.object({
    count: z.number().describe('Number of feed items to generate.'),
});
export type GenerateFeedInput = z.infer<typeof GenerateFeedInputSchema>;

export async function generateFeed(input: GenerateFeedInput): Promise<GenerateFeedOutput> {
  return generateFeedFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFeedPrompt',
  input: {schema: GenerateFeedInputSchema},
  output: {schema: GenerateFeedOutputSchema},
  prompt: `You are a social media content aggregator AI. Your task is to generate a list of fictional but realistic social media posts from various platforms like Twitter, YouTube, and Instagram. The topics should be related to the latest in technology, including AI, quantum computing, Web3, hardware, and developer tools.
Adopt a slightly informal, highly-engaging tone suitable for a Gen Z audience. Use contractions and avoid robotic, overly formal language. The goal is to sound like a very smart, passionate tech enthusiast, not a dry academic.

Generate {{{count}}} unique social media posts.

For each post, you must provide the following information in the specified JSON format:
- author: A realistic but fictional name for the author.
- handle: A fictional social media handle (e.g., @techGuru, @quantumLeap).
- avatar: Use a real-looking but fictional person's portrait from Unsplash: 'https://source.unsplash.com/random/100x100?portrait'.
- time: A short, relative time string (e.g., "5m ago", "3h ago", "2d ago").
- platform: 'Twitter', 'YouTube', or 'Instagram'.
- content: The body of the post. Keep it concise for Twitter. For YouTube, make it a video title. For Instagram, an image caption.
- headline: A short, catchy headline that summarizes the core idea of the post.
- url: A valid link to the platform's homepage, like "https://twitter.com", "https://youtube.com", or "https://instagram.com".
- likes: A believable integer for likes.
- comments: A believable integer for comments.
- views: A believable integer for views, usually higher than likes and comments.

Example for a Twitter post:
{
  "author": "AI Innovator",
  "handle": "@ai_innovator",
  "avatar": "https://source.unsplash.com/random/100x100?portrait",
  "time": "15m ago",
  "platform": "Twitter",
  "content": "Just got access to the new multimodal embedding API. The ability to seamlessly blend text, image, and audio search is going to unlock some incredible applications. The future is now!",
  "headline": "New Multimodal API Unlocks Advanced Search",
  "url": "https://twitter.com",
  "likes": 512,
  "comments": 45,
  "views": 2456
}

Now, generate the feed items.`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const generateFeedFlow = ai.defineFlow(
  {
    name: 'generateFeedFlow',
    inputSchema: GenerateFeedInputSchema,
    outputSchema: GenerateFeedOutputSchema,
  },
  async (input) => {
    try {
      const result = await prompt(input);
      const output = result.output;

      if (!output || !output.feedItems) {
        throw new Error("AI failed to generate valid feed items.");
      }
      
      return output;
    } catch (e) {
      console.error("An error occurred in generateFeedFlow while calling the AI model:", e);
      return { feedItems: [] };
    }
  }
);
