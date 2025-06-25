
'use server';
/**
 * @fileOverview An AI agent for generating a personalized daily briefing.
 *
 * - generateBriefing - Generates a briefing based on user activity.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';

const GenerateBriefingInputSchema = z.object({
  userId: z.string().describe("The ID of the user to generate the briefing for."),
});
export type GenerateBriefingInput = z.infer<typeof GenerateBriefingInputSchema>;

const GenerateBriefingOutputSchema = z.object({
  briefing: z.string().describe("A personalized daily briefing formatted in Markdown."),
});
export type GenerateBriefingOutput = z.infer<typeof GenerateBriefingOutputSchema>;

async function getUserActivity(userId: string): Promise<string> {
    if (!db) return "No activity found.";

    const userRef = doc(db, 'users', userId);
    const likesQuery = query(collection(db, 'likes'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(5));

    const [userSnap, likesSnapshot] = await Promise.all([
        getDoc(userRef),
        getDocs(likesQuery)
    ]);
    
    let activity = [];

    if (userSnap.exists()) {
        activity.push(`User's name: ${userSnap.data().displayName || 'Valued User'}`);
    }

    if (!likesSnapshot.empty) {
        const likedPostIds = likesSnapshot.docs.map(d => d.data().postId);
        const postPromises = likedPostIds.map(async (id) => {
            // Check in feedItems first, then dailyTopics
            const feedItemRef = doc(db, 'feedItems', id);
            const feedItemSnap = await getDoc(feedItemRef);
            if (feedItemSnap.exists()) return feedItemSnap.data().headline;

            const dailyTopicRef = doc(db, 'dailyTopics', id);
            const dailyTopicSnap = await getDoc(dailyTopicRef);
            if (dailyTopicSnap.exists()) return dailyTopicSnap.data().headline;
            
            return null;
        });

        const likedPostHeadlines = (await Promise.all(postPromises)).filter(Boolean);
        if (likedPostHeadlines.length > 0) {
            activity.push(`Recently liked topics: "${likedPostHeadlines.join('", "')}"`);
        }
    }

    return activity.length > 0 ? activity.join('\n') : "User has no recent activity.";
}

async function getRecentContent(): Promise<string> {
    if (!db) return "No recent content.";

    const articlesQuery = query(collection(db, 'articles'), orderBy('createdAt', 'desc'), limit(5));
    const feedQuery = query(collection(db, 'feedItems'), orderBy('createdAt', 'desc'), limit(5));

    const [articlesSnapshot, feedSnapshot] = await Promise.all([getDocs(articlesQuery), getDocs(feedQuery)]);

    let content = [];
    if (!articlesSnapshot.empty) {
        const articles = articlesSnapshot.docs.map(d => `Article: "${d.data().title}"`);
        content.push(articles.join('\n'));
    }
     if (!feedSnapshot.empty) {
        const posts = feedSnapshot.docs.map(d => `Feed Post: "${d.data().headline}"`);
        content.push(posts.join('\n'));
    }
    
    return content.length > 0 ? content.join('\n\n') : "No recent site content.";
}


export async function generateBriefing(input: GenerateBriefingInput): Promise<GenerateBriefingOutput> {
  return generateBriefingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBriefingPrompt',
  input: {
    schema: z.object({ 
        userActivity: z.string(),
        recentContent: z.string(),
    })
  },
  output: {schema: GenerateBriefingOutputSchema},
  prompt: `You are a sharp and insightful AI tech analyst, responsible for creating a personalized "Daily Briefing" for a user of the Tech Ink Insights platform.

Your goal is to synthesize the user's recent activity with the latest content on the site to provide a unique, valuable summary that makes them feel in-the-know.

**User's Recent Activity:**
{{{userActivity}}}

**Latest Content on the Site:**
{{{recentContent}}}

**Your Task:**
Based on the user's activity and the latest content, generate a concise, 3-5 point briefing in Markdown format.
For each point:
- Identify a key theme or topic that the user seems interested in.
- Connect it to one or more of the recent articles or feed posts.
- Provide a sharp insight or a thought-provoking question.
- Make it personal and engaging. Address the user directly (e.g., "Good morning, [User Name]!").

Example Output:
{
  "briefing": "### Your Tech Ink Daily Briefing\\n\\nGood morning, Bime! Here’s what’s happening in tech, tailored for you:\\n\\n*   **The Future of AI Hardware:** You've been engaging with content about AI. You might find the latest article on 'Quantum Leap in AI Processing' particularly interesting as it discusses the next-generation chips that could power the models you're curious about.\\n\\n*   **Data-Centric AI:** Your interest in data quality aligns with the 'Topic of the Day' about Scale AI. Is high-quality, human-labeled data the most significant moat in the AI race?\\n\\n*   **Developer Tools on the Rise:** We've noticed you like posts about developer productivity. Check out the new insight on 'Developer Cognition'—it might change how you think about building software."
}

Now, generate the briefing.`,
});

const generateBriefingFlow = ai.defineFlow(
  {
    name: 'generateBriefingFlow',
    inputSchema: GenerateBriefingInputSchema,
    outputSchema: GenerateBriefingOutputSchema,
  },
  async ({ userId }) => {
    const [userActivity, recentContent] = await Promise.all([
        getUserActivity(userId),
        getRecentContent()
    ]);
    
    const {output} = await prompt({ userActivity, recentContent });
    return output!;
  }
);
