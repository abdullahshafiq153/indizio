# INDIZIO design prototype

This is the first interactive frontend direction for `indizio.space`.

## Design synthesis

- GoodCart: restrained interface, clear filtering, large visual breathing room.
- Payload: rule-based layout, editorial typography, high-contrast segmented buttons.
- Showcase Supply: compact visual cards with metadata beneath each card.

The approved palette is intentionally restricted to black, white, and `#f7f7f7`. Visual variation comes from line work, scale, spacing, grid texture, and typography.

The prototype deliberately uses generated typographic brand panels rather than storefront screenshots. All brand entries are fictional design-review data.

## Review locally

Open `index.html` directly in a browser. Search, filters, industry jumps, detail dialogs, mobile navigation, load-more behavior, and the newsletter confirmation state are interactive.

## Production migration

After visual approval, move the interface into the Next.js + Payload application and replace the sample array with Payload queries. MongoDB Atlas, Beehiiv, and object storage require production credentials.
