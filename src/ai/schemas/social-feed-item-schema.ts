
/**
 * @fileOverview Defines the Zod schema and TypeScript type for a social media feed item.
 * This is shared across multiple AI flows.
 */
import {z} from 'zod';

export const PollSchema = z.object({
  options: z.record(z.string().min(1, "Option text cannot be empty.").max(80, "Option text is too long."), z.number().int().default(0)),
  voters: z.record(z.string(), z.string()).optional(), // Maps userId -> optionText
});


export const SocialFeedItemSchema = z.object({
  author: z.string().describe("The name of the post's author."),
  handle: z.string().describe("The author's social media handle (e.g., @username)."),
  avatar: z.string().describe("A URL for the author's avatar image."),
  time: z.string().describe("A relative time string for when the post was made (e.g., '2h ago', '1d ago')."),
  platform: z.enum(['Twitter', 'YouTube', 'Instagram', 'TechInk']).describe("The social media platform the post is from."),
  content: z.string().describe("The text content of the post. For YouTube, this should be a video title. For Instagram, a caption. For a 'Topic of the Day', this should be a detailed, multi-paragraph analysis."),
  poll: PollSchema.optional().describe("An optional poll attached to the post."),
  headline: z.string().describe("A compelling headline summarizing the post's content."),
  url: z.string().describe("A string for the link to the original post on the social media platform."),
  likes: z.number().int().describe("A realistic number of likes for the post."),
  comments: z.number().int().describe("A realistic number of comments for the post."),
  views: z.number().int().optional().describe("The number of views the post has received."),
  userId: z.string().optional().describe("The ID of the user who created the post."),
  imageUrl: z.string().optional().describe("A URL for a relevant image from Unsplash. Only for 'Topic of the Day' posts."),
  imageAiHint: z.string().optional().describe("One or two keywords for a suitable image. Only for 'Topic of the Day' posts."),
});

export type SocialFeedItem = z.infer<typeof SocialFeedItemSchema>;
export type Poll = z.infer<typeof PollSchema>;
export type PollOption = { text: string; votes: number }; // Kept for form handling if needed
