# INDIZIO

The Next.js application for [indizio.space](https://indizio.space): a curated index of ecommerce websites, patterns, and field research.

## Design synthesis

- GoodCart: restrained interface, clear filtering, large visual breathing room.
- Payload: rule-based layout, editorial typography, high-contrast segmented buttons.
- Showcase Supply: compact visual cards with metadata beneath each card.

The approved palette is intentionally restricted to black, white, and `#f7f7f7`. Visual variation comes from line work, scale, spacing, grid texture, and typography.

The current V1 uses generated typographic brand panels rather than storefront screenshots. All entries are fictional seed data ready to be replaced by Payload CMS queries.

## Local development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Search, filters, industry jumps, detail dialogs, mobile navigation, bookmarks, account gating, load-more behavior, and the newsletter confirmation state are interactive.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Next integrations

- Payload CMS with MongoDB Atlas
- Persistent authentication and saved websites
- Beehiiv newsletter subscription endpoint
- CMS-managed website entries and editorial research
