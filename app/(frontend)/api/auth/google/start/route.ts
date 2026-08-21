import { createHash, randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const temporaryCookie = { httpOnly: true, maxAge: 600, path: '/', sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production' }

export async function GET(request: NextRequest) {
  const clientID = process.env.GOOGLE_CLIENT_ID
  if (!clientID) return NextResponse.redirect(new URL('/?authError=google-unavailable', request.url))

  const state = randomBytes(24).toString('base64url')
  const verifier = randomBytes(48).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  const requestedReturnTo = request.nextUrl.searchParams.get('returnTo') || '/'
  const returnTo = requestedReturnTo.startsWith('/') && !requestedReturnTo.startsWith('//') ? requestedReturnTo : '/'
  const newsletter = request.nextUrl.searchParams.get('newsletter') === '1' ? '1' : '0'
  const redirectURI = process.env.GOOGLE_REDIRECT_URI || new URL('/api/auth/google/callback', request.url).toString()
  const authorizationURL = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authorizationURL.search = new URLSearchParams({
    client_id: clientID,
    redirect_uri: redirectURI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString()

  const response = NextResponse.redirect(authorizationURL)
  response.cookies.set('indizio-google-state', state, temporaryCookie)
  response.cookies.set('indizio-google-verifier', verifier, temporaryCookie)
  response.cookies.set('indizio-google-return', returnTo, temporaryCookie)
  response.cookies.set('indizio-google-newsletter', newsletter, temporaryCookie)
  return response
}
