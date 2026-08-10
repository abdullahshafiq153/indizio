'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useRef, useState, useTransition } from 'react'
import {
  createBookmarkCollection,
  removeBookmark,
  saveBookmark,
  signIn,
  signOut,
  signUp,
  subscribeNewsletter,
} from '../actions'
import type {
  BookmarkCollectionSummary,
  MemberSummary,
  SavedBookmarkSummary,
} from '../(frontend)/page'
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

type Props = {
  initialSites: Site[]
  initialMember: MemberSummary | null
  initialCollections: BookmarkCollectionSummary[]
  initialBookmarks: SavedBookmarkSummary[]
}

export function IndizioHome({ initialSites, initialMember, initialCollections, initialBookmarks }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup')
  const [authMessage, setAuthMessage] = useState('')
  const [bookmarkMessage, setBookmarkMessage] = useState('')
  const [collections, setCollections] = useState(initialCollections)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [industries, setIndustries] = useState<Set<string>>(new Set())
  const [menuOpen, setMenuOpen] = useState(false)
  const [newsletterMessage, setNewsletterMessage] = useState('No noise. Unsubscribe whenever you like.')
  const [pendingBookmark, setPendingBookmark] = useState<Site | null>(null)
  const [query, setQuery] = useState('')
  const [savedOnly, setSavedOnly] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [sort, setSort] = useState<SortMode>('featured')
  const [visible, setVisible] = useState(9)
  const authDialogRef = useRef<HTMLDialogElement>(null)
  const bookmarkDialogRef = useRef<HTMLDialogElement>(null)
  const siteDialogRef = useRef<HTMLDialogElement>(null)

  const authenticated = Boolean(initialMember)
  const savedWebsiteIDs = useMemo(
    () => new Set(initialBookmarks.map((bookmark) => bookmark.websiteID)),
    [initialBookmarks],
  )
  const selectedCollectionWebsiteIDs = useMemo(
    () => new Set(initialBookmarks.filter((bookmark) => !selectedCollection || bookmark.collectionID === selectedCollection).map((bookmark) => bookmark.websiteID)),
    [initialBookmarks, selectedCollection],
  )

  const industryOptions = useMemo(
    () => [...new Set(initialSites.map((site) => site.industry))].sort(),
    [initialSites],
  )

  const filteredSites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = initialSites.filter((site) => {
      const matchesText = !normalizedQuery || `${site.name} ${site.industry} ${site.style} ${site.note}`.toLowerCase().includes(normalizedQuery)
      const matchesIndustry = industries.size === 0 || industries.has(site.industry)
      const matchesSaved = !savedOnly || Boolean(site.id && selectedCollectionWebsiteIDs.has(site.id))
      return matchesText && matchesIndustry && matchesSaved
    })

    return filtered.sort((a, b) => {
      if (sort === 'az') return a.name.localeCompare(b.name)
      if (sort === 'newest') return initialSites.indexOf(a) - initialSites.indexOf(b)
      return b.featured - a.featured
    })
  }, [industries, initialSites, query, savedOnly, selectedCollectionWebsiteIDs, sort])

  const resetFilters = () => {
    setQuery('')
    setIndustries(new Set())
    setSavedOnly(false)
    setSelectedCollection(null)
    setVisible(9)
  }

  const openAuth = (site: Site | null = null) => {
    setPendingBookmark(site)
    setAuthMessage('')
    setAuthMode('signup')
    authDialogRef.current?.showModal()
  }

  const openBookmark = (site: Site) => {
    if (!authenticated) {
      openAuth(site)
      return
    }
    setPendingBookmark(site)
    setBookmarkMessage('')
    bookmarkDialogRef.current?.showModal()
  }

  const handleAccount = () => {
    if (!authenticated) {
      openAuth()
      return
    }
    startTransition(async () => {
      await signOut()
      setSavedOnly(false)
      router.refresh()
    })
  }

  const handleAuth = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setAuthMessage('')
    startTransition(async () => {
      const result = authMode === 'signup' ? await signUp(data) : await signIn(data)
      setAuthMessage(result.message)
      if (result.ok) {
        form.reset()
        authDialogRef.current?.close()
        router.refresh()
      }
    })
  }

  const handleNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    startTransition(async () => {
      const result = await subscribeNewsletter(data)
      setNewsletterMessage(result.message)
      if (result.ok) form.reset()
    })
  }

  const handleCreateCollection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    startTransition(async () => {
      const result = await createBookmarkCollection(data)
      setBookmarkMessage(result.message)
      if (result.ok && result.id) {
        setCollections((current) => [{ id: result.id!, name: String(data.get('name')), count: 0 }, ...current])
        form.reset()
      }
    })
  }

  const handleSaveBookmark = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    startTransition(async () => {
      const result = await saveBookmark(data)
      setBookmarkMessage(result.message)
      if (result.ok) {
        bookmarkDialogRef.current?.close()
        setPendingBookmark(null)
        router.refresh()
      }
    })
  }

  const handleRemoveBookmark = (bookmarkID: string) => {
    const data = new FormData()
    data.set('bookmark', bookmarkID)
    startTransition(async () => {
      const result = await removeBookmark(data)
      setBookmarkMessage(result.message)
      if (result.ok) router.refresh()
    })
  }

  const jumpToIndustry = (industry: string) => {
    setQuery('')
    setIndustries(new Set([industry]))
    setSavedOnly(false)
    setSelectedCollection(null)
    setVisible(9)
    setFiltersOpen(true)
    document.querySelector('#library')?.scrollIntoView({ behavior: 'smooth' })
  }

  const openSaved = () => {
    setSavedOnly(true)
    setSelectedCollection(null)
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
            <button className="bookmark-collection" type="button" onClick={openSaved} aria-label={`View ${savedWebsiteIDs.size} saved websites`}>
              <BookmarkIcon /> <span>{savedWebsiteIDs.size}</span>
            </button>
          )}
          <button className="account-button" type="button" onClick={handleAccount} disabled={isPending}>{authenticated ? 'Log out' : 'Log in'}</button>
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
            {authenticated && collections.length > 0 && <div><p className="filter-label">Saved collections</p><div className="filter-options">
              <button className={`filter-chip${savedOnly && !selectedCollection ? ' active' : ''}`} type="button" onClick={() => { setSavedOnly(true); setSelectedCollection(null); setIndustries(new Set()); setVisible(9) }}>All saved</button>
              {collections.map((collection) => (
                <button className={`filter-chip${selectedCollection === collection.id ? ' active' : ''}`} type="button" key={collection.id} onClick={() => { setSavedOnly(true); setSelectedCollection(collection.id); setIndustries(new Set()); setVisible(9) }}>{collection.name} · {collection.count}</button>
              ))}
            </div></div>}
            <button className="text-button" type="button" onClick={resetFilters}>Clear all</button>
          </div>

          <div className="results-meta">
            <p>{filteredSites.length} {savedOnly ? 'saved websites' : 'discoveries'}</p>
            <label>Sort <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="az">A–Z</option></select></label>
          </div>

          <div className="card-grid" aria-live="polite">
            {filteredSites.slice(0, visible).map((site, index) => {
              const bookmarked = Boolean(authenticated && site.id && savedWebsiteIDs.has(site.id))
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
                      <button className="card-action" type="button" onClick={() => openBookmark(site)} aria-label={`${authenticated ? 'Organize' : 'Sign up to bookmark'} ${site.name}`} aria-pressed={bookmarked} title={authenticated ? 'Save to a collection' : 'Sign up to bookmark'}><BookmarkIcon filled={bookmarked} /></button>
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

        <section className="newsletter ruled-section" id="newsletter"><div><p className="eyebrow">03 / Indizio weekly</p><h2>Seven signals.<br />Every Thursday.</h2></div><div className="newsletter__form-wrap"><p>Ecommerce websites, patterns, and ideas worth studying—selected and annotated in one concise fieldnote.</p><form className="newsletter-form" onSubmit={handleNewsletter}><label className="visually-hidden" htmlFor="email">Email address</label><input id="email" name="email" type="email" placeholder="Email address" required /><button type="submit" aria-label="Subscribe" disabled={isPending}><span>{isPending ? 'Joining…' : 'Join the fieldnotes'}</span><i aria-hidden="true">↗</i></button></form><p className="form-message" aria-live="polite">{newsletterMessage}</p></div></section>
      </main>

      <footer className="site-footer"><div className="footer-meta"><div><p className="footer-label">INDIZIO</p><p>Evidence from the storefront.</p></div><div><p className="footer-label">Explore</p><a href="#library">Websites</a><a href="#industries">Industries</a><a href="#index-report">Research</a></div><div><p className="footer-label">Follow</p><a href="#newsletter">Newsletter</a><a href="#">LinkedIn</a><a href="#">Instagram</a></div><div><p className="footer-label">Contact</p><a href="mailto:hello@indizio.space">hello@indizio.space</a><p>© 2026 INDIZIO</p></div></div></footer>

      <dialog className="site-dialog" ref={siteDialogRef} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
        <button className="dialog-close" type="button" aria-label="Close" onClick={() => siteDialogRef.current?.close()}>×</button>
        {selectedSite && <><div className="dialog-visual">{selectedSite.name}</div><div className="dialog-copy"><p className="eyebrow">{selectedSite.industry} / {selectedSite.style}</p><h2>{selectedSite.name}</h2><p>{selectedSite.note}</p><a className="line-button line-button--dark" href={selectedSite.url} target="_blank" rel="noreferrer"><span>Visit storefront</span><span className="line-button__icon">↗</span></a></div></>}
      </dialog>

      <dialog className="auth-dialog" ref={authDialogRef} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
        <button className="dialog-close auth-dialog__close" type="button" aria-label="Close" onClick={() => authDialogRef.current?.close()}>×</button>
        <div className="auth-dialog__content">
          <p className="eyebrow">Save your research</p>
          <h2>{authMode === 'signup' ? 'Create your INDIZIO account.' : 'Welcome back.'}</h2>
          <p>{authMode === 'signup' ? 'Create collections, annotate storefronts, and return to your research from any device.' : 'Sign in to open your saved collections.'}</p>
          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => { setAuthMode('signup'); setAuthMessage('') }}>Sign up</button>
            <button type="button" className={authMode === 'signin' ? 'active' : ''} onClick={() => { setAuthMode('signin'); setAuthMessage('') }}>Sign in</button>
          </div>
          <form className="auth-form" onSubmit={handleAuth}>
            {authMode === 'signup' && <><label htmlFor="account-name">Name</label><input id="account-name" name="name" type="text" placeholder="Your name" autoComplete="name" required /></>}
            <label htmlFor="account-email">Email address</label><input id="account-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
            <label htmlFor="account-password">Password</label><input id="account-password" name="password" type="password" placeholder="At least 8 characters" minLength={8} autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} required />
            {authMode === 'signup' && <label className="consent-field"><input name="newsletterConsent" type="checkbox" defaultChecked /><span>Also send me INDIZIO’s weekly fieldnotes. I can unsubscribe at any time.</span></label>}
            <button className="line-button line-button--dark" type="submit" disabled={isPending}><span>{isPending ? 'Please wait…' : authMode === 'signup' ? 'Create account' : 'Sign in'}</span><span className="line-button__icon" aria-hidden="true">→</span></button>
          </form>
          <p className="auth-note" aria-live="polite">{authMessage || 'Your newsletter choice is optional and stored with your account.'}</p>
        </div>
      </dialog>

      <dialog className="auth-dialog collection-dialog" ref={bookmarkDialogRef} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
        <button className="dialog-close auth-dialog__close" type="button" aria-label="Close" onClick={() => bookmarkDialogRef.current?.close()}>×</button>
        <div className="auth-dialog__content">
          <p className="eyebrow">Your research library</p>
          <h2>Save {pendingBookmark?.name || 'this website'}.</h2>
          <p>Choose a collection, or make a new one for this line of research.</p>
          {collections.length > 0 && pendingBookmark?.id && (
            <form className="auth-form collection-save-form" onSubmit={handleSaveBookmark}>
              <input type="hidden" name="website" value={pendingBookmark.id} />
              <label htmlFor="bookmark-folder">Collection</label>
              <select id="bookmark-folder" name="collection" defaultValue={collections[0]?.id} required>
                {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name} ({collection.count})</option>)}
              </select>
              <label htmlFor="bookmark-note">Private note <span>Optional</span></label>
              <textarea id="bookmark-note" name="note" placeholder="What is worth remembering here?" rows={3} />
              <button className="line-button line-button--dark" type="submit" disabled={isPending}><span>{isPending ? 'Saving…' : 'Save website'}</span><span className="line-button__icon" aria-hidden="true">+</span></button>
            </form>
          )}
          {!pendingBookmark?.id && <p className="collection-warning">This preview website must be added through Payload before it can be saved.</p>}
          {pendingBookmark?.id && initialBookmarks.some((bookmark) => bookmark.websiteID === pendingBookmark.id) && (
            <div className="saved-placements">
              <p className="filter-label">Already saved in</p>
              {initialBookmarks.filter((bookmark) => bookmark.websiteID === pendingBookmark.id).map((bookmark) => (
                <div key={bookmark.id}>
                  <span>{collections.find((collection) => collection.id === bookmark.collectionID)?.name || 'Collection'}</span>
                  <button type="button" onClick={() => handleRemoveBookmark(bookmark.id)} disabled={isPending}>Remove</button>
                </div>
              ))}
            </div>
          )}
          <div className="collection-divider"><span>New collection</span></div>
          <form className="auth-form collection-create-form" onSubmit={handleCreateCollection}>
            <label htmlFor="collection-name">Name</label><input id="collection-name" name="name" type="text" placeholder="e.g. Strong product pages" required />
            <label htmlFor="collection-description">Description <span>Optional</span></label><input id="collection-description" name="description" type="text" placeholder="What are you collecting?" />
            <button className="line-button" type="submit" disabled={isPending}><span>Create collection</span><span className="line-button__icon" aria-hidden="true">+</span></button>
          </form>
          <p className="auth-note" aria-live="polite">{bookmarkMessage || 'Collections are private by default.'}</p>
        </div>
      </dialog>
    </>
  )
}
