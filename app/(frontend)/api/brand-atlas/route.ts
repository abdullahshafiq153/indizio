import config from '@payload-config'
import { after, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { brandNameFromDomain, crawlDomain, domainKey, normalizeStartURL } from '../../../../lib/brand-atlas'

export const runtime = 'nodejs'
export const maxDuration = 300
const SHARED_CACHE_DAYS = 30
const BACKGROUND_REFRESH_HOURS = 24

type Relationship = string | number | { id: string | number }
type AtlasPageRecord = {
  id?: string | null
  url: string
  path: string
  type: string
  source: string
  title?: string | null
}
type CrawlRunRecord = {
  id: string | number
  owner: Relationship
  input: string
  brandName: string
  domain: string
  startURL: string
  status: 'running' | 'completed' | 'failed'
  source?: 'live' | 'history-cache' | null
  urlCount?: number | null
  sitemapCount?: number | null
  truncated?: boolean | null
  refreshing?: boolean | null
  completedAt?: string | null
  error?: string | null
  createdAt: string
  pages?: AtlasPageRecord[] | null
}

function serializeRun(run: CrawlRunRecord, includePages = true) {
  const stale = run.status === 'running' && Date.now() - new Date(run.createdAt).getTime() > 10 * 60 * 1000
  return {
    id: String(run.id),
    input: run.input,
    brandName: run.brandName,
    domain: run.domain,
    startURL: run.startURL,
    status: stale ? 'failed' : run.status,
    source: run.source || 'live',
    urlCount: run.urlCount || 0,
    sitemapCount: run.sitemapCount || 0,
    truncated: Boolean(run.truncated),
    refreshing: Boolean(run.refreshing),
    completedAt: run.completedAt || null,
    createdAt: run.createdAt,
    error: stale ? 'This crawl did not complete within the processing window. Refresh the map to try again.' : run.error || null,
    pages: includePages ? (run.pages || []).map((page) => ({
      url: page.url,
      path: page.path,
      type: page.type,
      source: page.source,
      title: page.title || null,
    })) : undefined,
  }
}

async function authenticatedContext(request: Request) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: request.headers })
  if (auth.user?.collection !== 'members') return { payload, user: null }
  return { payload, user: auth.user }
}

async function resolveInput(payload: Awaited<ReturnType<typeof getPayload>>, input: string) {
  const looksLikeURL = /^https?:\/\//i.test(input) || input.includes('.')
  if (looksLikeURL) {
    const url = normalizeStartURL(input)
    const domain = domainKey(url.hostname)
    return { brandName: brandNameFromDomain(domain), domain, startURL: new URL('/', url).toString() }
  }

  const result = await payload.find({
    collection: 'websites',
    depth: 0,
    limit: 5,
    overrideAccess: false,
    select: { name: true, url: true },
    where: { name: { contains: input } },
  })
  if (result.docs.length) {
    const website = result.docs[0] as unknown as { name: string; url: string }
    const url = normalizeStartURL(website.url)
    return { brandName: website.name, domain: domainKey(url.hostname), startURL: new URL('/', url).toString() }
  }

  const mapped = await payload.find({
    collection: 'crawl-runs',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: '-completedAt',
    where: {
      and: [
        { status: { equals: 'completed' } },
        { or: [{ brandName: { contains: input } }, { domain: { contains: input } }] },
      ],
    },
  })
  if (!mapped.docs.length) throw new Error('That brand has not been mapped yet. Paste its website URL to create the first map.')
  const run = mapped.docs[0] as unknown as CrawlRunRecord
  return { brandName: run.brandName, domain: run.domain, startURL: run.startURL }
}

export async function GET(request: Request) {
  const { payload, user } = await authenticatedContext(request)
  const requestURL = new URL(request.url)
  const suggestionQuery = requestURL.searchParams.get('suggest')?.trim().slice(0, 80) || ''
  if (suggestionQuery.length >= 2) {
    const result = await payload.find({
      collection: 'crawl-runs',
      depth: 0,
      limit: 12,
      overrideAccess: true,
      pagination: false,
      sort: '-completedAt',
      select: { brandName: true, domain: true, startURL: true, urlCount: true, completedAt: true },
      where: {
        and: [
          { status: { equals: 'completed' } },
          { or: [{ brandName: { contains: suggestionQuery } }, { domain: { contains: suggestionQuery } }] },
        ],
      },
    })
    const seen = new Set<string>()
    const suggestions = (result.docs as unknown as CrawlRunRecord[]).filter((run) => {
      if (seen.has(run.domain)) return false
      seen.add(run.domain)
      return true
    }).slice(0, 6).map((run) => ({ brandName: run.brandName, domain: run.domain, startURL: run.startURL, urlCount: run.urlCount || 0, completedAt: run.completedAt || null }))
    return NextResponse.json({ suggestions })
  }
  if (!user) return NextResponse.json({ message: 'Sign in to view Brand Atlas history.' }, { status: 401 })

  const id = requestURL.searchParams.get('id')
  if (id) {
    try {
      const run = await payload.findByID({
        collection: 'crawl-runs',
        id,
        depth: 0,
        overrideAccess: false,
        user,
      }) as unknown as CrawlRunRecord
      return NextResponse.json({ run: serializeRun(run) })
    } catch {
      return NextResponse.json({ message: 'That crawl could not be found.' }, { status: 404 })
    }
  }

  const result = await payload.find({
    collection: 'crawl-runs',
    depth: 0,
    limit: 50,
    overrideAccess: false,
    pagination: false,
    sort: '-createdAt',
    user,
    select: {
      input: true,
      brandName: true,
      domain: true,
      startURL: true,
      status: true,
      source: true,
      urlCount: true,
      sitemapCount: true,
      truncated: true,
      completedAt: true,
      createdAt: true,
      error: true,
    },
  })
  return NextResponse.json({ history: (result.docs as unknown as CrawlRunRecord[]).map((run) => serializeRun(run, false)) })
}

export async function POST(request: Request) {
  const { payload, user } = await authenticatedContext(request)
  if (!user) return NextResponse.json({ message: 'Sign in to run Brand Atlas.' }, { status: 401 })

  let body: { input?: unknown; force?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Enter a brand name or website URL.' }, { status: 400 })
  }

  const input = typeof body.input === 'string' ? body.input.trim().slice(0, 500) : ''
  if (input.length < 2) return NextResponse.json({ message: 'Enter a brand name or website URL.' }, { status: 400 })

  try {
    const target = await resolveInput(payload, input)
    const running = await payload.find({
      collection: 'crawl-runs',
      depth: 0,
      limit: 3,
      overrideAccess: false,
      sort: '-createdAt',
      user,
      where: {
        and: [
          { owner: { equals: user.id } },
          { status: { equals: 'running' } },
          { createdAt: { greater_than: new Date(Date.now() - 10 * 60 * 1000).toISOString() } },
        ],
      },
    })
    const sameDomainRun = (running.docs as unknown as CrawlRunRecord[]).find((run) => run.domain === target.domain)
    if (sameDomainRun) return NextResponse.json({ cached: true, run: serializeRun(sameDomainRun) }, { status: 202 })
    if (running.docs.length >= 2) {
      return NextResponse.json({ message: 'Two maps are already running. Wait for one to finish before starting another.' }, { status: 429 })
    }

    if (!body.force) {
      const freshAfter = new Date(Date.now() - SHARED_CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString()
      const existing = await payload.find({
        collection: 'crawl-runs',
        depth: 0,
        limit: 1,
        overrideAccess: false,
        sort: '-createdAt',
        user,
        where: {
          and: [
            { owner: { equals: user.id } },
            { domain: { equals: target.domain } },
            { status: { equals: 'completed' } },
            { completedAt: { greater_than: freshAfter } },
          ],
        },
      })
      if (existing.docs[0]) {
        return NextResponse.json({ cached: true, run: serializeRun(existing.docs[0] as unknown as CrawlRunRecord) })
      }

      const shared = await payload.find({
        collection: 'crawl-runs',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        sort: '-completedAt',
        where: {
          and: [
            { domain: { equals: target.domain } },
            { status: { equals: 'completed' } },
            { completedAt: { greater_than: freshAfter } },
          ],
        },
      })
      if (shared.docs[0]) {
        const source = shared.docs[0] as unknown as CrawlRunRecord
        const refreshAfter = Date.now() - BACKGROUND_REFRESH_HOURS * 60 * 60 * 1000
        const shouldRefresh = !source.completedAt || new Date(source.completedAt).getTime() < refreshAfter
        const activeRefresh = shouldRefresh ? await payload.find({
          collection: 'crawl-runs', depth: 0, limit: 1, overrideAccess: true,
          where: { and: [
            { domain: { equals: target.domain } }, { refreshing: { equals: true } },
            { updatedAt: { greater_than: new Date(Date.now() - 10 * 60 * 1000).toISOString() } },
          ] },
        }) : null
        const revalidating = shouldRefresh && !activeRefresh?.docs.length
        const cachedRun = await payload.create({
          collection: 'crawl-runs',
          depth: 0,
          overrideAccess: false,
          user,
          data: {
            owner: user.id,
            input,
            brandName: source.brandName,
            domain: source.domain,
            startURL: source.startURL,
            status: 'completed',
            source: 'history-cache',
            urlCount: source.urlCount || 0,
            sitemapCount: source.sitemapCount || 0,
            truncated: Boolean(source.truncated),
            refreshing: revalidating,
            completedAt: source.completedAt,
            pages: (source.pages || []).map((page) => ({ url: page.url, path: page.path, type: page.type, source: page.source, title: page.title || undefined })),
          },
        }) as unknown as CrawlRunRecord
        console.info('[brand-atlas] shared cache hit', { domain: target.domain, sourceRunId: String(source.id), runId: String(cachedRun.id) })
        if (revalidating) after(async () => {
          console.info('[brand-atlas] background refresh started', { runId: String(cachedRun.id), domain: target.domain })
          try {
            const result = await crawlDomain(target.startURL)
            const merged = new Map((source.pages || []).map((page) => [page.url, page]))
            for (const page of result.pages) merged.set(page.url, page)
            const pages = Array.from(merged.values()).slice(0, 5000)
            await payload.update({ collection: 'crawl-runs', id: cachedRun.id, overrideAccess: true, data: {
              refreshing: false, completedAt: new Date().toISOString(), urlCount: pages.length,
              sitemapCount: result.sitemapCount, truncated: result.truncated || merged.size > 5000, pages, error: null,
            } })
            console.info('[brand-atlas] background refresh completed', { runId: String(cachedRun.id), domain: target.domain, urlCount: pages.length })
          } catch (error) {
            await payload.update({ collection: 'crawl-runs', id: cachedRun.id, overrideAccess: true, data: { refreshing: false } })
            console.error('[brand-atlas] background refresh failed', { runId: String(cachedRun.id), domain: target.domain, error: error instanceof Error ? error.message : String(error) })
          }
        })
        return NextResponse.json({ cached: true, shared: true, revalidating, run: serializeRun(cachedRun) })
      }
    }

    const run = await payload.create({
      collection: 'crawl-runs',
      depth: 0,
      overrideAccess: false,
      user,
      data: {
        owner: user.id,
        input,
        brandName: target.brandName,
        domain: target.domain,
        startURL: target.startURL,
        status: 'running',
        source: 'live',
        urlCount: 0,
        sitemapCount: 0,
        truncated: false,
        refreshing: false,
        pages: [],
      },
    }) as unknown as CrawlRunRecord

    after(async () => {
      console.info('[brand-atlas] crawl started', { runId: String(run.id), domain: target.domain })
      try {
        const result = await crawlDomain(target.startURL)
        await payload.update({
          collection: 'crawl-runs',
          id: run.id,
          overrideAccess: true,
          data: {
            status: 'completed',
            completedAt: new Date().toISOString(),
            urlCount: result.pages.length,
            sitemapCount: result.sitemapCount,
            truncated: result.truncated,
            pages: result.pages,
            error: null,
          },
        })
        console.info('[brand-atlas] crawl completed', { runId: String(run.id), domain: target.domain, urlCount: result.pages.length })
      } catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 1000) : 'The crawl failed unexpectedly.'
        console.error('[brand-atlas] crawl failed', { runId: String(run.id), domain: target.domain, error: message })
        try {
          await payload.update({
            collection: 'crawl-runs',
            id: run.id,
            overrideAccess: true,
            data: { status: 'failed', completedAt: new Date().toISOString(), error: message },
          })
        } catch (updateError) {
          console.error('[brand-atlas] failed to persist crawl failure', {
            runId: String(run.id),
            error: updateError instanceof Error ? updateError.message : String(updateError),
          })
        }
      }
    })

    return NextResponse.json({ cached: false, run: serializeRun(run) }, { status: 202 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start this crawl.'
    return NextResponse.json({ message }, { status: 400 })
  }
}
