'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

import { signOut } from '../actions'
import type { MemberSummary } from '../_data/load-library-data'

export function AccountMenu({ member }: { member: MemberSummary }) {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const initials = member.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'IN'

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape) }
  }, [])

  const handleSignOut = () => startTransition(async () => {
    await signOut()
    window.dispatchEvent(new Event('indizio:viewer-changed'))
    setOpen(false)
    router.push('/')
    router.refresh()
  })

  const prefetchAccountRoutes = () => {
    router.prefetch('/account')
    router.prefetch('/bookmarks')
    router.prefetch('/atlas')
  }

  return (
    <div className="account-menu" ref={rootRef}>
      <button className="account-menu__trigger" type="button" aria-label="Open account menu" aria-expanded={open} aria-controls="account-menu-panel" onPointerEnter={prefetchAccountRoutes} onFocus={prefetchAccountRoutes} onClick={() => { prefetchAccountRoutes(); setOpen((value) => !value) }}>
        <span>{initials}</span>
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="5.2" r="2.7" stroke="currentColor" strokeWidth="1.3" /><path d="M3 14c.4-3 2.1-4.5 5-4.5s4.6 1.5 5 4.5" stroke="currentColor" strokeWidth="1.3" /></svg>
      </button>
      {open && <div className="account-menu__panel" id="account-menu-panel">
        <div className="account-menu__identity"><strong>{member.name}</strong><span>{member.email}</span></div>
        <nav aria-label="Account options">
          <Link href="/account" onClick={() => setOpen(false)}><span>Manage account</span><i aria-hidden="true">→</i></Link>
          <Link href="/bookmarks" onClick={() => setOpen(false)}><span>Saved websites</span><i aria-hidden="true">→</i></Link>
          <Link href="/atlas" onClick={() => setOpen(false)}><span>Brand Atlas history</span><i aria-hidden="true">→</i></Link>
        </nav>
        <button type="button" onClick={handleSignOut} disabled={isPending}><span>{isPending ? 'Logging out…' : 'Log out'}</span><i aria-hidden="true">↗</i></button>
      </div>}
    </div>
  )
}
