import type { Metadata, Viewport } from 'next'
import { DM_Mono, Manrope } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ViewerProvider } from '../_components/viewer-context'
import { absoluteURL, jsonLd } from '../_data/seo'
import '../../styles.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://indizio.space'),
  title: {
    default: 'INDIZIO — Ecommerce intelligence for growing brands',
    template: '%s | INDIZIO',
  },
  description: 'Discover relevant ecommerce brands, investigate how their storefronts work, and turn real-world evidence into better growth decisions.',
  openGraph: {
    title: 'INDIZIO — Ecommerce intelligence for growing brands',
    description: 'Find the brands worth studying and the storefront decisions worth acting on.',
    url: 'https://indizio.space',
    siteName: 'INDIZIO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INDIZIO — Ecommerce intelligence for growing brands',
    description: 'Find the brands worth studying and the storefront decisions worth acting on.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f7f7f7',
}

export default function FrontendLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${absoluteURL('/')}#organization`,
    name: 'INDIZIO',
    url: absoluteURL('/'),
    logo: absoluteURL('/icon.svg'),
    description: 'Independent ecommerce research, storefront intelligence, and conversion fieldnotes.',
  }

  return (
    <html lang="en" className={`${manrope.variable} ${dmMono.variable}`}>
      <body>
        <ViewerProvider>{children}</ViewerProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema) }} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
