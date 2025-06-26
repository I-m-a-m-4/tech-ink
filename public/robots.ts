
import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
        {
            userAgent: '*',
            allow: '/',
            disallow: ['/imam', '/briefing', '/settings'], 
        }
    ],
    sitemap: 'https://tech-ink.web.app/sitemap.xml',
  }
}
