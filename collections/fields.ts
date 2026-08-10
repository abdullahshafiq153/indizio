import type { Field, FieldHook } from 'payload'

export const formatSlug: FieldHook = ({ data, value }) => {
  const source = typeof value === 'string' && value ? value : data?.name || data?.title
  if (typeof source !== 'string') return value
  return source
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const slugField: Field = {
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  hooks: { beforeValidate: [formatSlug] },
}
