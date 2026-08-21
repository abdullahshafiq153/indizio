# Indizio Website Library — Living Product Specification

**Status:** Live and evolving  
**Last updated:** August 22, 2026

## 1. Purpose

The Website Library is Indizio's core public product: a clean, searchable collection of ecommerce websites selected for the decisions behind their design. It should help designers, founders, marketers, and CRO researchers discover relevant storefronts quickly and preserve useful examples in private collections.

## 2. Product principles

1. Quality and useful classification matter more than raw volume.
2. Browsing should be fast, visual, and free of unnecessary card decoration.
3. Public pages should be indexable and genuinely useful, not thin SEO pages.
4. Saving should be immediate and use the same universal save model everywhere.
5. Editorially approved websites remain distinct from unreviewed community discoveries.

## 3. Current experience

- A homepage preview and dedicated `/library` page.
- Continuous loading on the library page rather than a manual load-more button.
- Search across brand, industry, style, and editorial observation.
- Industry filters displayed in a right-hand sidebar.
- Sorting and a view selector for two, three, or four columns; three is the default.
- Dynamic card skeletons while library data loads; static page elements do not use skeletons.
- Responsive layouts for desktop, tablet, and mobile.

## 4. Website card requirements

Each card should contain:

- Cover image
- Website name
- Collection/category and visual style
- One minimal external-link icon
- One universal save toggle
- Public total-save count beside the save control

The card should not display a date or a tag over the cover. The external-link action opens the website in a new tab. The save control uses an active state when the current user has saved the website and removes the save when selected again.

## 5. Website record

Minimum fields:

- Name
- Slug
- Canonical homepage URL
- Normalized domain
- Cover image
- Industry
- Style
- Short editorial note
- Publication status
- Featured order
- Public save count

Recommended enrichment fields:

- Ecommerce platform
- Country or market
- Tags
- Notable page types
- Date first reviewed
- Date last checked
- Source
- Related Fieldnotes and Ecommerce Ideas

## 6. Ingestion workflow

The preferred bulk workflow is a CSV importer backed by Payload:

1. Upload a structured CSV.
2. Normalize domains and URLs.
3. Detect duplicates.
4. Match or create controlled taxonomy values.
5. Create records as drafts.
6. Queue automatic cover capture.
7. Return created, skipped, duplicate, and failed rows.
8. Review records before public publication.

Accepted research inputs can include CSV, Excel exports, bookmarks exports, and structured text. The canonical import columns should include name, URL, industry, style, short note, tags, source, and featured status.

## 7. Cover images

Manual cover uploads remain available in Payload, but the scalable path is automated capture:

- Use a consistent desktop viewport.
- Capture a fixed card-friendly region rather than a very tall full-page image.
- Optimize to WebP.
- Upload to Payload's configured media storage.
- Retry failures and expose a manual replacement control.
- Never block record creation while the screenshot is processing.

## 8. Saves and collections

- Signed-out users are prompted to register or sign in.
- Signed-in users save immediately to default saves.
- A toast identifies the destination and offers **Change collection**.
- The collection action is disabled with a circular loader until its data is available.
- The toast slides in from the left and exits the same way, with no outer shadow.
- Users manage all saved websites on a dedicated page.
- Collections are optional and private by default.

The Chrome extension specification is the canonical reference for universal saves, unknown domains, and candidate discovery.

## 9. SEO architecture

Planned indexable routes:

- `/library`
- `/websites/[slug]`
- `/industries/[slug]`
- `/styles/[slug]`
- `/platforms/[slug]`

Every indexable detail or taxonomy page should provide original context, descriptive metadata, canonical URLs, internal links, useful related entries, accessible image alt text, and inclusion in dynamic XML/image sitemaps. Avoid automatically indexing thin filter combinations.

## 10. Performance requirements

- Server-render the initial useful result set.
- Optimize covers through `next/image` and accurate responsive sizes.
- Lazy-load noncritical covers.
- Use skeletons only for dynamic content.
- Keep searching, filtering, and optimistic saves responsive.
- Preserve infinite-scroll accessibility and provide recoverable error states.

## 11. Success metrics

- Library visits from organic search
- Website-card outbound click rate
- Save rate per viewed website
- Searches and filter usage
- Repeat visitor rate
- Approved websites with complete taxonomy and covers
- Page speed and Core Web Vitals
- Zero-result search rate

## 12. Near-term roadmap

1. Build the CSV importer.
2. Automate cover capture and upload.
3. Add full website detail pages.
4. Publish useful industry, style, and platform landing pages.
5. Connect extension-discovered candidates after moderation.
6. Connect Brand Atlas page maps when the crawler is ready.

