import type { Metadata } from 'next'

import { BrandAtlasPage } from '../../_components/brand-atlas-page'
import { EditorialFooter, EditorialHeader } from '../../_components/editorial-chrome'
import { loadEditorialViewer } from '../../_data/editorial-viewer'

export const metadata: Metadata = {
  title: 'Brand Atlas — Ecommerce URL Scraper',
  description: 'Discover and organize the public URLs associated with an ecommerce brand or domain.',
  alternates: { canonical: '/atlas' },
}

export const dynamic = 'force-dynamic'

export default async function AtlasPage() {
  const viewer = await loadEditorialViewer()
  return (
    <>
      <a className="skip-link" href="#brand-atlas">Skip to Brand Atlas</a>
      <EditorialHeader active="atlas" member={viewer.member} bookmarkCount={viewer.bookmarkCount} />
      <BrandAtlasPage member={viewer.member} />
      <EditorialFooter />
    </>
  )
}
