import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import path from 'node:path'

import { Admins } from './collections/Admins'
import { Articles } from './collections/Articles'
import { BookmarkCollections } from './collections/BookmarkCollections'
import { Bookmarks } from './collections/Bookmarks'
import { Curations } from './collections/Curations'
import { Industries } from './collections/Industries'
import { Members } from './collections/Members'
import { Styles } from './collections/Styles'
import { Websites } from './collections/Websites'

export default buildConfig({
  bin: [
    { key: 'seed', scriptPath: path.resolve(process.cwd(), 'scripts/seed.ts') },
  ],
  admin: {
    user: Admins.slug,
  },
  collections: [
    Admins,
    Members,
    Industries,
    Styles,
    Websites,
    Curations,
    Articles,
    BookmarkCollections,
    Bookmarks,
  ],
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/indizio',
  }),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'indizio-local-development-secret-change-me',
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  typescript: {
    outputFile: './payload-types.ts',
  },
})
