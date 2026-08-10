import type { CollectionConfig } from 'payload'

import { isAdmin } from './access'
import { slugField } from './fields'

export const Websites: CollectionConfig = {
  slug: 'websites',
  admin: {
    group: 'Library',
    useAsTitle: 'name',
    defaultColumns: ['name', 'url', 'industry', 'featuredRank', '_status'],
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
    { name: 'coverImage', type: 'text', required: true, label: 'Cover image URL' },
    { name: 'industry', type: 'relationship', relationTo: 'industries' },
    { name: 'styles', type: 'relationship', relationTo: 'styles', hasMany: true },
    { name: 'note', type: 'textarea' },
    { name: 'featuredRank', type: 'number', defaultValue: 0, index: true },
  ],
}
