'use server';
/**
 * @fileOverview An AI agent for answering questions about a news article.
 *
 * - chatWithArticle - A function that handles answering user questions about an article.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  ChatWithArticleInputSchema,
  ChatWithArticleOutputSchema,
  type ChatWithArticleInput,
  type ChatWithArticleOutput,
} from '@/ai/schemas/chat-with-article-schema';

export async function chatWithArticle(
  input: ChatWithArticleInput
): Promise<ChatWithArticleOutput> {
  return chatWithArticleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithArticlePrompt',
  input: { schema: ChatWithArticleInputSchema },
  output: { schema: ChatWithArticleOutputSchema },
  prompt: `You are a helpful and insightful AI assistant for the Tech Ink Insights platform. A user is asking a question about a specific news article.

Your task is to analyze the provided article content and provide a clear, concise, and helpful answer to the user's question.

**Instructions:**
1.  Base your answer **strictly** on the information provided in the article content. Do not invent facts or use external knowledge.
2.  If the answer cannot be found in the article, state that clearly.
3.  Format your answer using Markdown for readability (e.g., use bullet points for lists, bold for emphasis).

**Article Title:**
"{{{articleTitle}}}"

**Full Article Content:**
---
{{{articleContent}}}
---

**User's Question:**
"{{{question}}}"

Now, generate your answer.`,
});

const chatWithArticleFlow = ai.defineFlow(
  {
    name: 'chatWithArticleFlow',
    inputSchema: ChatWithArticleInputSchema,
    outputSchema: ChatWithArticleOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
