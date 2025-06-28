/**
 * @fileOverview Defines the Zod schema and TypeScript type for a news article.
 * This is shared across multiple files.
 */
import {z} from 'zod';

export const ArticleSchema = z.object({
  title: z.string().describe("The compelling title of the news article."),
  description: z.string().describe("A short, engaging summary of the article (2-3 sentences). This is used for previews."),
  content: z.string().describe("The full content of the article, formatted in Markdown. Should be several paragraphs long, with headings and lists where appropriate. To highlight text, wrap it in <mark>text</mark> tags."),
  imageUrl: z.string().url().describe("A URL for the article's image from Unsplash."),
  imageAiHint: z.string().describe("One or two keywords describing a suitable image for the article (e.g., 'artificial intelligence')."),
  externalUrl: z.string().url().optional().or(z.literal('')).describe("A URL for the link to the full article. Should be a placeholder link."),
  category: z.string().describe("A relevant category for the article (e.g., AI, Web3, Hardware).")
});

export type Article = z.infer<typeof ArticleSchema>;
