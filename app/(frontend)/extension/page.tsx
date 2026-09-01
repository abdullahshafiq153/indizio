import type { Metadata } from 'next'
import Link from 'next/link'

import { EditorialFooter, EditorialHeader } from '../../_components/editorial-chrome'
import { BrandMark } from '../../_components/brand-mark'

export const metadata: Metadata = {
  title: 'Chrome Extension',
  description: 'Build a private ecommerce research system by saving useful pages, observations, and collections from anywhere you browse.',
}

const downloadURL = '/downloads/indizio-extension-v0.1.0.zip'

export default function ExtensionPage() {
  return (
    <>
      <a className="skip-link" href="#extension-details">Skip to extension details</a>
      <EditorialHeader active="extension" />
      <main id="extension-details">
        <header className="extension-page-hero ruled-section">
          <div><p className="eyebrow">Indizio for Chrome / Development release</p><h1>Build your private<br />research system.</h1></div>
          <div className="extension-page-hero__aside"><p>Save any useful storefront page, add the observation worth remembering, and organize your research by project, campaign, or conversion opportunity.</p><div className="extension-page-actions"><a className="line-button line-button--dark" href={downloadURL} download><span>Download extension</span><span className="line-button__icon" aria-hidden="true">↓</span></a><Link className="text-button" href="#install">Installation guide</Link></div></div>
        </header>

        <section className="extension-product ruled-section" aria-label="Extension product preview">
          <div className="extension-product__sidebar"><p className="eyebrow">Your library travels with you</p><strong>Save page</strong><span>Library</span><span>Collections</span><span>Notes</span></div>
          <div className="extension-product__window"><div className="extension-preview__bar"><BrandMark className="extension-bar-mark" /><span>INDIZIO / SAVE PAGE</span><span>•••</span></div><div className="extension-product__content"><p className="eyebrow">Current discovery</p><h2>Remarkable storefront found.</h2><div className="extension-product__field"><span>Page</span><strong>Product detail page</strong></div><div className="extension-product__field"><span>Collection</span><strong>Product page research⌄</strong></div><div className="extension-product__field"><span>Note</span><strong>Add the clue worth remembering…</strong></div><div className="extension-product__save">Save to Indizio <span>+</span></div></div></div>
        </section>

        <section className="extension-benefits ruled-section">
          <article><span>01</span><h2>Capture the exact page.</h2><p>Save a homepage, product page, collection, article, or landing page with its title, canonical URL, description, and favicon.</p></article>
          <article><span>02</span><h2>Build research collections.</h2><p>Keep product-page ideas separate from navigation references, campaign research, client work, or any collection you create.</p></article>
          <article><span>03</span><h2>Find it from anywhere.</h2><p>Switch between a compact save view and your complete list or grid library directly inside the extension.</p></article>
        </section>

        <section className="extension-install ruled-section" id="install">
          <div><p className="eyebrow">Installation / Development release</p><h2>Install in four steps.</h2><p>The Chrome Web Store release is coming later. This development package can be installed manually today.</p><a className="line-button line-button--dark extension-install__download" href={downloadURL} download><span>Download extension ZIP</span><span className="line-button__icon" aria-hidden="true">↓</span></a></div>
          <ol><li><span>01</span><p>Download and unzip the extension package.</p></li><li><span>02</span><p>Open <strong>chrome://extensions</strong> and enable Developer mode.</p></li><li><span>03</span><p>Choose Load unpacked and select the unzipped extension folder.</p></li><li><span>04</span><p>Sign in to Indizio, open the extension, and connect your account.</p></li></ol>
        </section>

        <section className="extension-privacy ruled-section"><p className="eyebrow">Your independent research library</p><h2>Save any website—not only what’s on Indizio.</h2><p>Use the extension independently to save pages from anywhere on the web, including websites that are not part of the public Indizio library. Every discovery stays safely stored in your private account and organized in your own collections.</p></section>
      </main>
      <EditorialFooter />
    </>
  )
}
