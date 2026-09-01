import type { Metadata } from 'next'
import { Suspense } from 'react'

import { IndizioData, IndizioDataSkeleton } from '../_components/indizio-data'

export const revalidate = 300

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return (
    <Suspense fallback={<IndizioDataSkeleton />}>
      <IndizioData />
    </Suspense>
  )
}
