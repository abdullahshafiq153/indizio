import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://indizio.space', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://indizio.space/library', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  ]
}
