import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { EditorialFooter, EditorialHeader } from '../../../_components/editorial-chrome'
import { getIndustrySEO } from '../../../_data/industry-seo'
import { isIndexableIndustry, loadPublicIndustry } from '../../../_data/load-library-data'
import { absoluteURL, jsonLd } from '../../../_data/seo'

export const revalidate = 300

type PageProps = { params: Promise<{ slug: string }> }

function industryDescription(name: string, count: number) {
  return `Explore ${count} curated ${name.toLowerCase()} ecommerce websites, with real examples of storefront design, product discovery, merchandising, and conversion patterns.`
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const industry = await loadPublicIndustry(slug)
  if (!industry) return { title: 'Industry not found', robots: { index: false, follow: false } }
  const description = industryDescription(industry.name, industry.sites.length)
  const indexable = isIndexableIndustry(industry)
  return {
    title: `Best ${industry.name} Ecommerce Websites`,
    description,
    alternates: { canonical: `/industries/${industry.slug}` },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: `Best ${industry.name} Ecommerce Websites | INDIZIO`,
      description,
      url: `/industries/${industry.slug}`,
      type: 'website',
      images: industry.sites[0]?.coverImage ? [{ url: industry.sites[0].coverImage, alt: `${industry.name} ecommerce website inspiration` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Best ${industry.name} Ecommerce Websites | INDIZIO`,
      description,
      images: industry.sites[0]?.coverImage ? [industry.sites[0].coverImage] : undefined,
    },
  }
}

export default async function IndustryPage({ params }: PageProps) {
  const { slug } = await params
  const industry = await loadPublicIndustry(slug)
  if (!industry) notFound()

  const description = industryDescription(industry.name, industry.sites.length)
  const editorial = getIndustrySEO(industry.slug, industry.name)
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${absoluteURL(`/industries/${industry.slug}`)}#collection`,
        url: absoluteURL(`/industries/${industry.slug}`),
        name: `Best ${industry.name} Ecommerce Websites`,
        description,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: industry.sites.length,
          itemListElement: industry.sites.map((site, index) => ({
            '@type': 'ListItem', position: index + 1, name: site.name, url: absoluteURL(`/brands/${site.slug}`),
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Website library', item: absoluteURL('/library') },
          { '@type': 'ListItem', position: 2, name: industry.name, item: absoluteURL(`/industries/${industry.slug}`) },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: editorial.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  }

  return (
    <>
      <a className="skip-link" href="#industry-index">Skip to industry websites</a>
      <EditorialHeader active="library" />
      <main id="industry-index" className="seo-industry ruled-section">
        <nav className="seo-breadcrumbs" aria-label="Breadcrumb"><Link href="/library">Website library</Link><span>/</span><span aria-current="page">{industry.name}</span></nav>
        <header className="seo-industry__hero">
          <div><p className="eyebrow">Industry index / {String(industry.sites.length).padStart(2, '0')} brands</p><h1>{industry.name}<br />ecommerce websites.</h1></div>
          <div><p>{description}</p><Link className="line-button line-button--dark" href="/library"><span>Search the complete library</span><span className="line-button__icon" aria-hidden="true">↗</span></Link></div>
        </header>

        {industry.tags.length > 0 && <section className="seo-industry__tags" aria-label={`${industry.name} product categories`}><span>Common product categories</span><div>{industry.tags.map((tag) => <span key={tag.name}>{tag.name} <small>{tag.count}</small></span>)}</div></section>}

        <section className="seo-industry__editorial" aria-labelledby="industry-guide-heading">
          <div><p className="eyebrow">Research guide</p><h2 id="industry-guide-heading">What to study in {industry.name.toLowerCase()} ecommerce.</h2></div>
          <div><p>{editorial.intro}</p><ul>{editorial.study.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </section>

        <section className="seo-industry__list" aria-label={`${industry.name} websites`}>
          {industry.sites.map((site, index) => <article key={site.id}>
            <Link className="seo-industry-card__visual" href={`/brands/${site.slug}`}>
              {site.coverImage ? <Image src={site.coverImage} alt={`${site.name} ecommerce storefront`} fill sizes="(max-width: 700px) 100vw, 340px" quality={70} /> : <span>{site.name}</span>}
            </Link>
            <div className="seo-industry-card__number">{String(index + 1).padStart(2, '0')}</div>
            <div className="seo-industry-card__copy"><h2><Link href={`/brands/${site.slug}`}>{site.name}</Link></h2><p>{site.note || `${site.name} is part of the INDIZIO ${industry.name} ecommerce index.`}</p><div>{site.tags?.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div></div>
            <div className="seo-industry-card__actions"><Link href={`/brands/${site.slug}`}>View profile →</Link><a href={site.url} target="_blank" rel="noreferrer">Visit site ↗</a></div>
          </article>)}
        </section>

        <section className="seo-industry__faq" aria-labelledby="industry-faq-heading">
          <div><p className="eyebrow">Questions answered</p><h2 id="industry-faq-heading">About this {industry.name.toLowerCase()} website index.</h2></div>
          <div>{editorial.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div>
        </section>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <EditorialFooter />
    </>
  )
}
