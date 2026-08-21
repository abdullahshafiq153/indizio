# Indizio Chrome Extension — Living Product Specification

**Status:** Planned  
**Last updated:** August 22, 2026  
**Document purpose:** Preserve the agreed product decisions for the Indizio Chrome extension and its supporting website functionality. Update this document whenever the extension scope changes.

## 1. Product vision

The Indizio Chrome extension will let users capture ecommerce research without interrupting their browsing. It should combine the speed of a browser bookmarker such as Raindrop with Indizio's curated ecommerce library, research collections, public save signals, and future Brand Atlas crawler.

The extension is not only a bookmarking utility. It is also a community-powered discovery channel through which Indizio can identify ecommerce websites and important pages that are not yet present in the public library.

## 2. Core principles

1. Saving must be fast and require as little effort as possible.
2. A collection is optional. A user can save first and organize later.
3. The same save system must work on the Indizio website and in the Chrome extension.
4. Users can save any public website or page, even if it is not already in the Indizio library.
5. User collections and identity remain private unless a future sharing feature is explicitly introduced.
6. User-submitted websites must never become public library entries automatically.
7. Community activity should help Indizio discover and prioritize new ecommerce brands without reducing editorial quality.

## 3. Terminology

### Save

The primary user action. "Save" replaces the need for separate like and bookmark actions.

A save has two roles:

- It places a website or page in the user's private research library.
- It contributes to the public save count of an approved library website.

### Default saves

Every account has a default saves area. If the user does not select a collection, the item is stored there automatically.

### Collection

A private user-created folder for organizing saved research, similar to Pinterest boards or Raindrop collections.

### Website

The normalized ecommerce domain or brand record, for example `brand.com`.

### Saved page

The exact page the user captured, for example `brand.com/products/example` or `brand.com/pages/returns`.

### Website candidate

A private moderation record created when users save a domain that is not already in the public Indizio library.

### Public library website

A website reviewed and approved by Indizio. It can appear in public search, filters, category pages, save rankings, and sitemaps.

## 4. Agreed saving model

Likes and bookmarks will not be separate concepts. Indizio will use one save action.

- Saving an approved website counts as a public save signal.
- Removing the user's final save of that website removes their corresponding signal.
- Users may organize saves into collections.
- The public website card displays the total number of saves beside the save icon.
- The same button saves and unsaves a website on the homepage, library page, bookmark page, and later in the extension.
- The bookmarks page should not have a separate remove button. The save button toggles removal, while an edit action lets the user change collection placement.

### Counting rule requiring final confirmation

The current product direction says that adding one website to two collections can count as two saves. This makes collection placements the public signal rather than unique savers.

Before the extension is built, confirm whether the public count should be:

- **Collection placements:** one person can contribute multiple saves by placing the website in multiple collections; or
- **Unique savers:** one public save per user per website, regardless of collections.

Recommendation: display unique savers publicly and track collection placements privately. This prevents one user from disproportionately inflating popularity while preserving collection data for discovery scoring.

## 5. Extension saving flow

### 5.1 Opening the extension

The extension reads the active tab's:

- Full URL
- Normalized domain
- Page title
- Meta description when available
- Favicon
- Canonical URL when available

The interface should immediately display the detected website and page.

### 5.2 Signed-out user

If the user is not authenticated:

1. Show a clear sign-in or create-account action.
2. Return the user to the same save flow after authentication.
3. Do not discard the active page while authentication is happening.

### 5.3 Fast default save

The primary action saves the page immediately to the user's default saves area.

After the click:

1. Update the save control optimistically.
2. Show a notification immediately.
3. Display `Saved to Your saves` or the relevant collection name.
4. Include a **Change collection** action.
5. If collection data is still loading, show the action in a disabled state with a small circular loader.
6. Enable the action without dismissing the notification once the data is ready.
7. Animate the notification in from the left and back out.
8. Do not add a drop shadow around the notification.

### 5.4 Selecting a collection

Users can:

- Keep the item in default saves.
- Move it to an existing collection.
- Add it to another collection if multiple placements are supported.
- Create a collection without abandoning the current save.
- Edit the collection later from the dedicated saves page.

### 5.5 Unsaving

If the active page or its parent website is already saved, the same control should clearly appear active and allow the user to remove it. The UI should update optimistically and roll back if the request fails.

## 6. Saving a website that is not in Indizio

This must feel exactly as fast as saving an existing library website.

### Required system behavior

1. Normalize the submitted URL.
2. Check for an existing saved page by canonical URL.
3. Check for an existing website by normalized registrable domain.
4. If the website exists, attach the saved page to it.
5. If the website does not exist, create or update a private website candidate.
6. Save the page to the user's selected collection immediately.
7. Queue metadata enrichment and cover generation asynchronously.
8. Show a message such as `Saved to Website inspiration. This site is new to Indizio.`

The user must not wait for candidate creation, screenshot generation, categorization, or moderation before the save succeeds.

## 7. Domain and page data model

Store brands/domains separately from individual pages:

```text
Website / brand
├── Homepage
├── Product pages
├── Collection pages
├── Cart and checkout-related pages
├── Policy and informational pages
└── Other user-saved pages
```

Saving a homepage and a product page on the same domain should create one website record with two page records, not two separate brands.

### URL normalization requirements

- Lowercase the hostname.
- Remove URL fragments.
- Remove tracking parameters such as common UTM parameters.
- Preserve query parameters that materially identify page content.
- Follow or resolve known redirect and canonical URLs asynchronously.
- Treat `www` and non-`www` variants as the same domain when appropriate.
- Detect obvious duplicate URLs before creating records.
- Reject unsupported protocols and local/private network addresses.

## 8. Website candidate discovery queue

Payload should contain a private `Website Candidates` collection or equivalent admin view.

Each candidate should include:

- Normalized domain
- First submitted URL
- All discovered or saved page URLs
- Automatically detected brand name
- Favicon and generated cover
- First discovered date
- Most recent save date
- Unique saver count
- Total save or collection-placement count
- Suggested industry
- Suggested style and tags
- Detected commerce platform when available
- Referring source (`extension`, `manual import`, or future crawler)
- Moderation status
- Internal editorial notes
- Rejection or duplicate reason

### Candidate statuses

```text
New → Enriching → Ready for review → Approved
                                 ├── Rejected
                                 └── Duplicate
```

### Suggested discovery score

Unique users should carry more weight than repeated actions by one user.

```text
score =
  unique savers × 5
  + total valid saves × 2
  + recency bonus
  + number of distinct useful pages
```

The exact weights should remain configurable and should not be exposed publicly.

## 9. Moderation and publication

Before approval, a candidate:

- Is visible only to users who saved it and to Indizio administrators.
- Does not appear in the public website library.
- Does not appear in public search, filters, rankings, related websites, or sitemaps.
- May contribute to a private discovery score.

After approval:

- The candidate becomes or connects to a public website record.
- Existing user saves automatically point to the approved record.
- Legitimate accumulated save signals may appear publicly.
- Indizio adds editorial classification, descriptions, observations, and a reviewed cover.
- The website becomes eligible for public search and SEO landing pages.

Moderation should protect the public library against spam, affiliate pages, phishing, adult content, internal URLs, duplicate brands, and irrelevant non-commerce websites.

## 10. Privacy and user trust

Suggested user-facing explanation:

> Your saves and collections remain private. New domains may be reviewed for inclusion in the public Indizio library, but your identity and collection names are never published.

The extension should eventually support a **private or sensitive save** option. A sensitive save remains in the user's account but does not enter the discovery queue or contribute to public popularity signals.

Never expose:

- Which individual user saved a website
- Private collection names
- Private notes
- Browsing history beyond pages the user explicitly saves
- Authentication tokens or extension secrets

## 11. Cover images and enrichment

Cover creation must be automatic wherever possible.

When a new domain enters the discovery queue:

1. Queue a standardized desktop screenshot.
2. Wait for primary content and fonts within a bounded timeout.
3. Capture a fixed viewport suitable for Indizio website cards.
4. Optimize the image to WebP or another supported efficient format.
5. Upload it to Indizio's Payload media storage.
6. Attach it to the candidate.
7. Retry transient failures.
8. Allow an administrator to replace the generated cover manually.

Screenshot processing must happen asynchronously and must never block the user's save action.

## 12. Relationship with Brand Atlas

Brand Atlas is the planned fifth Indizio module. Its purpose is to map useful pages belonging to an ecommerce domain.

The extension and Brand Atlas should share the same website/page model:

- Extension saves reveal pages users already consider valuable.
- Candidate data identifies which domains deserve crawling first.
- Brand Atlas can later discover remaining product, collection, policy, editorial, and conversion-flow pages.
- User-saved pages must be preserved and distinguished from crawler-discovered pages.

The crawler is explicitly out of scope for the first extension release.

## 13. Website integration

The website currently provides the intended interaction foundation:

- Account sign-up and sign-in
- Default saves
- User collections
- Save and unsave toggle
- Public total-save count on website cards
- Optimistic operations
- Collection-change notification flow
- Dedicated saves page

The extension must use the same backend records and counting rules rather than maintaining a separate bookmark database.

The homepage includes a planned Chrome extension section and waitlist CTA. Replace the waitlist CTA with a Chrome Web Store install link only when a public release exists.

## 14. Technical architecture direction

### Extension

- Chrome Manifest V3
- React and TypeScript interface
- Minimal popup or side-panel UI
- Background service worker for authentication and API communication
- Active-tab permission only where possible
- Secure server-issued session or short-lived token
- No permanent application secrets embedded in the extension bundle

### Indizio backend

- Payload CMS and MongoDB remain the source of truth.
- Use authenticated API endpoints specifically designed for extension clients.
- Apply rate limits to authentication, save, candidate, and enrichment endpoints.
- Make write operations idempotent to prevent duplicate records from retries.
- Use asynchronous jobs for screenshots, metadata enrichment, and later crawling.
- Log candidate creation and moderation actions for auditing.

## 15. Performance requirements

- The save UI should respond visually immediately through optimistic state.
- Normal save requests should target sub-second completion under ordinary conditions.
- Collection information may load separately and must not delay the initial save.
- Retried requests must not create duplicate saves or candidate websites.
- Screenshot and enrichment jobs must run outside the interactive request.
- The extension should remain usable when enrichment services are unavailable.

## 16. Abuse and security requirements

- Validate every submitted URL on the server.
- Block localhost, private IP ranges, file URLs, browser-internal URLs, and unsupported schemes.
- Protect screenshot and crawler workers against server-side request forgery.
- Rate-limit saves and new-domain submissions.
- Detect repeated spam domains and suspicious account behavior.
- Sanitize all external metadata before displaying it.
- Do not execute website-supplied scripts outside an isolated browser environment.
- Provide a mechanism to block domains from future candidate creation.

## 17. Release phases

### Phase 0 — Foundation

- Finalize the save-counting rule.
- Refactor the backend into universal website and saved-page records.
- Add website candidates and moderation statuses.
- Add extension-safe authentication endpoints.

### Phase 1 — Minimum viable extension

- Authenticate with an Indizio account.
- Read the active tab.
- Save any public URL to default saves.
- Choose or create a collection.
- Unsave an existing page.
- Create private candidates for unknown domains.
- Display immediate success and error states.

### Phase 2 — Discovery operations

- Candidate admin queue
- Automatic metadata and screenshots
- Duplicate detection
- Candidate scoring and sorting
- Approval workflow connecting saves to public websites

### Phase 3 — Research experience

- Notes and tags
- Page-type detection
- Improved collection management
- Search across saved pages
- Optional shared collections

### Phase 4 — Brand Atlas

- Domain crawling
- Page classification
- Brand page maps
- Crawl controls and freshness checks
- Integration with extension-discovered pages

## 18. Success metrics

- Extension activation rate
- Saves per active extension user
- Percentage of saves completed without collection selection
- Collection-change rate after default save
- Number of unique new domains discovered weekly
- Candidate approval rate
- Time from discovery to moderation
- Percentage of public library additions sourced from extension activity
- Save-request latency and failure rate
- Duplicate-candidate rate

## 19. Decisions still open

Resolve these before implementation begins:

1. Whether public counts represent unique savers or collection placements.
2. Whether the first version uses a popup, side panel, or both.
3. Whether users save an exact page, its parent website, or both by default.
4. Whether one page can belong to multiple collections in the first release.
5. Which saved-page query parameters must be preserved.
6. Whether private/sensitive saves are included in V1.
7. Whether approved websites inherit historical candidate save counts publicly.
8. How users are informed when a candidate they discovered becomes part of the public library.

## 20. Explicitly out of scope for the first release

- Full-domain crawling
- Automatic publication to the public library
- Public user profiles
- Public collection sharing
- Social following or messaging
- Automated editorial articles
- Chrome browsing-history collection
- Support for browsers other than Chromium-based browsers

