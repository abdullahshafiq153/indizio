import type { CollectionConfig } from 'payload'

import { isAdmin } from './access'
import { slugField } from './fields'

export const Curations: CollectionConfig = {
  slug: 'curations',
  admin: { group: 'Editorial', useAsTitle: 'name' },
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField,
    { name: 'description', type: 'textarea' },
    { name: 'websites', type: 'relationship', relationTo: 'websites', hasMany: true },
  ],
}
