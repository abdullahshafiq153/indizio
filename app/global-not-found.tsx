import type { Metadata } from 'next'
import Link from 'next/link'
import '../styles.css'

export const metadata: Metadata = {
  title: 'Signal not found | INDIZIO',
  description: 'The requested page could not be found.',
}

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main className="error-page">
          <div className="error-page__meta"><Link className="wordmark" href="/">INDIZIO<span className="wordmark-dot">●</span></Link><span>404 / Signal not found</span></div>
          <div className="error-page__copy"><p className="eyebrow">The trail ends here</p><h1>This page left no trace.</h1><p>The address may have moved, changed, or never existed. Return to the index and keep exploring.</p><Link className="line-button line-button--dark" href="/"><span>Back to INDIZIO</span><span className="line-button__icon" aria-hidden="true">↗</span></Link></div>
          <div className="error-page__code" aria-hidden="true">404</div>
        </main>
      </body>
    </html>
  )
}
