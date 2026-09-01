'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BrandMark } from './brand-mark'
import { useRouter } from 'next/navigation'
import { FormEvent, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  createBookmarkCollection,
  moveBookmark,
  removeBookmark,
  saveBookmark,
  signIn,
  signUp,
  subscribeNewsletter,
} from '../actions'
import type {
  BookmarkCollectionSummary,
  SavedBookmarkSummary,
  LibraryFilterMetadata,
} from '../_data/load-library-data'
import type { Site } from '../_data/sites'
import { AccountMenu } from './account-menu'
import { useViewer } from './viewer-context'

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
  'Alcohol & Spirits',
  'Apparel',
  'Beauty',
  'Beverage',
  'Bicycle',
  'Coffee',
  'Cookware',
  'Electronics',
  'Everyday Carry',
  'Eyewear',
  'Fitness',
  'Flower',
  'Food',
  'Footwear',
  'Fragrance',
  'Furniture',
  'Hair Care',
  'Health & Wellness',
  'Hemp & Cannabis',
  'Home',
  'Jewelry',
  'Kids & Baby',
  'Lifestyle',
  'Luggage',
  'Oral Care',
  'Personal Care',
  'Pet',
  'Sexual Wellness',
  'Supplements',
  'Swimwear',
  'Vape & Nicotine',
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

function AtlasIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.8 8h10.4M8 2.5c1.7 1.5 2.6 3.3 2.6 5.5S9.7 12 8 13.5C6.3 12 5.4 10.2 5.4 8S6.3 4 8 2.5Z" stroke="currentColor" strokeWidth="1.1" />
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
  initialTotal: number
  filterMetadata: LibraryFilterMetadata
  mode?: 'home' | 'library'
  loading?: boolean
}

export function IndizioHome({ initialSites, initialTotal, filterMetadata, mode = 'home', loading = false }: Props) {
  const isLibraryPage = mode === 'library'
  const initialVisible = isLibraryPage ? 12 : 9
  const skeletonCards = isLibraryPage ? LIBRARY_SKELETON_CARDS : HOME_SKELETON_CARDS
  const router = useRouter()
  const viewer = useViewer()
  const [isPending, startTransition] = useTransition()
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup')
  const [authMessage, setAuthMessage] = useState('')
  const [activeBookmarkID, setActiveBookmarkID] = useState<string | null>(null)
  const [bookmarkMessage, setBookmarkMessage] = useState('')
  const [bookmarkToast, setBookmarkToast] = useState<BookmarkToast>(null)
  const [bookmarkToastExiting, setBookmarkToastExiting] = useState(false)
  const [bookmarks, setBookmarks] = useState<SavedBookmarkSummary[]>([])
  const [saveCounts, setSaveCounts] = useState(() => new Map(initialSites.filter((site) => site.id).map((site) => [site.id!, site.saveCount || 0])))
  const [collections, setCollections] = useState<BookmarkCollectionSummary[]>([])
  const [sites, setSites] = useState(initialSites)
  const [resultsTotal, setResultsTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [fetchingSites, setFetchingSites] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(isLibraryPage)
  const [savedPanelOpen, setSavedPanelOpen] = useState(false)
  const [showAllIndustries, setShowAllIndustries] = useState(false)
  const [showAllTags, setShowAllTags] = useState(false)
  const [filterView, setFilterView] = useState<'industries' | 'tags'>('industries')
  const [industries, setIndustries] = useState<Set<string>>(new Set())
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [menuOpen, setMenuOpen] = useState(false)
  const [newsletterMessage, setNewsletterMessage] = useState('No noise. Unsubscribe whenever you like.')
  const [googleNewsletterConsent, setGoogleNewsletterConsent] = useState(true)
  const [pendingBookmark, setPendingBookmark] = useState<Site | null>(null)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [savedOnly, setSavedOnly] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [sort, setSort] = useState<SortMode>('featured')
  const [gridColumns, setGridColumns] = useState<GridColumns>(3)
  const [activeJourney, setActiveJourney] = useState('library')
  const authDialogRef = useRef<HTMLDialogElement>(null)
  const bookmarkDialogRef = useRef<HTMLDialogElement>(null)
  const infiniteScrollRef = useRef<HTMLDivElement>(null)
  const siteDialogRef = useRef<HTMLDialogElement>(null)
  const toastDismissTimeoutRef = useRef<number | null>(null)
  const catalogMountedRef = useRef(false)

  useEffect(() => {
    if (isLibraryPage) return
    const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-journey]'))
    if (!panels.length) return
    const observer = new IntersectionObserver((entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visibleEntry) setActiveJourney((visibleEntry.target as HTMLElement).dataset.journey || 'library')
    }, { rootMargin: '-18% 0px -52% 0px', threshold: [0.15, 0.35, 0.6] })
    panels.forEach((panel) => observer.observe(panel))
    return () => observer.disconnect()
  }, [isLibraryPage])

  const member = viewer.member
  const authenticated = Boolean(member)
  const savedWebsiteIDs = useMemo(
    () => new Set(bookmarks.map((bookmark) => bookmark.websiteID)),
    [bookmarks],
  )
  const selectedCollectionWebsiteIDs = useMemo(
    () => new Set(bookmarks.filter((bookmark) => !selectedCollection || bookmark.collectionID === selectedCollection).map((bookmark) => bookmark.websiteID)),
    [bookmarks, selectedCollection],
  )

  const industryOptions = useMemo(
    () => [...new Set([...INDUSTRIES, ...filterMetadata.industryOptions])].sort(),
    [filterMetadata.industryOptions],
  )
  const tagOptions = useMemo(() => [...new Set(
    [...industries].flatMap((industry) => filterMetadata.tagOptionsByIndustry[industry] || []),
  )].sort(), [filterMetadata.tagOptionsByIndustry, industries])
  const validTagSet = useMemo(() => new Set(tagOptions), [tagOptions])
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const industry of industries) {
      for (const [tag, count] of Object.entries(filterMetadata.tagCountsByIndustry[industry] || {})) {
        counts.set(tag, (counts.get(tag) || 0) + count)
      }
    }
    return counts
  }, [filterMetadata.tagCountsByIndustry, industries])
  const activeFilterCount = industries.size + selectedTags.size + (savedOnly ? 1 : 0)

  useEffect(() => {
    if (industries.size === 0 && filterView === 'tags') setFilterView('industries')
    setSelectedTags((current) => {
      const next = new Set([...current].filter((tag) => validTagSet.has(tag)))
      return next.size === current.size ? current : next
    })
  }, [filterView, industries.size, validTagSet])

  const filteredSites = sites

  useEffect(() => {
    if (!member) {
      setBookmarks([])
      setCollections([])
      return
    }
    const controller = new AbortController()
    void fetch('/api/bookmark-state', { cache: 'no-store', signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((state: { bookmarks: SavedBookmarkSummary[]; collections: BookmarkCollectionSummary[] }) => {
        setBookmarks(state.bookmarks)
        setCollections(state.collections)
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [member])

  const savedFilterIDs = savedOnly ? [...selectedCollectionWebsiteIDs].sort().join(',') : ''
  useEffect(() => {
    if (loading) return
    if (!catalogMountedRef.current) {
      catalogMountedRef.current = true
      return
    }
    if (savedOnly && !savedFilterIDs) {
      setSites([])
      setResultsTotal(0)
      setPage(1)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(initialVisible),
        sort,
      })
      if (deferredQuery.trim()) params.set('query', deferredQuery.trim())
      if (industries.size) params.set('industries', [...industries].join(','))
      if (selectedTags.size) params.set('tags', [...selectedTags].join(','))
      if (savedFilterIDs) params.set('websiteIDs', savedFilterIDs)

      setFetchingSites(true)
      void fetch(`/api/library?${params}`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() : Promise.reject())
        .then((result: { sites: Site[]; total: number }) => {
          setSites((current) => page === 1 ? result.sites : [...current, ...result.sites])
          setResultsTotal(result.total)
          setSaveCounts((current) => {
            const next = new Map(current)
            for (const site of result.sites) if (site.id) next.set(site.id, site.saveCount || 0)
            return next
          })
        })
        .catch(() => undefined)
        .finally(() => setFetchingSites(false))
    }, page === 1 ? 180 : 0)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [deferredQuery, industries, initialVisible, loading, page, savedFilterIDs, savedOnly, selectedTags, sort])

  const showBookmarkToast = (toast: Exclude<BookmarkToast, null>) => {
    if (toastDismissTimeoutRef.current) window.clearTimeout(toastDismissTimeoutRef.current)
    setBookmarkToastExiting(false)
    setBookmarkToast(toast)
  }

  const dismissBookmarkToast = () => {
    if (toastDismissTimeoutRef.current) window.clearTimeout(toastDismissTimeoutRef.current)
    setBookmarkToastExiting(true)
    toastDismissTimeoutRef.current = window.setTimeout(() => {
      setBookmarkToast(null)
      setBookmarkToastExiting(false)
      toastDismissTimeoutRef.current = null
    }, 220)
  }

  useEffect(() => {
    if (!bookmarkToast) return
    const isBookmarkStillSaving = bookmarkToast.saved && bookmarkToast.websiteID && !bookmarkToast.bookmarkID
    if (isBookmarkStillSaving) return
    const timeout = window.setTimeout(() => {
      setBookmarkToastExiting(true)
      toastDismissTimeoutRef.current = window.setTimeout(() => {
        setBookmarkToast(null)
        setBookmarkToastExiting(false)
        toastDismissTimeoutRef.current = null
      }, 220)
    }, 6500)
    return () => window.clearTimeout(timeout)
  }, [bookmarkToast])

  useEffect(() => () => {
    if (toastDismissTimeoutRef.current) window.clearTimeout(toastDismissTimeoutRef.current)
  }, [])

  useEffect(() => {
    if (!isLibraryPage || fetchingSites || filteredSites.length >= resultsTotal) return
    const target = infiniteScrollRef.current
    if (!target) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setPage((current) => current + 1)
    }, { rootMargin: '500px 0px' })

    observer.observe(target)
    return () => observer.disconnect()
  }, [fetchingSites, filteredSites.length, isLibraryPage, resultsTotal])

  const resetFilters = () => {
    setQuery('')
    setIndustries(new Set())
    setSelectedTags(new Set())
    setSavedOnly(false)
    setSelectedCollection(null)
    setPage(1)
  }

  const toggleIndustry = (industry: string) => {
    setIndustries((current) => {
      const next = new Set(current)
      if (next.has(industry)) next.delete(industry)
      else next.add(industry)
      return next
    })
    setFilterView('tags')
    setShowAllTags(false)
    setSavedOnly(false)
    setPage(1)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((current) => {
      const next = new Set(current)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
    setSavedOnly(false)
    setPage(1)
  }

  const removeIndustry = (industry: string) => {
    setIndustries((current) => {
      const next = new Set(current)
      next.delete(industry)
      return next
    })
    setShowAllTags(false)
    setPage(1)
  }

  const removeTag = (tag: string) => {
    setSelectedTags((current) => {
      const next = new Set(current)
      next.delete(tag)
      return next
    })
    setPage(1)
  }

  const openAuth = (site: Site | null = null) => {
    setPendingBookmark(site)
    setAuthMessage('')
    setAuthMode('signup')
    authDialogRef.current?.showModal()
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') !== 'signin') return
    const timer = window.setTimeout(() => {
      setAuthMode('signin')
      setAuthMessage(params.get('reset') === 'success' ? 'Password updated. Sign in with your new password.' : '')
      authDialogRef.current?.showModal()
      window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const openCollectionChanger = (bookmarkID: string, websiteID: string) => {
    setActiveBookmarkID(bookmarkID)
    setPendingBookmark(sites.find((site) => site.id === websiteID) || null)
    setBookmarkMessage('')
    bookmarkDialogRef.current?.showModal()
  }

  const openBookmark = (site: Site) => {
    if (!authenticated) {
      openAuth(site)
      return
    }
    if (!site.id) {
      showBookmarkToast({ message: 'This preview website is not ready to be saved.' })
      return
    }

    const existing = bookmarks.filter((bookmark) => bookmark.websiteID === site.id)
    if (existing.length) {
      setBookmarks((current) => current.filter((bookmark) => bookmark.websiteID !== site.id))
      setSaveCounts((current) => new Map(current).set(site.id!, Math.max(0, (current.get(site.id!) || 0) - existing.length)))
      showBookmarkToast({
        message: 'Removed from your saves.',
        saved: false,
        websiteID: site.id,
      })

      const data = new FormData()
      data.set('website', site.id)
      startTransition(async () => {
        const result = await removeBookmark(data)
        if (result.ok) {
          window.dispatchEvent(new Event('indizio:viewer-changed'))
        } else {
          setBookmarks((current) => [...existing, ...current])
          setSaveCounts((current) => new Map(current).set(site.id!, (current.get(site.id!) || 0) + existing.length))
          showBookmarkToast({
            bookmarkID: existing[0].id,
            collectionID: existing[0].collectionID,
            message: result.message,
            saved: true,
            websiteID: site.id,
          })
        }
      })
      return
    }

    const optimisticID = `optimistic-${site.id}-${Date.now()}`
    setBookmarks((current) => [{
      id: optimisticID,
      websiteID: site.id!,
      collectionID: null,
    }, ...current])
    setSaveCounts((current) => new Map(current).set(site.id!, (current.get(site.id!) || 0) + 1))
    showBookmarkToast({
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
        window.dispatchEvent(new Event('indizio:viewer-changed'))
        setBookmarks((current) => current.map((bookmark) => bookmark.id === optimisticID ? {
          id: result.bookmarkID!,
          websiteID: site.id!,
          collectionID: result.collectionID || null,
        } : bookmark))
        if (typeof result.saveCount === 'number') setSaveCounts((current) => new Map(current).set(site.id!, result.saveCount!))
      } else {
        setBookmarks((current) => current.filter((bookmark) => bookmark.id !== optimisticID))
        setSaveCounts((current) => new Map(current).set(site.id!, Math.max(0, (current.get(site.id!) || 0) - 1)))
      }
      showBookmarkToast({
        bookmarkID: result.bookmarkID,
        collectionID: result.collectionID,
        message: result.message,
        saved: result.ok,
        websiteID: site.id,
      })
    })
  }

  const handleAccount = () => {
    openAuth()
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
        window.dispatchEvent(new Event('indizio:viewer-changed'))
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
            if (typeof bookmarkResult.saveCount === 'number') setSaveCounts((current) => new Map(current).set(pendingBookmark.id!, bookmarkResult.saveCount!))
          }
          showBookmarkToast({
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
    const data = new FormData(event.currentTarget)
    const bookmarkID = String(data.get('bookmark') || '')
    const nextCollectionID = String(data.get('collection') || '') || null
    const previousBookmark = bookmarks.find((bookmark) => bookmark.id === bookmarkID)
    const websiteID = pendingBookmark?.id
    const nextCollectionName = collections.find((collection) => collection.id === nextCollectionID)?.name || 'All Bookmarks'

    bookmarkDialogRef.current?.close()
    showBookmarkToast({
      bookmarkID,
      collectionID: nextCollectionID,
      message: `Adding to ${nextCollectionName}…`,
      saved: true,
      websiteID,
    })
    setActiveBookmarkID(null)
    setPendingBookmark(null)

    startTransition(async () => {
      const result = await moveBookmark(data)
      setBookmarkMessage(result.message)
      if (result.ok && result.bookmarkID) {
        window.dispatchEvent(new Event('indizio:viewer-changed'))
        setBookmarks((current) => current.some((bookmark) => bookmark.id === result.bookmarkID)
          ? current
          : [{ id: result.bookmarkID!, websiteID: websiteID || '', collectionID: result.collectionID || null }, ...current])
        if (websiteID && typeof result.saveCount === 'number') setSaveCounts((current) => new Map(current).set(websiteID, result.saveCount!))
        showBookmarkToast({
          bookmarkID: result.bookmarkID,
          collectionID: result.collectionID,
          message: result.message,
          saved: true,
          websiteID,
        })
      } else if (previousBookmark) {
        setBookmarks((current) => current.map((bookmark) => bookmark.id === previousBookmark.id
          ? previousBookmark
          : bookmark))
        showBookmarkToast({
          bookmarkID: previousBookmark.id,
          collectionID: previousBookmark.collectionID,
          message: result.message,
          saved: true,
          websiteID,
        })
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
        <Link className="wordmark" href="/" aria-label="INDIZIO home"><BrandMark className="wordmark__mark" />INDIZIO</Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          <Link href="/library" aria-current={isLibraryPage ? 'page' : undefined}>Website library</Link>
          <Link href="/fieldnotes">CRO fieldnotes</Link>
          <Link href="/atlas">Brand Atlas</Link>
          <Link href="/extension">Extension</Link>
        </nav>
        <div className="header-actions">
          {authenticated && (
            <div className="account-controls">
              <Link className="bookmark-collection" href="/bookmarks" aria-label={`View ${savedWebsiteIDs.size} saved websites`}>
                <BookmarkIcon /> <span>{savedWebsiteIDs.size}</span>
              </Link>
            </div>
          )}
          {viewer.loading ? <span className="header-account-placeholder" aria-hidden="true" /> : authenticated && member ? <AccountMenu member={member} /> : <button className="line-button header-cta" type="button" onClick={handleAccount}><span>Login / Register</span><span className="line-button__icon" aria-hidden="true">→</span></button>}
        </div>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((open) => !open)}>Menu</button>
      </header>

      <nav className="mobile-menu" id="mobile-menu" aria-label="Mobile navigation" hidden={!menuOpen} onClick={() => setMenuOpen(false)}>
        <Link href="/library">Website library</Link><Link href="/fieldnotes">CRO fieldnotes</Link><Link href="/atlas">Brand Atlas</Link><Link href="/extension">Extension</Link>
        {authenticated && <><Link href="/bookmarks">Bookmarks ({savedWebsiteIDs.size})</Link><Link href="/account">Manage account</Link></>}
        {!authenticated && <button className="mobile-account-button" type="button" onClick={handleAccount}>Log in</button>}
      </nav>

      <main id="top">
        {!isLibraryPage && <section className="hero ruled-section">
          <div className="hero__headline">
            <p className="eyebrow"><span className="signal-dot" />Ecommerce intelligence for growing brands</p>
            <h1>See what leading brands<br />are doing differently.</h1>
            <div className="hero__aside-copy">
              <p className="hero__intro">Indizio studies storefronts, customer journeys, and conversion patterns to help ambitious brands decide what to build, change, and test next.</p>
              <Link className="line-button line-button--dark hero__cta" href="/library">
                <span>Find brands like yours</span><span className="line-button__icon" aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
          <div className="hero-paths hero-paths--hero" aria-label="Choose your path through INDIZIO">
            <Link className="hero-path" href="/library"><span className="hero-path__meta">01 / Discover</span><span className="hero-path__copy"><strong>Website library</strong><span>Find brands solving the same growth, merchandising, and conversion problems as you.</span></span><span className="hero-path__cta">Explore the library <i aria-hidden="true">↗</i></span></Link>
            <Link className="hero-path" href="/fieldnotes"><span className="hero-path__meta">02 / Understand</span><span className="hero-path__copy"><strong>CRO fieldnotes</strong><span>Understand how leading brands communicate value, reduce hesitation, and move customers toward conversion.</span></span><span className="hero-path__cta">Read the research <i aria-hidden="true">↗</i></span></Link>
            <Link className="hero-path hero-path--atlas" href="/atlas"><span className="hero-path__meta">03 / Investigate</span><span className="hero-path__copy"><strong>Brand Atlas</strong><span>Go beyond the homepage to uncover the public pages that reveal how a brand actually operates.</span></span><span className="hero-path__cta">Map a brand <i aria-hidden="true">↗</i></span></Link>
          </div>
        </section>}

        <section className={`library ruled-section ${isLibraryPage ? 'library--page' : 'library--home'}`} id="library" aria-busy={loading || fetchingSites}>
          {isLibraryPage && <div className="section-heading">
            <div><p className="eyebrow">The complete index / 001</p><h2>Find the brands worth studying.</h2></div>
            <p>Explore a growing research library of ecommerce brands organized to help you find relevant comparisons—not random inspiration.</p>
          </div>}
          {!isLibraryPage && <div className="section-heading section-heading--home">
            <div><p className="eyebrow">The website library</p><h2>Find the brands worth studying.</h2></div>
            <p>Explore storefronts by industry and observed strategy, then investigate the decisions most relevant to your own brand.</p>
          </div>}

          <div className="library-tools">
            <label className="search-field">
              <span className="visually-hidden">Search websites</span><span aria-hidden="true">⌕</span>
              <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search by brand, industry, or observation" autoComplete="off" disabled={loading} />
            </label>
            <button className="filter-trigger" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
              Filters <span>{activeFilterCount}</span><span aria-hidden="true">{filtersOpen ? '−' : '＋'}</span>
            </button>
            {isLibraryPage && authenticated && collections.length > 0 && <button className="filter-trigger filter-trigger--saved" type="button" aria-expanded={savedPanelOpen} onClick={() => setSavedPanelOpen((open) => !open)}>
              Saved <span>{savedOnly ? 1 : 0}</span><span aria-hidden="true">{savedPanelOpen ? '−' : '＋'}</span>
            </button>}
          </div>

          {isLibraryPage && authenticated && collections.length > 0 && <div className="filter-panel" hidden={!savedPanelOpen}>
            <div><p className="filter-label">Saved collections</p><div className="filter-options">
              <button className={`filter-chip${savedOnly && !selectedCollection ? ' active' : ''}`} type="button" onClick={() => { setSavedOnly(true); setSelectedCollection(null); setIndustries(new Set()); setSelectedTags(new Set()); setPage(1) }}>All saved</button>
              {collections.map((collection) => (
                <button className={`filter-chip${selectedCollection === collection.id ? ' active' : ''}`} type="button" key={collection.id} onClick={() => { setSavedOnly(true); setSelectedCollection(collection.id); setIndustries(new Set()); setSelectedTags(new Set()); setPage(1) }}>{collection.name} · {collection.count}</button>
              ))}
            </div></div>
            <button className="text-button" type="button" onClick={resetFilters}>Clear all</button>
          </div>}

          <div className={`library-body library-body--with-filters${filtersOpen ? ' library-body--filters-visible' : ''}`}>
          <div className="library-results"><div className="results-meta">
            <p>{loading ? <span className="skeleton-block skeleton-results-count" aria-label="Loading website count" /> : <>{resultsTotal} {savedOnly ? 'saved websites' : 'discoveries'}</>}</p>
            <div className="results-controls">
              <label className="view-select">View
                <select value={gridColumns} onChange={(event) => setGridColumns(Number(event.target.value) as GridColumns)} aria-label="Cards per row" disabled={loading}>
                  <option value={2}>2 columns</option>
                  <option value={3}>3 columns</option>
                  <option value={4}>4 columns</option>
                </select>
              </label>
              <label>Sort <select value={sort} onChange={(event) => { setSort(event.target.value as SortMode); setPage(1) }} disabled={loading}><option value="featured">Featured</option><option value="newest">Newest</option><option value="az">A–Z</option></select></label>
            </div>
          </div>

          {activeFilterCount > 0 && <div className="active-filters" aria-label="Active filters">
            <span className="active-filters__label">Filtering by</span>
            {[...industries].map((industry) => <button type="button" key={industry} onClick={() => removeIndustry(industry)}>{industry}<span aria-hidden="true">×</span></button>)}
            {[...selectedTags].map((tag) => <button type="button" key={tag} onClick={() => removeTag(tag)}>{tag}<span aria-hidden="true">×</span></button>)}
            {savedOnly && <button type="button" onClick={() => { setSavedOnly(false); setSelectedCollection(null); setPage(1) }}>{selectedCollection ? collections.find((collection) => collection.id === selectedCollection)?.name : 'All saved'}<span aria-hidden="true">×</span></button>}
            <button className="active-filters__clear" type="button" onClick={resetFilters}>Clear all</button>
          </div>}

          <div className="card-grid" data-columns={gridColumns} aria-live="polite">
            {loading ? skeletonCards.map((item) => (
              <article className="skeleton-card" key={item} aria-hidden="true">
                <span className="skeleton-block skeleton-card__visual" />
                <span className="skeleton-block skeleton-card__title" />
                <span className="skeleton-block skeleton-card__detail" />
              </article>
            )) : filteredSites.map((site) => {
              const bookmarked = Boolean(authenticated && site.id && savedWebsiteIDs.has(site.id))
              const saveCount = saveCounts.get(site.id || '') || 0
              return (
                <article className="site-card" key={site.name}>
                  <div className="card-visual">
                    <button className="card-open" type="button" onClick={() => { setSelectedSite(site); siteDialogRef.current?.showModal() }} aria-label={`Open ${site.name} fieldnote`}>
                      {site.coverImage && <Image className="card-cover" src={site.coverImage} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, (max-width: 1440px) 33vw, 420px" quality={70} unoptimized={!site.coverImage.includes('cdn.sanity.io') && !site.coverImage.includes('public.blob.vercel-storage.com') && !site.coverImage.includes('indizio.space/api/media/file/')} />}
                      {!site.coverImage && <span className="card-mark">{site.name}</span>}
                    </button>
                  </div>
                  <div className="card-meta">
                    <div className="card-title-row"><h3>{site.slug ? <Link href={`/brands/${site.slug}`}>{site.name}</Link> : site.name}</h3><div className="card-actions">
                      <Link className="card-action" href={`/atlas?url=${encodeURIComponent(site.url)}`} aria-label={`Map ${site.name} in Brand Atlas`} title="Map in Brand Atlas"><AtlasIcon /></Link>
                      <a className="card-action" href={site.url} target="_blank" rel="noreferrer" aria-label={`Visit ${site.name} website`} title="Visit website"><ExternalIcon /></a>
                      <button className="card-action card-save-action" type="button" onClick={() => openBookmark(site)} aria-label={`${bookmarked ? 'Remove saved research for' : authenticated ? 'Save' : 'Sign up to save'} ${site.name}`} aria-pressed={bookmarked} title={bookmarked ? 'Remove save' : authenticated ? 'Save website' : 'Sign up to save'}><BookmarkIcon filled={bookmarked} />{saveCount >= 5 && <span>{saveCount}</span>}</button>
                    </div></div>
                    <div className="card-taxonomy"><button className="card-industry" type="button" onClick={() => { setIndustries(new Set([site.industry])); setSelectedTags(new Set()); setFilterView('tags'); setFiltersOpen(true); setPage(1) }}>{site.industry}</button>{site.tags?.slice(0, 3).map((tag) => <button className="card-tag" type="button" onClick={() => { setIndustries(new Set([site.industry])); setSelectedTags(new Set([tag])); setFilterView('tags'); setFiltersOpen(true); setPage(1) }} key={tag}>{tag}</button>)}{(site.tags?.length || 0) > 3 && <span className="card-tag card-tag--more">+{site.tags!.length - 3}</span>}</div>
                  </div>
                </article>
              )
            })}
          </div>

          {!loading && filteredSites.length === 0 && <div className="empty-state"><p>No signals found.</p><button className="text-button" type="button" onClick={resetFilters}>Reset the library</button></div>}
          {!loading && !isLibraryPage && filteredSites.length < resultsTotal && <div className="load-more-wrap"><button className="line-button" type="button" disabled={fetchingSites} onClick={() => setPage((current) => current + 1)}><span>{fetchingSites ? 'Loading websites' : 'Load more websites'}</span><span className="line-button__icon" aria-hidden="true">＋</span></button></div>}
          {!loading && isLibraryPage && filteredSites.length < resultsTotal && <div className="infinite-scroll-status" ref={infiniteScrollRef} role="status">
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
          {!loading && isLibraryPage && filteredSites.length > 0 && filteredSites.length >= resultsTotal && <p className="library-end">You have reached the end of the current index.</p>}
          </div>
          {filtersOpen && <aside className="filter-sidebar" aria-label="Filter websites">
            <div className="filter-sidebar__title"><div><p className="eyebrow">Refine the index</p><strong>Filters</strong></div><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">×</button></div>
            <div className="filter-view-tabs" role="tablist" aria-label="Filter steps">
              <button className={filterView === 'industries' ? 'active' : ''} type="button" role="tab" aria-selected={filterView === 'industries'} onClick={() => setFilterView('industries')}>01 Industry <span>{industries.size || ''}</span></button>
              <button className={filterView === 'tags' ? 'active' : ''} type="button" role="tab" aria-selected={filterView === 'tags'} aria-disabled={industries.size === 0} onClick={() => industries.size > 0 && setFilterView('tags')}>02 Product tags <span>{selectedTags.size || ''}</span></button>
            </div>
            {filterView === 'industries' ? <><div className="filter-sidebar__head"><p className="filter-label">Choose an industry</p>{industries.size > 0 && <button className="text-button" type="button" onClick={() => { setIndustries(new Set()); setSelectedTags(new Set()); setPage(1) }}>Clear</button>}</div>
            <div className="filter-sidebar__options">
              {industryOptions.slice(0, showAllIndustries ? undefined : 8).map((industry) => <label className="sidebar-filter" key={industry}>
                <input type="checkbox" checked={industries.has(industry)} onChange={() => toggleIndustry(industry)} disabled={loading} />
                <span>{industry}</span><small>{filterMetadata.industryCounts[industry] || 0}</small>
              </label>)}
            </div>
            {industryOptions.length > 8 && <button className="filter-show-more" type="button" onClick={() => setShowAllIndustries((value) => !value)}>{showAllIndustries ? 'Show fewer' : `Show all ${industryOptions.length}`}</button>}</> : <><div className="filter-sidebar__head"><p className="filter-label">Tags for {[...industries].join(', ')}</p>{selectedTags.size > 0 && <button className="text-button" type="button" onClick={() => { setSelectedTags(new Set()); setPage(1) }}>Clear</button>}</div>
            {tagOptions.length > 0 ? <>
              <div className="filter-sidebar__options">
                {tagOptions.slice(0, showAllTags ? undefined : 8).map((tag) => <label className="sidebar-filter" key={tag}>
                  <input type="checkbox" checked={selectedTags.has(tag)} onChange={() => toggleTag(tag)} disabled={loading} />
                  <span>{tag}</span><small>{tagCounts.get(tag) || 0}</small>
                </label>)}
              </div>
              {tagOptions.length > 8 && <button className="filter-show-more" type="button" onClick={() => setShowAllTags((value) => !value)}>{showAllTags ? 'Show fewer' : `Show all ${tagOptions.length}`}</button>}
            </> : <p className="filter-dependent-note">No product tags are assigned to this industry yet.</p>}</>}
          </aside>}
          </div>
        </section>

        {!isLibraryPage && <><section className="journey-showcase ruled-section" id="industries" aria-labelledby="journey-heading">
          <header className="journey-showcase__heading"><p className="eyebrow">How INDIZIO works</p><h2 id="journey-heading">From market signal<br />to better decision.</h2></header>
          <div className="journey-showcase__layout">
            <nav className="journey-showcase__nav" aria-label="INDIZIO journeys">
              <a className={activeJourney === 'library' ? 'active' : ''} href="#journey-library" aria-current={activeJourney === 'library' ? 'step' : undefined}><span>01</span>Discover websites</a>
              <a className={activeJourney === 'fieldnotes' ? 'active' : ''} href="#journey-fieldnotes" aria-current={activeJourney === 'fieldnotes' ? 'step' : undefined}><span>02</span>Study the evidence</a>
              <a className={activeJourney === 'atlas' ? 'active' : ''} href="#journey-atlas" aria-current={activeJourney === 'atlas' ? 'step' : undefined}><span>03</span>Map every page</a>
            </nav>
            <div className="journey-showcase__panels">
              <article className="journey-panel" id="journey-library" data-journey="library">
                <div className="journey-panel__copy"><p className="eyebrow">01 / Website library</p><h3>Find brands relevant to yours.</h3><p>Start with carefully classified ecommerce brands and narrow the market by industry, product category, and observed strategy.</p><Link className="text-button" href="/library">Explore the library ↗</Link></div>
                <div className="journey-visual journey-visual--library" aria-hidden="true"><div className="journey-search">Search the index <span>⌕</span></div><div className="journey-card-row"><span>Apparel</span><span>Beauty</span><span>Wellness</span></div><div className="journey-card-row journey-card-row--images"><i /><i /><i /></div></div>
              </article>
              <article className="journey-panel" id="journey-fieldnotes" data-journey="fieldnotes">
                <div className="journey-panel__copy"><p className="eyebrow">02 / CRO fieldnotes</p><h3>Understand what the evidence means.</h3><p>Use original storefront research to see how leading brands communicate value, reduce hesitation, and shape the path to purchase.</p><Link className="text-button" href="/fieldnotes">Read the research ↗</Link></div>
                <div className="journey-visual journey-visual--notes" aria-hidden="true"><span className="journey-note-tag">Fieldnote / Conversion</span><strong>The clues behind a higher-converting product page.</strong><p>Evidence, annotations, and patterns recorded from the storefront.</p><div><span>Trust</span><span>Merchandising</span><span>UX</span></div></div>
              </article>
              <article className="journey-panel" id="journey-atlas" data-journey="atlas">
                <div className="journey-panel__copy"><p className="eyebrow">03 / Brand Atlas</p><h3>Investigate beyond the homepage.</h3><p>Enter a domain and uncover its public products, collections, articles, policies, and landing pages in one reusable index.</p><Link className="text-button" href="/atlas">Open Brand Atlas ↗</Link></div>
                <div className="journey-visual journey-visual--atlas" aria-hidden="true"><div className="atlas-node atlas-node--root">Brand.com</div><span className="atlas-line" /><div className="atlas-node-grid"><span>Products</span><span>Collections</span><span>Journal</span><span>Policies</span></div></div>
              </article>
            </div>
          </div>
        </section>

        <section className="dark-context ruled-section" id="context" aria-labelledby="dark-context-heading">
          <div className="dark-context__copy">
            <p className="eyebrow">Commerce intelligence from the open web</p>
            <h2 id="dark-context-heading">See what is changing.<br />Decide what to do next.</h2>
            <p>INDIZIO connects relevant brands, original CRO research, complete page indexes, and private research collections—so evidence becomes action.</p>
          </div>
        </section>

        <section className="stat-strip stat-strip--dark" aria-label="Library statistics">
          <div><strong>001</strong><span>Edition</span></div><div><strong>{loading ? <span className="skeleton-block skeleton-stat-value" aria-label="Loading website total" /> : String(initialTotal).padStart(2, '0')}</strong><span>Websites indexed</span></div><div><strong>{String(INDUSTRIES.length).padStart(2, '0')}</strong><span>Industries</span></div><div><strong>Weekly</strong><span>Research cadence</span></div>
        </section>

        <section className="extension-section ruled-section" aria-labelledby="extension-heading">
          <div className="extension-section__copy">
            <p className="eyebrow">Indizio for Chrome / Development release</p>
            <h2 id="extension-heading">Build a private research system<br />for your brand.</h2>
            <p>Capture any useful page without breaking your flow. Add an observation, organize it by project or conversion opportunity, and keep private discoveries beside the public Indizio library.</p>
            <ul className="extension-section__features"><li>Save the exact page, not only the domain</li><li>Organize discoveries into research collections</li><li>Open your complete Indizio library from any tab</li></ul>
            <div className="extension-section__actions"><Link className="line-button line-button--dark" href="/extension"><span>Explore the extension</span><span className="line-button__icon" aria-hidden="true">↗</span></Link></div>
          </div>
          <div className="extension-preview" aria-label="Preview of the Indizio Chrome extension">
            <div className="extension-preview__bar"><span /><span>indizio.space</span><span>•••</span></div>
            <div className="extension-preview__body">
              <div className="extension-preview__brand"><span>INDIZIO</span><span>●</span></div>
              <p className="eyebrow">Save to your research</p>
              <strong>Remarkable storefront found.</strong>
              <div className="extension-preview__site"><span>Current website</span><span>↗</span></div>
              <label>Collection</label>
              <div className="extension-preview__select"><span>Website inspiration</span><span>⌄</span></div>
              <div className="extension-preview__button"><span>Save to Indizio</span><span>+</span></div>
            </div>
            <div className="extension-preview__note"><span>01</span><p>One click from discovery to an organized research library.</p></div>
          </div>
        </section>

        <section className="index-report ruled-section" id="index-report"><div className="report-art" aria-hidden="true"><span className="report-art__index">INDEX<br />2026</span><span className="crosshair crosshair--one" /><span className="crosshair crosshair--two" /></div><div className="report-copy"><p className="eyebrow">Coming soon / Report 001</p><h2>100 storefronts. 10 industries. One view of ecommerce now.</h2><p>The first Indizio Ecommerce Index will study the most instructive storefronts across ten industries—revealing the decisions, trust signals, and merchandising patterns worth paying attention to.</p><a className="line-button line-button--dark" href="#newsletter"><span>Get the report at launch</span><span className="line-button__icon" aria-hidden="true">↗</span></a></div></section>

        <section className="about ruled-section" id="about"><p className="eyebrow">About Indizio</p><p>INDIZIO means “a clue” in Italian. We organize the clues hiding across modern commerce—helping growing brands understand what leading storefronts are doing and decide what to build, change, and test next.</p></section></>}

        {isLibraryPage && <section className="index-report ruled-section" id="index-report"><div className="report-art" aria-hidden="true"><span className="report-art__index">INDEX<br />2026</span><span className="crosshair crosshair--one" /><span className="crosshair crosshair--two" /></div><div className="report-copy"><p className="eyebrow">Coming soon / Report 001</p><h2>100 storefronts. 10 industries. One view of ecommerce now.</h2><p>The first Indizio Ecommerce Index will study the most instructive storefronts across ten industries—revealing the decisions, trust signals, and merchandising patterns worth paying attention to.</p><a className="line-button line-button--dark" href="#newsletter"><span>Get the report at launch</span><span className="line-button__icon" aria-hidden="true">↗</span></a></div></section>}

        {!isLibraryPage && <section className="newsletter ruled-section" id="newsletter"><div><p className="eyebrow">Indizio Weekly</p><h2>Seven signals.<br />One useful briefing.</h2></div><div className="newsletter__form-wrap"><p>The storefront decisions, emerging patterns, and practical experiments worth paying attention to—selected for people growing ecommerce brands.</p><form className="newsletter-form" onSubmit={handleNewsletter}><label className="visually-hidden" htmlFor="email">Email address</label><input id="email" name="email" type="email" placeholder="Email address" required /><button type="submit" aria-label="Subscribe" disabled={isPending}><span>{isPending ? 'Joining…' : 'Join Indizio Weekly'}</span><i aria-hidden="true">↗</i></button></form><p className="form-message" aria-live="polite">{newsletterMessage}</p></div></section>}
      </main>

      <footer className="site-footer">
        {isLibraryPage && <section className="footer-newsletter" id="newsletter"><div><p className="footer-label">Indizio Weekly</p><p className="footer-newsletter__headline">Seven signals. One useful briefing.</p></div><div className="footer-newsletter__signup"><form className="newsletter-form" onSubmit={handleNewsletter}><label className="visually-hidden" htmlFor="footer-email">Email address</label><input id="footer-email" name="email" type="email" placeholder="Email address" required /><button type="submit" aria-label="Subscribe" disabled={isPending}><span>{isPending ? 'Joining…' : 'Join Indizio Weekly'}</span><i aria-hidden="true">↗</i></button></form><p className="form-message" aria-live="polite">{newsletterMessage}</p></div></section>}
        <nav className="footer-index-links" aria-label="Popular ecommerce industries"><span>Browse by industry</span><Link href="/industries/apparel">Apparel</Link><Link href="/industries/beauty">Beauty</Link><Link href="/industries/coffee">Coffee</Link><Link href="/industries/food">Food</Link><Link href="/industries/supplements">Supplements</Link><Link href="/industries/home">Home</Link></nav>
        <div className="footer-meta"><div className="footer-brand"><BrandMark className="footer-brand__mark" title="INDIZIO" /><p>Evidence from the storefront.</p></div><div><p className="footer-label">Explore</p><Link href="/library">Websites</Link><Link href="/fieldnotes">CRO fieldnotes</Link><Link href="/atlas">Brand Atlas</Link><Link href="/extension">Chrome extension</Link></div><div><p className="footer-label">Follow</p><Link href="/#newsletter">Newsletter</Link><a href="#">LinkedIn</a><a href="#">Instagram</a></div><div><p className="footer-label">Contact</p><a href="mailto:hello@indizio.space">hello@indizio.space</a><p>© 2026 INDIZIO</p></div></div>
      </footer>

      {bookmarkToast && (
        <div className={`bookmark-toast${bookmarkToastExiting ? ' bookmark-toast--exiting' : ''}`} role="status" aria-live="polite">
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
          <button className="bookmark-toast__close" type="button" aria-label="Dismiss notification" onClick={dismissBookmarkToast}>×</button>
        </div>
      )}

      <dialog className="site-dialog" ref={siteDialogRef} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
        <button className="dialog-close" type="button" aria-label="Close" onClick={() => siteDialogRef.current?.close()}>×</button>
        {selectedSite && <><div className={`dialog-visual${selectedSite.coverImage ? ' has-cover' : ''}`}>{selectedSite.coverImage ? <Image src={selectedSite.coverImage} alt={`${selectedSite.name} website cover`} fill sizes="(max-width: 760px) 100vw, 620px" quality={80} unoptimized={!selectedSite.coverImage.includes('cdn.sanity.io') && !selectedSite.coverImage.includes('public.blob.vercel-storage.com') && !selectedSite.coverImage.includes('indizio.space/api/media/file/')} /> : selectedSite.name}</div><div className="dialog-copy"><p className="eyebrow">{selectedSite.industry}</p><h2>{selectedSite.name}</h2>{selectedSite.tags?.length ? <div className="dialog-tags">{selectedSite.tags.map((tag) => <span className="card-tag" key={tag}>{tag}</span>)}</div> : null}{selectedSite.note && <p>{selectedSite.note}</p>}<a className="line-button line-button--dark" href={selectedSite.url} target="_blank" rel="noreferrer"><span>Visit storefront</span><span className="line-button__icon">↗</span></a></div></>}
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
          {authMode === 'signup' && <label className="consent-field auth-google-consent"><input type="checkbox" checked={googleNewsletterConsent} onChange={(event) => setGoogleNewsletterConsent(event.target.checked)} /><span>Also send me INDIZIO’s weekly fieldnotes. I can unsubscribe at any time.</span></label>}
          <a className="google-auth-button" href={`/api/auth/google/start?newsletter=${authMode === 'signup' && googleNewsletterConsent ? '1' : '0'}&returnTo=${isLibraryPage ? '/library' : '/'}`}><span className="google-auth-button__mark" aria-hidden="true">G</span><span>Continue with Google</span><i aria-hidden="true">→</i></a>
          <div className="auth-divider"><span>or use email</span></div>
          <form className="auth-form" onSubmit={handleAuth}>
            {authMode === 'signup' && <><label htmlFor="account-name">Name</label><input id="account-name" name="name" type="text" placeholder="Your name" autoComplete="name" required /></>}
            <label htmlFor="account-email">Email address</label><input id="account-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
            <label htmlFor="account-password">Password</label><input id="account-password" name="password" type="password" placeholder="At least 8 characters" minLength={8} autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} required />
            {authMode === 'signin' && <Link className="auth-forgot-link" href="/forgot-password">Forgot password?</Link>}
            {authMode === 'signup' && googleNewsletterConsent && <input name="newsletterConsent" type="hidden" value="on" />}
            <button className="line-button line-button--dark" type="submit" disabled={isPending}><span>{isPending ? 'Please wait…' : authMode === 'signup' ? 'Create account' : 'Sign in'}</span><span className="line-button__icon" aria-hidden="true">→</span></button>
          </form>
          <p className="auth-note" aria-live="polite">{authMessage || 'Your newsletter choice is optional and stored with your account.'}</p>
        </div>
      </dialog>

      <dialog className="auth-dialog collection-dialog" ref={bookmarkDialogRef} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
        <button className="dialog-close auth-dialog__close" type="button" aria-label="Close" onClick={() => bookmarkDialogRef.current?.close()}>×</button>
        <div className="auth-dialog__content">
          <p className="eyebrow">Organize save</p>
          <h2>Add {pendingBookmark?.name || 'this website'} to a collection.</h2>
          <p>Every collection placement counts as a save signal and remains private to you.</p>
          {activeBookmarkID && (
            <form className="auth-form collection-save-form" onSubmit={handleChangeCollection}>
              <input type="hidden" name="bookmark" value={activeBookmarkID} />
              <label htmlFor="bookmark-folder">Collection</label>
              <select id="bookmark-folder" name="collection" defaultValue="">
                <option value="" disabled>Select a collection</option>
                {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name} ({collection.count})</option>)}
              </select>
              <button className="line-button line-button--dark" type="submit" disabled={isPending || collections.length === 0}><span>{isPending ? 'Saving…' : 'Add to collection'}</span><span className="line-button__icon" aria-hidden="true">→</span></button>
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
