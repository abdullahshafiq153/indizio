import type { CollectionConfig } from 'payload'

import { isAdmin } from './access'
import { slugField } from './fields'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    group: 'Editorial',
    useAsTitle: 'title',
    defaultColumns: ['title', 'featured', 'space', 'industry', 'publishedAt', '_status'],
  },
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
    { name: 'featured', type: 'checkbox', defaultValue: false, label: 'Featured note', index: true },
    {
      name: 'space',
      type: 'select',
      defaultValue: 'fieldnotes',
      options: [
        { label: 'CRO Fieldnotes', value: 'fieldnotes' },
        { label: 'Ecommerce Ideas', value: 'ecommerce-ideas' },
      ],
      required: true,
      index: true,
    },
    { name: 'industry', type: 'relationship', relationTo: 'industries' },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'fieldnote',
      options: ['fieldnote', 'brand-teardown', 'industry-blueprint', 'pattern-report'],
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      admin: { date: { pickerAppearance: 'dayAndTime' } },
      index: true,
    },
    { name: 'readingTime', type: 'number', min: 1, defaultValue: 6, label: 'Reading time (minutes)' },
    { name: 'content', type: 'richText', required: true },
    { name: 'relatedWebsites', type: 'relationship', relationTo: 'websites', hasMany: true },
  ],
}
