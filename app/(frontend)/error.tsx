'use client'

import Link from 'next/link'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-page">
      <div className="error-page__meta"><Link className="wordmark" href="/">INDIZIO<span className="wordmark-dot">●</span></Link><span>Error / Signal interrupted</span></div>
      <div className="error-page__copy"><p className="eyebrow">A temporary interruption</p><h1>We lost the signal.</h1><p>Your data is safe. Try the request once more, return to Brand Atlas, or go back to the index.</p><div className="error-page__actions"><button className="line-button line-button--dark" type="button" onClick={reset}><span>Try again</span><span className="line-button__icon" aria-hidden="true">↻</span></button><Link className="line-button" href="/atlas"><span>Back to Atlas</span><span className="line-button__icon" aria-hidden="true">←</span></Link><Link className="text-button" href="/">Return home</Link></div></div>
      <div className="error-page__code" aria-hidden="true">ERR</div>
    </main>
  )
}
