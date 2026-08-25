import config from '@payload-config'
import { randomBytes, createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const runtime = 'nodejs'
const EXTENSION_CALLBACK_HOST = 'pjmjaepkcignpoobodjehmmhgfhmbeco.chromiumapp.org'

function safeRedirect(input: string | null) {
  if (!input) return null
  try {
    const url = new URL(input)
    return url.protocol === 'https:' && url.hostname === EXTENSION_CALLBACK_HOST ? url : null
  } catch { return null }
}

export async function GET(request: NextRequest) {
  const redirect = safeRedirect(request.nextUrl.searchParams.get('redirect_uri'))
  if (!redirect) return NextResponse.json({ message: 'Invalid extension redirect.' }, { status: 400 })

  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: request.headers })
  if (auth.user?.collection !== 'members') {
    redirect.hash = new URLSearchParams({ error: 'not_signed_in' }).toString()
    return NextResponse.redirect(redirect)
  }

  const token = randomBytes(32).toString('base64url')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  await payload.create({ collection: 'extension-sessions', overrideAccess: true, data: { owner: auth.user.id, tokenHash, expiresAt, lastUsedAt: new Date().toISOString(), revoked: false } })
  redirect.hash = new URLSearchParams({ token }).toString()
  return NextResponse.redirect(redirect)
}
