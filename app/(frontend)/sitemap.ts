import type { MetadataRoute } from 'next'

import { loadFieldnotes } from '../_data/fieldnotes'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fieldnotes = await loadFieldnotes()
  return [
    { url: 'https://indizio.space', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://indizio.space/library', changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://indizio.space/fieldnotes', changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://indizio.space/atlas', changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://indizio.space/extension', changeFrequency: 'monthly', priority: 0.8 },
    ...fieldnotes.map((article) => ({
      url: `https://indizio.space/fieldnotes/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
