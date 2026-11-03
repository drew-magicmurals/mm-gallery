# Phase 1B: make the gallery sell (build brief for Cursor)

Same hard constraints as AGENTS.md (vanilla JS/CSS, no third-party scripts, `mmg-` prefixed CSS, CSP-safe, accessible, mobile first, JS < 60 KB gz total).
Everything below must work with the existing `gallery.json`. New fields are OPTIONAL; if absent, the feature quietly hides. Never require manual data entry.

## 0. Fix first
- Alt text reads "installed in a living". Use taxonomy labels ("living room") and fall back to mural name only.
- Remove inline `style=` attributes (CSP). Set card aspect ratio via CSS custom property from JS (`el.style.setProperty` is also inline-style; prefer a width/height attribute on the img plus CSS `aspect-ratio: auto w / h` using attr sizing, or a constructed stylesheet). Verify nothing breaks under `Content-Security-Policy: style-src 'self'`.

## 1. Color filter
- New optional per-image field `colors`: up to 3 dominant colors as hex, plus `dominant` bucket key.
- Build step (`scripts/extract-colors.mjs`, sharp): quantize each photo, map to ~10 named buckets (red, orange, yellow, green, teal, blue, purple, pink, neutral/gray, black/white, brown/earth). Write into gallery.json. Use mural-wall-agnostic simple approach; ignore near-white/near-gray pixels when picking a hue unless the image is mostly neutral.
- UI: a row of small round swatches (with accessible names) above the grid; click toggles filter; state in URL hash (`color=blue`). Works with other filters.
- Also use first color as the blurred placeholder background of each card while the image loads.

## 2. Shortlist (favorites)
- Heart button on each card and in the lightbox. Stored in localStorage (wrapped in try/catch; works without it for the session).
- Floating tray/button "Your shortlist (N)" opens a panel listing thumbnails + IDs, remove buttons, and:
  - "Email my shortlist to Magic Murals": opens a `mailto:` to the address in config constant `CONTACT_EMAIL` (default `testimonials@magicmurals.com`; the owner will change it), pre-filled subject and body listing IDs and permalinks.
  - "Copy shareable link": `#list=G-0012,G-0088`. Loading a link with `list=` shows that set as a shortlist view.
- No cookies, no server.

## 3. "I want this one"
- In the lightbox, primary button "I want this look" (the existing "See this mural" stays when a mural link exists).
- Opens a mailto (config-driven; later swappable for a form endpoint) with subject "Custom mural like photo G-0412" and body including ID and permalink, and a blank line for the customer's wall size/notes.
- Config `WANT_THIS_URL` optional: if set, link to `/custom-wall-murals.html?ref=G-0412` instead.

## 4. Find by ID (subtle)
- The search box accepts IDs: typing `G-0412`, `g0412` or `412` jumps to / opens that photo.
- Keep it unobtrusive: no separate big box. Placeholder text "Search murals, places, or a photo number". The ID stays small in the lightbox and on hover in the grid.

## 6. Featured stories strip
- Above the grid, only when no filter/search is active: up to 5 items where `featured: true`, shown larger (1 big + 2-4 smaller on desktop; horizontal scroll-snap on mobile) with a pull-quote from `text` when present (truncate gracefully), caption and mural name.
- Clicking opens the lightbox. Featured items also stay in the main grid.

## 7. Browse by room (only if it stays clean)
- Visual tiles (image = best-scoring photo for that room, label + count) for the top ~6 rooms/sectors, replacing nothing: dropdowns remain.
- Collapse behind a single "Browse by room" row on mobile. If it makes the page feel cluttered at 375px, hide it on mobile and tell us.

## 8. Group by mural
- In the lightbox, if other photos share the same `mural.name`, show "N more installs of this mural" with a thumbnail row. Also support filter `mural=<name>` via hash and a "Show all installs of this mural" link.
- Expose a tiny reusable embed entry point (`window.MMGallery.mount(el, {mural: "..."})` or a data attribute on the container) so a future product page could show a strip of matching photos. Do not build the product-page integration yet.

## Later (design for, don't build)
Before/after slider, extra facts (wall size, material), video, map of installs, shuffle, stats line, Wall of the Month. Keep the data schema open to extra optional fields.

## Acceptance
- All features keyboard accessible and good at 375 px; no console errors; no third-party requests.
- Features hide cleanly when their data is missing.
- Lighthouse mobile Perf >= 90, A11y >= 95 on the host page.
- README updated (new config constants, how colors are regenerated).
- Open a PR; describe each feature and any decision you made.
