import type { Metadata } from 'next'

import { BookmarksPage } from '../../_components/bookmarks-page'
import { loadLibraryData } from '../../_data/load-library-data'

export const metadata: Metadata = {
  title: 'Your Bookmarks',
  description: 'View and organize your saved ecommerce website inspiration.',
  robots: { index: false, follow: false },
}

export default async function SavedBookmarksPage() {
  const data = await loadLibraryData()

  return (
    <BookmarksPage
      initialSites={data.sites}
      initialMember={data.member}
      initialCollections={data.collections}
      initialBookmarks={data.bookmarks}
    />
  )
}
