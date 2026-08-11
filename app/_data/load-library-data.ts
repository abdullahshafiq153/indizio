import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { sites as fallbackSites, type Site } from './sites'

export type MemberSummary = { id: string; email: string; name: string }
export type BookmarkCollectionSummary = { id: string; name: string; count: number }
export type SavedBookmarkSummary = { id: string; websiteID: string; collectionID: string }

export type LibraryData = {
  sites: Site[]
  member: MemberSummary | null
  collections: BookmarkCollectionSummary[]
  bookmarks: SavedBookmarkSummary[]
}

function relationshipID(value: string | number | { id: string | number }): string {
  return String(typeof value === 'object' ? value.id : value)
}

function coverURL(cover: unknown, legacyURL?: string | null): string | undefined {
  if (cover && typeof cover === 'object') {
    const media = cover as {
      sizes?: { card?: { url?: string | null } | null } | null
      url?: string | null
    }
    return media.sizes?.card?.url || media.url || legacyURL || undefined
  }
  return legacyURL || undefined
}

export async function loadLibraryData(): Promise<LibraryData> {
  if (!process.env.DATABASE_URL) {
    return { sites: fallbackSites, member: null, collections: [], bookmarks: [] }
  }

  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const [auth, websiteResult] = await Promise.all([
      payload.auth({ headers: requestHeaders }),
      payload.find({
        collection: 'websites',
        depth: 1,
        limit: 500,
        overrideAccess: false,
        sort: '-featuredRank',
      }),
    ])

    const sites: Site[] = websiteResult.docs.map((website) => ({
      id: String(website.id),
      slug: website.slug,
      name: website.name,
      coverImage: coverURL(website.cover, website.coverImage),
      industry: typeof website.industry === 'object' && website.industry ? website.industry.name : 'Ecommerce',
      style: website.styles?.map((style: { name: string } | string | number) => typeof style === 'object' ? style.name : '').filter(Boolean).join(' / ') || 'Unclassified',
      note: website.note || '',
      url: website.url,
      featured: website.featuredRank || 0,
    }))

    if (auth.user?.collection !== 'members') {
      return { sites: sites.length ? sites : fallbackSites, member: null, collections: [], bookmarks: [] }
    }

    const [folderResult, bookmarkResult] = await Promise.all([
      payload.find({
        collection: 'bookmark-collections',
        depth: 0,
        limit: 100,
        overrideAccess: false,
        user: auth.user,
        sort: '-createdAt',
      }),
      payload.find({
        collection: 'bookmarks',
        depth: 0,
        limit: 500,
        overrideAccess: false,
        user: auth.user,
      }),
    ])

    const bookmarks = bookmarkResult.docs.map((bookmark) => ({
      id: String(bookmark.id),
      websiteID: relationshipID(bookmark.website),
      collectionID: relationshipID(bookmark.folder),
    }))

    return {
      sites: sites.length ? sites : fallbackSites,
      member: {
        id: String(auth.user.id),
        email: auth.user.email || '',
        name: auth.user.name || auth.user.email?.split('@')[0] || 'Member',
      },
      collections: folderResult.docs.map((folder) => ({
        id: String(folder.id),
        name: folder.name,
        count: bookmarks.filter((bookmark) => bookmark.collectionID === String(folder.id)).length,
      })),
      bookmarks,
    }
  } catch {
    return { sites: fallbackSites, member: null, collections: [], bookmarks: [] }
  }
}
