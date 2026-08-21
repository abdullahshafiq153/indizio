import config from '@payload-config'
import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { subscribeToBeehiiv } from '@/lib/beehiiv'
import { createGoogleSession, GOOGLE_SESSION_COOKIE, googleSessionMaxAge } from '@/lib/google-session'

export const runtime = 'nodejs'

type GoogleProfile = { sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string }
type MemberRecord = { id: string | number; email?: string | null; googleSubject?: string | null }

function clearOAuthCookies(response: NextResponse) {
  for (const name of ['indizio-google-state', 'indizio-google-verifier', 'indizio-google-return', 'indizio-google-newsletter']) response.cookies.delete(name)
}

function failure(request: NextRequest, reason: string) {
  const response = NextResponse.redirect(new URL(`/?authError=${encodeURIComponent(reason)}`, request.url))
  clearOAuthCookies(response)
  return response
}

export async function GET(request: NextRequest) {
  const clientID = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const savedState = request.cookies.get('indizio-google-state')?.value
  const verifier = request.cookies.get('indizio-google-verifier')?.value
  if (!clientID || !clientSecret || !code || !state || !savedState || state !== savedState || !verifier) return failure(request, 'google-auth-failed')

  try {
    const redirectURI = process.env.GOOGLE_REDIRECT_URI || new URL('/api/auth/google/callback', request.url).toString()
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, cache: 'no-store',
      body: new URLSearchParams({ client_id: clientID, client_secret: clientSecret, code, code_verifier: verifier, grant_type: 'authorization_code', redirect_uri: redirectURI }),
    })
    const token = await tokenResponse.json() as { access_token?: string }
    if (!tokenResponse.ok || !token.access_token) return failure(request, 'google-token-failed')

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${token.access_token}` }, cache: 'no-store' })
    const profile = await profileResponse.json() as GoogleProfile
    const email = profile.email?.trim().toLowerCase()
    if (!profileResponse.ok || !profile.sub || !email || !profile.email_verified) return failure(request, 'google-email-not-verified')

    const payload = await getPayload({ config })
    const [subjectMatch, emailMatch] = await Promise.all([
      payload.find({ collection: 'members', depth: 0, limit: 1, overrideAccess: true, where: { googleSubject: { equals: profile.sub } } }),
      payload.find({ collection: 'members', depth: 0, limit: 1, overrideAccess: true, where: { email: { equals: email } } }),
    ])
    const bySubject = subjectMatch.docs[0] as unknown as MemberRecord | undefined
    const byEmail = emailMatch.docs[0] as unknown as MemberRecord | undefined
    if (bySubject && byEmail && String(bySubject.id) !== String(byEmail.id)) return failure(request, 'google-account-conflict')
    if (byEmail?.googleSubject && byEmail.googleSubject !== profile.sub) return failure(request, 'google-account-conflict')

    const newsletterConsent = request.cookies.get('indizio-google-newsletter')?.value === '1'
    let member: MemberRecord
    if (bySubject || byEmail) {
      member = await payload.update({ collection: 'members', id: (bySubject || byEmail)!.id, overrideAccess: true, data: {
        googleSubject: profile.sub, googleAvatarURL: profile.picture || undefined,
      } }) as unknown as MemberRecord
    } else {
      member = await payload.create({ collection: 'members', overrideAccess: true, data: {
        name: profile.name?.trim() || email.split('@')[0], email, password: randomBytes(32).toString('base64url'),
        googleSubject: profile.sub, googleAvatarURL: profile.picture || undefined, newsletterConsent,
        newsletterStatus: newsletterConsent ? 'pending' : 'not-subscribed',
      } }) as unknown as MemberRecord
      if (newsletterConsent) {
        const subscription = await subscribeToBeehiiv(email)
        await payload.update({ collection: 'members', id: member.id, overrideAccess: true, data: subscription.ok
          ? { newsletterStatus: 'subscribed', beehiivSubscriptionId: subscription.subscriptionId }
          : { newsletterStatus: 'error' } })
      }
    }

    const returnTo = request.cookies.get('indizio-google-return')?.value || '/'
    const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/'
    const response = NextResponse.redirect(new URL(`${safeReturnTo}${safeReturnTo.includes('?') ? '&' : '?'}auth=google-success`, request.nextUrl.origin))
    clearOAuthCookies(response)
    response.cookies.set(GOOGLE_SESSION_COOKIE, createGoogleSession(String(member.id)), {
      httpOnly: true, maxAge: googleSessionMaxAge, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    })
    return response
  } catch (error) {
    console.error('[google-auth] callback failed', { error: error instanceof Error ? error.message : String(error) })
    return failure(request, 'google-auth-failed')
  }
}
