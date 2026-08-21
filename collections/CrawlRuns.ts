import type { CollectionConfig } from 'payload'

import { isMemberOrAdmin, ownsDocument } from './access'

export const CrawlRuns: CollectionConfig = {
  slug: 'crawl-runs',
  admin: {
    group: 'Brand Atlas',
    useAsTitle: 'brandName',
    defaultColumns: ['brandName', 'domain', 'status', 'urlCount', 'createdAt'],
  },
  access: {
    create: isMemberOrAdmin,
    read: ownsDocument,
    update: ownsDocument,
    delete: ownsDocument,
  },
  hooks: {
    beforeChange: [({ data, req }) => {
      if (req.user?.collection !== 'members') return data
      return { ...data, owner: req.user.id }
    }],
  },
  indexes: [
    { fields: ['owner', 'domain', 'createdAt'] },
    { fields: ['domain', 'status', 'completedAt'] },
  ],
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'members', required: true, index: true },
    { name: 'input', type: 'text', required: true },
    { name: 'brandName', type: 'text', required: true, index: true },
    { name: 'domain', type: 'text', required: true, index: true },
    { name: 'startURL', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'running',
      index: true,
      options: ['running', 'completed', 'failed'],
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'live',
      options: ['live', 'history-cache'],
    },
    { name: 'urlCount', type: 'number', defaultValue: 0 },
    { name: 'sitemapCount', type: 'number', defaultValue: 0 },
    { name: 'truncated', type: 'checkbox', defaultValue: false },
    { name: 'completedAt', type: 'date' },
    { name: 'error', type: 'textarea' },
    {
      name: 'pages',
      type: 'array',
      fields: [
        { name: 'url', type: 'text', required: true },
        { name: 'path', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          options: ['homepage', 'product', 'collection', 'blog', 'article', 'page', 'about', 'help', 'policy', 'account', 'cart', 'checkout', 'search', 'gift-card', 'other'],
        },
        { name: 'source', type: 'select', required: true, options: ['sitemap', 'link'] },
        { name: 'title', type: 'text' },
      ],
    },
  ],
}
