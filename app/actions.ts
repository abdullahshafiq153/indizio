'use server'

import config from '@payload-config'
import { login, logout } from '@payloadcms/next/auth'
import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { getPayload } from 'payload'

import { subscribeToBeehiiv } from '@/lib/beehiiv'
import { GOOGLE_SESSION_COOKIE } from '@/lib/google-session'

export type ActionResult = {
  ok: boolean
  message: string
}

export type BookmarkActionResult = ActionResult & {
  bookmarkID?: string
  collectionID?: string | null
  collectionName?: string
  saveCount?: number
}

export async function updateAccountProfile(formData: FormData): Promise<ActionResult> {
  const session = await currentMember()
  if (!session) return { ok: false, message: 'Sign in to update your account.' }
  const name = value(formData, 'name')
  if (name.length < 2 || name.length > 80) return { ok: false, message: 'Enter a name between 2 and 80 characters.' }
  try {
    await session.payload.update({ collection: 'members', id: session.user.id, data: { name }, overrideAccess: false, user: session.user })
    revalidatePath('/account'); revalidatePath('/'); revalidatePath('/library')
    return { ok: true, message: 'Profile updated.' }
  } catch {
    return { ok: false, message: 'We could not update your profile.' }
  }
}

export async function changeAccountPassword(formData: FormData): Promise<ActionResult> {
  const session = await currentMember()
  if (!session?.user.email) return { ok: false, message: 'Sign in to update your password.' }
  const currentPassword = value(formData, 'currentPassword')
  const password = value(formData, 'password')
  const confirmation = value(formData, 'confirmation')
  if (password.length < 8) return { ok: false, message: 'Use at least 8 characters for the new password.' }
  if (password !== confirmation) return { ok: false, message: 'The new passwords do not match.' }
  try {
    await session.payload.login({ collection: 'members', data: { email: session.user.email, password: currentPassword } })
    await session.payload.update({ collection: 'members', id: session.user.id, data: { password }, overrideAccess: true })
    return { ok: true, message: 'Password updated.' }
  } catch {
    return { ok: false, message: 'Your current password was not recognized.' }
  }
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const email = value(formData, 'email').toLowerCase()
  if (email.includes('@') && process.env.DATABASE_URL) {
    try {
      const payload = await getPayload({ config })
      await payload.forgotPassword({ collection: 'members', data: { email }, disableEmail: false })
    } catch {
      // Keep the response identical so account existence cannot be inferred.
    }
  }
  return { ok: true, message: 'If an account exists for that email, a reset link is on its way.' }
}

export async function resetAccountPassword(formData: FormData): Promise<ActionResult> {
  const token = value(formData, 'token')
  const password = value(formData, 'password')
  const confirmation = value(formData, 'confirmation')
  if (!token) return { ok: false, message: 'This reset link is invalid.' }
  if (password.length < 8) return { ok: false, message: 'Use at least 8 characters for your new password.' }
  if (password !== confirmation) return { ok: false, message: 'The passwords do not match.' }
  try {
    const payload = await getPayload({ config })
    await payload.resetPassword({ collection: 'members', data: { password, token }, overrideAccess: true })
    return { ok: true, message: 'Password reset. You can now sign in.' }
  } catch {
    return { ok: false, message: 'This reset link is invalid or has expired.' }
  }
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
  try {
    if (process.env.DATABASE_URL) await logout({ config })
  } finally {
    ;(await cookies()).delete(GOOGLE_SESSION_COOKIE)
  }
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
      limit: 100,
      overrideAccess: false,
      user: session.user,
      where: {
        and: [
          { owner: { equals: session.user.id } },
          { website: { equals: website } },
        ],
      },
    })

    const existingBookmark = existing.docs.find((item) => {
      const folderID = typeof item.folder === 'object' ? item.folder?.id : item.folder
      return String(folderID || '') === collection
    })

    if (existingBookmark) {
      const folderID = typeof existingBookmark.folder === 'object' ? existingBookmark.folder?.id : existingBookmark.folder
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
        bookmarkID: String(existingBookmark.id),
        collectionID: folderID ? String(folderID) : null,
        collectionName,
        saveCount: existing.totalDocs,
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
    const totalSaves = await session.payload.count({
      collection: 'bookmarks',
      overrideAccess: true,
      where: { website: { equals: website } },
    })
    return {
      ok: true,
      message: collection ? 'Saved to your collection.' : 'Saved to All Bookmarks.',
      bookmarkID: String(bookmark.id),
      collectionID: collection || null,
      collectionName: collection ? 'Collection' : 'All Bookmarks',
      saveCount: totalSaves.totalDocs,
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
    const source = await session.payload.findByID({ collection: 'bookmarks', id: bookmark, depth: 0, overrideAccess: false, user: session.user })
    if (!collection) return { ok: true, message: 'Already saved to All saves.', bookmarkID: String(source.id), collectionID: null, collectionName: 'All saves' }

    const folder = await session.payload.findByID({ collection: 'bookmark-collections', id: collection, overrideAccess: false, user: session.user })
    const websiteID = typeof source.website === 'object' ? source.website.id : source.website
    const existing = await session.payload.find({
      collection: 'bookmarks', depth: 0, limit: 1, overrideAccess: false, user: session.user,
      where: { and: [{ owner: { equals: session.user.id } }, { website: { equals: websiteID } }, { folder: { equals: collection } }] },
    })
    const saved = existing.docs[0] || await session.payload.create({ collection: 'bookmarks', data: { owner: session.user.id, website: websiteID, folder: collection }, overrideAccess: false, user: session.user })
    const totalSaves = await session.payload.count({ collection: 'bookmarks', overrideAccess: true, where: { website: { equals: websiteID } } })
    revalidateBookmarkPages()
    return { ok: true, message: existing.docs[0] ? `Already saved to ${folder.name}.` : `Added to ${folder.name}.`, bookmarkID: String(saved.id), collectionID: collection, collectionName: folder.name, saveCount: totalSaves.totalDocs }
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
  const website = value(formData, 'website')

  try {
    if (website) {
      const saved = await session.payload.find({
        collection: 'bookmarks', depth: 0, limit: 500, overrideAccess: false, user: session.user,
        where: { and: [{ owner: { equals: session.user.id } }, { website: { equals: website } }] },
      })
      await Promise.all(saved.docs.map((item) => session.payload.delete({ collection: 'bookmarks', id: item.id, overrideAccess: false, user: session.user })))
    } else if (bookmark) {
      await session.payload.delete({ collection: 'bookmarks', id: bookmark, overrideAccess: false, user: session.user })
    }
    revalidateBookmarkPages()
    return { ok: true, message: 'Bookmark removed.' }
  } catch {
    return { ok: false, message: 'We could not remove that bookmark.' }
  }
}
