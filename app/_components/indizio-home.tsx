'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  createBookmarkCollection,
  moveBookmark,
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
} from '../_data/load-library-data'
import type { Site } from '../_data/sites'

type SortMode = 'featured' | 'newest' | 'az'
type GridColumns = 2 | 3 | 4
type BookmarkToast = {
  bookmarkID?: string
  collectionID?: string | null
  message: string
  saved?: boolean
  websiteID?: string
} | null

const INDUSTRIES = [
  'Apparel',
  'Beauty',
  'Beverage',
  'Bicycle',
  'Cookware',
  'Everyday Carry',
  'Fitness',
  'Flower',
  'Food',
  'Furniture',
  'Hair Care',
  'Health & Wellness',
  'Home',
  'Jewelry',
  'Kids',
  'Lifestyle',
  'Luggage',
  'Personal Care',
  'Pet',
  'Swimsuit',
] as const

const HOME_SKELETON_CARDS = Array.from({ length: 9 }, (_, index) => index)
const LIBRARY_SKELETON_CARDS = Array.from({ length: 12 }, (_, index) => index)

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
  mode?: 'home' | 'library'
  loading?: boolean
}

export function IndizioHome({ initialSites, initialMember, initialCollections, initialBookmarks, mode = 'home', loading = false }: Props) {
  const isLibraryPage = mode === 'library'
  const initialVisible = isLibraryPage ? 12 : 9
  const skeletonCards = isLibraryPage ? LIBRARY_SKELETON_CARDS : HOME_SKELETON_CARDS
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup')
  const [authMessage, setAuthMessage] = useState('')
  const [activeBookmarkID, setActiveBookmarkID] = useState<string | null>(null)
  const [bookmarkMessage, setBookmarkMessage] = useState('')
  const [bookmarkToast, setBookmarkToast] = useState<BookmarkToast>(null)
  const [bookmarks, setBookmarks] = useState(initialBookmarks)
  const [collections, setCollections] = useState(initialCollections)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [industries, setIndustries] = useState<Set<string>>(new Set())
  const [menuOpen, setMenuOpen] = useState(false)
  const [newsletterMessage, setNewsletterMessage] = useState('No noise. Unsubscribe whenever you like.')
  const [pendingBookmark, setPendingBookmark] = useState<Site | null>(null)
  const [query, setQuery] = useState('')
  const [savedOnly, setSavedOnly] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [sort, setSort] = useState<SortMode>('featured')
  const [gridColumns, setGridColumns] = useState<GridColumns>(3)
  const [visible, setVisible] = useState(initialVisible)
  const authDialogRef = useRef<HTMLDialogElement>(null)
  const bookmarkDialogRef = useRef<HTMLDialogElement>(null)
  const infiniteScrollRef = useRef<HTMLDivElement>(null)
  const siteDialogRef = useRef<HTMLDialogElement>(null)

  const authenticated = Boolean(initialMember)
  const savedWebsiteIDs = useMemo(
    () => new Set(bookmarks.map((bookmark) => bookmark.websiteID)),
    [bookmarks],
  )
  const selectedCollectionWebsiteIDs = useMemo(
    () => new Set(bookmarks.filter((bookmark) => !selectedCollection || bookmark.collectionID === selectedCollection).map((bookmark) => bookmark.websiteID)),
    [bookmarks, selectedCollection],
  )

  const industryOptions = useMemo(
    () => [...new Set([...INDUSTRIES, ...initialSites.map((site) => site.industry)])].sort(),
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

  useEffect(() => {
    if (!bookmarkToast) return
    const timeout = window.setTimeout(() => setBookmarkToast(null), 6500)
    return () => window.clearTimeout(timeout)
  }, [bookmarkToast])

  useEffect(() => {
    if (!isLibraryPage || visible >= filteredSites.length) return
    const target = infiniteScrollRef.current
    if (!target) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible((count) => Math.min(count + 9, filteredSites.length))
      }
    }, { rootMargin: '500px 0px' })

    observer.observe(target)
    return () => observer.disconnect()
  }, [filteredSites.length, isLibraryPage, visible])

  const resetFilters = () => {
    setQuery('')
    setIndustries(new Set())
    setSavedOnly(false)
    setSelectedCollection(null)
    setVisible(initialVisible)
  }

  const toggleIndustry = (industry: string) => {
    setIndustries((current) => {
      const next = new Set(current)
      if (next.has(industry)) next.delete(industry)
      else next.add(industry)
      return next
    })
    setSavedOnly(false)
    setVisible(initialVisible)
  }

  const openAuth = (site: Site | null = null) => {
    setPendingBookmark(site)
    setAuthMessage('')
    setAuthMode('signup')
    authDialogRef.current?.showModal()
  }

  const openCollectionChanger = (bookmarkID: string, websiteID: string) => {
    setActiveBookmarkID(bookmarkID)
    setPendingBookmark(initialSites.find((site) => site.id === websiteID) || null)
    setBookmarkMessage('')
    bookmarkDialogRef.current?.showModal()
  }

  const openBookmark = (site: Site) => {
    if (!authenticated) {
      openAuth(site)
      return
    }
    if (!site.id) {
      setBookmarkToast({ message: 'This preview website is not ready to be saved.' })
      return
    }

    const existing = bookmarks.find((bookmark) => bookmark.websiteID === site.id)
    if (existing) {
      const collectionName = collections.find((collection) => collection.id === existing.collectionID)?.name || 'All Bookmarks'
      setBookmarkToast({
        bookmarkID: existing.id,
        collectionID: existing.collectionID,
        message: `Already saved to ${collectionName}.`,
        saved: true,
        websiteID: site.id,
      })
      return
    }

    const optimisticID = `optimistic-${site.id}-${Date.now()}`
    setBookmarks((current) => [{
      id: optimisticID,
      websiteID: site.id!,
      collectionID: null,
    }, ...current])
    setBookmarkToast({
      collectionID: null,
      message: 'Saved to All Bookmarks.',
      saved: true,
      websiteID: site.id,
    })

    const data = new FormData()
    data.set('website', site.id)
    startTransition(async () => {
      const result = await saveBookmark(data)
      if (result.ok && result.bookmarkID) {
        setBookmarks((current) => current.map((bookmark) => bookmark.id === optimisticID ? {
          id: result.bookmarkID!,
          websiteID: site.id!,
          collectionID: result.collectionID || null,
        } : bookmark))
      } else {
        setBookmarks((current) => current.filter((bookmark) => bookmark.id !== optimisticID))
      }
      setBookmarkToast({
        bookmarkID: result.bookmarkID,
        collectionID: result.collectionID,
        message: result.message,
        saved: result.ok,
        websiteID: site.id,
      })
    })
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
        if (pendingBookmark?.id) {
          const bookmarkData = new FormData()
          bookmarkData.set('website', pendingBookmark.id)
          const bookmarkResult = await saveBookmark(bookmarkData)
          if (bookmarkResult.ok && bookmarkResult.bookmarkID) {
            setBookmarks((current) => [{
              id: bookmarkResult.bookmarkID!,
              websiteID: pendingBookmark.id!,
              collectionID: bookmarkResult.collectionID || null,
            }, ...current])
          }
          setBookmarkToast({
            bookmarkID: bookmarkResult.bookmarkID,
            collectionID: bookmarkResult.collectionID,
            message: bookmarkResult.message,
            websiteID: pendingBookmark.id,
          })
          setPendingBookmark(null)
        }
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

  const handleChangeCollection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    startTransition(async () => {
      const result = await moveBookmark(data)
      setBookmarkMessage(result.message)
      if (result.ok && result.bookmarkID) {
        setBookmarks((current) => current.map((bookmark) => bookmark.id === result.bookmarkID
          ? { ...bookmark, collectionID: result.collectionID || null }
          : bookmark))
        bookmarkDialogRef.current?.close()
        setBookmarkToast({
          bookmarkID: result.bookmarkID,
          collectionID: result.collectionID,
          message: result.message,
          websiteID: pendingBookmark?.id,
        })
        setActiveBookmarkID(null)
        setPendingBookmark(null)
        router.refresh()
      }
    })
  }

  return (
    <>
      <a className="skip-link" href="#library">Skip to the library</a>

      <div className="announcement">
        <span>The INDIZIO Ecommerce Index 2026</span>
        <Link href="/#index-report">Preview the research <span aria-hidden="true">↗</span></Link>
      </div>

      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="INDIZIO home">INDIZIO<span className="wordmark-dot">●</span></Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          <Link href="/library" aria-current={isLibraryPage ? 'page' : undefined}>Websites</Link>
          <Link href="/#industries">Industries</Link>
          <Link href="/#index-report">Research</Link>
          <Link href="/#about">About</Link>
        </nav>
        <div className="header-actions">
          {authenticated && (
            <div className="account-controls">
              <Link className="bookmark-collection" href="/bookmarks" aria-label={`View ${savedWebsiteIDs.size} saved websites`}>
                <BookmarkIcon /> <span>{savedWebsiteIDs.size}</span>
              </Link>
            </div>
          )}
          <button className="line-button header-cta" type="button" onClick={handleAccount} disabled={isPending}>
            <span>{authenticated ? 'Log out' : 'Login / Register'}</span><span className="line-button__icon" aria-hidden="true">→</span>
          </button>
        </div>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((open) => !open)}>Menu</button>
      </header>

      <nav className="mobile-menu" id="mobile-menu" aria-label="Mobile navigation" hidden={!menuOpen} onClick={() => setMenuOpen(false)}>
        <Link href="/library">Websites</Link><Link href="/#industries">Industries</Link><Link href="/#index-report">Research</Link><Link href="/#about">About</Link>
        {authenticated && <Link href="/bookmarks">Bookmarks ({savedWebsiteIDs.size})</Link>}
        <button className="mobile-account-button" type="button" onClick={handleAccount}>{authenticated ? 'Log out' : 'Log in'}</button>
      </nav>

      <main id="top">
        {!isLibraryPage && <section className="hero ruled-section">
          <div className="hero__headline">
            <p className="eyebrow"><span className="signal-dot" />Independent ecommerce research</p>
            <h1>Evidence from<br />the storefront.</h1>
            <div className="hero__aside-copy">
              <p className="hero__intro">A living index of remarkable ecommerce websites, emerging patterns, and the details worth studying.</p>
              <Link className="line-button line-button--dark hero__cta" href="/library">
                <span>View complete library</span><span className="line-button__icon" aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </section>}

        <section className={`library ruled-section ${isLibraryPage ? 'library--page' : 'library--home'}`} id="library" aria-busy={loading}>
          {isLibraryPage && <div className="section-heading">
            <div><p className="eyebrow">The complete index / 001</p><h2>Websites worth studying.</h2></div>
            <p>Browse the complete, continuously growing index of storefronts selected for the decisions behind their design.</p>
          </div>}

          <div className="library-tools">
            <label className="search-field">
              <span className="visually-hidden">Search websites</span><span aria-hidden="true">⌕</span>
              <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisible(initialVisible) }} placeholder="Search by brand, industry, or observation" autoComplete="off" disabled={loading} />
            </label>
            {isLibraryPage && authenticated && collections.length > 0 && <button className="filter-trigger" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
              Saved <span>{savedOnly ? 1 : 0}</span><span aria-hidden="true">＋</span>
            </button>}
          </div>

          {isLibraryPage && authenticated && collections.length > 0 && <div className="filter-panel" hidden={!filtersOpen}>
            <div><p className="filter-label">Saved collections</p><div className="filter-options">
              <button className={`filter-chip${savedOnly && !selectedCollection ? ' active' : ''}`} type="button" onClick={() => { setSavedOnly(true); setSelectedCollection(null); setIndustries(new Set()); setVisible(initialVisible) }}>All saved</button>
              {collections.map((collection) => (
                <button className={`filter-chip${selectedCollection === collection.id ? ' active' : ''}`} type="button" key={collection.id} onClick={() => { setSavedOnly(true); setSelectedCollection(collection.id); setIndustries(new Set()); setVisible(initialVisible) }}>{collection.name} · {collection.count}</button>
              ))}
            </div></div>
            <button className="text-button" type="button" onClick={resetFilters}>Clear all</button>
          </div>}

          <div className="library-body library-body--with-filters">
          <div className="library-results"><div className="results-meta">
            <p>{loading ? <span className="skeleton-block skeleton-results-count" aria-label="Loading website count" /> : <>{filteredSites.length} {savedOnly ? 'saved websites' : 'discoveries'}</>}</p>
            <div className="results-controls">
              <label className="view-select">View
                <select value={gridColumns} onChange={(event) => setGridColumns(Number(event.target.value) as GridColumns)} aria-label="Cards per row" disabled={loading}>
                  <option value={2}>2 columns</option>
                  <option value={3}>3 columns</option>
                  <option value={4}>4 columns</option>
                </select>
              </label>
              <label>Sort <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} disabled={loading}><option value="featured">Featured</option><option value="newest">Newest</option><option value="az">A–Z</option></select></label>
            </div>
          </div>

          <div className="card-grid" data-columns={gridColumns} aria-live="polite">
            {loading ? skeletonCards.map((item) => (
              <article className="skeleton-card" key={item} aria-hidden="true">
                <span className="skeleton-block skeleton-card__visual" />
                <span className="skeleton-block skeleton-card__title" />
                <span className="skeleton-block skeleton-card__detail" />
              </article>
            )) : filteredSites.slice(0, visible).map((site) => {
              const bookmarked = Boolean(authenticated && site.id && savedWebsiteIDs.has(site.id))
              return (
                <article className="site-card" key={site.name}>
                  <div className="card-visual">
                    <button className="card-open" type="button" onClick={() => { setSelectedSite(site); siteDialogRef.current?.showModal() }} aria-label={`Open ${site.name} fieldnote`}>
                      {site.coverImage && <Image className="card-cover" src={site.coverImage} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, (max-width: 1440px) 25vw, 320px" quality={70} />}
                      {!site.coverImage && <span className="card-mark">{site.name}</span>}
                    </button>
                  </div>
                  <div className="card-meta">
                    <div className="card-title-row"><h3>{site.name}</h3><div className="card-actions">
                      <a className="card-action" href={site.url} target="_blank" rel="noreferrer" aria-label={`Visit ${site.name} website`} title="Visit website"><ExternalIcon /></a>
                      <button className="card-action" type="button" onClick={() => openBookmark(site)} aria-label={`${bookmarked ? 'Organize saved' : authenticated ? 'Bookmark' : 'Sign up to bookmark'} ${site.name}`} aria-pressed={bookmarked} title={bookmarked ? 'Saved — change collection' : authenticated ? 'Save website' : 'Sign up to bookmark'}><BookmarkIcon filled={bookmarked} /></button>
                    </div></div>
                    <div className="card-detail-row"><p>{site.industry} · {site.style}</p></div>
                  </div>
                </article>
              )
            })}
          </div>

          {!loading && filteredSites.length === 0 && <div className="empty-state"><p>No signals found.</p><button className="text-button" type="button" onClick={resetFilters}>Reset the library</button></div>}
          {!loading && !isLibraryPage && visible < filteredSites.length && <div className="load-more-wrap"><button className="line-button" type="button" onClick={() => setVisible((count) => count + 6)}><span>Load more websites</span><span className="line-button__icon" aria-hidden="true">＋</span></button></div>}
          {!loading && isLibraryPage && visible < filteredSites.length && <div className="infinite-scroll-status" ref={infiniteScrollRef} role="status">
            <span className="visually-hidden">Loading more websites</span>
            <div className="card-grid skeleton-grid skeleton-grid--more" aria-hidden="true">
              {[0, 1, 2].map((item) => (
                <article className="skeleton-card" key={item}>
                  <span className="skeleton-block skeleton-card__visual" />
                  <span className="skeleton-block skeleton-card__title" />
                  <span className="skeleton-block skeleton-card__detail" />
                </article>
              ))}
            </div>
          </div>}
          {!loading && isLibraryPage && filteredSites.length > 0 && visible >= filteredSites.length && <p className="library-end">You have reached the end of the current index.</p>}
          </div>
          <aside className="filter-sidebar" aria-label="Filter websites by industry">
            <div className="filter-sidebar__head"><p className="filter-label">Industries</p>{industries.size > 0 && <button className="text-button" type="button" onClick={resetFilters}>Clear</button>}</div>
            <div className="filter-sidebar__options">
              {industryOptions.map((industry) => <label className="sidebar-filter" key={industry}>
                <input type="checkbox" checked={industries.has(industry)} onChange={() => toggleIndustry(industry)} disabled={loading} />
                <span>{industry}</span>
              </label>)}
            </div>
          </aside>
          </div>
        </section>

        {!isLibraryPage && <><section className="explore-section ruled-section" id="industries" aria-labelledby="explore-heading">
          <div className="explore-section__heading">
            <div><p className="eyebrow">Explore INDIZIO</p><h2 id="explore-heading">Four paths through modern commerce.</h2></div>
            <p>Move from storefront inspiration to repeatable patterns, original research, and practical ideas worth testing.</p>
          </div>
          <div className="hero-paths hero-paths--explore" aria-label="Explore INDIZIO">
            <Link className="hero-path" href="/library"><span className="hero-path__meta">01 / Live now</span><span className="hero-path__copy"><strong>Website library</strong><span>Curated ecommerce storefronts selected for the decisions behind their design.</span></span><span className="hero-path__cta">Browse websites <i aria-hidden="true">↗</i></span></Link>
            <a className="hero-path" href="#industries"><span className="hero-path__meta">02 / Building next</span><span className="hero-path__copy"><strong>Commerce patterns</strong><span>Buy boxes, cart drawers, cancel flows, and repeatable conversion patterns.</span></span><span className="hero-path__cta">Preview patterns <i aria-hidden="true">↗</i></span></a>
            <a className="hero-path" href="#index-report"><span className="hero-path__meta">03 / Field research</span><span className="hero-path__copy"><strong>CRO fieldnotes</strong><span>Brand teardowns, industry blueprints, and evidence-backed observations.</span></span><span className="hero-path__cta">Read the research <i aria-hidden="true">↗</i></span></a>
            <a className="hero-path" href="#newsletter"><span className="hero-path__meta">04 / Coming soon</span><span className="hero-path__copy"><strong>Ecommerce ideas</strong><span>Practical concepts, experiments, and details worth testing on your own store.</span></span><span className="hero-path__cta">Get early access <i aria-hidden="true">↗</i></span></a>
          </div>
        </section>

        <section className="stat-strip" aria-label="Library statistics">
          <div><strong>001</strong><span>Edition</span></div><div><strong>{loading ? <span className="skeleton-block skeleton-stat-value" aria-label="Loading website total" /> : String(initialSites.length).padStart(2, '0')}</strong><span>Websites indexed</span></div><div><strong>{String(INDUSTRIES.length).padStart(2, '0')}</strong><span>Industries</span></div><div><strong>Weekly</strong><span>Research cadence</span></div>
        </section>

        <section className="index-report ruled-section" id="index-report"><div className="report-art" aria-hidden="true"><span className="report-art__index">INDEX<br />2026</span><span className="crosshair crosshair--one" /><span className="crosshair crosshair--two" /></div><div className="report-copy"><p className="eyebrow">Coming soon / Report 001</p><h2>What 100 storefronts tell us about ecommerce now.</h2><p>The first Indizio Index maps the design decisions, trust signals, and merchandising patterns appearing across twelve industries.</p><a className="line-button line-button--dark" href="#newsletter"><span>Get the report at launch</span><span className="line-button__icon" aria-hidden="true">↗</span></a></div></section>

        <section className="about ruled-section" id="about"><p className="eyebrow">About the work</p><p>INDIZIO means “a clue” in Italian. This is a record of the clues hiding in plain sight across modern commerce—the small choices that shape how people understand, trust, and buy from a brand.</p></section></>}

        {isLibraryPage && <section className="index-report ruled-section" id="index-report"><div className="report-art" aria-hidden="true"><span className="report-art__index">INDEX<br />2026</span><span className="crosshair crosshair--one" /><span className="crosshair crosshair--two" /></div><div className="report-copy"><p className="eyebrow">Coming soon / Report 001</p><h2>What 100 storefronts tell us about ecommerce now.</h2><p>The first Indizio Index maps the design decisions, trust signals, and merchandising patterns appearing across twelve industries.</p><a className="line-button line-button--dark" href="#newsletter"><span>Get the report at launch</span><span className="line-button__icon" aria-hidden="true">↗</span></a></div></section>}

        {!isLibraryPage && <section className="newsletter ruled-section" id="newsletter"><div><p className="eyebrow">03 / Indizio weekly</p><h2>Seven signals.<br />Every Thursday.</h2></div><div className="newsletter__form-wrap"><p>Ecommerce websites, patterns, and ideas worth studying—selected and annotated in one concise fieldnote.</p><form className="newsletter-form" onSubmit={handleNewsletter}><label className="visually-hidden" htmlFor="email">Email address</label><input id="email" name="email" type="email" placeholder="Email address" required /><button type="submit" aria-label="Subscribe" disabled={isPending}><span>{isPending ? 'Joining…' : 'Join the fieldnotes'}</span><i aria-hidden="true">↗</i></button></form><p className="form-message" aria-live="polite">{newsletterMessage}</p></div></section>}
      </main>

      <footer className="site-footer">
        {isLibraryPage && <section className="footer-newsletter" id="newsletter"><div><p className="footer-label">Indizio weekly</p><p className="footer-newsletter__headline">Seven signals, every Thursday.</p></div><div className="footer-newsletter__signup"><form className="newsletter-form" onSubmit={handleNewsletter}><label className="visually-hidden" htmlFor="footer-email">Email address</label><input id="footer-email" name="email" type="email" placeholder="Email address" required /><button type="submit" aria-label="Subscribe" disabled={isPending}><span>{isPending ? 'Joining…' : 'Join the fieldnotes'}</span><i aria-hidden="true">↗</i></button></form><p className="form-message" aria-live="polite">{newsletterMessage}</p></div></section>}
        <div className="footer-meta"><div><p className="footer-label">INDIZIO</p><p>Evidence from the storefront.</p></div><div><p className="footer-label">Explore</p><Link href="/library">Websites</Link><Link href="/#industries">Industries</Link><Link href="/#index-report">Research</Link></div><div><p className="footer-label">Follow</p><Link href="/#newsletter">Newsletter</Link><a href="#">LinkedIn</a><a href="#">Instagram</a></div><div><p className="footer-label">Contact</p><a href="mailto:hello@indizio.space">hello@indizio.space</a><p>© 2026 INDIZIO</p></div></div>
      </footer>

      {bookmarkToast && (
        <div className="bookmark-toast" role="status" aria-live="polite">
          <span className="bookmark-toast__icon" aria-hidden="true"><BookmarkIcon filled={Boolean(bookmarkToast.saved || bookmarkToast.bookmarkID)} /></span>
          <p>{bookmarkToast.message}</p>
          {(bookmarkToast.saved || bookmarkToast.bookmarkID) && bookmarkToast.websiteID && (
            <button
              type="button"
              disabled={!bookmarkToast.bookmarkID}
              aria-busy={!bookmarkToast.bookmarkID}
              onClick={() => {
                if (bookmarkToast.bookmarkID && bookmarkToast.websiteID) {
                  openCollectionChanger(bookmarkToast.bookmarkID, bookmarkToast.websiteID)
                }
              }}
            >
              {!bookmarkToast.bookmarkID && <span className="bookmark-toast__loader" aria-hidden="true" />}
              <span>Change collection</span>
            </button>
          )}
          <button className="bookmark-toast__close" type="button" aria-label="Dismiss notification" onClick={() => setBookmarkToast(null)}>×</button>
        </div>
      )}

      <dialog className="site-dialog" ref={siteDialogRef} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
        <button className="dialog-close" type="button" aria-label="Close" onClick={() => siteDialogRef.current?.close()}>×</button>
        {selectedSite && <><div className={`dialog-visual${selectedSite.coverImage ? ' has-cover' : ''}`}>{selectedSite.coverImage ? <Image src={selectedSite.coverImage} alt={`${selectedSite.name} website cover`} fill sizes="(max-width: 760px) 100vw, 620px" quality={80} /> : selectedSite.name}</div><div className="dialog-copy"><p className="eyebrow">{selectedSite.industry} / {selectedSite.style}</p><h2>{selectedSite.name}</h2>{selectedSite.note && <p>{selectedSite.note}</p>}<a className="line-button line-button--dark" href={selectedSite.url} target="_blank" rel="noreferrer"><span>Visit storefront</span><span className="line-button__icon">↗</span></a></div></>}
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
          <p className="eyebrow">Organize bookmark</p>
          <h2>Choose where to keep {pendingBookmark?.name || 'this website'}.</h2>
          <p>It will always remain in All Bookmarks. A custom collection is optional.</p>
          {activeBookmarkID && (
            <form className="auth-form collection-save-form" onSubmit={handleChangeCollection}>
              <input type="hidden" name="bookmark" value={activeBookmarkID} />
              <label htmlFor="bookmark-folder">Collection</label>
              <select id="bookmark-folder" name="collection" defaultValue={bookmarks.find((bookmark) => bookmark.id === activeBookmarkID)?.collectionID || ''}>
                <option value="">All Bookmarks</option>
                {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name} ({collection.count})</option>)}
              </select>
              <button className="line-button line-button--dark" type="submit" disabled={isPending}><span>{isPending ? 'Moving…' : 'Update collection'}</span><span className="line-button__icon" aria-hidden="true">→</span></button>
            </form>
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
