# Magic Murals Gallery: Build Brief (for Cursor)

Read this whole file first, then build Phase 1. Ask before expanding scope.

## 1. What we're building

A replacement for the customer photo gallery at `https://www.magicmurals.com/testimonials/` (currently a slow, custom Magento module). The new gallery is a **standalone static front end** that renders *inside* the existing Magento page (not an iframe, not a new URL) and looks native to the site.

Phase 1 (this brief) = a working **local prototype** with sample data. Nothing goes live.

## 2. Hard constraints

- **No URL changes.** The page stays at `/testimonials/`. Our code is loaded by one `<script>` tag plus one container `<div>` pasted into the Magento CMS page's HTML block.
- **Vanilla HTML/CSS/JS. No framework runtime dependency, no jQuery, no CDN scripts.** A build step (Vite or none) is fine only if the output is a few static files. Target: JS < 60 KB gzipped.
- **Same-origin assets later.** Files will be served from a path like `/gallery-assets/` on magicmurals.com. Never reference third-party hosts for scripts. Use relative paths from one config constant `ASSET_BASE`.
- **Magento's CSP allows only `'self'` plus a fixed allowlist for scripts.** No inline event handlers, no `eval`, no external script loading.
- **Security posture:** zero server-side code in Phase 1, no cookies, no tracking, no user input rendered as HTML (escape everything, use `textContent`).
- **Mobile first.** Must be fast on a mid-range phone. Lazy-load images, reserve image space to avoid layout shift.
- **Accessible:** keyboard navigation, focus trap in lightbox, ARIA labels, visible focus rings, respects `prefers-reduced-motion`.

## 3. Look and feel (must match the host site)

Host page tokens (from the live site):
- Body font: **Mulish**; headings: **Poppins** (both already loaded by the host page, so **inherit with `font-family: inherit`**, do not load fonts ourselves)
- Text color `#393939`, background `#ffffff`, link/accent green `#3c9b35`
- Host page already provides header, footer, H1 "Customer Gallery" and intro text. **We render only the gallery block.**

Define all colors/spacing as CSS custom properties on `.mmg-root` (prefix **every** class `mmg-` to avoid collisions with the host theme). Dark mode not needed.

## 4. Public data schema (`gallery.json`)

One cached file. Public fields only. **No order numbers, emails or full names ever.**

```json
{
  "version": 1,
  "generated": "2026-11-03T00:00:00Z",
  "items": [
    {
      "id": "G-0412",
      "images": [{ "src": "img/G-0412-1", "w": 1000, "h": 750, "alt": "..." }],
      "caption": "Allie B., Stafford Springs, CT",
      "headline": "Vintage Eiffel Tower",
      "text": "plain text testimonial, may be empty",
      "mural": { "name": "Vintage Eiffel Tower", "url": "/vintage-eiffel-tower.html" },
      "segment": "residential",
      "rooms": ["living", "dining"],
      "sectors": [],
      "material": null,
      "featured": false,
      "score": 0.0,
      "added": "2016-07-04"
    }
  ]
}
```

Notes:
- `id` is an **opaque, permanent public ID** (`G-` + 4 digits). It is the deep-link key and is never derived from an order number.
- `segment`: `residential` | `business`. `rooms`/`sectors` use the keys in section 6.
- `score` (0-1) and `featured` drive default sort. Both may be missing; treat missing as 0/false.
- Images: build 3 widths per image (`-450.webp`, `-900.webp`, `-1600.webp`) with `srcset`. Provide a JPG fallback only if trivial.

## 5. Source data for the prototype

The live legacy feed is public JSON. Fetch ~20 entries per page:

`https://www.magicmurals.com/testimonials_front/testimonials/index/?page=1` (also try `page=2`, `3`... until empty)

Legacy fields: `url, imageUrl, fullImage, name, filename, company, install, headline, description (HTML), type ("R,L,D" codes), mural`.

Write a one-off Node script `scripts/convert-legacy.mjs` that:
1. Downloads pages until empty, and the images (`fullImage` URLs, relative to `https://www.magicmurals.com`) into `data/raw/`.
2. Assigns sequential opaque ids `G-0001`...
3. Strips HTML from `description`, trims stray trailing apostrophes.
4. Maps `type` codes using section 6; the first letter `R`=residential, `B`=business.
5. Generates the 3 WebP widths with `sharp`.
6. Writes `public/data/gallery.json` and a **private** `data/private-map.json` (`id` -> legacy filename/name). Add `data/` to `.gitignore`.
7. Sets `alt` to a simple placeholder like `"{mural} installed in a {room}"`. (AI alt text is a later phase.)

If the live site blocks downloads, fall back to a hand-written `gallery.json` with 20 placeholder entries and royalty-free placeholder images.

## 6. Category keys

Rooms (residential): `Ba` bathroom, `Be` bedroom, `Bor` bonus room, `Bo` boy's room, `D` dining, `Eh` entry/hallway, `Rf` framed, `G` garage, `Gi` girl's room, `Ho` home office, `Kid` kid's room, `Ki` kitchen, `L` living, `M` man cave, `Ro` other.

Business sectors: `Ch` churches & religion, `Co` corporate & offices, `E` entertainment, `Li` libraries, `Me` medical, `Mu` museums, `Rc` residential communities, `Re` restaurants, `Ret` retail, `S` salons & spas, `Sc` schools & universities, `Buo` other.

Store these in `public/data/taxonomy.json` so labels can change without code changes.

## 7. Phase 1 features

**Gallery**
- Responsive masonry grid (CSS columns or a small JS layout; no library). 2 cols mobile, 3-4 desktop.
- Lazy-loaded images with fixed aspect placeholders. Hover/focus shows mural name + location.
- Default sort: featured first, then score, then newest. Sort control: Best / Newest / Mural name.
- Filters: All | Residential | Business, then a room or sector dropdown (shown by segment). Active filters reflected in the URL **hash** (e.g. `#room=Be&seg=residential`), never the path.
- **Search box:** matches headline, caption, mural name, text, and (future) `description`. Debounced, client-side, case-insensitive, simple tokenization.
- Result count and an empty state with a "clear filters" button.
- Incremental rendering: first 24, then "Load more" (or IntersectionObserver).

**Lightbox**
- Opens on click/Enter. Large image, caption, headline, testimonial text, the permanent ID (small, e.g. "Photo G-0412").
- **"See this mural"** button -> `mural.url`. If the entry has no mural link, show **"Start a custom mural like this"** -> `/custom-wall-murals.html`.
- Next/prev (buttons, arrow keys, touch swipe), Esc to close, focus trap, restores focus.
- Multiple images per entry: thumbnail strip.
- **Copy link** button (copies `.../testimonials/#G-0412`) and a **Pinterest save** link using the current image + permalink.
- Direct link support: loading `#G-0412` opens that photo.

**SEO/structure:** render a `<noscript>` message; add `ImageObject` JSON-LD for the first 24 items at load.

**Share-your-photo widget (UI only in Phase 1)**
- Small fixed tab "Share your wall" (bottom-right, does not cover content on mobile).
- Opens a modal: file picker (accept `image/jpeg,image/png,image/webp,image/heic`; multiple; camera-friendly on phones; show thumbnails; client-side limit of 10 files / 15 MB each), required email, optional first name, city/state, one-line comment, and a required permission checkbox ("OK to display my photo on magicmurals.com").
- Link under the form: "Prefer email? Send photos to testimonials@magicmurals.com" (mailto).
- Also opens automatically if the URL has `?share=1`.
- On submit, POST `FormData` to `UPLOAD_ENDPOINT` (a config constant). In the prototype, point it at a local mock (`scripts/mock-upload.mjs`, a tiny Node server that saves to `tmp/` and returns `{ok:true}`). Show success and error states. Include a hidden honeypot field and a placeholder `<div id="mmg-turnstile">` where a Cloudflare Turnstile widget will mount later.
- Uploads never publish anything. They only go to a review queue (not built yet).

## 8. Project structure

```
/public
  /data/gallery.json, taxonomy.json
  /img/...                (generated webp)
  mmg.js  mmg.css         (built output)
/src                      (source for mmg.js/mmg.css)
/scripts
  convert-legacy.mjs
  mock-upload.mjs
/dev
  host-page.html          (mimics the Magento page: Mulish/Poppins via Google Fonts link, white bg, #393939 text, header/footer placeholders, and the two-line embed snippet)
README.md                 (how to run, build, embed, update data)
```

**Embed snippet** (this is all that goes into Magento later):

```html
<div id="mmg-gallery"></div>
<script src="/gallery-assets/mmg.js" defer></script>
```

`mmg.js` finds `#mmg-gallery`, injects `mmg.css` (a `<link>` to the same base path), loads `data/gallery.json`, and renders. Everything relative to `ASSET_BASE` (defaults to the script's own directory).

## 9. Acceptance criteria

- `npm run dev` serves `/dev/host-page.html` and the gallery renders from sample data.
- Filters, search, sort, load-more, lightbox, deep links (`#G-0001`), copy link, and the upload modal all work with keyboard only and on a 375 px viewport.
- Lighthouse (mobile) for the host page: Performance >= 90, Accessibility >= 95.
- No console errors. No requests to any host except the local server and Google Fonts (host-page only).
- Gallery CSS is fully namespaced; adding a hostile global `* { box-sizing: content-box; }` to the host page does not break layout.
- `README.md` documents how to regenerate data and how to swap `ASSET_BASE`.

## 10. Do NOT

- Do not add a framework runtime (React, Vue, jQuery), analytics, cookies, or external scripts.
- Do not put emails, order numbers or full customer names in any public file.
- Do not build a backend, admin UI or database yet.
- Do not change anything about magicmurals.com. This is read-only against the live site.

## 11. Later phases (context only, not for now)

- Phase 2: backlog import (about 1,600 emails) with AI tagging and quality scoring, a private review queue, and publishing that regenerates `gallery.json` and the images.
- Phase 3: real upload endpoint (Cloudflare Worker + R2 storage + Turnstile), order matching, a review/approve screen, and Cloudflare path routing so `/gallery-assets/*` serves these files from the same domain.
- Design `gallery.json` and the code so these phases are additive.
