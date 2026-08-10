import type { CollectionConfig } from 'payload'

import { isAdmin } from './access'

export const Admins: CollectionConfig = {
  slug: 'admins',
  auth: true,
  admin: { useAsTitle: 'email' },
  access: {
    create: async ({ req }) => {
      if (req.user?.collection === 'admins') return true
      const existing = await req.payload.count({ collection: 'admins', overrideAccess: true })
      return existing.totalDocs === 0
    },
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'editor',
      required: true,
      options: ['admin', 'editor'],
    },
  ],
}
