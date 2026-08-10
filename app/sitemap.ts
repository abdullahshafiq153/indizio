import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: 'https://indizio.space', changeFrequency: 'weekly', priority: 1 }]
}
