# Indizio Brand Atlas / Scraper — Living Product Specification

**Status:** V1 built; validation and iteration ongoing
**Last updated:** August 22, 2026

## 1. Purpose

Brand Atlas maps the useful public URLs belonging to an ecommerce domain so users can find product, collection, editorial, policy, account, and conversion-flow pages from one Indizio workspace.

It is the scraper/crawler module discussed for Indizio. The first version now supports authenticated user searches, persistent private history, sitemap-first discovery, and bounded same-domain fallback crawling.

## Current V1 behavior

- Users can enter a brand name already present in the Website Library.
- Users can paste a public HTTP or HTTPS website URL for any other brand.
- Completed results are reused from the user's history unless they explicitly refresh the map.
- Fresh completed maps are reused across users for 30 days, while each user's search history and ownership remain private.
- Shared maps older than 24 hours are returned immediately and refreshed in the background, with only one refresh running per domain.
- Newly discovered URLs are merged into the saved map after a background refresh.
- Brand and domain autocomplete suggests previously mapped sites as the user types.
- Runs continue after the initiating response and the interface polls their stored status.
- Results can be searched, filtered by page type, copied, and exported as CSV.
- Users can switch between the detailed list and a visual map organized as domain → page-type branches → representative URLs.
- Results are tagged with color-coded Shopify-aware page types including homepage, product, collection, blog, article, page, policy, cart, checkout, and gift card.
- Discovery checks declared sitemaps first and uses public same-domain links as a fallback and enrichment source.
- Each result is private to its owner and manageable in Payload by administrators.
- A run stores up to 5,000 URLs and clearly reports when that safety limit was reached.
- Crawl start, completion, failure, and failure-persistence events are written to structured runtime logs.

## 2. Core use case

A user opens an approved brand on Indizio and sees a categorized map of useful public pages instead of manually searching the website or relying on its navigation.

Example structure:

```text
Brand
├── Homepage
├── Product pages
├── Collections
├── Editorial and guides
├── About and brand story
├── Policies and help
├── Account and loyalty
└── Cart or other conversion surfaces
```

## 3. Inputs

- Approved Website Library domains
- Domains prioritized from the extension candidate queue
- Administrator-requested domains
- Exact pages already saved by extension users

User-saved pages must be preserved as explicit discoveries and distinguished from crawler-discovered pages.

## 4. Crawl behavior

The future crawler should:

1. Validate and normalize the starting domain.
2. Read permitted discovery sources such as the homepage, internal links, and XML sitemaps.
3. Stay within the approved domain and recognized related hostnames.
4. Respect crawl restrictions and configurable rate limits.
5. Canonicalize and deduplicate URLs.
6. Classify pages by type.
7. Store crawl timestamps and status.
8. Queue screenshots or metadata only for useful pages.
9. Surface ambiguous classifications for review.

## 5. Page record

- Exact URL
- Canonical URL
- Parent website
- Page title
- Page type
- Meta description
- Discovery source
- First and last discovered dates
- Last successful check
- HTTP and indexability status
- Screenshot when needed
- User-save count
- Editorial visibility

## 6. Public experience

Brand Atlas should eventually provide:

- Brand search
- Categorized page map
- Page-type filters
- One-click external opening
- Saving exact pages into user collections
- Links back to the main library record
- Related Fieldnotes and Ecommerce Ideas

Do not publish raw crawl output. Public results should be deduplicated, categorized, safe, and useful.

## 7. Admin experience

- Crawl request queue
- Priority and status
- Pages discovered, accepted, hidden, or failed
- Duplicate and redirect review
- Re-crawl controls
- Domain blocklist
- Crawl logs and failure reasons
- Manual page classification and visibility overrides

## 8. Safety and compliance

- Block localhost, private networks, unsupported protocols, and unsafe redirects.
- Prevent server-side request forgery.
- Apply per-domain concurrency and request limits.
- Respect applicable robots directives and site terms.
- Do not crawl authenticated, checkout, or personally identifiable customer areas.
- Do not submit forms or mutate third-party websites.
- Sanitize all captured metadata.
- Provide removal and blocklist workflows.

## 9. Relationship with other modules

- **Website Library:** supplies approved brand records and receives useful page summaries.
- **Chrome Extension:** supplies user-discovered domains and exact high-value pages.
- **CRO Fieldnotes:** references crawled pages as research evidence after editorial review.
- **Ecommerce Ideas:** links actionable concepts to relevant page examples.

## 10. Release phases

### Phase 1 — Internal crawler

- Crawl administrator-selected domains.
- Collect URLs and basic metadata.
- Deduplicate and classify common page types.
- Keep all output private.

### Phase 2 — Moderated Brand Atlas

- Add admin review and public visibility controls.
- Publish approved page maps for selected brands.
- Add freshness checks and re-crawls.

### Phase 3 — User experience

- Search and filters
- Exact-page saving
- Extension integration
- Prioritization based on community demand

## 11. Success metrics

- Useful pages found per approved domain
- Classification accuracy
- Crawl failure and duplicate rates
- External page-open rate
- Exact-page save rate
- Percentage of crawled pages approved for public display
- Freshness and broken-link rate

## 12. Open decisions

- Initial crawl depth and page limits
- Whether discovery starts with sitemaps, internal links, or both
- Which commerce platforms receive specialized adapters
- Recrawl frequency
- Whether screenshots are generated for every approved page or on demand
- Public naming: Brand Atlas, Site Map, Page Index, or another final label
