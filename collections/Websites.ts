import type { CollectionConfig } from 'payload'

import { isAdmin } from './access'
import { slugField } from './fields'

export const Websites: CollectionConfig = {
  slug: 'websites',
  admin: {
    group: 'Library',
    useAsTitle: 'name',
    defaultColumns: ['name', 'industry', 'featuredRank', '_status'],
  },
  access: {
    read: ({ req }) => req.user?.collection === 'admins' || { _status: { equals: 'published' } },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  versions: { drafts: true },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField,
    { name: 'url', type: 'text', required: true },
    { name: 'industry', type: 'relationship', relationTo: 'industries', required: true },
    { name: 'styles', type: 'relationship', relationTo: 'styles', hasMany: true },
    { name: 'note', type: 'textarea', required: true },
    { name: 'featuredRank', type: 'number', defaultValue: 0, index: true },
  ],
}
