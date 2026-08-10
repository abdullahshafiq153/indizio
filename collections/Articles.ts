import type { CollectionConfig } from 'payload'

import { isAdmin } from './access'
import { slugField } from './fields'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: { group: 'Editorial', useAsTitle: 'title' },
  access: {
    read: ({ req }) => req.user?.collection === 'admins' || { _status: { equals: 'published' } },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField,
    { name: 'excerpt', type: 'textarea', required: true },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'fieldnote',
      options: ['fieldnote', 'brand-teardown', 'industry-blueprint', 'pattern-report'],
      required: true,
    },
    { name: 'content', type: 'richText', required: true },
    { name: 'relatedWebsites', type: 'relationship', relationTo: 'websites', hasMany: true },
  ],
}
