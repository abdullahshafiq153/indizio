import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="error-page">
      <div className="error-page__meta"><Link className="wordmark" href="/">INDIZIO<span className="wordmark-dot">●</span></Link><span>404 / Signal not found</span></div>
      <div className="error-page__copy"><p className="eyebrow">The trail ends here</p><h1>This page left no trace.</h1><p>The address may have moved, changed, or never existed. Return to the index and keep exploring.</p><Link className="line-button line-button--dark" href="/"><span>Back to INDIZIO</span><span className="line-button__icon" aria-hidden="true">↗</span></Link></div>
      <div className="error-page__code" aria-hidden="true">404</div>
    </main>
  )
}
