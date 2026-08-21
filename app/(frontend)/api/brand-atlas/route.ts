import config from '@payload-config'
import { after, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { brandNameFromDomain, crawlDomain, domainKey, normalizeStartURL } from '../../../../lib/brand-atlas'

export const runtime = 'nodejs'
export const maxDuration = 300

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
  if (!result.docs.length) throw new Error('That brand is not in the Indizio library yet. Paste its website URL instead.')
  const website = result.docs[0] as unknown as { name: string; url: string }
  const url = normalizeStartURL(website.url)
  return { brandName: website.name, domain: domainKey(url.hostname), startURL: new URL('/', url).toString() }
}

export async function GET(request: Request) {
  const { payload, user } = await authenticatedContext(request)
  if (!user) return NextResponse.json({ message: 'Sign in to view Brand Atlas history.' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
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
          ],
        },
      })
      if (existing.docs[0]) {
        return NextResponse.json({ cached: true, run: serializeRun(existing.docs[0] as unknown as CrawlRunRecord) })
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
