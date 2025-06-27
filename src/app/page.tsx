
import { ArticleSummarizer } from "@/components/article-summarizer";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typewriter } from "@/components/typewriter";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, initializationError } from '@/lib/firebase';
import Image from 'next/image';
import { RetroTv3d } from "@/components/retro-tv-3d";
import { type Article } from "@/ai/flows/generate-articles-flow";
import { CircuitPen3d } from "@/components/circuit-pen-3d";


async function getLatestArticles(): Promise<(Article & {id: string})[] | null> {
  if (initializationError) {
    console.error("Firebase not initialized, skipping getLatestArticles.", initializationError.message);
    return [];
  }
  try {
    const articlesCollection = collection(db, 'articles');
    const q = query(articlesCollection, orderBy('createdAt', 'desc'), limit(3));
    const articlesSnapshot = await getDocs(q);
    if (!articlesSnapshot.empty) {
        return articlesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Article & {id: string}));
    }
    return [];
  } catch (error) {
    console.error("Error fetching articles from Firestore for homepage:", error);
    return [];
  }
}


export default async function Home() {
  const latestArticles = await getLatestArticles();
  
  const aboutPoints = [
    {
      icon: <Icons.trending className="h-8 w-8 text-primary" />,
      title: "In-depth tech news and analysis",
      description: "Stay ahead of the curve with our expert take on the latest in technology.",
      href: "/news"
    },
    {
      icon: <Icons.database className="h-8 w-8 text-primary" />,
      title: "Data-driven insights",
      description: "Make informed decisions with our reports and visualizations on tech trends.",
      href: "/insights"
    },
    {
      icon: <Icons.message className="h-8 w-8 text-primary" />,
      title: "Live community feed",
      description: "Engage in meaningful discussions with a focus on quality content, not link sharing.",
      href: "/feed"
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section id="hero" className="container mx-auto grid place-items-center gap-6 px-4 sm:px-6 py-20 text-center md:py-32">
          <div className="relative">
            <div className="absolute -inset-2">
              <div className="mx-auto h-full w-full max-w-sm rounded-full bg-primary/50 opacity-50 blur-[100px]" />
            </div>
            <Typewriter text="Tech News 🔥 Data Talks" />
          </div>

          <p className="max-w-2xl text-balance text-lg text-muted-foreground">
            Welcome to Tech Ink, your trusted source for cutting-edge tech news and data-driven insights. We cut through the noise to bring you what truly matters.
          </p>
        </section>

        <section id="interactive-tv" className="container mx-auto px-4 sm:px-6 py-12 md:py-24">
           <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
                <div className="space-y-4 text-center lg:text-left">
                    <h2 className="text-4xl font-extrabold md:text-6xl animate-gradient">Decoding the Future</h2>
                    <p className="text-lg text-muted-foreground">
                       We go deeper than the news cycle, analyzing the trends and technologies that will shape our world. Here, data reveals the narrative, and insights spark the conversation.
                    </p>
                </div>
                <div className="flex h-[350px] w-full items-center justify-center lg:h-[450px]">
                    <RetroTv3d />
                </div>
            </div>
        </section>

        <section id="latest-news" className="container mx-auto flex flex-col items-center justify-center px-4 sm:px-6 py-12 md:py-24">
           <div className="mx-auto mb-12 max-w-xl text-center">
             <h2 className="text-4xl font-extrabold md:text-6xl animate-gradient">Latest In Tech</h2>
             <p className="mt-4 text-lg text-muted-foreground">
              Explore the latest articles and discussions from our team.
             </p>
           </div>
          <div className="mx-auto max-w-6xl w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {latestArticles && latestArticles.length > 0 ? (
                  latestArticles.map((article) => {
                      const cardContent = (
                          <>
                              <div className="relative h-64 w-full">
                                  <Image 
                                    src={article.imageUrl} 
                                    alt={article.title} 
                                    fill 
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover transition-transform duration-300 group-hover:scale-105" />
                              </div>
                              <div className="p-6">
                                  <h3 className="text-xl font-bold text-card-foreground">{article.title}</h3>
                                  <p className="mt-2 text-muted-foreground line-clamp-2">{article.description}</p>
                                  {article.category && <p className="text-sm font-bold mt-2 text-primary">{article.category}</p>}
                              </div>
                          </>
                      );
                      const commonCardClasses = "group block w-full h-full overflow-hidden rounded-2xl shadow-lg transition-all hover:shadow-primary/20 bg-card";
                  
                      return (
                          <div key={article.id}>
                          {article.externalUrl ? (
                              <a href={article.externalUrl} target="_blank" rel="noopener noreferrer" className={commonCardClasses}>
                                  {cardContent}
                              </a>
                          ) : (
                              <Link href={`/news/${article.id}`} className={commonCardClasses}>
                                  {cardContent}
                              </Link>
                          )}
                          </div>
                      );
                  })
                ) : (
                    <div className="col-span-full text-center py-12">
                        <p className="text-muted-foreground">No articles available at the moment. Check back soon!</p>
                    </div>
                )}
            </div>
            {latestArticles && latestArticles.length > 0 && (
                <div className="mt-12 text-center">
                    <Button asChild size="lg">
                        <Link href="/news">
                            View All Articles <Icons.arrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            )}
          </div>
        </section>

        <section id="blueprint-for-tomorrow" className="container mx-auto px-4 sm:px-6 py-12 md:py-24">
           <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
                <div className="flex h-[350px] w-full items-center justify-center lg:h-[450px]">
                    <CircuitPen3d />
                </div>
                <div className="space-y-4 text-center lg:text-left">
                    <h2 className="text-4xl font-extrabold md:text-6xl animate-gradient">Where Insight Takes Form</h2>
                    <p className="text-lg text-muted-foreground">
                        Tech Ink is more than a news source—it's a shared space for curiosity. We believe that the most powerful ideas emerge when data-driven analysis meets creative human intellect. Join us in sketching out what's next.
                    </p>
                </div>
            </div>
        </section>

        <section id="about" className="bg-card/30 py-12 md:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-6xl">
                <div className="mx-auto max-w-xl text-center">
                <h2 className="text-4xl font-extrabold">Our Commitment</h2>
                <p className="mt-4 text-muted-foreground">
                    We’re committed to keeping this group focused on high-quality content, with no tolerance for spam or irrelevant posts. Our goal is to provide a valuable resource for our members.
                </p>
                </div>

                <div className="mt-12 grid gap-8 md:grid-cols-3">
                {aboutPoints.map((point) => {
                    const cardContent = (
                    <Card className="bg-background/50 text-center shadow-lg transition-all hover:border-primary/50 hover:shadow-primary/20 h-full">
                        <CardHeader className="items-center">
                        {point.icon}
                        <CardTitle className="mt-4">{point.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <p className="text-muted-foreground">{point.description}</p>
                        </CardContent>
                    </Card>
                    );

                    if (point.href) {
                    return <Link href={point.href} key={point.title} className="block h-full">{cardContent}</Link>;
                    }
                    
                    return <div key={point.title}>{cardContent}</div>;
                })}
                </div>
            </div>
          </div>
        </section>

        <section id="ai-summarizer" className="container mx-auto px-4 sm:px-6 py-12 md:py-24">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-4xl font-extrabold">AI-Powered Summarizer</h2>
            <p className="mt-4 text-muted-foreground">
              Have a long tech article? Paste it here and let our AI give you the key takeaways in seconds.
            </p>
          </div>
          <div className="mt-12">
            <ArticleSummarizer />
          </div>
        </section>

        <section id="community" className="container mx-auto px-4 sm:px-6 py-12 md:py-24">
           <div className="mx-auto max-w-xl text-center">
             <h2 className="text-4xl font-extrabold">Join Our Community</h2>
             <p className="mt-4 text-muted-foreground">
                Connect with other tech enthusiasts and get the latest updates by joining our WhatsApp group.
             </p>
             <div className="mt-8">
                <Button asChild size="lg">
                    <Link href="https://chat.whatsapp.com/CbCQukJJUBIJv3hbx7Qin1" target="_blank" rel="noopener noreferrer">
                        Join on WhatsApp <Icons.message className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
             </div>
           </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
