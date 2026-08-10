import type { Access } from 'payload'

export const isAdmin: Access = ({ req }) => req.user?.collection === 'admins'

export const isAdminOrSelf: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (!req.user) return false
  return { id: { equals: req.user.id } }
}

export const ownsDocument: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'members') return false
  return { owner: { equals: req.user.id } }
}

export const isMemberOrAdmin: Access = ({ req }) =>
  req.user?.collection === 'members' || req.user?.collection === 'admins'
