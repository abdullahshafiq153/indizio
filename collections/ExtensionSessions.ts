import type { CollectionConfig } from 'payload'

import { isAdmin } from './access'

export const ExtensionSessions: CollectionConfig = {
  slug: 'extension-sessions',
  admin: { group: 'Community', useAsTitle: 'id', defaultColumns: ['owner', 'expiresAt', 'lastUsedAt', 'createdAt'] },
  access: { create: isAdmin, read: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'members', required: true, index: true },
    { name: 'tokenHash', type: 'text', required: true, unique: true, index: true, admin: { hidden: true } },
    { name: 'expiresAt', type: 'date', required: true, index: true },
    { name: 'lastUsedAt', type: 'date' },
    { name: 'revoked', type: 'checkbox', defaultValue: false },
  ],
}
