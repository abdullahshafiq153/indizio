import type { Metadata } from 'next'

import { BrandAtlasPage } from '../../_components/brand-atlas-page'
import { EditorialFooter, EditorialHeader } from '../../_components/editorial-chrome'

export const metadata: Metadata = {
  title: 'Brand Atlas — Ecommerce URL Scraper',
  description: 'Go beyond the homepage and uncover the public products, collections, landing pages, and content behind an ecommerce brand.',
  alternates: { canonical: '/atlas' },
}

export default function AtlasPage() {
  return (
    <>
      <a className="skip-link" href="#brand-atlas">Skip to Brand Atlas</a>
      <EditorialHeader active="atlas" />
      <BrandAtlasPage />
      <EditorialFooter />
    </>
  )
}
