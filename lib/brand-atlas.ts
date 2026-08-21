import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export type AtlasPageType = 'homepage' | 'product' | 'collection' | 'blog' | 'article' | 'page' | 'about' | 'help' | 'policy' | 'account' | 'cart' | 'checkout' | 'search' | 'gift-card' | 'other'
export type AtlasPage = {
  url: string
  path: string
  type: AtlasPageType
  source: 'sitemap' | 'link'
  title?: string
}

export type CrawlResult = {
  pages: AtlasPage[]
  sitemapCount: number
  truncated: boolean
}

const MAX_URLS = 5000
const MAX_SITEMAPS = 40
const MAX_FALLBACK_PAGES = 36
const FETCH_TIMEOUT = 8000
const MAX_RESPONSE_BYTES = 6_000_000
const TRACKING_PARAMS = new Set(['fbclid', 'gclid', 'msclkid', 'ref', 'source'])
const COMMON_SECOND_LEVEL_SUFFIXES = new Set(['co.uk', 'org.uk', 'com.au', 'com.br', 'co.nz', 'co.za', 'co.jp', 'co.in', 'com.pk', 'com.sg', 'com.mx', 'com.tr'])

function isPrivateIPv4(address: string) {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some(Number.isNaN)) return true
  const [a, b] = parts
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224
}

function isPrivateAddress(address: string) {
  if (isIP(address) === 4) return isPrivateIPv4(address)
  if (isIP(address) !== 6) return true
  const normalized = address.toLowerCase()
  return normalized === '::1' || normalized === '::' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')
}

export function domainKey(hostname: string) {
  const host = hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '')
  const labels = host.split('.').filter(Boolean)
  if (labels.length <= 2) return host
  const lastTwo = labels.slice(-2).join('.')
  return COMMON_SECOND_LEVEL_SUFFIXES.has(lastTwo) ? labels.slice(-3).join('.') : lastTwo
}

export function normalizeStartURL(input: string) {
  const value = input.trim()
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`
  const url = new URL(candidate)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only public HTTP and HTTPS websites are supported.')
  if (url.username || url.password || url.port) throw new Error('URLs containing credentials or custom ports are not supported.')
  url.hash = ''
  return url
}

async function assertPublicURL(url: URL) {
  const hostname = url.hostname.toLowerCase()
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || isIP(hostname)) {
    throw new Error('Local and private network addresses cannot be crawled.')
  }
  const addresses = await lookup(hostname, { all: true, verbatim: true })
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('The website resolved to a private or unsupported network address.')
  }
}

function sameDomain(url: URL, key: string) {
  return domainKey(url.hostname) === key
}

function normalizeDiscoveredURL(value: string, base: URL, key: string) {
  try {
    const url = new URL(value, base)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port || !sameDomain(url, key)) return null
    url.hash = ''
    url.hostname = url.hostname.toLowerCase()
    for (const name of [...url.searchParams.keys()]) {
      if (name.toLowerCase().startsWith('utm_') || TRACKING_PARAMS.has(name.toLowerCase())) url.searchParams.delete(name)
    }
    if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '') || '/'
    return url.toString()
  } catch {
    return null
  }
}

async function fetchText(url: URL, accept: string) {
  let currentURL = url
  let response: Response | null = null
  for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
    await assertPublicURL(currentURL)
    response = await fetch(currentURL, {
      headers: {
        accept,
        'user-agent': 'IndizioBrandAtlas/1.0 (+https://www.indizio.space/atlas)',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    })
    if (![301, 302, 303, 307, 308].includes(response.status)) break
    const location = response.headers.get('location')
    if (!location || redirectCount === 5) throw new Error('The website returned too many or invalid redirects.')
    currentURL = new URL(location, currentURL)
    if (!['http:', 'https:'].includes(currentURL.protocol) || currentURL.username || currentURL.password || currentURL.port) throw new Error('The website redirected to an unsupported address.')
  }
  if (!response) throw new Error('The website did not return a response.')
  if (!response.ok) throw new Error(`Request failed with HTTP ${response.status}.`)
  const finalURL = currentURL
  await assertPublicURL(finalURL)
  const length = Number(response.headers.get('content-length') || 0)
  if (length > MAX_RESPONSE_BYTES) throw new Error('The response was too large to process safely.')
  const text = await response.text()
  if (text.length > MAX_RESPONSE_BYTES) throw new Error('The response was too large to process safely.')
  return { text, finalURL, contentType: response.headers.get('content-type') || '' }
}

function decodeXML(value: string) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

function extractLocations(xml: string) {
  return [...xml.matchAll(/<loc(?:\s[^>]*)?>([\s\S]*?)<\/loc>/gi)].map((match) => decodeXML(match[1].trim())).filter(Boolean)
}

function extractLinks(html: string, base: URL, key: string) {
  const links = new Set<string>()
  for (const match of html.matchAll(/<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    const normalized = normalizeDiscoveredURL(match[1], base, key)
    if (normalized) links.add(normalized)
  }
  return [...links]
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match?.[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 180) || undefined
}

export function classifyPage(urlValue: string): AtlasPageType {
  const url = new URL(urlValue)
  const path = url.pathname.toLowerCase()
  if (path === '/' || path === '') return 'homepage'
  if (path.includes('/gift-card') || path.includes('/gift_card')) return 'gift-card'
  if (/\/(products?|p)\//.test(path)) return 'product'
  if (/\/(collections?|categories?|catalog)\//.test(path)) return 'collection'
  if (/\/(blogs?|journal|stories)(\/|$)/.test(path)) return 'blog'
  if (/\/(articles?|guides?|news)\//.test(path)) return 'article'
  if (/\/(about|our-story|company)(\/|$)/.test(path)) return 'about'
  if (/\/(help|support|contact|faq)(\/|$)/.test(path)) return 'help'
  if (/\/(policies|privacy|terms|refund|returns?|shipping)(\/|$|-)/.test(path)) return 'policy'
  if (/\/(account|login|register)(\/|$)/.test(path)) return 'account'
  if (/\/(checkouts?|checkout)(\/|$)/.test(path)) return 'checkout'
  if (/\/(cart|basket)(\/|$)/.test(path)) return 'cart'
  if (/\/(search)(\/|$)/.test(path)) return 'search'
  if (/\/(pages?)(\/|$)/.test(path)) return 'page'
  return 'other'
}

function pageFromURL(urlValue: string, source: AtlasPage['source'], title?: string): AtlasPage {
  const url = new URL(urlValue)
  return { url: urlValue, path: `${url.pathname}${url.search}`, type: classifyPage(urlValue), source, title }
}

async function robotsInfo(start: URL) {
  try {
    const { text } = await fetchText(new URL('/robots.txt', start), 'text/plain,*/*;q=0.1')
    const sitemaps = [...text.matchAll(/^\s*sitemap\s*:\s*(\S+)\s*$/gim)].map((match) => match[1])
    const disallow: string[] = []
    let applies = false
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.replace(/\s*#.*$/, '').trim()
      const agent = line.match(/^user-agent\s*:\s*(.+)$/i)
      if (agent) {
        applies = agent[1].trim() === '*'
        continue
      }
      const rule = line.match(/^disallow\s*:\s*(.*)$/i)
      if (applies && rule?.[1].trim()) disallow.push(rule[1].trim())
    }
    return { sitemaps, disallow }
  } catch {
    return { sitemaps: [], disallow: [] }
  }
}

async function discoverFromSitemaps(start: URL, key: string) {
  const robots = await robotsInfo(start)
  const queue = [...new Set([
    ...robots.sitemaps,
    new URL('/sitemap.xml', start).toString(),
    new URL('/sitemap_index.xml', start).toString(),
  ])]
  const visited = new Set<string>()
  const pages = new Set<string>()
  let truncated = false

  while (queue.length && visited.size < MAX_SITEMAPS && pages.size < MAX_URLS) {
    const next = queue.shift()!
    if (visited.has(next) || next.toLowerCase().endsWith('.gz')) continue
    let sitemapURL: URL
    try {
      sitemapURL = new URL(next, start)
      if (!sameDomain(sitemapURL, key)) continue
    } catch {
      continue
    }
    visited.add(sitemapURL.toString())
    try {
      const { text, finalURL } = await fetchText(sitemapURL, 'application/xml,text/xml,*/*;q=0.1')
      const locations = extractLocations(text)
      const isIndex = /<sitemapindex[\s>]/i.test(text)
      for (const location of locations) {
        const normalized = normalizeDiscoveredURL(location, finalURL, key)
        if (!normalized) continue
        if (isIndex || /\.xml(?:\.gz)?(?:\?|$)/i.test(normalized)) {
          if (!visited.has(normalized)) queue.push(normalized)
        } else {
          pages.add(normalized)
          if (pages.size >= MAX_URLS) {
            truncated = true
            break
          }
        }
      }
    } catch {
      // A missing auxiliary sitemap should not fail the entire discovery run.
    }
  }

  if (queue.length || visited.size >= MAX_SITEMAPS) truncated = true
  return { urls: [...pages], sitemapCount: visited.size, truncated, disallow: robots.disallow }
}

function allowedByRobots(urlValue: string, disallow: string[]) {
  const path = new URL(urlValue).pathname
  return !disallow.some((rule) => rule === '/' || (rule.endsWith('$') ? path === rule.slice(0, -1) : path.startsWith(rule.replace(/\*.*$/, ''))))
}

async function discoverFromLinks(start: URL, key: string, seedURLs: string[], disallow: string[]) {
  const queue = [...new Set([start.toString(), ...seedURLs.slice(0, 8)])]
  const visited = new Set<string>()
  const discovered = new Map<string, string | undefined>()

  while (queue.length && visited.size < MAX_FALLBACK_PAGES) {
    const batch = queue.splice(0, 4).filter((url) => !visited.has(url))
    await Promise.all(batch.map(async (urlValue) => {
      visited.add(urlValue)
      if (!allowedByRobots(urlValue, disallow)) return
      try {
        const { text, finalURL, contentType } = await fetchText(new URL(urlValue), 'text/html,application/xhtml+xml')
        if (!contentType.includes('html') && !/<html[\s>]/i.test(text)) return
        const canonical = normalizeDiscoveredURL(finalURL.toString(), start, key)
        if (canonical) discovered.set(canonical, extractTitle(text))
        for (const link of extractLinks(text, finalURL, key)) {
          if (!discovered.has(link)) discovered.set(link, undefined)
          if (!visited.has(link) && queue.length < MAX_FALLBACK_PAGES * 3) queue.push(link)
        }
      } catch {
        // Individual pages may fail without invalidating the rest of the crawl.
      }
    }))
  }
  return discovered
}

export async function crawlDomain(startInput: string): Promise<CrawlResult> {
  const start = normalizeStartURL(startInput)
  await assertPublicURL(start)
  const key = domainKey(start.hostname)
  const canonicalStart = new URL('/', start)
  canonicalStart.search = ''
  canonicalStart.hash = ''

  const sitemap = await discoverFromSitemaps(canonicalStart, key)
  const links = await discoverFromLinks(canonicalStart, key, sitemap.urls, sitemap.disallow)
  const pages = new Map<string, AtlasPage>()

  for (const url of sitemap.urls) pages.set(url, pageFromURL(url, 'sitemap'))
  for (const [url, title] of links) {
    const existing = pages.get(url)
    pages.set(url, existing ? { ...existing, title: title || existing.title } : pageFromURL(url, 'link', title))
  }
  if (!pages.has(canonicalStart.toString())) pages.set(canonicalStart.toString(), pageFromURL(canonicalStart.toString(), 'link'))

  return {
    pages: [...pages.values()].sort((a, b) => a.type.localeCompare(b.type) || a.path.localeCompare(b.path)).slice(0, MAX_URLS),
    sitemapCount: sitemap.sitemapCount,
    truncated: sitemap.truncated || pages.size > MAX_URLS,
  }
}

export function brandNameFromDomain(domain: string) {
  return domain.split('.')[0].split(/[-_]/).filter(Boolean).map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ')
}
