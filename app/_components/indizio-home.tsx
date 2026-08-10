'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import type { Site } from '../_data/sites'

type SortMode = 'featured' | 'newest' | 'az'

function ExternalIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 3h8v8M13 3 3 13" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path d="M3.5 2.5h9v11l-4.5-3-4.5 3v-11Z" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function IndizioHome({ initialSites }: { initialSites: Site[] }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [industries, setIndustries] = useState<Set<string>>(new Set())
  const [menuOpen, setMenuOpen] = useState(false)
  const [newsletterMessage, setNewsletterMessage] = useState('No noise. Unsubscribe whenever you like.')
  const [pendingBookmark, setPendingBookmark] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [savedOnly, setSavedOnly] = useState(false)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [sort, setSort] = useState<SortMode>('featured')
  const [visible, setVisible] = useState(9)
  const authDialogRef = useRef<HTMLDialogElement>(null)
  const siteDialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthenticated(localStorage.getItem('indizio-authenticated') === 'true')
      setBookmarks(new Set(JSON.parse(localStorage.getItem('indizio-bookmarks') || '[]') as string[]))
    } catch {
      // Storage can be unavailable in privacy-restricted contexts.
    }
  }, [])

  const industryOptions = useMemo(
    () => [...new Set(initialSites.map((site) => site.industry))].sort(),
    [initialSites],
  )

  const filteredSites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = initialSites.filter((site) => {
      const matchesText = !normalizedQuery || `${site.name} ${site.industry} ${site.style} ${site.note}`.toLowerCase().includes(normalizedQuery)
      const matchesIndustry = industries.size === 0 || industries.has(site.industry)
      const matchesSaved = !savedOnly || bookmarks.has(site.name)
      return matchesText && matchesIndustry && matchesSaved
    })

    return filtered.sort((a, b) => {
      if (sort === 'az') return a.name.localeCompare(b.name)
      if (sort === 'newest') return initialSites.indexOf(a) - initialSites.indexOf(b)
      return b.featured - a.featured
    })
  }, [bookmarks, industries, initialSites, query, savedOnly, sort])

  const resetFilters = () => {
    setQuery('')
    setIndustries(new Set())
    setSavedOnly(false)
    setVisible(9)
  }

  const openAuth = (siteName: string | null = null) => {
    setPendingBookmark(siteName)
    authDialogRef.current?.showModal()
  }

  const toggleBookmark = (siteName: string) => {
    if (!authenticated) {
      openAuth(siteName)
      return
    }

    setBookmarks((current) => {
      const next = new Set(current)
      if (next.has(siteName)) next.delete(siteName)
      else next.add(siteName)
      localStorage.setItem('indizio-bookmarks', JSON.stringify([...next]))
      return next
    })
  }

  const handleAccount = () => {
    if (!authenticated) {
      openAuth()
      return
    }
    setAuthenticated(false)
    setSavedOnly(false)
    localStorage.setItem('indizio-authenticated', 'false')
  }

  const handleAuth = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthenticated(true)
    localStorage.setItem('indizio-authenticated', 'true')
    if (pendingBookmark) {
      setBookmarks((current) => {
        const next = new Set(current).add(pendingBookmark)
        localStorage.setItem('indizio-bookmarks', JSON.stringify([...next]))
        return next
      })
    }
    setPendingBookmark(null)
    event.currentTarget.reset()
    authDialogRef.current?.close()
  }

  const handleNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = new FormData(event.currentTarget).get('email')
    setNewsletterMessage(`Fieldnote reserved for ${email}. Beehiiv connection follows in the production build.`)
    event.currentTarget.reset()
  }

  const jumpToIndustry = (industry: string) => {
    setQuery('')
    setIndustries(new Set([industry]))
    setSavedOnly(false)
    setVisible(9)
    setFiltersOpen(true)
    document.querySelector('#library')?.scrollIntoView({ behavior: 'smooth' })
  }

  const openSaved = () => {
    setSavedOnly(true)
    setIndustries(new Set())
    setQuery('')
    setVisible(9)
    document.querySelector('#library')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <a className="skip-link" href="#library">Skip to the library</a>

      <div className="announcement">
        <span>The INDIZIO Ecommerce Index 2026</span>
        <a href="#index-report">Preview the research <span aria-hidden="true">↗</span></a>
      </div>

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="INDIZIO home">INDIZIO<span className="wordmark-dot">●</span></a>
        <nav className="primary-nav" aria-label="Primary navigation">
          <a href="#library">Websites</a>
          <a href="#industries">Industries</a>
          <a href="#index-report">Research</a>
          <a href="#about">About</a>
        </nav>
        <div className="account-controls">
          {authenticated && (
            <button className="bookmark-collection" type="button" onClick={openSaved} aria-label={`View ${bookmarks.size} saved websites`}>
              <BookmarkIcon /> <span>{bookmarks.size}</span>
            </button>
          )}
          <button className="account-button" type="button" onClick={handleAccount}>{authenticated ? 'Log out' : 'Log in'}</button>
        </div>
        <a className="line-button line-button--dark header-cta" href="#newsletter">
          <span>Get the fieldnotes</span><span className="line-button__icon" aria-hidden="true">↗</span>
        </a>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((open) => !open)}>Menu</button>
      </header>

      <nav className="mobile-menu" id="mobile-menu" aria-label="Mobile navigation" hidden={!menuOpen} onClick={() => setMenuOpen(false)}>
        <a href="#library">Websites</a><a href="#industries">Industries</a><a href="#index-report">Research</a><a href="#about">About</a>
        <button className="mobile-account-button" type="button" onClick={handleAccount}>{authenticated ? 'Log out' : 'Log in'}</button>
      </nav>

      <main id="top">
        <section className="hero ruled-section">
          <div className="hero__headline">
            <p className="eyebrow"><span className="signal-dot" />Independent ecommerce research</p>
            <h1>Evidence from<br />the storefront.</h1>
            <div className="hero__aside-copy">
              <p className="hero__intro">A living index of remarkable ecommerce websites, emerging patterns, and the details worth studying.</p>
              <a className="line-button line-button--dark hero__cta" href="#library">
                <span>Explore the library</span><span className="line-button__icon" aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <div className="hero-paths" aria-label="Explore INDIZIO">
            <a className="hero-path" href="#library"><span className="hero-path__meta">01 / Live now</span><span className="hero-path__copy"><strong>Website library</strong><span>Curated ecommerce storefronts selected for the decisions behind their design.</span></span><span className="hero-path__cta">Browse websites <i aria-hidden="true">↗</i></span></a>
            <a className="hero-path" href="#industries"><span className="hero-path__meta">02 / Building next</span><span className="hero-path__copy"><strong>Commerce patterns</strong><span>Buy boxes, cart drawers, cancel flows, and repeatable conversion patterns.</span></span><span className="hero-path__cta">Preview patterns <i aria-hidden="true">↗</i></span></a>
            <a className="hero-path" href="#index-report"><span className="hero-path__meta">03 / Field research</span><span className="hero-path__copy"><strong>CRO fieldnotes</strong><span>Brand teardowns, industry blueprints, and evidence-backed observations.</span></span><span className="hero-path__cta">Read the research <i aria-hidden="true">↗</i></span></a>
            <a className="hero-path" href="#newsletter"><span className="hero-path__meta">04 / Coming soon</span><span className="hero-path__copy"><strong>Ecommerce ideas</strong><span>Practical concepts, experiments, and details worth testing on your own store.</span></span><span className="hero-path__cta">Get early access <i aria-hidden="true">↗</i></span></a>
          </div>
        </section>

        <section className="library ruled-section" id="library">
          <div className="section-heading">
            <div><p className="eyebrow">01 / The library</p><h2>Websites worth studying.</h2></div>
            <p>Selected for the decisions behind the design—not simply how the homepage looks.</p>
          </div>

          <div className="library-tools">
            <label className="search-field">
              <span className="visually-hidden">Search websites</span><span aria-hidden="true">⌕</span>
              <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisible(9) }} placeholder="Search by brand, industry, or observation" autoComplete="off" />
            </label>
            <button className="filter-trigger" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
              Filters <span>{industries.size}</span><span aria-hidden="true">＋</span>
            </button>
          </div>

          <div className="filter-panel" hidden={!filtersOpen}>
            <div><p className="filter-label">Industry</p><div className="filter-options">
              {industryOptions.map((industry) => (
                <button className={`filter-chip${industries.has(industry) ? ' active' : ''}`} type="button" key={industry} onClick={() => {
                  setIndustries((current) => {
                    const next = new Set(current)
                    if (next.has(industry)) next.delete(industry)
                    else next.add(industry)
                    return next
                  })
                  setSavedOnly(false)
                  setVisible(9)
                }}>{industry}</button>
              ))}
            </div></div>
            <button className="text-button" type="button" onClick={resetFilters}>Clear all</button>
          </div>

          <div className="results-meta">
            <p>{filteredSites.length} {savedOnly ? 'saved websites' : 'discoveries'}</p>
            <label>Sort <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="az">A–Z</option></select></label>
          </div>

          <div className="card-grid" aria-live="polite">
            {filteredSites.slice(0, visible).map((site, index) => {
              const bookmarked = authenticated && bookmarks.has(site.name)
              return (
                <article className="site-card" key={site.name}>
                  <div className="card-visual">
                    <button className="card-open" type="button" onClick={() => { setSelectedSite(site); siteDialogRef.current?.showModal() }} aria-label={`Open ${site.name} fieldnote`}>
                      <span className="card-index">{String(index + 1).padStart(2, '0')} / {site.industry.toUpperCase()}</span>
                      <span className="card-mark">{site.name}</span>
                    </button>
                  </div>
                  <div className="card-meta">
                    <div className="card-title-row"><h3>{site.name}</h3><div className="card-actions">
                      <a className="card-action" href={site.url} target="_blank" rel="noreferrer" aria-label={`Visit ${site.name} website`} title="Visit website"><ExternalIcon /></a>
                      <button className="card-action" type="button" onClick={() => toggleBookmark(site.name)} aria-label={`${authenticated ? (bookmarked ? 'Remove' : 'Bookmark') : 'Sign up to bookmark'} ${site.name}`} aria-pressed={bookmarked} title={authenticated ? 'Bookmark website' : 'Sign up to bookmark'}><BookmarkIcon filled={bookmarked} /></button>
                    </div></div>
                    <div className="card-detail-row"><p>{site.industry} · {site.style}</p></div>
                  </div>
                </article>
              )
            })}
          </div>

          {filteredSites.length === 0 && <div className="empty-state"><p>No signals found.</p><button className="text-button" type="button" onClick={resetFilters}>Reset the library</button></div>}
          {visible < filteredSites.length && <div className="load-more-wrap"><button className="line-button" type="button" onClick={() => setVisible((count) => count + 6)}><span>Load more websites</span><span className="line-button__icon" aria-hidden="true">＋</span></button></div>}
        </section>

        <section className="stat-strip" aria-label="Library statistics">
          <div><strong>001</strong><span>Edition</span></div><div><strong>{String(initialSites.length).padStart(2, '0')}</strong><span>Websites indexed</span></div><div><strong>08</strong><span>Industries</span></div><div><strong>Weekly</strong><span>Research cadence</span></div>
        </section>

        <section className="industry-section ruled-section" id="industries">
          <div className="section-heading section-heading--compact"><div><p className="eyebrow">02 / Browse the field</p><h2>Start with an industry.</h2></div></div>
          <div className="industry-list">
            {[['Fashion', 'Fashion & apparel', '07'], ['Beauty', 'Beauty & wellness', '05'], ['Food', 'Food & beverage', '04'], ['Home', 'Home & objects', '03'], ['Technology', 'Technology', '03'], ['Health', 'Health & supplements', '02']].map(([value, label, count]) => (
              <button type="button" key={value} onClick={() => jumpToIndustry(value)}><span>{label}</span><strong>{count}</strong><i>↗</i></button>
            ))}
          </div>
        </section>

        <section className="index-report ruled-section" id="index-report"><div className="report-art" aria-hidden="true"><span className="report-art__index">INDEX<br />2026</span><span className="crosshair crosshair--one" /><span className="crosshair crosshair--two" /></div><div className="report-copy"><p className="eyebrow">Coming soon / Report 001</p><h2>What 100 storefronts tell us about ecommerce now.</h2><p>The first Indizio Index maps the design decisions, trust signals, and merchandising patterns appearing across twelve industries.</p><a className="line-button line-button--dark" href="#newsletter"><span>Get the report at launch</span><span className="line-button__icon" aria-hidden="true">↗</span></a></div></section>

        <section className="about ruled-section" id="about"><p className="eyebrow">About the work</p><p>INDIZIO means “a clue” in Italian. This is a record of the clues hiding in plain sight across modern commerce—the small choices that shape how people understand, trust, and buy from a brand.</p></section>

        <section className="newsletter ruled-section" id="newsletter"><div><p className="eyebrow">03 / Indizio weekly</p><h2>Seven signals.<br />Every Thursday.</h2></div><div className="newsletter__form-wrap"><p>Ecommerce websites, patterns, and ideas worth studying—selected and annotated in one concise fieldnote.</p><form className="newsletter-form" onSubmit={handleNewsletter}><label className="visually-hidden" htmlFor="email">Email address</label><input id="email" name="email" type="email" placeholder="Email address" required /><button type="submit" aria-label="Subscribe"><span>Join the fieldnotes</span><i aria-hidden="true">↗</i></button></form><p className="form-message" aria-live="polite">{newsletterMessage}</p></div></section>
      </main>

      <footer className="site-footer"><div className="footer-meta"><div><p className="footer-label">INDIZIO</p><p>Evidence from the storefront.</p></div><div><p className="footer-label">Explore</p><a href="#library">Websites</a><a href="#industries">Industries</a><a href="#index-report">Research</a></div><div><p className="footer-label">Follow</p><a href="#newsletter">Newsletter</a><a href="#">LinkedIn</a><a href="#">Instagram</a></div><div><p className="footer-label">Contact</p><a href="mailto:hello@indizio.space">hello@indizio.space</a><p>© 2026 INDIZIO</p></div></div></footer>

      <dialog className="site-dialog" ref={siteDialogRef} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
        <button className="dialog-close" type="button" aria-label="Close" onClick={() => siteDialogRef.current?.close()}>×</button>
        {selectedSite && <><div className="dialog-visual">{selectedSite.name}</div><div className="dialog-copy"><p className="eyebrow">{selectedSite.industry} / {selectedSite.style}</p><h2>{selectedSite.name}</h2><p>{selectedSite.note}</p><a className="line-button line-button--dark" href={selectedSite.url} target="_blank" rel="noreferrer"><span>Visit storefront</span><span className="line-button__icon">↗</span></a></div></>}
      </dialog>

      <dialog className="auth-dialog" ref={authDialogRef} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
        <button className="dialog-close auth-dialog__close" type="button" aria-label="Close" onClick={() => authDialogRef.current?.close()}>×</button>
        <div className="auth-dialog__content"><p className="eyebrow">Save your research</p><h2>Create your INDIZIO account.</h2><p>Sign up to bookmark storefronts and return to your saved library from any device.</p><form className="auth-form" onSubmit={handleAuth}><label className="visually-hidden" htmlFor="account-email">Email address</label><input id="account-email" name="email" type="email" placeholder="Email address" required /><button className="line-button line-button--dark" type="submit"><span>Continue with email</span><span className="line-button__icon" aria-hidden="true">→</span></button></form><p className="auth-note">Prototype account flow. Production authentication will be connected to Payload.</p></div>
      </dialog>
    </>
  )
}
