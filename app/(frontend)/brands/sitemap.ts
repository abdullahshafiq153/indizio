import type { MetadataRoute } from 'next'

import { isIndexableBrand, loadPublicSites } from '../../_data/load-library-data'
import { absoluteURL } from '../../_data/seo'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sites = await loadPublicSites()
  return sites.filter(isIndexableBrand).map((site) => ({
    url: absoluteURL(`/brands/${site.slug}`),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
    images: site.coverImage ? [site.coverImage] : undefined,
  }))
}
