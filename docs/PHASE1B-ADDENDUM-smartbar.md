# Phase 1B addendum: the Smart Bar (replaces separate filter UI)

Supersedes: the separate Residential/Business buttons, room/sector dropdown, sort dropdown and color swatch row from AGENTS.md section 7 and PHASE1B.md section 1 (the color FEATURE stays; only its UI moves). Everything else in PHASE1B.md stands. If you already built separate controls on `cursor/phase-1b-448f`, fold them into this instead of keeping both.

Principle: ONE obvious control for the whole page. Default state shows everything. Nothing is hidden that a normal visitor needs; power lives behind a single click.

## Layout (collapsed, default)
One wide pill, full width of the container, ~48px tall:

[ search icon | text input "Search murals, places, colors, rooms…" | (right side) segmented toggle: All · Home · Business ]

- The All / Home / Business toggle sits INSIDE the pill on the right (on mobile: directly under the pill, full width, same visual group). It is always visible. One tap, no typing. "All" is selected by default. Maps to segment: all | residential | business.
- Labels: "Home" and "Business" (not "Residential/Commercial"). Match to taxonomy segment keys.
- Under the pill: a muted result line, e.g. "Showing 428 photos" that updates live, and active chips.

## Expanded (on focus or click of the pill)
A panel opens directly under the pill (desktop: popover the same width as the pill; mobile: bottom sheet). Closes on Esc, outside click, or "Done".
Sections, in this order, each only shown if it has data:
1. Suggestions (while typing): grouped rows with icons: Colors (swatch), Rooms/Sectors, Places (city/state), Murals, Photo number (jump to ID). Arrow keys + Enter.
2. Empty-input launcher: 
   - Color dots (up to 10 buckets)
   - Room or Business-sector chips, depending on the Home/Business toggle (top 8 by count, "More" to expand)
   - Sort: small segmented "Best · Newest · A–Z"
   - "Clear all"

## Chips
- Selecting any suggestion/launcher item adds a removable chip INSIDE the pill (before the text input), e.g. [blue ×] [Kitchen ×] [Ohio ×]. Free text stays as plain search text, not a chip.
- Chips combine with AND across types; multiple of the same type (two colors) combine with OR.
- Backspace on empty input removes the last chip. Chips wrap to a second line inside the pill on mobile.
- Counts next to suggestions reflect the current result set where cheap to compute.

## Behavior
- Typing "home"/"business"/"residential"/"commercial" as words also sets the toggle (synonyms), but nobody has to.
- `/` focuses the bar. Esc closes. Enter on a free-text query applies it.
- Search ranking: exact ID > mural name > place > headline/text; tolerant of case, punctuation and small typos (simple edit-distance or prefix match; no library).
- Empty result: friendly line + the 3 closest suggestions + "Clear all".
- State in URL hash: `seg=business&room=Re&color=blue&place=OH&q=dragon&sort=new`. Hash links restore full state, including chips.
- Featured stories strip only shows when no chips, no query and toggle = All.

## Accessibility
- Implement as ARIA combobox with listbox popup; chips are buttons with "Remove <name>" labels; toggle is a radiogroup. Fully keyboard operable, visible focus, announce result count politely (aria-live).
- Targets >= 44px on mobile. Respects reduced motion.

## Out of scope here
Shortlist heart stays as a separate floating button (it is an action, not a filter). Map, shuffle, stats later.

## Acceptance
- With the bar collapsed, the page shows just the pill + toggle: visually calm.
- A visitor can get to "Business > Restaurants > blue" with only taps, and to the same result by typing "blue restaurants".
- No console errors, JS still < 60 KB gz total, hostile global CSS doesn't break it, works at 375px.
