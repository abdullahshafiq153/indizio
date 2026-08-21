import { createHmac, timingSafeEqual } from 'node:crypto'

export const GOOGLE_SESSION_COOKIE = 'indizio-google-session'
const SESSION_SECONDS = 60 * 60 * 24 * 30

type GoogleSession = { memberId: string; exp: number }

function secret() {
  const value = process.env.PAYLOAD_SECRET
  if (!value) throw new Error('PAYLOAD_SECRET is required for Google sessions.')
  return value
}

function signature(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url')
}

export function createGoogleSession(memberId: string) {
  const value = Buffer.from(JSON.stringify({ memberId, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS } satisfies GoogleSession)).toString('base64url')
  return `${value}.${signature(value)}`
}

export function verifyGoogleSession(token?: string | null): GoogleSession | null {
  if (!token) return null
  const [value, providedSignature] = token.split('.')
  if (!value || !providedSignature) return null
  const expected = Buffer.from(signature(value))
  const provided = Buffer.from(providedSignature)
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null
  try {
    const session = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as GoogleSession
    return session.memberId && session.exp > Math.floor(Date.now() / 1000) ? session : null
  } catch {
    return null
  }
}

export function googleSessionFromHeaders(headers: Headers) {
  const cookie = headers.get('cookie') || ''
  const token = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${GOOGLE_SESSION_COOKIE}=`))?.slice(GOOGLE_SESSION_COOKIE.length + 1)
  return verifyGoogleSession(token ? decodeURIComponent(token) : null)
}

export const googleSessionMaxAge = SESSION_SECONDS
