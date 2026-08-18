import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { sites as fallbackSites, type Site } from './sites'

export type MemberSummary = { id: string; email: string; name: string }
export type BookmarkCollectionSummary = { id: string; name: string; count: number }
export type SavedBookmarkSummary = { id: string; websiteID: string; collectionID: string | null }

export type LibraryData = {
  sites: Site[]
  member: MemberSummary | null
  collections: BookmarkCollectionSummary[]
  bookmarks: SavedBookmarkSummary[]
}

type RelationshipValue = string | number | { id: string | number }
type WebsiteSelection = {
  id: string | number
  slug?: string | null
  name: string
  cover?: unknown
  coverImage?: string | null
  industry?: RelationshipValue | { name?: string | null } | null
  styles?: Array<RelationshipValue | { name?: string | null }> | null
  note?: string | null
  url: string
  featuredRank?: number | null
}
type FolderSelection = { id: string | number; name: string }
type BookmarkSelection = { id: string | number; website: RelationshipValue; folder?: RelationshipValue | null }

function relationshipID(value: RelationshipValue): string {
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
    const [auth, websiteResult, publicSaveResult] = await Promise.all([
      payload.auth({ headers: requestHeaders }),
      payload.find({
        collection: 'websites',
        depth: 1,
        limit: 500,
        overrideAccess: false,
        select: {
          slug: true,
          name: true,
          cover: true,
          coverImage: true,
          industry: true,
          styles: true,
          note: true,
          url: true,
          featuredRank: true,
        },
        sort: '-featuredRank',
      }),
      payload.find({
        collection: 'bookmarks',
        depth: 0,
        limit: 5000,
        overrideAccess: true,
        select: { website: true },
      }),
    ])

    const websites = websiteResult.docs as unknown as WebsiteSelection[]
    const publicSaveCounts = new Map<string, number>()
    for (const save of publicSaveResult.docs as unknown as Array<{ website: RelationshipValue }>) {
      const websiteID = relationshipID(save.website)
      publicSaveCounts.set(websiteID, (publicSaveCounts.get(websiteID) || 0) + 1)
    }
    const sites: Site[] = websites.map((website) => ({
      id: String(website.id),
      slug: website.slug || undefined,
      name: website.name,
      coverImage: coverURL(website.cover, website.coverImage),
      industry: typeof website.industry === 'object' && website.industry && 'name' in website.industry ? website.industry.name || 'Ecommerce' : 'Ecommerce',
      style: website.styles?.map((style) => typeof style === 'object' && 'name' in style ? style.name || '' : '').filter(Boolean).join(' / ') || 'Unclassified',
      note: website.note || '',
      url: website.url,
      featured: website.featuredRank || 0,
      saveCount: publicSaveCounts.get(String(website.id)) || 0,
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
        select: { name: true },
        user: auth.user,
        sort: '-createdAt',
      }),
      payload.find({
        collection: 'bookmarks',
        depth: 0,
        limit: 500,
        overrideAccess: false,
        select: { website: true, folder: true },
        user: auth.user,
      }),
    ])

    const bookmarkDocs = bookmarkResult.docs as unknown as BookmarkSelection[]
    const folderDocs = folderResult.docs as unknown as FolderSelection[]
    const bookmarks = bookmarkDocs.map((bookmark) => ({
      id: String(bookmark.id),
      websiteID: relationshipID(bookmark.website),
      collectionID: bookmark.folder ? relationshipID(bookmark.folder) : null,
    }))

    return {
      sites: sites.length ? sites : fallbackSites,
      member: {
        id: String(auth.user.id),
        email: auth.user.email || '',
        name: auth.user.name || auth.user.email?.split('@')[0] || 'Member',
      },
      collections: folderDocs.map((folder) => ({
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
