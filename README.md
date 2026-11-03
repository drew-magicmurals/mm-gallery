# Magic Murals Gallery (Phase 1)

Standalone customer photo gallery that embeds into the existing Magento `/testimonials/` page. Phase 1 is a **local prototype** with sample data — nothing is deployed to magicmurals.com yet.

See [AGENTS.md](./AGENTS.md) for the full product brief.

## Quick start

```bash
npm install
npm run generate-data   # or npm run convert (legacy feed + fallback)
npm run dev             # opens dev/host-page.html; mock upload on :3099
```

Production-style static assets:

```bash
npm run build           # writes public/mmg.js and public/mmg.css
npm run preview         # serve the built gallery
```

## Embed snippet (Magento CMS)

```html
<div id="mmg-gallery"></div>
<script src="/gallery-assets/mmg.js" defer></script>
```

`mmg.js` mounts into `#mmg-gallery`, injects `mmg.css` from the same directory, and loads `data/gallery.json` relative to **`ASSET_BASE`**.

### Changing `ASSET_BASE`

By default, `ASSET_BASE` is the directory that contains `mmg.js` (derived from the script URL). To override (for example if JSON and images live elsewhere), set a global **before** the script loads:

```html
<script>window.MMG_ASSET_BASE = '/gallery-assets';</script>
<div id="mmg-gallery"></div>
<script src="/gallery-assets/mmg.js" defer></script>
```

If you add this hook, wire it in `src/config.js` / `src/main.js` when you deploy.

## Regenerating gallery data

| Command | Purpose |
|--------|---------|
| `npm run convert` | Download legacy JSON + images from magicmurals.com, build WebPs, write `public/data/gallery.json` and private `data/private-map.json` |
| `npm run generate-data` | Always write 20 placeholder entries (used automatically when convert is blocked) |

Legacy API (read-only):  
`https://www.magicmurals.com/testimonials_front/testimonials/index/?page=1`

Images are emitted as `public/img/G-XXXX-1-{450,900,1600}.webp`.

## Share upload (prototype)

The “Share your wall” tab POSTs to `UPLOAD_ENDPOINT` (`/api/upload` in `src/config.js`). During `npm run dev`, Vite proxies that path to `scripts/mock-upload.mjs`, which saves raw bodies under `tmp/`.

Open the form via the tab, `?share=1`, or the link on the dev host page.

## Project layout

```
public/          Built mmg.js/css, data/, img/
src/             Gallery source (vanilla JS + CSS)
scripts/         convert-legacy.mjs, mock-upload.mjs, generate-sample-data.mjs
dev/             host-page.html (Magento-like shell for local dev)
data/            gitignored raw downloads + private-map.json
```

## Dev host page

`dev/host-page.html` loads Mulish/Poppins from Google Fonts (host simulation only), includes a hostile global `* { box-sizing: content-box; }`, and mounts the gallery via Vite (`/src/main.js`). Production uses the built `mmg.js` bundle only.

## Acceptance checklist

- Filters, search, sort, load-more, lightbox, `#G-0001` deep links, copy link, Pinterest link, keyboard use, 375px layout
- No framework runtime; target bundle &lt; 60 KB gzipped (`npm run build` then `gzip -c public/mmg.js | wc -c`)
- All gallery classes prefixed with `mmg-`; layout scoped under `.mmg-root`
