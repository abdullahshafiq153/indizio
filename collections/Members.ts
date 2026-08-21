import type { CollectionConfig } from 'payload'

import { isAdminOrSelf } from './access'
import { googleSessionFromHeaders } from '../lib/google-session'

export const Members: CollectionConfig = {
  slug: 'members',
  auth: {
    forgotPassword: {
      expiration: 30 * 60 * 1000,
      generateEmailSubject: () => 'Reset your INDIZIO password',
      generateEmailHTML: (args) => {
        const token = args?.token
        const origin = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
        const resetURL = `${origin}/reset-password?token=${encodeURIComponent(String(token))}`
        return `<div style="font-family:Arial,sans-serif;color:#000"><p>INDIZIO</p><h1>Reset your password</h1><p>This link expires in 30 minutes.</p><p><a href="${resetURL}">Choose a new password</a></p><p>If you did not request this, you can ignore this email.</p></div>`
      },
    },
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
