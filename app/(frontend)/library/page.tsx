import type { Metadata } from 'next'

import { IndizioHome } from '../../_components/indizio-home'
import { loadLibraryData } from '../../_data/load-library-data'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Ecommerce Website Library',
  description: 'Explore a continuously growing index of ecommerce websites selected for the design decisions worth studying.',
  alternates: { canonical: '/library' },
  openGraph: {
    title: 'Ecommerce Website Library | INDIZIO',
    description: 'A curated index of remarkable ecommerce storefronts and the details worth studying.',
    url: '/library',
  },
}

export default async function LibraryPage() {
  const data = await loadLibraryData()
  return (
    <IndizioHome
      initialSites={data.sites}
      initialMember={data.member}
      initialCollections={data.collections}
      initialBookmarks={data.bookmarks}
      mode="library"
    />
  )
}
