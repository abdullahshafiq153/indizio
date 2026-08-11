import type { CollectionConfig } from 'payload'

import { isAdmin } from './access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Library',
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  upload: {
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 323,
        position: 'top',
      },
      {
        name: 'card',
        width: 1200,
        height: 968,
        position: 'top',
      },
    ],
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alternative text',
      admin: {
        description: 'Describe the storefront shown in this image.',
      },
    },
  ],
}
