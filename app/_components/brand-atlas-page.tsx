'use client'

import Link from 'next/link'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import type { MemberSummary } from '../_data/load-library-data'

type AtlasPage = { url: string; path: string; type: string; source: string; title: string | null }
type AtlasRun = {
  id: string
  input: string
  brandName: string
  domain: string
  startURL: string
  status: 'running' | 'completed' | 'failed'
  source: string
  urlCount: number
  sitemapCount: number
  truncated: boolean
  completedAt: string | null
  createdAt: string
  error: string | null
  pages?: AtlasPage[]
}

const PAGE_TYPES = ['all', 'homepage', 'product', 'collection', 'blog', 'article', 'about', 'help', 'policy', 'account', 'cart', 'search', 'other']

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

export function BrandAtlasPage({ member }: { member: MemberSummary | null }) {
  const [history, setHistory] = useState<AtlasRun[]>([])
  const [selectedRun, setSelectedRun] = useState<AtlasRun | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(Boolean(member))
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [resultQuery, setResultQuery] = useState('')

  const loadHistory = useCallback(async () => {
    if (!member) return
    try {
      const response = await fetch('/api/brand-atlas', { cache: 'no-store' })
      const data = await response.json()
      if (response.ok) setHistory(data.history || [])
    } finally {
      setHistoryLoading(false)
    }
  }, [member])

  const loadRun = async (id: string) => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(`/api/brand-atlas?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to open this crawl.')
      setSelectedRun(data.run)
      setType('all')
      setResultQuery('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to open this crawl.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadHistory() }, [loadHistory])

  useEffect(() => {
    if (selectedRun?.status !== 'running') return
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/brand-atlas?id=${encodeURIComponent(selectedRun.id)}`, { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok) return
        setSelectedRun(data.run)
        if (data.run.status !== 'running') void loadHistory()
      } catch {
        // A temporary polling failure should not discard a running crawl.
      }
    }, 2500)
    return () => window.clearInterval(timer)
  }, [loadHistory, selectedRun?.id, selectedRun?.status])

  const startCrawl = async (event?: FormEvent<HTMLFormElement>, force = false, inputOverride?: string) => {
    event?.preventDefault()
    const input = inputOverride || query
    if (!member || !input.trim()) return
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/brand-atlas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input, force }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to start Brand Atlas.')
      setSelectedRun(data.run)
      setType('all')
      setResultQuery('')
      setMessage(data.cached ? 'Opened your saved result—no new crawl was needed.' : 'Discovery started. You can leave this page and return from history.')
      void loadHistory()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start Brand Atlas.')
    } finally {
      setLoading(false)
    }
  }

  const filteredPages = useMemo(() => {
    const normalized = resultQuery.trim().toLowerCase()
    return (selectedRun?.pages || []).filter((page) => {
      const matchesType = type === 'all' || page.type === type
      const matchesQuery = !normalized || `${page.url} ${page.title || ''}`.toLowerCase().includes(normalized)
      return matchesType && matchesQuery
    })
  }, [resultQuery, selectedRun?.pages, type])

  const copyURLs = async () => {
    await navigator.clipboard.writeText(filteredPages.map((page) => page.url).join('\n'))
    setMessage(`${filteredPages.length} URLs copied.`)
  }

  const exportCSV = () => {
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`
    const csv = ['URL,Type,Title,Source', ...filteredPages.map((page) => [page.url, page.type, page.title || '', page.source].map(escape).join(','))].join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    link.download = `${selectedRun?.domain || 'indizio-brand-atlas'}-urls.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <main id="brand-atlas" className="atlas-page ruled-section">
      <header className="atlas-hero">
        <div><p className="eyebrow">03 / Brand Atlas</p><h1>Every public page.<br />One brand map.</h1></div>
        <div className="atlas-hero__aside"><p>Enter an Indizio brand or paste a website URL. Brand Atlas discovers the public pages connected to its main domain and keeps every result in your history.</p><p className="atlas-limit-note">Sitemap-first discovery with a safe same-domain crawl fallback.</p></div>
      </header>

      <section className="atlas-search" aria-labelledby="atlas-search-heading">
        <div><p className="eyebrow">Start a map</p><h2 id="atlas-search-heading">Find a brand by name or URL.</h2></div>
        {member ? (
          <form onSubmit={startCrawl} className="atlas-search__form">
            <label htmlFor="atlas-query">Brand name or website</label>
            <div><input id="atlas-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Allbirds or https://allbirds.com" autoComplete="off" required /><button type="submit" disabled={loading || query.trim().length < 2}><span>{loading ? 'Opening…' : 'Map this brand'}</span><span aria-hidden="true">→</span></button></div>
            <p aria-live="polite">{message || 'Brand names resolve from the Indizio library. Paste a URL for any other website.'}</p>
          </form>
        ) : (
          <div className="atlas-signed-out"><p>Sign in to run a map and keep its results in your private search history.</p><Link className="line-button line-button--dark" href="/"><span>Login / Register</span><span className="line-button__icon" aria-hidden="true">→</span></Link></div>
        )}
      </section>

      <div className="atlas-workspace">
        <aside className="atlas-history" aria-label="Brand Atlas history">
          <div className="atlas-panel-heading"><span>History</span><span>{history.length.toString().padStart(2, '0')}</span></div>
          {historyLoading ? <div className="atlas-history__loading"><span /><span /><span /></div> : history.length ? history.map((run) => (
            <button key={run.id} type="button" className={selectedRun?.id === run.id ? 'active' : ''} onClick={() => void loadRun(run.id)}>
              <span><strong>{run.brandName}</strong><small>{run.domain}</small></span>
              <span><small>{run.status === 'completed' ? `${run.urlCount} URLs` : run.status}</small><small>{formatDate(run.createdAt)}</small></span>
            </button>
          )) : <p className="atlas-empty-copy">Your previous maps will appear here.</p>}
        </aside>

        <section className="atlas-results" aria-live="polite">
          {!selectedRun ? (
            <div className="atlas-results__empty"><span>↳</span><h2>Your map will appear here.</h2><p>Search for a brand above or reopen a previous result from history.</p></div>
          ) : selectedRun.status === 'running' ? (
            <div className="atlas-results__empty atlas-results__running"><span className="atlas-spinner" /><h2>Mapping {selectedRun.domain}.</h2><p>Checking sitemaps and public same-domain links. This result is already saved to your history.</p></div>
          ) : selectedRun.status === 'failed' ? (
            <div className="atlas-results__empty"><span>!</span><h2>This map could not be completed.</h2><p>{selectedRun.error}</p><button className="line-button" type="button" onClick={() => { setQuery(selectedRun.startURL); void startCrawl(undefined, true, selectedRun.startURL) }}><span>Try again</span><span className="line-button__icon">↗</span></button></div>
          ) : (
            <>
              <header className="atlas-results__header">
                <div><p className="eyebrow">Completed map</p><h2>{selectedRun.brandName}</h2><a href={selectedRun.startURL} target="_blank" rel="noreferrer">{selectedRun.domain} ↗</a></div>
                <div className="atlas-results__stats"><span><strong>{selectedRun.urlCount}</strong><small>URLs found</small></span><span><strong>{selectedRun.sitemapCount}</strong><small>Sitemaps checked</small></span></div>
              </header>
              {selectedRun.truncated && <p className="atlas-truncated">This website exceeded the safe result limit. The first 5,000 discoverable URLs are shown.</p>}
              <div className="atlas-results__tools">
                <label><span className="visually-hidden">Search result URLs</span><input type="search" value={resultQuery} onChange={(event) => setResultQuery(event.target.value)} placeholder="Filter URLs" /></label>
                <label>Type <select value={type} onChange={(event) => setType(event.target.value)}>{PAGE_TYPES.map((option) => <option key={option} value={option}>{option === 'all' ? 'All pages' : option}</option>)}</select></label>
                <button type="button" onClick={() => void copyURLs()}>Copy URLs</button>
                <button type="button" onClick={exportCSV}>Export CSV</button>
                <button type="button" onClick={() => { setQuery(selectedRun.startURL); void startCrawl(undefined, true, selectedRun.startURL) }}>Refresh map</button>
              </div>
              <div className="atlas-results__meta"><span>{filteredPages.length} shown</span><span>Saved {formatDate(selectedRun.completedAt || selectedRun.createdAt)}</span></div>
              <ol className="atlas-url-list">
                {filteredPages.map((page, index) => <li key={page.url}><span>{String(index + 1).padStart(3, '0')}</span><div><strong>{page.title || page.path || '/'}</strong><a href={page.url} target="_blank" rel="noreferrer">{page.url}</a></div><span>{page.type}</span><a href={page.url} target="_blank" rel="noreferrer" aria-label={`Open ${page.url}`}>↗</a></li>)}
              </ol>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
