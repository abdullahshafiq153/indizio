import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  agentRules: false,
  reactStrictMode: true,
}

export default withPayload(nextConfig)
