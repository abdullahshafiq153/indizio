import type { CollectionConfig } from 'payload'

import { isAdmin } from './access'
import { slugField } from './fields'

export const Websites: CollectionConfig = {
  slug: 'websites',
  admin: {
    group: 'Library',
    useAsTitle: 'name',
    defaultColumns: ['name', 'cover', 'url', 'industry', 'featuredRank', '_status'],
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
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: 'Cover image',
      displayPreview: true,
      admin: {
        description: 'Upload a new cover or choose one from the INDIZIO media library.',
      },
    },
    {
      name: 'coverImage',
      type: 'text',
      label: 'Legacy cover image URL',
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    { name: 'industry', type: 'relationship', relationTo: 'industries' },
    { name: 'styles', type: 'relationship', relationTo: 'styles', hasMany: true },
    { name: 'note', type: 'textarea' },
    { name: 'featuredRank', type: 'number', defaultValue: 0, index: true },
  ],
}
