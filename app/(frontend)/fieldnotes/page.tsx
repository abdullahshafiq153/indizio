import type { Metadata } from 'next'
import Link from 'next/link'

import { EditorialFooter, EditorialHeader } from '../../_components/editorial-chrome'
import { loadEditorialViewer } from '../../_data/editorial-viewer'
import { loadFieldnotes } from '../../_data/fieldnotes'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'CRO Fieldnotes',
  description: 'Brand teardowns, conversion blueprints, and evidence-backed observations from modern ecommerce storefronts.',
  alternates: { canonical: '/fieldnotes' },
  openGraph: {
    title: 'CRO Fieldnotes | INDIZIO',
    description: 'Long-form ecommerce research, brand teardowns, and practical conversion blueprints.',
    url: '/fieldnotes',
  },
}

const formatDate = (value: string) => new Intl.DateTimeFormat('en', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
}).format(new Date(value))

export default async function FieldnotesPage() {
  const [articles, viewer] = await Promise.all([loadFieldnotes(), loadEditorialViewer()])

  return (
    <>
      <a className="skip-link" href="#fieldnotes">Skip to fieldnotes</a>
      <EditorialHeader active="fieldnotes" member={viewer.member} bookmarkCount={viewer.bookmarkCount} />
      <main id="fieldnotes" className="fieldnotes-page ruled-section">
        <header className="fieldnotes-hero">
          <div>
            <p className="eyebrow">03 / CRO Fieldnotes</p>
            <h1>Research for better decisions.</h1>
          </div>
          <p>Long-form brand teardowns, industry blueprints, and conversion patterns—written to explain not only what works, but why.</p>
        </header>

        <div className="fieldnotes-index-meta">
          <p>{articles.length.toString().padStart(2, '0')} published notes</p>
          <p>Newest first</p>
        </div>

        <section className="fieldnotes-list" aria-label="CRO fieldnotes">
          {articles.map((article, index) => (
            <article className="fieldnote-row" key={article.id}>
              <div className="fieldnote-row__number">{String(index + 1).padStart(2, '0')}</div>
              <div className="fieldnote-row__content">
                <div className="fieldnote-row__tags"><span>{article.industry}</span><span>{article.type}</span></div>
                <h2><Link href={`/fieldnotes/${article.slug}`}>{article.title}</Link></h2>
                <p>{article.excerpt}</p>
              </div>
              <div className="fieldnote-row__aside">
                <span>{formatDate(article.publishedAt)}</span>
                <span>{article.readingTime} min read</span>
                <Link href={`/fieldnotes/${article.slug}`} aria-label={`Read ${article.title}`}>Read fieldnote <i aria-hidden="true">↗</i></Link>
              </div>
            </article>
          ))}
        </section>
      </main>
      <EditorialFooter />
    </>
  )
}
