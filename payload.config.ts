import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { buildConfig } from 'payload'
import path from 'node:path'
import sharp from 'sharp'

import { Admins } from './collections/Admins'
import { Articles } from './collections/Articles'
import { BookmarkCollections } from './collections/BookmarkCollections'
import { Bookmarks } from './collections/Bookmarks'
import { Curations } from './collections/Curations'
import { CrawlRuns } from './collections/CrawlRuns'
import { Industries } from './collections/Industries'
import { Media } from './collections/Media'
import { Members } from './collections/Members'
import { Styles } from './collections/Styles'
import { Websites } from './collections/Websites'

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const trustedVercelOrigins = [
  process.env.VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
]
  .filter((hostname): hostname is string => Boolean(hostname))
  .map((hostname) => `https://${hostname}`)

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
    Media,
    Websites,
    Curations,
    Articles,
    BookmarkCollections,
    Bookmarks,
    CrawlRuns,
  ],
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/indizio',
  }),
  editor: lexicalEditor(),
  email: resendAdapter({
    apiKey: process.env.RESEND_API_KEY || '',
    defaultFromAddress: process.env.AUTH_FROM_EMAIL || 'accounts@indizio.space',
    defaultFromName: 'INDIZIO',
  }),
  plugins: [
    vercelBlobStorage({
      collections: {
        media: {
          prefix: 'media',
        },
      },
      clientUploads: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || 'indizio-local-development-secret-change-me',
  serverURL,
  sharp,
  csrf: [...new Set([serverURL, ...trustedVercelOrigins])],
  typescript: {
    outputFile: './payload-types.ts',
  },
})
