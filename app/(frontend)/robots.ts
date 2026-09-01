import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
    sitemap: [
      'https://indizio.space/sitemap.xml',
      'https://indizio.space/brands/sitemap.xml',
      'https://indizio.space/industries/sitemap.xml',
    ],
  }
}
