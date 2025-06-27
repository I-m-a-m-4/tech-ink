/**
 * @fileOverview Defines the Zod schemas and TypeScript types for the AI article interaction feature.
 */
import { z } from 'zod';

export const ChatWithArticleInputSchema = z.object({
  articleTitle: z.string().describe("The title of the article being discussed."),
  articleContent: z.string().describe("The full Markdown content of the article."),
  question: z.string().describe("The user's question or the predefined prompt about the article."),
});
export type ChatWithArticleInput = z.infer<typeof ChatWithArticleInputSchema>;

export const ChatWithArticleOutputSchema = z.object({
  answer: z.string().describe("A concise, insightful answer to the user's question, based on the article's content. The answer should be in Markdown format."),
});
export type ChatWithArticleOutput = z.infer<typeof ChatWithArticleOutputSchema>;
