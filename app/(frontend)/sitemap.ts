import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: 'https://indizio.space', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 }]
}
