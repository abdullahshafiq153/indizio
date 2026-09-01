import type { Metadata } from 'next'
import { Suspense } from 'react'

import { IndizioData, IndizioDataSkeleton } from '../../_components/indizio-data'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Ecommerce Website Library',
  description: 'Find relevant ecommerce brands through a growing research library organized by industry and observed storefront strategy.',
  alternates: { canonical: '/library' },
  openGraph: {
    title: 'Ecommerce Website Library | INDIZIO',
    description: 'Find the ecommerce brands solving growth, merchandising, and conversion problems relevant to yours.',
    url: '/library',
  },
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<IndizioDataSkeleton mode="library" />}>
      <IndizioData mode="library" />
    </Suspense>
  )
}
