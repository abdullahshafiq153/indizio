import type { CollectionConfig } from 'payload'

import { isAdmin } from './access'
import { slugField } from './fields'

export const Styles: CollectionConfig = {
  slug: 'styles',
  labels: { singular: 'Product tag', plural: 'Product tags' },
  admin: { group: 'Library', useAsTitle: 'name' },
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [{ name: 'name', type: 'text', required: true }, slugField],
}
