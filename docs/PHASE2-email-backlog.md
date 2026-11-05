# Phase 2: Email backlog triage (build brief for Cursor)

Goal: turn ~1,600 customer emails (Thunderbird mbox file OR a folder of .eml files) into a clean set of candidate gallery entries, using plain code first and AI only where code cannot decide. Token/API spend must stay minimal. Runs locally on the owner's computer; emails never leave it.

Language: Python 3 (stdlib `mailbox`, `email`, `sqlite3`) + Pillow; keep dependencies small. Put code in `/backlog` (separate from the public gallery). Add `/backlog/work/` and `/backlog/out/` to `.gitignore` (contain private data). NEVER commit emails, attachments, names or order numbers.

CLI: `python backlog/run.py --input <mbox file or folder of .eml> --work backlog/work`

## Stage 1: parse (no AI)
For each message extract: message-id, in-reply-to/references, subject, from (name+address), date, plain-text body (prefer text/plain; strip HTML to text), with quoted replies and signatures/disclaimers removed as best as possible.
Images: save real photos (attachments AND inline cid images) to `work/images/<hash>.jpg`. Skip junk: width or height < 400px, file < 40 KB, common signature/logo/tracking patterns, repeated hashes across many different senders. Dedupe by perceptual hash (dHash) and exact hash. Convert HEIC if pillow-heif available. Normalize EXIF rotation.
Links: collect Google Drive/Photos, Dropbox, iCloud, WeTransfer, OneDrive, Box, Imgur links per message into a `links` table (do not download; owner handles later).
Store everything in SQLite `work/backlog.db` (tables: messages, images, links, cases).

## Stage 2: group into cases (no AI)
A case = one customer's submission. Group messages by thread (references / normalized subject) and by sender address within a time window (e.g. 60 days). Merge a "yes you can use it" reply with the earlier photo email from the same sender.
Per case compute features: n_images, has_links, body text length (excluding quotes), permission phrase hit (regex list: "you can use", "feel free", "permission", "go ahead", "happy for you to", "ok to (post|use|share|display)", "yes"), testimonial-ness (length > ~200 chars plus positive words, first-person), is_auto_reply/bounce/newsletter (List-Unsubscribe header, no-reply sender, out-of-office), is_internal (company domain senders only).
Bucket each case:
- READY: image(s) and (permission hit or testimonial text)
- PHOTO_ONLY: image(s), no permission/testimonial
- PERMISSION_NO_PHOTO: permission/testimonial but no image anywhere in the case
- TEXT_ONLY, LINK_ONLY, JUNK, UNSURE (conflicting signals)
Write `out/summary.txt` with counts per bucket and 10 example subjects each (no full names/emails in the summary printed to console; use initials). STOP here by default and let the owner review the numbers before any AI stage (`--ai` flag required for later stages).

## Stage 3: cheap text-model pass (only with --ai, only UNSURE + PERMISSION/TEXT cases)
Use a small/cheap Claude model via the Anthropic API (key in env `ANTHROPIC_API_KEY`, never in repo), use the Batch API when possible. Input: cleaned body text only, with email addresses/phone numbers/street addresses masked. Output JSON: {is_testimonial, grants_permission: yes|no|unclear, quote (verbatim, trimmed), first_name, city_state, mural_mentioned}. Cache by case id; resumable; print estimated token count and cost BEFORE running and require `--yes`.

## Stage 4: photo quality + tagging (only with --ai)
First a free local filter: Laplacian-variance blur score, resolution, exposure/histogram. Rank; drop clear failures (very blurry, tiny).
Then for survivors: downsize to ~768px longest side, send to a vision-capable Claude model in batches (images only, no names). Output JSON per image: {description (1 sentence), alt_text, subjects[] (tags like landmark, nature, floral, map, vintage, kids, abstract...), rooms[] (taxonomy keys), segment_guess (residential|business), colors_named[], quality_score 0-1, issues[] (people_faces, license_plate, address_visible, not_a_wall, blurry, heavy_clutter)}. Same cost preview + `--yes` + resumable + cached.

## Stage 5: order matching (free; optional, only if `--orders orders.csv` given)
Match case sender address (and name fallback, fuzzy) to the order CSV (columns will include order number, customer full name, email, ship city/state, product/mural name). Store private match in the db only. Produce confidence (email exact > name+city > name only).

## Stage 6: review page (local, no server needed beyond `python -m http.server`)
Generate `out/review/index.html` + thumbnails: grid of cases sorted by confidence/quality; each shows photo(s), proposed caption (First name + last initial, city/state), quote, tags, quality, issues, bucket, and buttons Approve / Skip / Needs-info (state saved in localStorage and exportable to `out/decisions.json`). Provide bulk "approve all above score X". Sections for PHOTO_ONLY (permission unknown: show a flag "no permission on file").

## Stage 7: export to gallery
Script `backlog/export_gallery.py` reads approved decisions and writes new entries compatible with the existing `public/data/gallery.json` schema (fresh opaque ids continuing after the last G-####, resized webp 450/900/1600, optional new fields: tags, colors, alt text, description). Writes private map (id -> case, email, name, order number) to `data/private-map.json` (gitignored). Never put private fields in public files.

## Acceptance
- Stage 1-2 runs on the full mailbox in minutes with zero network calls.
- Summary printed with bucket counts; re-runs are idempotent.
- AI stages refuse to run without --ai and --yes, print cost estimate first, are resumable and cache results.
- No private data in git. Unit tests for: permission regex, quote stripping, junk-image filter, case grouping.
- README section documenting how to run and where files are saved.
