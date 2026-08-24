import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

type Relation = string | number | { id: string | number }
type ExtensionBody = {
  action?: 'save' | 'remove' | 'update' | 'create-collection'
  bookmarkID?: string
  collectionID?: string | null
  collectionName?: string
  description?: string
  favicon?: string
  note?: string
  title?: string
  url?: string
}

const relationID = (value?: Relation | null) => value == null ? null : String(typeof value === 'object' ? value.id : value)

function extensionHeaders(request: Request) {
  const origin = request.headers.get('origin') || ''
  return {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Origin': origin.startsWith('chrome-extension://') ? origin : 'https://www.indizio.space',
    'Cache-Control': 'private, no-store',
    Vary: 'Origin',
  }
}

function normalizePageURL(input: string) {
  const url = new URL(input)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only public web pages can be saved.')
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
  if (!hostname.includes('.') || hostname === 'localhost' || /^(10|127|169\.254|192\.168)\./.test(hostname)) throw new Error('This address cannot be saved.')
  url.hostname = hostname
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$)/i.test(key)) url.searchParams.delete(key)
  }
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/$/, '')
  return { domain: hostname, pageURL: url.toString(), originURL: `${url.protocol}//${hostname}/` }
}

async function session(request: Request) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: new Headers(request.headers) })
  return { payload, user: auth.user?.collection === 'members' ? auth.user : null }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: extensionHeaders(request) })
}

export async function GET(request: Request) {
  const headers = extensionHeaders(request)
  const { payload, user } = await session(request)
  if (!user) return NextResponse.json({ signedIn: false }, { headers })

  const [collectionResult, bookmarkResult] = await Promise.all([
    payload.find({ collection: 'bookmark-collections', depth: 0, limit: 100, overrideAccess: true, sort: '-createdAt', where: { owner: { equals: user.id } } }),
    payload.find({ collection: 'bookmarks', depth: 0, limit: 500, overrideAccess: true, sort: '-createdAt', where: { owner: { equals: user.id } } }),
  ])

  const websiteIDs = [...new Set(bookmarkResult.docs.map((item) => relationID(item.website)).filter((id): id is string => Boolean(id)))]
  const websiteResult = websiteIDs.length ? await payload.find({
    collection: 'websites', depth: 1, limit: websiteIDs.length, overrideAccess: true,
    where: { id: { in: websiteIDs } },
  }) : { docs: [] }
  const websites = new Map(websiteResult.docs.map((website) => [String(website.id), website]))
  const counts = new Map<string, number>()
  for (const bookmark of bookmarkResult.docs) {
    const folderID = relationID(bookmark.folder)
    if (folderID) counts.set(folderID, (counts.get(folderID) || 0) + 1)
  }

  return NextResponse.json({
    signedIn: true,
    member: { email: user.email, name: user.name },
    collections: collectionResult.docs.map((folder) => ({ id: String(folder.id), name: folder.name, count: counts.get(String(folder.id)) || 0 })),
    bookmarks: bookmarkResult.docs.map((bookmark) => {
      const websiteID = relationID(bookmark.website) || ''
      const website = websites.get(websiteID)
      const cover = website?.cover && typeof website.cover === 'object' ? website.cover : null
      return {
        id: String(bookmark.id), websiteID, collectionID: relationID(bookmark.folder),
        url: bookmark.pageURL || website?.url || '', title: bookmark.pageTitle || website?.name || 'Saved page',
        description: bookmark.pageDescription || website?.note || '', favicon: bookmark.faviconURL || '', note: bookmark.note || '',
        domain: (() => { try { return new URL(bookmark.pageURL || website?.url || '').hostname.replace(/^www\./, '') } catch { return '' } })(),
        cover: cover && 'url' in cover ? cover.url : website?.coverImage || '', createdAt: bookmark.createdAt,
      }
    }),
  }, { headers })
}

export async function POST(request: Request) {
  const headers = extensionHeaders(request)
  const { payload, user } = await session(request)
  if (!user) return NextResponse.json({ ok: false, signedIn: false, message: 'Sign in to Indizio first.' }, { status: 401, headers })

  try {
    const body = await request.json() as ExtensionBody
    if (body.action === 'create-collection') {
      const name = body.collectionName?.trim() || ''
      if (name.length < 2) throw new Error('Give the collection a name.')
      const folder = await payload.create({ collection: 'bookmark-collections', overrideAccess: true, data: { name, owner: user.id, visibility: 'private' } })
      return NextResponse.json({ ok: true, collection: { id: String(folder.id), name: folder.name, count: 0 } }, { headers })
    }

    if (body.action === 'remove') {
      if (!body.bookmarkID) throw new Error('Choose a saved page.')
      const bookmark = await payload.findByID({ collection: 'bookmarks', id: body.bookmarkID, depth: 0, overrideAccess: true })
      if (relationID(bookmark.owner) !== String(user.id)) throw new Error('You cannot remove this save.')
      await payload.delete({ collection: 'bookmarks', id: bookmark.id, overrideAccess: true })
      return NextResponse.json({ ok: true }, { headers })
    }

    if (body.action === 'update') {
      if (!body.bookmarkID) throw new Error('Choose a saved page.')
      const bookmark = await payload.findByID({ collection: 'bookmarks', id: body.bookmarkID, depth: 0, overrideAccess: true })
      if (relationID(bookmark.owner) !== String(user.id)) throw new Error('You cannot edit this save.')
      const updated = await payload.update({
        collection: 'bookmarks', id: bookmark.id, overrideAccess: true,
        data: { folder: body.collectionID || null, note: body.note?.trim() || '' },
      })
      return NextResponse.json({ ok: true, bookmarkID: String(updated.id), collectionID: relationID(updated.folder) }, { headers })
    }

    if (!body.url) throw new Error('Open a public page before saving.')
    const normalized = normalizePageURL(body.url)
    const websiteCandidates = await payload.find({ collection: 'websites', depth: 0, limit: 1000, overrideAccess: true, pagination: false })
    let website = websiteCandidates.docs.find((item) => {
      try { return new URL(item.url).hostname.toLowerCase().replace(/^www\./, '') === normalized.domain } catch { return false }
    })
    let isNew = false
    if (!website) {
      isNew = true
      const brandName = (body.title || normalized.domain.split('.')[0]).split(/[|–—-]/)[0].trim() || normalized.domain
      website = await payload.create({
        collection: 'websites', draft: true, overrideAccess: true,
        data: { name: brandName, slug: `${normalized.domain.replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`, url: normalized.originURL, note: 'Discovered through the Indizio Chrome extension.' },
      })
    }

    const collectionID = body.collectionID || null
    const existing = await payload.find({
      collection: 'bookmarks', depth: 0, limit: 1, overrideAccess: true,
      where: { and: [
        { owner: { equals: user.id } }, { pageKey: { equals: normalized.pageURL } },
        collectionID ? { folder: { equals: collectionID } } : { folder: { exists: false } },
      ] },
    })
    if (existing.docs[0]) return NextResponse.json({ ok: true, alreadySaved: true, bookmarkID: String(existing.docs[0].id), collectionID, isNew }, { headers })

    const bookmark = await payload.create({
      collection: 'bookmarks', overrideAccess: true,
      data: {
        owner: user.id, website: website.id, folder: collectionID || undefined,
        pageURL: normalized.pageURL, pageKey: normalized.pageURL, pageTitle: body.title?.trim() || website.name,
        pageDescription: body.description?.trim() || '', faviconURL: body.favicon || '', note: body.note?.trim() || '', source: 'extension',
      },
    })
    return NextResponse.json({ ok: true, bookmarkID: String(bookmark.id), collectionID, isNew }, { headers })
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'The extension request failed.' }, { status: 400, headers })
  }
}
