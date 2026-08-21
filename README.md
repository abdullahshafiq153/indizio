# INDIZIO

The Next.js application for [indizio.space](https://indizio.space): a curated index of ecommerce websites, patterns, and field research.

## Design synthesis

- GoodCart: restrained interface, clear filtering, large visual breathing room.
- Payload: rule-based layout, editorial typography, high-contrast segmented buttons.
- Showcase Supply: compact visual cards with metadata beneath each card.

The approved palette is intentionally restricted to black, white, and `#f7f7f7`. Visual variation comes from line work, scale, spacing, grid texture, and typography.

The current V1 uses generated typographic brand panels rather than storefront screenshots. The bundled fictional entries are used as a safe fallback until MongoDB is configured and can also be seeded into Payload.

## Local development

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

Set `DATABASE_URL` to a MongoDB Atlas connection string and replace `PAYLOAD_SECRET` with a long random value. Add `BEEHIIV_API_KEY` and `BEEHIIV_PUBLICATION_ID` to enable newsletter subscriptions.

For Google account access, create a Google OAuth web client and set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`. Production should use `https://www.indizio.space/api/auth/google/callback`; add that exact URI to the Google client’s authorized redirect URIs.

Open `http://localhost:3000`. The Payload admin is at `http://localhost:3000/admin`; the first administrator can be created there. Load the starter website records after connecting MongoDB:

```bash
pnpm seed
```

Search, filters, industry jumps, detail dialogs, mobile navigation, real member accounts, multi-collection bookmarks, private bookmark notes, saved-collection filtering, and Beehiiv enrollment are implemented.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Application structure

- Payload CMS + MongoDB for websites, taxonomy, curations, CRO articles, administrators, and members
- HTTP-only cookie authentication through Payload
- Owner-scoped bookmark collections with visibility, notes, ordering, and duplicate protection
- Consent-based Beehiiv enrollment during signup and through the standalone newsletter form
- Seed fallback when no database environment is present, keeping previews and Vercel builds safe
