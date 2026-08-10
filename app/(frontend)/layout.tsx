import type { Metadata, Viewport } from 'next'
import { DM_Mono, Manrope } from 'next/font/google'
import '../../styles.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://indizio.space'),
  title: {
    default: 'INDIZIO — Evidence from the storefront',
    template: '%s | INDIZIO',
  },
  description: 'A living index of remarkable ecommerce websites, emerging patterns, and the details worth studying.',
  openGraph: {
    title: 'INDIZIO — Evidence from the storefront',
    description: 'Ecommerce websites, patterns, and research worth studying.',
    url: 'https://indizio.space',
    siteName: 'INDIZIO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INDIZIO — Evidence from the storefront',
    description: 'Ecommerce websites, patterns, and research worth studying.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#c7f8fe',
}

export default function FrontendLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
