# Bulk library imports

Open https://www.indizio.space/library-import.html after signing into the Payload admin on the same www domain. Choose a reviewed JSON bundle and click **Publish bundle** once. Keep the tab open until **Import complete** appears.

The importer uses the existing authenticated Payload REST API. It does not require API keys or grant new access. Each entry uploads a PNG to Indizio media storage, creates missing product tags, and publishes the website. Existing slugs are skipped, and media with the same alternative text is reused on retry. It does not update existing entries. Run only one import at a time.

## Bundle format

The file is a JSON array with at most 50 entries. Each entry contains `name`, `slug`, `url`, `note`, `industrySlug`, `tags` (array of tag names), `alt`, and `imageBase64` (raw base64 PNG without a data URL prefix). Use a real existing industry slug from `/api/industries?limit=500`; names alone may be ambiguous. Keep each screenshot below 3 MB to fit hosting request limits. Only include reviewed entries and screenshots with unwanted popups dismissed.

## Build a bundle from a review pack

Save the following as `build_bundle.py`, then run `python3 build_bundle.py path/to/review-pack bundle.json`. The review pack should contain `draft-entries.json` with an `entries` array and relative screenshot paths. Entries must have `industrySlug` added during review and `screenshot_status` set to `ready`. Blocked screenshots are excluded.

```python
import base64
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1]).resolve()
review = json.loads((root / 'draft-entries.json').read_text())
bundle = []
for entry in review['entries']:
    if entry.get('screenshot_status') != 'ready':
        continue
    image = (root / entry['screenshot']).resolve()
    if not image.is_relative_to(root):
        raise ValueError('Screenshot must be inside the review pack')
    raw = image.read_bytes()
    if not raw.startswith(b'\x89PNG\r\n\x1a\n') or len(raw) > 3_000_000:
        raise ValueError('Use a PNG screenshot under 3 MB')
    item = {key: entry[key] for key in
            ('name', 'slug', 'url', 'note', 'industrySlug', 'tags', 'alt')}
    item['imageBase64'] = base64.b64encode(raw).decode('ascii')
    bundle.append(item)
pathlib.Path(sys.argv[2]).write_text(json.dumps(bundle))
print(f'Prepared {len(bundle)} entries')
```

If an error appears, resolve it and rerun the same bundle; already-created website slugs are skipped. Verify the results in the public library and CMS. A slug skipped because it already exists may be a draft or an older record, so review skipped entries rather than assuming they match the bundle. Public library caching can delay visibility by about five minutes.
