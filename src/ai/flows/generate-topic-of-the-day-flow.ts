
'use server';
/**
 * @fileOverview An AI agent for generating a "Topic of the Day" social media post.
 *
 * - generateTopicOfTheDay - A function that handles generating the post.
 * - SocialFeedItem - The type for the generated post.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { SocialFeedItemSchema, type SocialFeedItem } from '@/ai/schemas/social-feed-item-schema';

const GenerateTopicInputSchema = z.object({
  theme: z.string().describe("The theme for the Topic of the Day, e.g., 'Visionary Tech Founders', 'AI Breakthroughs'.")
});
export type GenerateTopicInput = z.infer<typeof GenerateTopicInputSchema>;


export async function generateTopicOfTheDay(input: GenerateTopicInput): Promise<SocialFeedItem> {
  const result = await generateTopicOfTheDayFlow(input);
  // The flow returns an object with a single item, so we extract it.
  return result.post;
}

const GenerateTopicOutputSchema = z.object({
    post: SocialFeedItemSchema
});

const prompt = ai.definePrompt({
  name: 'generateTopicOfTheDayPrompt',
  input: {schema: GenerateTopicInputSchema},
  output: {schema: GenerateTopicOutputSchema},
  prompt: `You are a tech journalist AI specializing in creating engaging, insightful "Topic of the Day" features for a social media feed.
Your task is to generate a single, detailed post about a significant figure, company, or breakthrough in the tech world based on the provided theme.
The post should be written in the style of a thought-leader on a platform like Twitter or a tech blog, providing deep insight.

Theme: {{{theme}}}

Your output must be a single JSON object containing a "post" field that conforms to the SocialFeedItem schema.
- **Content**: The content should be a detailed, multi-paragraph analysis. Start with a strong hook, provide background, key facts/milestones, and conclude with the significance or future implications. Use markdown for line breaks (\\n\\n).
- **Headline**: The headline should be very compelling and summarize the core topic.
- **Image**: Provide an 'imageUrl' from Unsplash, like 'https://source.unsplash.com/random/1200x600?{keywords}', using the 'imageAiHint' for the keywords. Also provide an 'imageAiHint' with one or two keywords for a suitable image.
- **Author**: Use a realistic but fictional author and handle (e.g., "Insight Analyst" / "@deeptech_daily").
- **Avatar**: Provide an 'avatar' using a random portrait from Unsplash: 'https://source.unsplash.com/random/100x100?portrait'.
- **Platform**: Set platform to 'Twitter'.
- **Likes/Comments/Views**: IMPORTANT! Set 'likes', 'comments', and 'views' to 0.

Example on the topic of "Alexandr Wang, founder of Scale AI":
{
  "post": {
    "author": "Tech Deep Dive",
    "handle": "@DeepDiveDaily",
    "avatar": "https://source.unsplash.com/random/100x100?portrait",
    "time": "Just now",
    "platform": "Twitter",
    "headline": "The Billion-Dollar Vision of Alexandr Wang: How Scale AI is Powering the Generative AI Boom",
    "content": "At just 26, Alexandr Wang has built Scale AI into a critical engine for the world's leading AI companies. But how did a dropout from MIT build a data-labeling empire valued at over $7 billion, and what does it tell us about the future of AI infrastructure?\\n\\nScale AI's core mission is to provide high-quality training data, the lifeblood of any machine learning model. From self-driving cars to large language models, the accuracy of an AI is only as good as the data it's trained on. Wang recognized this fundamental need early on, pivoting from a simple API to a full-stack data platform that combines human annotation with machine learning.\\n\\nKey Facts:\\n- Founded in 2016.\\n- Became the world's first data-labeling unicorn.\\n- Clients include industry giants like OpenAI, Microsoft, and General Motors.\\n\\nThis isn't just about labeling images. Scale AI is now at the forefront of Data-Centric AI, a paradigm shift focusing on systematically engineering data to improve AI systems. As generative AI continues to explode, the demand for reliable, high-quality, and nuanced data will only grow. Wang's vision has positioned Scale AI as the bedrock upon which the next generation of intelligence is being built.",
    "url": "https://twitter.com",
    "likes": 0,
    "comments": 0,
    "views": 0,
    "imageUrl": "https://source.unsplash.com/random/1200x600?artificial,intelligence,data",
    "imageAiHint": "artificial intelligence data"
  }
}

Now, generate the "Topic of the Day" post based on the provided theme: '{{{theme}}}'.`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const generateTopicOfTheDayFlow = ai.defineFlow(
  {
    name: 'generateTopicOfTheDayFlow',
    inputSchema: GenerateTopicInputSchema,
    outputSchema: GenerateTopicOutputSchema,
  },
  async (input) => {
    const result = await prompt(input);
    const output = result.output;
    if (!output || !output.post) {
        throw new Error("AI failed to generate a valid Topic of the Day.");
    }
    return output;
  }
);
