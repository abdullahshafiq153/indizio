import type { CollectionConfig } from 'payload'

import { isAdmin } from './access'
import { slugField } from './fields'

export const Industries: CollectionConfig = {
  slug: 'industries',
  admin: { group: 'Library', useAsTitle: 'name' },
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [{ name: 'name', type: 'text', required: true }, slugField],
}
