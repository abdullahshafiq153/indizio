import type { CollectionConfig } from 'payload'

import { isMemberOrAdmin, ownsDocument } from './access'

export const BookmarkCollections: CollectionConfig = {
  slug: 'bookmark-collections',
  admin: { group: 'Community', useAsTitle: 'name' },
  access: {
    create: isMemberOrAdmin,
    read: ownsDocument,
    update: ownsDocument,
    delete: ownsDocument,
  },
  hooks: {
    beforeChange: [({ data, req }) => {
      if (req.user?.collection === 'members') return { ...data, owner: req.user.id }
      return data
    }],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'visibility',
      type: 'select',
      defaultValue: 'private',
      options: ['private', 'unlisted', 'public'],
      required: true,
    },
    { name: 'owner', type: 'relationship', relationTo: 'members', required: true, index: true },
  ],
}
