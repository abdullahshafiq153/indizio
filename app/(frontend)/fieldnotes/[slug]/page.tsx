import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { EditorialFooter, EditorialHeader } from '../../../_components/editorial-chrome'
import { ReadingProgress } from '../../../_components/reading-progress'
import { loadEditorialViewer } from '../../../_data/editorial-viewer'
import { fallbackFieldnotes, loadFieldnote } from '../../../_data/fieldnotes'

export const revalidate = 300

type PageProps = { params: Promise<{ slug: string }> }

const formatDate = (value: string) => new Intl.DateTimeFormat('en', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
}).format(new Date(value))

export function generateStaticParams() {
  return fallbackFieldnotes.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await loadFieldnote(slug)
  if (!article) return { title: 'Fieldnote not found' }

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/fieldnotes/${article.slug}` },
    openGraph: {
      title: `${article.title} | INDIZIO`,
      description: article.excerpt,
      type: 'article',
      url: `/fieldnotes/${article.slug}`,
      publishedTime: article.publishedAt,
    },
  }
}

export default async function FieldnoteArticlePage({ params }: PageProps) {
  const { slug } = await params
  const [article, viewer] = await Promise.all([loadFieldnote(slug), loadEditorialViewer()])
  if (!article) notFound()

  return (
    <>
      <a className="skip-link" href="#article">Skip to article</a>
      <EditorialHeader active="fieldnotes" member={viewer.member} bookmarkCount={viewer.bookmarkCount} />
      <ReadingProgress />
      <main id="article" className="article-page ruled-section">
        <header className="article-hero">
          <Link className="article-back" href="/fieldnotes">← All fieldnotes</Link>
          <div className="article-tags"><span>{article.industry}</span><span>{article.type}</span></div>
          <h1>{article.title}</h1>
          <p className="article-deck">{article.excerpt}</p>
          <div className="article-byline"><span>INDIZIO Research</span><span>{formatDate(article.publishedAt)}</span><span>{article.readingTime} min read</span></div>
        </header>

        <div className="article-layout">
          <aside className="article-aside">
            <p className="footer-label">Filed under</p>
            <p>{article.industry}</p>
            <p>{article.type}</p>
            <Link href="#newsletter">Get the next fieldnote ↘</Link>
          </aside>
          <article className="article-body">
            {article.content ? (
              <RichText data={article.content as unknown as SerializedEditorState} />
            ) : (
              article.fallbackContent?.map((block, index) => {
                if (block.type === 'heading') return <h2 key={index}>{block.text}</h2>
                if (block.type === 'quote') return <blockquote key={index}>{block.text}</blockquote>
                return <p key={index}>{block.text}</p>
              })
            )}
          </article>
        </div>

        <section className="article-next">
          <p className="eyebrow">Continue the research</p>
          <Link href="/fieldnotes"><span>Explore every CRO fieldnote.</span><i aria-hidden="true">↗</i></Link>
        </section>
      </main>
      <EditorialFooter />
    </>
  )
}
