import type { CollectionConfig } from 'payload'

import { isAdminOrSelf } from './access'
import { googleSessionFromHeaders } from '../lib/google-session'

export const Members: CollectionConfig = {
  slug: 'members',
  auth: {
    strategies: [{
      name: 'google-session',
      authenticate: async ({ headers, payload }) => {
        const session = googleSessionFromHeaders(headers)
        if (!session) return { user: null }
        try {
          const member = await payload.findByID({ collection: 'members', id: session.memberId, depth: 0, overrideAccess: true })
          return { user: { ...member, collection: 'members' as const } }
        } catch {
          return { user: null }
        }
      },
    }],
  },
  admin: {
    group: 'Community',
    useAsTitle: 'email',
  },
  access: {
    admin: ({ req }) => req.user?.collection === 'admins',
    create: () => false,
    delete: isAdminOrSelf,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'googleSubject', type: 'text', unique: true, index: true, admin: { readOnly: true } },
    { name: 'googleAvatarURL', type: 'text', admin: { readOnly: true } },
    { name: 'newsletterConsent', type: 'checkbox', defaultValue: false },
    {
      name: 'newsletterStatus',
      type: 'select',
      defaultValue: 'not-subscribed',
      options: ['not-subscribed', 'pending', 'subscribed', 'error'],
      admin: { readOnly: true },
    },
    { name: 'beehiivSubscriptionId', type: 'text', admin: { readOnly: true } },
  ],
}
