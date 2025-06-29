
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { PageLoader } from '@/components/page-loader';
import { BackgroundProvider } from '@/contexts/background-context';
import { SiteBackgroundWrapper } from '@/components/site-background-wrapper';
import { Suspense } from 'react';
import { getSiteSettings } from '@/lib/settings';
import { PageViewTracker } from '@/components/page-view-tracker';
import { cookies } from 'next/headers';

const siteConfig = {
  name: "Tech Ink Insights",
  url: "https://tech-ink.vercel.app",
  ogImage: "https://res.cloudinary.com/dd1czj85j/image/upload/v1750851092/WhatsApp_Image_2025-06-23_at_11.34.37_c2bbc731_epfvrj.jpg",
  description: "An insight engine, not just a news site. We combine human curiosity with AI's analytical power to create a deeper understanding of technology. Explore trends, get personalized briefings, and join a community of builders.",
  author: "Bime",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - The Future of Tech News & Analysis`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'technology', 'tech news', 'AI news', 'data analysis', 'data visualization', 
    'AI summary', 'Genkit', 'Gemini AI', 'quantum computing', 'web3', 'blockchain', 
    'cybersecurity', 'developer tools', 'tech community', 'Bime', 'software engineering',
    'machine learning', 'data science', 'futurism', 'tech insights'
  ],
  authors: [{ name: siteConfig.author, url: siteConfig.url }],
  creator: siteConfig.author,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `Tech Ink Insights Logo`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@dev_bime',
  },
  icons: {
    icon: siteConfig.ogImage,
    shortcut: siteConfig.ogImage,
    apple: siteConfig.ogImage,
  }
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Opt into dynamic rendering to ensure the latest settings are always fetched.
  cookies();
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
  };

  const siteSettings = await getSiteSettings();
  
  return (
    <html lang="en" className="dark">
      <head>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased overflow-x-hidden">
        <AuthProvider>
          <BackgroundProvider defaultBackground={siteSettings.defaultBackground}>
            <SiteBackgroundWrapper>
              <Suspense fallback={null}>
                <PageLoader />
                <PageViewTracker />
              </Suspense>
              {children}
              <Toaster />
            </SiteBackgroundWrapper>
          </BackgroundProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
