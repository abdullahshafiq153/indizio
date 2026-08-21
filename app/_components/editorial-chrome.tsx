'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState, useTransition } from 'react'

import { signOut, subscribeNewsletter } from '../actions'
import type { MemberSummary } from '../_data/load-library-data'

type ActiveNav = 'library' | 'fieldnotes'

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 2.5h9v11l-4.5-3-4.5 3v-11Z" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

const navItems: Array<{ id: ActiveNav; href: string; label: string }> = [
  { id: 'library', href: '/library', label: 'Website library' },
  { id: 'fieldnotes', href: '/fieldnotes', label: 'CRO fieldnotes' },
]

export function EditorialHeader({ active, member, bookmarkCount }: { active: ActiveNav; member: MemberSummary | null; bookmarkCount: number }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleAccount = () => {
    if (!member) {
      router.push('/')
      return
    }
    startTransition(async () => {
      await signOut()
      router.refresh()
    })
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
          {navItems.map((item) => <Link key={item.id} href={item.href} aria-current={active === item.id ? 'page' : undefined}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          {member && <Link className="bookmark-collection" href="/bookmarks" aria-label={`View ${bookmarkCount} saved websites`}><BookmarkIcon /><span>{bookmarkCount}</span></Link>}
          <button className="line-button header-cta" type="button" onClick={handleAccount} disabled={isPending}>
            <span>{member ? 'Log out' : 'Login / Register'}</span><span className="line-button__icon" aria-hidden="true">→</span>
          </button>
        </div>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="editorial-mobile-menu" onClick={() => setMenuOpen((open) => !open)}>Menu</button>
      </header>
      <nav className="mobile-menu" id="editorial-mobile-menu" aria-label="Mobile navigation" hidden={!menuOpen} onClick={() => setMenuOpen(false)}>
        {navItems.map((item) => <Link key={item.id} href={item.href} aria-current={active === item.id ? 'page' : undefined}>{item.label}</Link>)}
        {member && <Link href="/bookmarks">Bookmarks ({bookmarkCount})</Link>}
        <button className="mobile-account-button" type="button" onClick={handleAccount}>{member ? 'Log out' : 'Log in'}</button>
      </nav>
    </>
  )
}

export function EditorialFooter() {
  const [isPending, startTransition] = useTransition()
  const [newsletterMessage, setNewsletterMessage] = useState('No noise. Unsubscribe whenever you like.')

  const handleNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    startTransition(async () => {
      const result = await subscribeNewsletter(new FormData(form))
      setNewsletterMessage(result.message)
      if (result.ok) form.reset()
    })
  }

  return (
    <footer className="site-footer">
      <section className="footer-newsletter" id="newsletter">
        <div><p className="footer-label">Indizio weekly</p><p className="footer-newsletter__headline">Seven signals, every Thursday.</p></div>
        <div className="footer-newsletter__signup">
          <form className="newsletter-form" onSubmit={handleNewsletter}>
            <label className="visually-hidden" htmlFor="editorial-footer-email">Email address</label>
            <input id="editorial-footer-email" name="email" type="email" placeholder="Email address" required />
            <button type="submit" aria-label="Subscribe" disabled={isPending}><span>{isPending ? 'Joining…' : 'Join the fieldnotes'}</span><i aria-hidden="true">↗</i></button>
          </form>
          <p className="form-message" aria-live="polite">{newsletterMessage}</p>
        </div>
      </section>
      <div className="footer-meta">
        <div><p className="footer-label">INDIZIO</p><p>Evidence from the storefront.</p></div>
        <div><p className="footer-label">Explore</p><Link href="/library">Website library</Link><Link href="/fieldnotes">CRO fieldnotes</Link></div>
        <div><p className="footer-label">Follow</p><Link href="/#newsletter">Newsletter</Link><a href="#">LinkedIn</a><a href="#">Instagram</a></div>
        <div><p className="footer-label">Contact</p><a href="mailto:hello@indizio.space">hello@indizio.space</a><p>© 2026 INDIZIO</p></div>
      </div>
    </footer>
  )
}
