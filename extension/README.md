# Indizio Chrome extension

## Load the development build

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Choose **Load unpacked**.
4. Select this `extension` folder.
5. Sign in at `https://www.indizio.space`, then open the extension.

The compact popup has two persistent modes: **Save page** and **Library**. The arrow in the header opens the complete library manager in a full browser tab. List/grid selection is also remembered.

## V1 behavior

- Reads only the page the user explicitly opens the extension on.
- Saves exact canonical URLs, titles, descriptions, favicons, notes, and collections.
- Uses the existing Indizio account session and Payload collections.
- Creates unknown domains as private Payload website drafts for editorial review.
- Never publishes extension-discovered websites automatically.

Before Chrome Web Store submission, add finalized PNG icons, screenshots, a privacy-policy URL, and a packaged release ZIP.
