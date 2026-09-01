import type { Metadata } from 'next'
import Link from 'next/link'

import { EditorialFooter, EditorialHeader } from '../../_components/editorial-chrome'
import { loadFieldnotes } from '../../_data/fieldnotes'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'CRO Fieldnotes',
  description: 'Original research into how leading ecommerce brands communicate value, reduce hesitation, and move customers toward conversion.',
  alternates: { canonical: '/fieldnotes' },
  openGraph: {
    title: 'CRO Fieldnotes | INDIZIO',
    description: 'Real storefront evidence translated into better conversion, merchandising, and customer-experience decisions.',
    url: '/fieldnotes',
  },
}

const formatDate = (value: string) => new Intl.DateTimeFormat('en', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
}).format(new Date(value))

export default async function FieldnotesPage() {
  const articles = await loadFieldnotes()
  const selectedFeatured = articles.filter((article) => article.featured)
  const featured = (selectedFeatured.length ? selectedFeatured : articles).slice(0, 2)
  const featuredIds = new Set(featured.map((article) => article.id))
  const remainingArticles = articles.filter((article) => !featuredIds.has(article.id))

  return (
    <>
      <a className="skip-link" href="#fieldnotes">Skip to fieldnotes</a>
      <EditorialHeader active="fieldnotes" />
      <main id="fieldnotes" className="fieldnotes-page ruled-section">
        <header className="fieldnotes-hero">
          <div>
            <p className="eyebrow">02 / CRO Fieldnotes</p>
            <h1>Understand what stronger storefronts do differently.</h1>
          </div>
          <p>Original research into how leading brands communicate value, reduce hesitation, merchandise products, and shape the path to purchase.</p>
        </header>

        <section className="featured-fieldnotes" aria-labelledby="featured-fieldnotes-heading">
          <header className="featured-fieldnotes__heading">
            <p className="eyebrow">Featured notes</p>
            <h2 id="featured-fieldnotes-heading">Start with the essential reads.</h2>
            <p>Essential storefront research for deciding what to build, change, and test next.</p>
          </header>
          <div className="featured-fieldnotes__grid">
            {featured.map((article, index) => (
              <article className="featured-fieldnote" key={article.id}>
                <div className="featured-fieldnote__meta"><span>0{index + 1}</span><span>{article.industry}</span><span>{article.readingTime} min</span></div>
                <div className="featured-fieldnote__copy">
                  <div className="fieldnote-row__tags"><span>{article.type}</span></div>
                  <h3><Link href={`/fieldnotes/${article.slug}`}>{article.title}</Link></h3>
                  <p>{article.excerpt}</p>
                </div>
                <Link className="featured-fieldnote__cta" href={`/fieldnotes/${article.slug}`}><span>Read featured note</span><i aria-hidden="true">↗</i></Link>
              </article>
            ))}
          </div>
        </section>

        <div className="fieldnotes-index-meta">
          <p>{remainingArticles.length.toString().padStart(2, '0')} more published notes</p>
          <p>Newest first</p>
        </div>

        <section className="fieldnotes-list" aria-label="CRO fieldnotes">
          {remainingArticles.map((article, index) => (
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
