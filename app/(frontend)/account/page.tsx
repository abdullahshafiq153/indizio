import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import config from '@payload-config'
import { getPayload } from 'payload'

import { AccountSettings } from '@/app/_components/account-settings'
import { EditorialFooter, EditorialHeader } from '@/app/_components/editorial-chrome'

export const metadata: Metadata = { title: 'Manage account', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || user.collection !== 'members') redirect('/?account=required')
  const bookmarks = await payload.count({ collection: 'bookmarks', where: { member: { equals: user.id } }, overrideAccess: true })
  const member = { id: String(user.id), name: String(user.name || 'Member'), email: String(user.email || '') }
  return <><EditorialHeader member={member} bookmarkCount={bookmarks.totalDocs} /><AccountSettings account={{ name: member.name, email: member.email, googleConnected: Boolean(user.googleSubject), newsletterStatus: user.newsletterStatus }} bookmarkCount={bookmarks.totalDocs} /><EditorialFooter /></>
}
