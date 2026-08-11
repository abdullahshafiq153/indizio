import type { MetadataRoute } from 'next'

import { loadFieldnotes } from '../_data/fieldnotes'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fieldnotes = await loadFieldnotes()
  return [
    { url: 'https://indizio.space', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://indizio.space/library', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://indizio.space/fieldnotes', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    ...fieldnotes.map((article) => ({
      url: `https://indizio.space/fieldnotes/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
