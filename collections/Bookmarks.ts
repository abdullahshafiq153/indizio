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

      const pageURL = typeof data?.pageURL === 'string' ? data.pageURL : ''
      return { ...data, owner: req.user.id, pageKey: pageURL || `website:${String(data?.website || '')}` }
    }],
  },
  indexes: [
    { fields: ['owner', 'folder', 'pageKey'], unique: true },
  ],
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'members', required: true, index: true },
    { name: 'folder', type: 'relationship', relationTo: 'bookmark-collections', index: true },
    { name: 'website', type: 'relationship', relationTo: 'websites', required: true, index: true },
    { name: 'pageURL', type: 'text', index: true },
    { name: 'pageKey', type: 'text', index: true, admin: { hidden: true } },
    { name: 'pageTitle', type: 'text' },
    { name: 'pageDescription', type: 'textarea' },
    { name: 'faviconURL', type: 'text' },
    { name: 'source', type: 'select', defaultValue: 'website', options: ['website', 'extension'] },
    { name: 'note', type: 'textarea' },
    { name: 'position', type: 'number', defaultValue: 0 },
  ],
}
