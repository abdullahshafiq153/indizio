import type { Metadata } from 'next'
import Link from 'next/link'

import { EditorialFooter, EditorialHeader } from '../../_components/editorial-chrome'

export const metadata: Metadata = {
  title: 'Chrome Extension',
  description: 'Save, organize, and revisit ecommerce research from any website with the Indizio Chrome extension.',
}

const downloadURL = '/downloads/indizio-extension-v0.1.0.zip'

export default function ExtensionPage() {
  return (
    <>
      <a className="skip-link" href="#extension-details">Skip to extension details</a>
      <EditorialHeader />
      <main id="extension-details">
        <header className="extension-page-hero ruled-section">
          <div><p className="eyebrow">Indizio for Chrome / V0.1</p><h1>Keep every clue.<br />Keep browsing.</h1></div>
          <div className="extension-page-hero__aside"><p>Save the exact ecommerce pages that matter, organize them into research collections, and open your complete library without losing your place.</p><div className="extension-page-actions"><a className="line-button line-button--dark" href={downloadURL} download><span>Download extension</span><span className="line-button__icon" aria-hidden="true">↓</span></a><Link className="text-button" href="#install">Installation guide</Link></div></div>
        </header>

        <section className="extension-product ruled-section" aria-label="Extension product preview">
          <div className="extension-product__sidebar"><p className="eyebrow">Your library travels with you</p><strong>Save page</strong><span>Library</span><span>Collections</span><span>Notes</span></div>
          <div className="extension-product__window"><div className="extension-preview__bar"><span /><span>INDIZIO / SAVE PAGE</span><span>•••</span></div><div className="extension-product__content"><p className="eyebrow">Current discovery</p><h2>Remarkable storefront found.</h2><div className="extension-product__field"><span>Page</span><strong>Product detail page</strong></div><div className="extension-product__field"><span>Collection</span><strong>Product page research⌄</strong></div><div className="extension-product__field"><span>Note</span><strong>Add the clue worth remembering…</strong></div><div className="extension-product__save">Save to Indizio <span>+</span></div></div></div>
        </section>

        <section className="extension-benefits ruled-section">
          <article><span>01</span><h2>Capture the exact page.</h2><p>Save a homepage, product page, collection, article, or landing page with its title, canonical URL, description, and favicon.</p></article>
          <article><span>02</span><h2>Build research collections.</h2><p>Keep product-page ideas separate from navigation references, campaign research, client work, or any collection you create.</p></article>
          <article><span>03</span><h2>Find it from anywhere.</h2><p>Switch between a compact save view and your complete list or grid library directly inside the extension.</p></article>
        </section>

        <section className="extension-install ruled-section" id="install">
          <div><p className="eyebrow">Installation / Development release</p><h2>Install in four steps.</h2><p>The Chrome Web Store release is coming later. This development package can be installed manually today.</p></div>
          <ol><li><span>01</span><p>Download and unzip the extension package.</p></li><li><span>02</span><p>Open <strong>chrome://extensions</strong> and enable Developer mode.</p></li><li><span>03</span><p>Choose Load unpacked and select the unzipped extension folder.</p></li><li><span>04</span><p>Sign in to Indizio, open the extension, and connect your account.</p></li></ol>
          <a className="line-button line-button--dark" href={downloadURL} download><span>Download extension ZIP</span><span className="line-button__icon" aria-hidden="true">↓</span></a>
        </section>

        <section className="extension-privacy ruled-section"><p className="eyebrow">Built for deliberate research</p><h2>Nothing is published automatically.</h2><p>The extension reads the page only when you open it. Unknown websites are stored privately for your account and enter an editorial review queue—they never appear in the public Indizio library without approval.</p></section>
      </main>
      <EditorialFooter />
    </>
  )
}
