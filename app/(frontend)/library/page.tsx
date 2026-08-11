import type { Metadata } from 'next'
import { Suspense } from 'react'

import { IndizioData, IndizioDataSkeleton } from '../../_components/indizio-data'

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

export default function LibraryPage() {
  return (
    <Suspense fallback={<IndizioDataSkeleton mode="library" />}>
      <IndizioData mode="library" />
    </Suspense>
  )
}
