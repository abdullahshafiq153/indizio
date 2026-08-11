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

      const folderID = data?.folder && typeof data.folder === 'object' ? data.folder.id : data?.folder
      if (folderID) {
        const folder = await req.payload.findByID({
          collection: 'bookmark-collections',
          id: folderID,
          overrideAccess: false,
          req,
        })
        const ownerID = typeof folder.owner === 'object' ? folder.owner.id : folder.owner
        if (String(ownerID) !== String(req.user.id)) throw new Error('You can only save into your own collections.')
      }

      return { ...data, owner: req.user.id }
    }],
  },
  indexes: [
    { fields: ['owner', 'folder', 'website'], unique: true },
  ],
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'members', required: true, index: true },
    { name: 'folder', type: 'relationship', relationTo: 'bookmark-collections', index: true },
    { name: 'website', type: 'relationship', relationTo: 'websites', required: true, index: true },
    { name: 'note', type: 'textarea' },
    { name: 'position', type: 'number', defaultValue: 0 },
  ],
}
