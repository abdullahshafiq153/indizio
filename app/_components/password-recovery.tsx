'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState, useTransition } from 'react'
import { requestPasswordReset, resetAccountPassword } from '../actions'

export function PasswordRecovery({ token }: { token?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const reset = Boolean(token)
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    startTransition(async () => {
      const result = await (reset ? resetAccountPassword : requestPasswordReset)(new FormData(form))
      setMessage(result.message)
      if (result.ok) {
        form.reset()
        if (reset) router.replace('/?auth=signin&reset=success')
      }
    })
  }
  return <main className="recovery-page"><section><p className="eyebrow">Account recovery</p><h1>{reset ? 'Choose a new password.' : 'Reset your password.'}</h1><p>{reset ? 'Use at least eight characters for your new password.' : 'Enter your account email and we’ll send a secure, 30-minute reset link.'}</p><form onSubmit={submit}>{reset ? <><input type="hidden" name="token" value={token} /><label>New password<input name="password" type="password" minLength={8} autoComplete="new-password" required /></label><label>Confirm password<input name="confirmation" type="password" minLength={8} autoComplete="new-password" required /></label></> : <label>Email address<input name="email" type="email" autoComplete="email" required /></label>}<button className="line-button line-button--dark" disabled={pending}><span>{pending ? 'Please wait…' : reset ? 'Set new password' : 'Send reset link'}</span><span className="line-button__icon">→</span></button><p className="form-message" aria-live="polite">{message}</p></form><Link href="/">← Return to INDIZIO</Link></section></main>
}
