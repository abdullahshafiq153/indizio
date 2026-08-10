'use server'

import config from '@payload-config'
import { login, logout } from '@payloadcms/next/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { subscribeToBeehiiv } from '@/lib/beehiiv'

export type ActionResult = {
  ok: boolean
  message: string
}

const unavailable = (): ActionResult => ({
  ok: false,
  message: 'Accounts are being connected. Please try again shortly.',
})

function value(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  if (!process.env.DATABASE_URL) return unavailable()

  const name = value(formData, 'name')
  const email = value(formData, 'email').toLowerCase()
  const password = value(formData, 'password')
  const newsletterConsent = formData.get('newsletterConsent') === 'on'

  if (name.length < 2) return { ok: false, message: 'Please enter your name.' }
  if (!email.includes('@')) return { ok: false, message: 'Please enter a valid email address.' }
  if (password.length < 8) return { ok: false, message: 'Use at least 8 characters for your password.' }

  try {
    const payload = await getPayload({ config })
    const member = await payload.create({
      collection: 'members',
      data: {
        name,
        email,
        password,
        newsletterConsent,
        newsletterStatus: newsletterConsent ? 'pending' : 'not-subscribed',
      },
      overrideAccess: true,
    })

    let message = 'Your account is ready.'
    if (newsletterConsent) {
      const subscription = await subscribeToBeehiiv(email)
      await payload.update({
        collection: 'members',
        id: member.id,
        data: subscription.ok
          ? { newsletterStatus: 'subscribed', beehiivSubscriptionId: subscription.subscriptionId }
          : { newsletterStatus: 'error' },
        overrideAccess: true,
      })
      message = subscription.ok
        ? 'Your account is ready and you are subscribed to the fieldnotes.'
        : `Your account is ready. ${subscription.error}`
    }

    await login({ collection: 'members', config, email, password })
    revalidatePath('/')
    return { ok: true, message }
  } catch (error) {
    const text = error instanceof Error ? error.message : ''
    if (/duplicate|already|unique/i.test(text)) {
      return { ok: false, message: 'An account already exists for this email.' }
    }
    return { ok: false, message: 'We could not create your account. Please try again.' }
  }
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  if (!process.env.DATABASE_URL) return unavailable()
  const email = value(formData, 'email').toLowerCase()
  const password = value(formData, 'password')

  try {
    await login({ collection: 'members', config, email, password })
    revalidatePath('/')
    return { ok: true, message: 'Welcome back.' }
  } catch {
    return { ok: false, message: 'That email and password combination was not recognized.' }
  }
}

export async function signOut(): Promise<void> {
  if (process.env.DATABASE_URL) await logout({ config })
  revalidatePath('/')
}

export async function subscribeNewsletter(formData: FormData): Promise<ActionResult> {
  const email = value(formData, 'email').toLowerCase()
  if (!email.includes('@')) return { ok: false, message: 'Please enter a valid email address.' }

  const result = await subscribeToBeehiiv(email)
  return result.ok
    ? { ok: true, message: 'You are on the list. Watch your inbox for the fieldnotes.' }
    : { ok: false, message: result.error }
}

async function currentMember() {
  if (!process.env.DATABASE_URL) return null
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: await headers() })
  return auth.user?.collection === 'members' ? { payload, user: auth.user } : null
}

export async function createBookmarkCollection(formData: FormData): Promise<ActionResult & { id?: string }> {
  const session = await currentMember()
  if (!session) return { ok: false, message: 'Sign in to create a collection.' }

  const name = value(formData, 'name')
  const description = value(formData, 'description')
  if (name.length < 2) return { ok: false, message: 'Give your collection a name.' }

  try {
    const folder = await session.payload.create({
      collection: 'bookmark-collections',
      data: { name, description, visibility: 'private', owner: session.user.id },
      overrideAccess: false,
      user: session.user,
    })
    revalidatePath('/')
    return { ok: true, message: 'Collection created.', id: String(folder.id) }
  } catch {
    return { ok: false, message: 'We could not create that collection.' }
  }
}

export async function saveBookmark(formData: FormData): Promise<ActionResult> {
  const session = await currentMember()
  if (!session) return { ok: false, message: 'Sign in to save websites.' }

  const website = value(formData, 'website')
  const collection = value(formData, 'collection')
  const note = value(formData, 'note')
  if (!website || !collection) return { ok: false, message: 'Choose a collection first.' }

  try {
    await session.payload.create({
      collection: 'bookmarks',
      data: { owner: session.user.id, website, folder: collection, note },
      overrideAccess: false,
      user: session.user,
    })
    revalidatePath('/')
    return { ok: true, message: 'Saved to your collection.' }
  } catch (error) {
    const text = error instanceof Error ? error.message : ''
    return /duplicate/i.test(text)
      ? { ok: true, message: 'This website is already in that collection.' }
      : { ok: false, message: text || 'We could not save this website.' }
  }
}

export async function removeBookmark(formData: FormData): Promise<ActionResult> {
  const session = await currentMember()
  if (!session) return { ok: false, message: 'Sign in to manage saved websites.' }
  const bookmark = value(formData, 'bookmark')

  try {
    await session.payload.delete({
      collection: 'bookmarks',
      id: bookmark,
      overrideAccess: false,
      user: session.user,
    })
    revalidatePath('/')
    return { ok: true, message: 'Bookmark removed.' }
  } catch {
    return { ok: false, message: 'We could not remove that bookmark.' }
  }
}
