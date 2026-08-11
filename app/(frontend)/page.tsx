import { Suspense } from 'react'

import { IndizioData, IndizioDataSkeleton } from '../_components/indizio-data'

export const revalidate = 300

export default function HomePage() {
  return (
    <Suspense fallback={<IndizioDataSkeleton />}>
      <IndizioData />
    </Suspense>
  )
}
