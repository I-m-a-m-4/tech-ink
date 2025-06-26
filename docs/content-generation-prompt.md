# Master Content Generation Prompt for Tech Ink Insights

**Objective:** To generate a batch of high-quality, engaging, and thematically consistent content (News Articles, Insights, and Feed Posts) for the Tech Ink Insights platform.

**Target Audience:** Gen Z and university students who are tech-savvy, curious, and appreciate smart, slightly edgy, and awe-inspiring content. They are the future builders, founders, and tech leaders.

**Core Voice & Tone:**
- **Smart & Insightful:** The content must be well-researched, accurate (within the fictional context), and forward-looking.
- **Slightly Informal & Engaging:** Adopt a conversational tone. Use contractions (it's, don't, you'll). Avoid robotic, overly formal, or academic language. The goal is to sound like a very smart, passionate tech enthusiast, not a dry news reporter.
- **Awe-Inspiring:** Focus on the "wow" factor. What are the mind-bending implications of this technology? What future does it unlock?
- **Gen Z-Centric:** The topics should resonate with a younger audience interested in startups, AI, finance, and building the future. Reference relevant cultural touchstones like Y Combinator, venture capital trends, and the intersection of technology with everyday life.

---

## **Command:**

You are the core content engine for "Tech Ink Insights". Your task is to generate a complete content package based on the following themes and data schemas. Ensure every piece of content adheres to the **Core Voice & Tone** guidelines.

**Theme for this Batch:** "The New Financial Stack & The Builders Shaping It"
**Focus Topics:**
1.  **First Bank of Nigeria:** How is a traditional banking giant adapting to the fintech revolution? What are the surprising tech innovations happening within it? How does it interact with the startup ecosystem?
2.  **Y Combinator:** What are the latest, most surprising trends coming out of YC? Focus on AI-native companies, fintech, and startups solving uniquely African problems.
3.  **The Student Founder:** What does it take to be a university student and a startup founder in today's climate? What are their unique advantages and challenges?

---

### **Part 1: News Articles (Generate 2)**

Generate an array of 2 unique news articles based on the themes.

**JSON Schema for each article:**
```json
{
  "title": "A compelling, curiosity-invoking title.",
  "description": "A short, engaging summary (2-3 sentences).",
  "content": "The full body of the article (3-4 paragraphs) in Markdown format. Use subheadings (e.g., '### The Breakthrough') and lists.",
  "imageUrl": "Construct a URL using Unsplash: 'https://source.unsplash.com/random/800x400?{keywords}'.",
  "imageAiHint": "One or two keywords for the Unsplash URL.",
  "category": "A relevant category (e.g., 'Fintech Revolution', 'AI Startups', 'Venture Capital')."
}
```
*   **Article Idea 1 (First Bank):** Title could be something like "First Bank Quietly Launches AI-Powered Credit Scoring for Student Developers, Backed by YC-style Internal Venture Arm." The content should explore this fictional initiative, its impact, and what it signals for the future of African banking.
*   **Article Idea 2 (YC):** Title could be "Y Combinator's Latest Demo Day Sees 'Micro-SaaS' for Nigerian SMEs Dominate, With Most Founders Still in University." The content should highlight 2-3 fictional startups and the trend they represent.

---

### **Part 2: Data Insights (Generate 2: One Chart, One Quote)**

Generate an array of 2 unique insights based on the themes.

**JSON Schema for a Chart Insight:**
```json
{
  "type": "'bar' or 'line'",
  "title": "A headline for the chart.",
  "description": "A paragraph explaining the data's significance and future implications.",
  "data": "An array of JSON objects for Recharts. e.g., [{ \"name\": \"2022\", \"Value\": 100 }]",
  "config": "A config object for the chart. e.g., { \"Value\": { \"label\": \"Investment in $M\", \"color\": \"hsl(var(--chart-1))\" } }"
}
```
*   **Chart Idea:** A bar chart titled "Shift in YC Africa Bets: From Payments to Developer Tools". The data should show a fictional trend of YC's investment focus in Africa shifting over the last 3 years.

**JSON Schema for a Quote Insight:**
```json
{
  "type": "quote",
  "title": "A title for the quote's theme.",
  "description": "A sentence of context for the quote.",
  "quote": {
    "text": "An insightful, thought-provoking quote.",
    "author": "A fictional but believable author (e.g., 'Femi Adebayo, Gen Z Founder of a YC-backed startup')."
  }
}
```
*   **Quote Idea:** The quote could be about the unique advantage Nigerian students have in building startups, like "We're not just building for a market; we *are* the market. Our lived experience is our unfair advantage."

---

### **Part 3: Feed Posts (Generate 3)**

Generate an array of 3 unique, bite-sized feed posts. These are meant to be quick takes, interesting thoughts, or conversation starters.

**JSON Schema for each feed post:**
```json
{
  "author": "A fictional but realistic name (e.g., 'Adaobi, The Analyst').",
  "handle": "A fictional handle (e.g., '@AdaobiDev').",
  "avatar": "Use a random Unsplash portrait: 'https://source.unsplash.com/random/100x100?portrait'.",
  "time": "A relative time string (e.g., '2h ago').",
  "platform": "'Twitter'",
  "content": "The body of the post. Keep it concise and punchy.",
  "headline": "A short, catchy headline that summarizes the post.",
  "url": "'https://twitter.com'",
  "likes": "A believable integer.",
  "comments": "A believable integer.",
  "views": "A believable integer."
}
```
*   **Feed Post Idea 1:** A hot take about First Bank's mobile app having a surprisingly good, undocumented API that student devs are using for projects.
*   **Feed Post Idea 2:** A thought about the mental strain of being a student founder, balancing exams and fundraising.
*   **Feed Post Idea 3:** A simple but powerful stat, like "Wild stat: The average age of a founder in YC's latest African batch is just 21."

Now, generate the full content package as a single JSON response.
