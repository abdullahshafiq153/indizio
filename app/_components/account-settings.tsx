'use client'

import Link from 'next/link'
import { FormEvent, useState, useTransition } from 'react'

import { changeAccountPassword, updateAccountProfile } from '../actions'

type Account = { name: string; email: string; googleConnected: boolean; newsletterStatus?: string | null }

export function AccountSettings({ account, bookmarkCount }: { account: Account; bookmarkCount: number }) {
  const [pending, startTransition] = useTransition()
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  const submit = (action: typeof updateAccountProfile, setMessage: (message: string) => void) => (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    startTransition(async () => {
      const result = await action(new FormData(form))
      setMessage(result.message)
      if (result.ok && action === changeAccountPassword) form.reset()
    })
  }

  return <main className="account-page">
    <section className="account-hero"><p className="eyebrow">Your INDIZIO account</p><h1>Manage account.</h1><p>Keep your profile, access, and research library in one place.</p></section>
    <div className="account-grid">
      <aside className="account-summary"><span className="account-summary__avatar">{account.name.slice(0, 1).toUpperCase()}</span><strong>{account.name}</strong><span>{account.email}</span><nav className="account-summary__links" aria-label="Account shortcuts"><Link href="/bookmarks">{bookmarkCount} saved website{bookmarkCount === 1 ? '' : 's'} <i aria-hidden="true">→</i></Link><Link href="/atlas">Brand Atlas <i aria-hidden="true">→</i></Link></nav></aside>
      <div className="account-sections">
        <section className="account-section"><div><p className="eyebrow">Profile</p><h2>Your details</h2></div><form onSubmit={submit(updateAccountProfile, setProfileMessage)}><label>Name<input name="name" defaultValue={account.name} minLength={2} maxLength={80} required /></label><label>Email<input value={account.email} readOnly aria-describedby="email-note" /></label><p id="email-note" className="account-note">Email changes require verification and are currently handled through account support.</p><button className="line-button line-button--dark" disabled={pending}><span>Save profile</span><span className="line-button__icon">→</span></button><p className="form-message" aria-live="polite">{profileMessage}</p></form></section>
        <section className="account-section"><div><p className="eyebrow">Security</p><h2>Password</h2></div>{account.googleConnected && <p className="account-note">Google is connected to this account. You can continue using Google, or create a password through password recovery.</p>}<form onSubmit={submit(changeAccountPassword, setPasswordMessage)}><label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label><label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label><label>Confirm new password<input name="confirmation" type="password" autoComplete="new-password" minLength={8} required /></label><div className="account-form-actions"><button className="line-button line-button--dark" disabled={pending}><span>Update password</span><span className="line-button__icon">→</span></button><Link href="/forgot-password">Forgot password?</Link></div><p className="form-message" aria-live="polite">{passwordMessage}</p></form></section>
      </div>
    </div>
  </main>
}
