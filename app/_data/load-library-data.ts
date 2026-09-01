import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { sites as fallbackSites, type Site } from './sites'

export type MemberSummary = { id: string; email: string; name: string }
export type BookmarkCollectionSummary = { id: string; name: string; count: number }
export type SavedBookmarkSummary = {
  id: string
  websiteID: string
  collectionID: string | null
  pageURL?: string
  pageTitle?: string
  pageDescription?: string
  faviconURL?: string
}

export type LibraryData = {
  sites: Site[]
  member: MemberSummary | null
  collections: BookmarkCollectionSummary[]
  bookmarks: SavedBookmarkSummary[]
}

export type MemberLibraryState = Omit<LibraryData, 'sites'> & { sites?: Site[] }

export type LibraryFilterMetadata = {
  industryOptions: string[]
  industryCounts: Record<string, number>
  tagOptionsByIndustry: Record<string, string[]>
  tagCountsByIndustry: Record<string, Record<string, number>>
}

export type PublicLibraryPage = LibraryFilterMetadata & {
  sites: Site[]
  total: number
  page: number
  hasMore: boolean
}

export type PublicLibraryQuery = {
  page?: number
  limit?: number
  query?: string
  industries?: string[]
  tags?: string[]
  sort?: 'featured' | 'newest' | 'az'
  websiteIDs?: string[]
}

export type PublicIndustryPage = {
  name: string
  slug: string
  sites: Site[]
  tags: Array<{ name: string; count: number }>
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
type BookmarkSelection = {
  id: string | number
  website: RelationshipValue
  folder?: RelationshipValue | null
  pageURL?: string | null
  pageTitle?: string | null
  pageDescription?: string | null
  faviconURL?: string | null
}

function websiteToSite(website: WebsiteSelection, saveCount = 0): Site {
  const tags = website.styles?.map((style) => typeof style === 'object' && 'name' in style ? style.name || '' : '').filter(Boolean) || []
  return {
    id: String(website.id), slug: website.slug || undefined, name: website.name,
    coverImage: coverURL(website.cover, website.coverImage),
    industry: typeof website.industry === 'object' && website.industry && 'name' in website.industry ? website.industry.name || 'Ecommerce' : 'Ecommerce',
    style: tags.join(' / ') || 'Unclassified', tags,
    note: website.note || '', url: website.url, featured: website.featuredRank || 0, saveCount,
  }
}

export const loadPublicSites = unstable_cache(async (): Promise<Site[]> => {
  if (!process.env.DATABASE_URL) return fallbackSites
  const payload = await getPayload({ config })
  const [websiteResult, publicSaveResult] = await Promise.all([
    payload.find({
      collection: 'websites', depth: 1, limit: 500, overrideAccess: false,
      select: { slug: true, name: true, cover: true, coverImage: true, industry: true, styles: true, note: true, url: true, featuredRank: true },
      sort: '-featuredRank',
    }),
    payload.db.collections.bookmarks.aggregate<{ _id: unknown; count: number }>([
      { $group: { _id: '$website', count: { $sum: 1 } } },
    ]),
  ])
  const publicSaveCounts = new Map<string, number>()
  for (const save of publicSaveResult) {
    publicSaveCounts.set(String(save._id), save.count)
  }
  return (websiteResult.docs as unknown as WebsiteSelection[]).map((website) => websiteToSite(website, publicSaveCounts.get(String(website.id)) || 0))
}, ['indizio-public-library-v2'], { revalidate: 300, tags: ['public-library'] })

function buildPublicFilterMetadata(sites: Site[]): LibraryFilterMetadata {
  const industryCounts: Record<string, number> = {}
  const tagSets = new Map<string, Set<string>>()
  const tagCountsByIndustry: Record<string, Record<string, number>> = {}

  for (const site of sites) {
    industryCounts[site.industry] = (industryCounts[site.industry] || 0) + 1
    const tags = tagSets.get(site.industry) || new Set<string>()
    const counts = tagCountsByIndustry[site.industry] || {}
    for (const tag of site.tags || []) {
      tags.add(tag)
      counts[tag] = (counts[tag] || 0) + 1
    }
    tagSets.set(site.industry, tags)
    tagCountsByIndustry[site.industry] = counts
  }

  return {
    industryOptions: Object.keys(industryCounts).sort(),
    industryCounts,
    tagOptionsByIndustry: Object.fromEntries(
      [...tagSets].map(([industry, tags]) => [industry, [...tags].sort()]),
    ),
    tagCountsByIndustry,
  }
}

export async function loadPublicLibraryPage({
  page = 1,
  limit = 12,
  query = '',
  industries = [],
  tags = [],
  sort = 'featured',
  websiteIDs = [],
}: PublicLibraryQuery = {}): Promise<PublicLibraryPage> {
  const catalog = await loadPublicSites()
  const metadata = buildPublicFilterMetadata(catalog)
  const normalizedQuery = query.trim().toLowerCase()
  const industrySet = new Set(industries)
  const validTagSet = new Set(
    industries.flatMap((industry) => metadata.tagOptionsByIndustry[industry] || []),
  )
  const applicableTags = industrySet.size
    ? tags.filter((tag) => validTagSet.has(tag))
    : []
  const websiteIDSet = new Set(websiteIDs)
  const safeLimit = Math.min(36, Math.max(1, limit))
  const safePage = Math.max(1, page)

  const filtered = catalog.filter((site) => {
    if (websiteIDSet.size && (!site.id || !websiteIDSet.has(site.id))) return false
    if (industrySet.size && !industrySet.has(site.industry)) return false
    if (applicableTags.length && !applicableTags.every((tag) => site.tags?.includes(tag))) return false
    if (!normalizedQuery) return true
    return `${site.name} ${site.industry} ${(site.tags || []).join(' ')} ${site.note}`
      .toLowerCase()
      .includes(normalizedQuery)
  })

  filtered.sort((a, b) => {
    if (sort === 'az') return a.name.localeCompare(b.name)
    if (sort === 'newest') return 0
    return b.featured - a.featured
  })

  const start = (safePage - 1) * safeLimit
  return {
    ...metadata,
    sites: filtered.slice(start, start + safeLimit),
    total: filtered.length,
    page: safePage,
    hasMore: start + safeLimit < filtered.length,
  }
}

export function taxonomySlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function loadPublicBrand(slug: string): Promise<Site | null> {
  const catalog = await loadPublicSites()
  return catalog.find((site) => site.slug === slug) || null
}

export async function loadPublicIndustry(slug: string): Promise<PublicIndustryPage | null> {
  const catalog = await loadPublicSites()
  const sites = catalog.filter((site) => site.slug && taxonomySlug(site.industry) === slug)
  if (!sites.length) return null

  const tagCounts = new Map<string, number>()
  for (const site of sites) {
    for (const tag of site.tags || []) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
  }

  return {
    name: sites[0].industry,
    slug,
    sites,
    tags: [...tagCounts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  }
}

export function isIndexableBrand(site: Site) {
  return Boolean(
    site.slug
    && site.coverImage
    && site.note.trim().length >= 45
    && site.industry !== 'Ecommerce'
    && site.industry !== 'Unclassified'
    && (site.tags?.length || 0) > 0,
  )
}

export function isIndexableIndustry(industry: PublicIndustryPage) {
  return industry.sites.filter(isIndexableBrand).length >= 6
}

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
    const [auth, sites] = await Promise.all([
      payload.auth({ headers: requestHeaders }),
      loadPublicSites(),
    ])

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
        select: { website: true, folder: true, pageURL: true, pageTitle: true, pageDescription: true, faviconURL: true },
        user: auth.user,
      }),
    ])

    const bookmarkDocs = bookmarkResult.docs as unknown as BookmarkSelection[]
    const folderDocs = folderResult.docs as unknown as FolderSelection[]
    const bookmarks = bookmarkDocs.map((bookmark) => ({
      id: String(bookmark.id),
      websiteID: relationshipID(bookmark.website),
      collectionID: bookmark.folder ? relationshipID(bookmark.folder) : null,
      pageURL: bookmark.pageURL || undefined,
      pageTitle: bookmark.pageTitle || undefined,
      pageDescription: bookmark.pageDescription || undefined,
      faviconURL: bookmark.faviconURL || undefined,
    }))

    const publicWebsiteIDs = new Set(sites.map((site) => site.id).filter(Boolean))
    const privateWebsiteIDs = [...new Set(bookmarks.map((bookmark) => bookmark.websiteID).filter((id) => !publicWebsiteIDs.has(id)))]
    const privateWebsiteResult = privateWebsiteIDs.length ? await payload.find({
      collection: 'websites', depth: 1, limit: privateWebsiteIDs.length, overrideAccess: true,
      select: { slug: true, name: true, cover: true, coverImage: true, industry: true, styles: true, note: true, url: true, featuredRank: true },
      where: { id: { in: privateWebsiteIDs } },
    }) : { docs: [] }
    const privateSites = (privateWebsiteResult.docs as unknown as WebsiteSelection[]).map((website) => websiteToSite(website))
    const availableSites = [...sites, ...privateSites]

    const counts = new Map<string, number>()
    for (const bookmark of bookmarks) {
      if (bookmark.collectionID) counts.set(bookmark.collectionID, (counts.get(bookmark.collectionID) || 0) + 1)
    }

    return {
      sites: availableSites.length ? availableSites : fallbackSites,
      member: {
        id: String(auth.user.id),
        email: auth.user.email || '',
        name: auth.user.name || auth.user.email?.split('@')[0] || 'Member',
      },
      collections: folderDocs.map((folder) => ({
        id: String(folder.id),
        name: folder.name,
        count: counts.get(String(folder.id)) || 0,
      })),
      bookmarks,
    }
  } catch {
    return { sites: fallbackSites, member: null, collections: [], bookmarks: [] }
  }
}

export async function loadMemberLibraryState({ includeSites = false }: { includeSites?: boolean } = {}): Promise<MemberLibraryState> {
  if (!process.env.DATABASE_URL) return { member: null, collections: [], bookmarks: [], sites: includeSites ? [] : undefined }

  try {
    const payload = await getPayload({ config })
    const auth = await payload.auth({ headers: await headers() })
    if (auth.user?.collection !== 'members') {
      return { member: null, collections: [], bookmarks: [], sites: includeSites ? [] : undefined }
    }

    const [folderResult, bookmarkResult] = await Promise.all([
      payload.find({
        collection: 'bookmark-collections', depth: 0, limit: 100, overrideAccess: false,
        select: { name: true }, user: auth.user, sort: '-createdAt',
      }),
      payload.find({
        collection: 'bookmarks', depth: 0, limit: 500, overrideAccess: false,
        select: { website: true, folder: true, pageURL: true, pageTitle: true, pageDescription: true, faviconURL: true },
        user: auth.user,
      }),
    ])

    const bookmarkDocs = bookmarkResult.docs as unknown as BookmarkSelection[]
    const folderDocs = folderResult.docs as unknown as FolderSelection[]
    const bookmarks = bookmarkDocs.map((bookmark) => ({
      id: String(bookmark.id),
      websiteID: relationshipID(bookmark.website),
      collectionID: bookmark.folder ? relationshipID(bookmark.folder) : null,
      pageURL: bookmark.pageURL || undefined,
      pageTitle: bookmark.pageTitle || undefined,
      pageDescription: bookmark.pageDescription || undefined,
      faviconURL: bookmark.faviconURL || undefined,
    }))
    const counts = new Map<string, number>()
    for (const bookmark of bookmarks) {
      if (bookmark.collectionID) counts.set(bookmark.collectionID, (counts.get(bookmark.collectionID) || 0) + 1)
    }

    let sites: Site[] | undefined
    if (includeSites) {
      const websiteIDs = [...new Set(bookmarks.map((bookmark) => bookmark.websiteID))]
      const result = websiteIDs.length ? await payload.find({
        collection: 'websites', depth: 1, limit: websiteIDs.length, overrideAccess: true,
        select: { slug: true, name: true, cover: true, coverImage: true, industry: true, styles: true, note: true, url: true, featuredRank: true },
        where: { id: { in: websiteIDs } },
      }) : { docs: [] }
      sites = (result.docs as unknown as WebsiteSelection[]).map((website) => websiteToSite(website))
    }

    return {
      member: {
        id: String(auth.user.id),
        email: auth.user.email || '',
        name: auth.user.name || auth.user.email?.split('@')[0] || 'Member',
      },
      collections: folderDocs.map((folder) => ({
        id: String(folder.id), name: folder.name, count: counts.get(String(folder.id)) || 0,
      })),
      bookmarks,
      sites,
    }
  } catch {
    return { member: null, collections: [], bookmarks: [], sites: includeSites ? [] : undefined }
  }
}
