import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import type { MemberSummary } from './load-library-data'

export type EditorialViewer = {
  member: MemberSummary | null
  bookmarkCount: number
}

export async function loadEditorialViewer(): Promise<EditorialViewer> {
  if (!process.env.DATABASE_URL) return { member: null, bookmarkCount: 0 }

  try {
    const payload = await getPayload({ config })
    const auth = await payload.auth({ headers: await headers() })
    if (auth.user?.collection !== 'members') return { member: null, bookmarkCount: 0 }

    const bookmarkResult = await payload.count({
      collection: 'bookmarks',
      overrideAccess: false,
      user: auth.user,
    })

    return {
      member: {
        id: String(auth.user.id),
        email: auth.user.email || '',
        name: auth.user.name || auth.user.email?.split('@')[0] || 'Member',
      },
      bookmarkCount: bookmarkResult.totalDocs,
    }
  } catch {
    return { member: null, bookmarkCount: 0 }
  }
}
