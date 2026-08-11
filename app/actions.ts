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

export type BookmarkActionResult = ActionResult & {
  bookmarkID?: string
  collectionID?: string | null
  collectionName?: string
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
    revalidateBookmarkPages()
    return { ok: true, message: 'Collection created.', id: String(folder.id) }
  } catch {
    return { ok: false, message: 'We could not create that collection.' }
  }
}

function revalidateBookmarkPages() {
  revalidatePath('/')
  revalidatePath('/library')
  revalidatePath('/bookmarks')
}

export async function saveBookmark(formData: FormData): Promise<BookmarkActionResult> {
  const session = await currentMember()
  if (!session) return { ok: false, message: 'Sign in to save websites.' }

  const website = value(formData, 'website')
  const collection = value(formData, 'collection')
  const note = value(formData, 'note')
  if (!website) return { ok: false, message: 'This website is not ready to be saved.' }

  try {
    const existing = await session.payload.find({
      collection: 'bookmarks',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      user: session.user,
      where: {
        and: [
          { owner: { equals: session.user.id } },
          { website: { equals: website } },
        ],
      },
    })

    if (existing.docs[0]) {
      const bookmark = existing.docs[0]
      const folderID = typeof bookmark.folder === 'object' ? bookmark.folder?.id : bookmark.folder
      let collectionName = 'All Bookmarks'
      if (folderID) {
        const folder = await session.payload.findByID({
          collection: 'bookmark-collections',
          id: folderID,
          overrideAccess: false,
          user: session.user,
        })
        collectionName = folder.name
      }
      return {
        ok: true,
        message: `Already saved to ${collectionName}.`,
        bookmarkID: String(bookmark.id),
        collectionID: folderID ? String(folderID) : null,
        collectionName,
      }
    }

    const bookmark = await session.payload.create({
      collection: 'bookmarks',
      data: {
        owner: session.user.id,
        website,
        ...(collection ? { folder: collection } : {}),
        ...(note ? { note } : {}),
      },
      overrideAccess: false,
      user: session.user,
    })
    revalidateBookmarkPages()
    return {
      ok: true,
      message: collection ? 'Saved to your collection.' : 'Saved to All Bookmarks.',
      bookmarkID: String(bookmark.id),
      collectionID: collection || null,
      collectionName: collection ? 'Collection' : 'All Bookmarks',
    }
  } catch (error) {
    const text = error instanceof Error ? error.message : ''
    return { ok: false, message: text || 'We could not save this website.' }
  }
}

export async function moveBookmark(formData: FormData): Promise<BookmarkActionResult> {
  const session = await currentMember()
  if (!session) return { ok: false, message: 'Sign in to organize saved websites.' }

  const bookmark = value(formData, 'bookmark')
  const collection = value(formData, 'collection')
  if (!bookmark) return { ok: false, message: 'Choose a bookmark to organize.' }

  try {
    let collectionName = 'All Bookmarks'
    if (collection) {
      const folder = await session.payload.findByID({
        collection: 'bookmark-collections',
        id: collection,
        overrideAccess: false,
        user: session.user,
      })
      collectionName = folder.name
    }

    await session.payload.update({
      collection: 'bookmarks',
      id: bookmark,
      data: { folder: collection || null },
      overrideAccess: false,
      user: session.user,
    })
    revalidateBookmarkPages()
    return {
      ok: true,
      message: `Saved to ${collectionName}.`,
      bookmarkID: bookmark,
      collectionID: collection || null,
      collectionName,
    }
  } catch {
    return { ok: false, message: 'We could not change that collection.' }
  }
}

export async function renameBookmarkCollection(formData: FormData): Promise<ActionResult> {
  const session = await currentMember()
  if (!session) return { ok: false, message: 'Sign in to manage collections.' }
  const collection = value(formData, 'collection')
  const name = value(formData, 'name')
  if (!collection || name.length < 2) return { ok: false, message: 'Enter a collection name.' }

  try {
    await session.payload.update({
      collection: 'bookmark-collections',
      id: collection,
      data: { name },
      overrideAccess: false,
      user: session.user,
    })
    revalidateBookmarkPages()
    return { ok: true, message: 'Collection renamed.' }
  } catch {
    return { ok: false, message: 'We could not rename that collection.' }
  }
}

export async function deleteBookmarkCollection(formData: FormData): Promise<ActionResult> {
  const session = await currentMember()
  if (!session) return { ok: false, message: 'Sign in to manage collections.' }
  const collection = value(formData, 'collection')
  if (!collection) return { ok: false, message: 'Choose a collection to delete.' }

  try {
    const bookmarks = await session.payload.find({
      collection: 'bookmarks',
      depth: 0,
      limit: 500,
      overrideAccess: false,
      user: session.user,
      where: { folder: { equals: collection } },
    })
    await Promise.all(bookmarks.docs.map((bookmark) => session.payload.update({
      collection: 'bookmarks',
      id: bookmark.id,
      data: { folder: null },
      overrideAccess: false,
      user: session.user,
    })))
    await session.payload.delete({
      collection: 'bookmark-collections',
      id: collection,
      overrideAccess: false,
      user: session.user,
    })
    revalidateBookmarkPages()
    return { ok: true, message: 'Collection deleted. Its websites remain in All Bookmarks.' }
  } catch {
    return { ok: false, message: 'We could not delete that collection.' }
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
    revalidateBookmarkPages()
    return { ok: true, message: 'Bookmark removed.' }
  } catch {
    return { ok: false, message: 'We could not remove that bookmark.' }
  }
}
