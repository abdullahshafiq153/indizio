import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  agentRules: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 604800,
    qualities: [70, 80],
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1440],
    imageSizes: [128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'indizio.space', pathname: '/api/media/file/**' },
      { protocol: 'https', hostname: 'www.indizio.space', pathname: '/api/media/file/**' },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
}

export default withPayload(nextConfig)
