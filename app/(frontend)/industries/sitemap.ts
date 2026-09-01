import type { MetadataRoute } from 'next'

import { isIndexableBrand, loadPublicSites, taxonomySlug } from '../../_data/load-library-data'
import { absoluteURL } from '../../_data/seo'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sites = await loadPublicSites()
  const counts = new Map<string, number>()
  for (const site of sites.filter(isIndexableBrand)) {
    const slug = taxonomySlug(site.industry)
    counts.set(slug, (counts.get(slug) || 0) + 1)
  }

  return [...counts]
    .filter(([, count]) => count >= 6)
    .map(([slug]) => ({
      url: absoluteURL(`/industries/${slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
}
