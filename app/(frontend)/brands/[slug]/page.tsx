import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { EditorialFooter, EditorialHeader } from '../../../_components/editorial-chrome'
import { isIndexableBrand, loadPublicBrand, loadPublicSites, taxonomySlug } from '../../../_data/load-library-data'
import { absoluteURL, jsonLd, truncateSEOText } from '../../../_data/seo'

export const revalidate = 300

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const brand = await loadPublicBrand(slug)
  if (!brand) return { title: 'Brand not found', robots: { index: false, follow: false } }

  const description = truncateSEOText(brand.note || `Explore the ${brand.name} ecommerce website, its industry, product categories, and storefront details in the INDIZIO library.`, 160)
  const pageTitle = truncateSEOText(`${brand.name} Website & Ecommerce Design`, 50)
  const indexable = isIndexableBrand(brand)

  return {
    title: pageTitle,
    description,
    alternates: { canonical: `/brands/${brand.slug}` },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: `${pageTitle} | INDIZIO`,
      description,
      url: `/brands/${brand.slug}`,
      type: 'website',
      images: brand.coverImage ? [{ url: brand.coverImage, alt: `${brand.name} ecommerce storefront` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${pageTitle} | INDIZIO`,
      description,
      images: brand.coverImage ? [brand.coverImage] : undefined,
    },
  }
}

export default async function BrandPage({ params }: PageProps) {
  const { slug } = await params
  const brand = await loadPublicBrand(slug)
  if (!brand) notFound()

  const catalog = await loadPublicSites()
  const related = catalog
    .filter((candidate) => candidate.id !== brand.id && candidate.industry === brand.industry && isIndexableBrand(candidate))
    .slice(0, 6)
  const industryHref = `/industries/${taxonomySlug(brand.industry)}`
  const description = brand.note || `${brand.name} is catalogued in the INDIZIO ecommerce website library under ${brand.industry}.`
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${absoluteURL(`/brands/${brand.slug}`)}#webpage`,
        url: absoluteURL(`/brands/${brand.slug}`),
        name: `${brand.name} Website & Ecommerce Design`,
        description,
        about: { '@type': 'Organization', name: brand.name, url: brand.url },
        primaryImageOfPage: brand.coverImage ? { '@type': 'ImageObject', url: brand.coverImage } : undefined,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Website library', item: absoluteURL('/library') },
          { '@type': 'ListItem', position: 2, name: brand.industry, item: absoluteURL(industryHref) },
          { '@type': 'ListItem', position: 3, name: brand.name, item: absoluteURL(`/brands/${brand.slug}`) },
        ],
      },
    ],
  }

  return (
    <>
      <a className="skip-link" href="#brand-profile">Skip to brand profile</a>
      <EditorialHeader active="library" />
      <main id="brand-profile" className="seo-detail ruled-section">
        <nav className="seo-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/library">Website library</Link><span>/</span><Link href={industryHref}>{brand.industry}</Link><span>/</span><span aria-current="page">{brand.name}</span>
        </nav>

        <header className="seo-detail__hero">
          <div>
            <p className="eyebrow">Storefront profile / {brand.industry}</p>
            <h1>{brand.name}</h1>
          </div>
          <div className="seo-detail__intro">
            <p>{description}</p>
            <div className="seo-detail__actions">
              <a className="line-button line-button--dark" href={brand.url} target="_blank" rel="noreferrer"><span>Visit storefront</span><span className="line-button__icon" aria-hidden="true">↗</span></a>
              <Link className="line-button" href={`/atlas?url=${encodeURIComponent(brand.url)}`}><span>Map in Brand Atlas</span><span className="line-button__icon" aria-hidden="true">→</span></Link>
            </div>
          </div>
        </header>

        <figure className="seo-detail__visual">
          {brand.coverImage ? <Image src={brand.coverImage} alt={`${brand.name} ecommerce storefront homepage`} fill sizes="(max-width: 900px) 100vw, 1200px" quality={80} priority /> : <span>{brand.name}</span>}
        </figure>

        <section className="seo-detail__facts" aria-label={`${brand.name} classification`}>
          <div><span>Industry</span><Link href={industryHref}>{brand.industry} ↗</Link></div>
          <div><span>Product categories</span><p>{brand.tags?.length ? brand.tags.join(' · ') : 'Classification in progress'}</p></div>
          <div><span>Public saves</span><p>{brand.saveCount || 0}</p></div>
          <div><span>Source</span><a href={brand.url} target="_blank" rel="noreferrer">Open website ↗</a></div>
        </section>

        {related.length > 0 && <section className="seo-related">
          <div className="seo-related__heading"><p className="eyebrow">Continue exploring</p><h2>More {brand.industry.toLowerCase()} websites.</h2><Link href={industryHref}>View the complete industry ↗</Link></div>
          <div className="seo-related__grid">
            {related.map((site) => <article key={site.id}>
              <Link className="seo-related__visual" href={`/brands/${site.slug}`}>{site.coverImage ? <Image src={site.coverImage} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" quality={70} /> : <span>{site.name}</span>}</Link>
              <p>{site.industry}</p><h3><Link href={`/brands/${site.slug}`}>{site.name}</Link></h3>
            </article>)}
          </div>
        </section>}
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <EditorialFooter />
    </>
  )
}
