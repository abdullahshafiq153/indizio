import type { CollectionConfig } from 'payload'

import { isMemberOrAdmin, ownsDocument } from './access'

export const Bookmarks: CollectionConfig = {
  slug: 'bookmarks',
  admin: { group: 'Community', useAsTitle: 'id' },
  access: {
    create: isMemberOrAdmin,
    read: ownsDocument,
    update: ownsDocument,
    delete: ownsDocument,
  },
  hooks: {
    beforeChange: [async ({ data, req }) => {
      if (req.user?.collection !== 'members') return data

      const folderID = typeof data?.collection === 'object' ? data.collection.id : data?.collection
      if (!folderID) throw new Error('Choose a collection before saving this website.')

      const folder = await req.payload.findByID({
        collection: 'bookmark-collections',
        id: folderID,
        overrideAccess: false,
        req,
      })
      const ownerID = typeof folder.owner === 'object' ? folder.owner.id : folder.owner
      if (ownerID !== req.user.id) throw new Error('You can only save into your own collections.')

      return { ...data, owner: req.user.id }
    }],
  },
  indexes: [
    { fields: ['owner', 'collection', 'website'], unique: true },
  ],
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'members', required: true, index: true },
    { name: 'collection', type: 'relationship', relationTo: 'bookmark-collections', required: true, index: true },
    { name: 'website', type: 'relationship', relationTo: 'websites', required: true, index: true },
    { name: 'note', type: 'textarea' },
    { name: 'position', type: 'number', defaultValue: 0 },
  ],
}
