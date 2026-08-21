'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useRef, useState, useTransition } from 'react'

import {
  createBookmarkCollection,
  deleteBookmarkCollection,
  moveBookmark,
  removeBookmark,
  renameBookmarkCollection,
  signOut,
  subscribeNewsletter,
} from '../actions'
import type {
  BookmarkCollectionSummary,
  MemberSummary,
  SavedBookmarkSummary,
} from '../_data/load-library-data'
import type { Site } from '../_data/sites'

type Props = {
  initialSites: Site[]
  initialMember: MemberSummary | null
  initialCollections: BookmarkCollectionSummary[]
  initialBookmarks: SavedBookmarkSummary[]
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3.5 2.5h9v11l-4.5-3-4.5 3v-11Z" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

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

export function BookmarksPage({ initialSites, initialMember, initialCollections, initialBookmarks }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [bookmarks, setBookmarks] = useState(initialBookmarks)
  const [collections, setCollections] = useState(initialCollections)
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [activeBookmarkID, setActiveBookmarkID] = useState<string | null>(null)
  const [editingCollectionID, setEditingCollectionID] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [message, setMessage] = useState('All changes are saved automatically.')
  const [newsletterMessage, setNewsletterMessage] = useState('No noise. Unsubscribe whenever you like.')
  const collectionDialogRef = useRef<HTMLDialogElement>(null)

  const siteByID = useMemo(
    () => new Map(initialSites.filter((site) => site.id).map((site) => [site.id!, site])),
    [initialSites],
  )
  const bookmarkByID = useMemo(
    () => new Map(bookmarks.map((bookmark) => [bookmark.id, bookmark])),
    [bookmarks],
  )
  const collectionByID = useMemo(
    () => new Map(collections.map((collection) => [collection.id, collection])),
    [collections],
  )
  const collectionCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const bookmark of bookmarks) {
      if (bookmark.collectionID) counts.set(bookmark.collectionID, (counts.get(bookmark.collectionID) || 0) + 1)
    }
    return counts
  }, [bookmarks])
  const visibleBookmarks = useMemo(
    () => bookmarks.filter((bookmark) => !selectedCollection || bookmark.collectionID === selectedCollection),
    [bookmarks, selectedCollection],
  )
  const collectionName = (collectionID: string | null) =>
    (collectionID ? collectionByID.get(collectionID)?.name : null) || 'All Bookmarks'

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
      router.push('/')
      router.refresh()
    })
  }

  const handleNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    startTransition(async () => {
      const result = await subscribeNewsletter(new FormData(form))
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
      setMessage(result.message)
      if (result.ok && result.id) {
        setCollections((current) => [{ id: result.id!, name: String(data.get('name')), count: 0 }, ...current])
        form.reset()
      }
    })
  }

  const handleRenameCollection = (event: FormEvent<HTMLFormElement>, collectionID: string) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    data.set('collection', collectionID)
    startTransition(async () => {
      const result = await renameBookmarkCollection(data)
      setMessage(result.message)
      if (result.ok) {
        const name = String(data.get('name'))
        setCollections((current) => current.map((collection) => collection.id === collectionID ? { ...collection, name } : collection))
        setEditingCollectionID(null)
      }
    })
  }

  const handleDeleteCollection = (collectionID: string) => {
    if (!window.confirm('Delete this collection? Its websites will remain in All Bookmarks.')) return
    const data = new FormData()
    data.set('collection', collectionID)
    startTransition(async () => {
      const result = await deleteBookmarkCollection(data)
      setMessage(result.message)
      if (result.ok) {
        setCollections((current) => current.filter((collection) => collection.id !== collectionID))
        setBookmarks((current) => current.map((bookmark) => bookmark.collectionID === collectionID ? { ...bookmark, collectionID: null } : bookmark))
        if (selectedCollection === collectionID) setSelectedCollection(null)
      }
    })
  }

  const handleMoveBookmark = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const bookmarkID = String(data.get('bookmark') || '')
    const nextCollectionID = String(data.get('collection') || '') || null
    const previousBookmark = bookmarks.find((bookmark) => bookmark.id === bookmarkID)
    const nextCollectionName = collectionName(nextCollectionID)

    setBookmarks((current) => current.map((bookmark) => bookmark.id === bookmarkID
      ? { ...bookmark, collectionID: nextCollectionID }
      : bookmark))
    setMessage(`Saved to ${nextCollectionName}.`)
    collectionDialogRef.current?.close()
    setActiveBookmarkID(null)

    startTransition(async () => {
      const result = await moveBookmark(data)
      setMessage(result.message)
      if (result.ok && result.bookmarkID) {
        setBookmarks((current) => current.map((bookmark) => bookmark.id === result.bookmarkID
          ? { ...bookmark, collectionID: result.collectionID || null }
          : bookmark))
      } else if (previousBookmark) {
        setBookmarks((current) => current.map((bookmark) => bookmark.id === previousBookmark.id
          ? previousBookmark
          : bookmark))
      }
    })
  }

  const handleRemoveBookmark = (bookmark: SavedBookmarkSummary) => {
    const removed = bookmarks.filter((item) => item.websiteID === bookmark.websiteID)
    const originalIndex = bookmarks.findIndex((item) => item.id === bookmark.id)
    setBookmarks((current) => current.filter((item) => item.websiteID !== bookmark.websiteID))
    setMessage('Save removed.')

    const data = new FormData()
    data.set('website', bookmark.websiteID)
    startTransition(async () => {
      const result = await removeBookmark(data)
      setMessage(result.message)
      if (!result.ok) {
        setBookmarks((current) => {
          if (current.some((item) => item.websiteID === bookmark.websiteID)) return current
          const insertAt = Math.max(0, Math.min(originalIndex, current.length))
          return [...current.slice(0, insertAt), ...removed, ...current.slice(insertAt)]
        })
      }
    })
  }

  const openCollectionDialog = (bookmarkID: string) => {
    setActiveBookmarkID(bookmarkID)
    collectionDialogRef.current?.showModal()
  }

  return (
    <>
      <div className="announcement">
        <span>The INDIZIO Ecommerce Index 2026</span>
        <Link href="/#index-report">Preview the research <span aria-hidden="true">↗</span></Link>
      </div>

      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="INDIZIO home">INDIZIO<span className="wordmark-dot">●</span></Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          <Link href="/library">Website library</Link>
          <Link href="/fieldnotes">CRO fieldnotes</Link>
          <Link href="/atlas">Brand Atlas</Link>
        </nav>
        <div className="header-actions">
          {initialMember && <Link className="bookmark-collection" href="/bookmarks" aria-current="page" aria-label={`View ${bookmarks.length} saved websites`}><BookmarkIcon /><span>{bookmarks.length}</span></Link>}
          <button className="line-button header-cta" type="button" onClick={initialMember ? handleSignOut : () => router.push('/')} disabled={isPending}>
            <span>{initialMember ? 'Log out' : 'Login / Register'}</span><span className="line-button__icon" aria-hidden="true">→</span>
          </button>
        </div>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((open) => !open)}>Menu</button>
      </header>

      <nav className="mobile-menu" id="mobile-menu" aria-label="Mobile navigation" hidden={!menuOpen} onClick={() => setMenuOpen(false)}>
        <Link href="/library">Website library</Link><Link href="/fieldnotes">CRO fieldnotes</Link><Link href="/atlas">Brand Atlas</Link><Link href="/bookmarks">Bookmarks ({bookmarks.length})</Link>
        <button className="mobile-account-button" type="button" onClick={initialMember ? handleSignOut : () => router.push('/')}>{initialMember ? 'Log out' : 'Log in'}</button>
      </nav>

      <main className="bookmarks-page ruled-section">
        <div className="section-heading bookmarks-heading">
          <div><p className="eyebrow">Your research library</p><h1>Saved websites.</h1></div>
          <p>Everything you save lives here. Collections are private layers for organizing the ideas you want to revisit.</p>
        </div>

        {!initialMember ? (
          <div className="bookmarks-empty bookmarks-empty--signed-out">
            <BookmarkIcon />
            <h2>Sign in to see your saves.</h2>
            <p>Your saved websites and private collections will appear here on every device.</p>
            <Link className="line-button line-button--dark" href="/"><span>Return home to sign in</span><span className="line-button__icon">→</span></Link>
          </div>
        ) : (
          <div className="bookmarks-layout">
            <aside className="bookmarks-sidebar" aria-label="Bookmark collections">
              <p className="filter-label">Collections</p>
              <button className={selectedCollection === null ? 'active' : ''} type="button" onClick={() => setSelectedCollection(null)}>
                <span>All saves</span><strong>{bookmarks.length}</strong>
              </button>
              {collections.map((collection) => {
                const count = collectionCounts.get(collection.id) || 0
                return (
                  <div className="collection-list-item" key={collection.id}>
                    {editingCollectionID === collection.id ? (
                      <form onSubmit={(event) => handleRenameCollection(event, collection.id)}>
                        <input name="name" defaultValue={collection.name} aria-label="Collection name" minLength={2} required />
                        <button type="submit" disabled={isPending}>Save</button>
                      </form>
                    ) : (
                      <button className={selectedCollection === collection.id ? 'active' : ''} type="button" onClick={() => setSelectedCollection(collection.id)}>
                        <span>{collection.name}</span><strong>{count}</strong>
                      </button>
                    )}
                    <div className="collection-list-actions">
                      <button type="button" onClick={() => setEditingCollectionID(editingCollectionID === collection.id ? null : collection.id)}>{editingCollectionID === collection.id ? 'Cancel' : 'Rename'}</button>
                      <button type="button" onClick={() => handleDeleteCollection(collection.id)} disabled={isPending}>Delete</button>
                    </div>
                  </div>
                )
              })}
              <form className="new-collection-form" onSubmit={handleCreateCollection}>
                <label htmlFor="new-collection">New collection</label>
                <div><input id="new-collection" name="name" type="text" placeholder="Collection name" minLength={2} required /><button type="submit" disabled={isPending}>+</button></div>
              </form>
            </aside>

            <section className="bookmarks-results" aria-live="polite">
              <div className="results-meta">
                <p>{visibleBookmarks.length} {visibleBookmarks.length === 1 ? 'website' : 'websites'} in {selectedCollection ? collectionName(selectedCollection) : 'All saves'}</p>
                <p className="bookmarks-status" role="status">{message}</p>
              </div>
              {visibleBookmarks.length ? (
                <div className="card-grid bookmarks-grid">
                  {visibleBookmarks.map((bookmark) => {
                    const site = siteByID.get(bookmark.websiteID)
                    if (!site) return null
                    return (
                      <article className="site-card" key={bookmark.id}>
                        <div className="card-visual">
                          <a className="card-open" href={site.url} target="_blank" rel="noreferrer" aria-label={`Visit ${site.name}`}>
                            {site.coverImage && <Image className="card-cover" src={site.coverImage} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 360px" quality={70} />}
                            {!site.coverImage && <span className="card-mark">{site.name}</span>}
                          </a>
                        </div>
                        <div className="card-meta">
                          <div className="card-title-row"><h3>{site.name}</h3><div className="card-actions">
                            <Link className="card-action" href={`/atlas?url=${encodeURIComponent(site.url)}`} aria-label={`Map ${site.name} in Brand Atlas`} title="Map in Brand Atlas"><AtlasIcon /></Link>
                            <a className="card-action" href={site.url} target="_blank" rel="noreferrer" aria-label={`Visit ${site.name}`}><ExternalIcon /></a>
                            <button className="card-action card-save-action" type="button" onClick={() => handleRemoveBookmark(bookmark)} aria-label={`Remove ${site.name} from your saves`} title="Remove save"><BookmarkIcon />{(site.saveCount || 0) >= 5 && <span>{site.saveCount}</span>}</button>
                          </div></div>
                          <div className="bookmark-card-detail"><span>{collectionName(bookmark.collectionID)}</span><button type="button" onClick={() => openCollectionDialog(bookmark.id)}>Edit</button></div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="bookmarks-empty"><BookmarkIcon /><h2>No saves here yet.</h2><p>Save websites from the library, then return here to organize them.</p><Link className="line-button" href="/library"><span>Browse the library</span><span className="line-button__icon">↗</span></Link></div>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className="site-footer">
        <section className="footer-newsletter" id="newsletter"><div><p className="footer-label">Indizio weekly</p><p className="footer-newsletter__headline">Seven signals, every Thursday.</p></div><div className="footer-newsletter__signup"><form className="newsletter-form" onSubmit={handleNewsletter}><label className="visually-hidden" htmlFor="bookmarks-footer-email">Email address</label><input id="bookmarks-footer-email" name="email" type="email" placeholder="Email address" required /><button type="submit" aria-label="Subscribe" disabled={isPending}><span>{isPending ? 'Joining…' : 'Join the fieldnotes'}</span><i aria-hidden="true">↗</i></button></form><p className="form-message" aria-live="polite">{newsletterMessage}</p></div></section>
        <div className="footer-meta"><div><p className="footer-label">INDIZIO</p><p>Evidence from the storefront.</p></div><div><p className="footer-label">Explore</p><Link href="/library">Websites</Link><Link href="/bookmarks">Bookmarks</Link><Link href="/#index-report">Research</Link></div><div><p className="footer-label">Follow</p><Link href="/#newsletter">Newsletter</Link><a href="#">LinkedIn</a><a href="#">Instagram</a></div><div><p className="footer-label">Contact</p><a href="mailto:hello@indizio.space">hello@indizio.space</a><p>© 2026 INDIZIO</p></div></div>
      </footer>

      <dialog className="auth-dialog collection-dialog" ref={collectionDialogRef} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
        <button className="dialog-close auth-dialog__close" type="button" aria-label="Close" onClick={() => collectionDialogRef.current?.close()}>×</button>
        <div className="auth-dialog__content">
          <p className="eyebrow">Organize bookmark</p>
          <h2>Change collection.</h2>
          <p>This website always remains in All Bookmarks.</p>
          {activeBookmarkID && <form className="auth-form" onSubmit={handleMoveBookmark}>
            <input type="hidden" name="bookmark" value={activeBookmarkID} />
            <label htmlFor="bookmarks-collection-picker">Collection</label>
            <select id="bookmarks-collection-picker" name="collection" defaultValue={bookmarkByID.get(activeBookmarkID)?.collectionID || ''}>
              <option value="">All Bookmarks</option>
              {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
            </select>
            <button className="line-button line-button--dark" type="submit" disabled={isPending}><span>{isPending ? 'Moving…' : 'Update collection'}</span><span className="line-button__icon">→</span></button>
          </form>}
        </div>
      </dialog>
    </>
  )
}
