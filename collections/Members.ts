import type { CollectionConfig } from 'payload'

import { isAdminOrSelf } from './access'

export const Members: CollectionConfig = {
  slug: 'members',
  auth: true,
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
