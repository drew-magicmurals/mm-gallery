import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLegacyType, stripHtml } from './lib/taxonomy-map.mjs';
import { imageAltText } from './lib/alt-text.mjs';
import { writeResponsiveWebp } from './lib/images.mjs';
import { generateSampleGallery } from './generate-sample-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_RAW = path.join(ROOT, 'data/raw');
const PUBLIC = path.join(ROOT, 'public');
const BASE = 'https://www.magicmurals.com';

function mediaPathFromRow(row) {
  if (row.filename) {
    const fn = String(row.filename).replace(/^\/+/, '');
    return `/media/${fn}`;
  }
  const thumb = row.fullImage || row.imageUrl || '';
  const m = String(thumb).match(/media\/(testimonials\/testimony\/[^&]+)/);
  if (m) return `/media/${m[1]}`;
  return row.fullImage || row.imageUrl || null;
}

async function fetchJson(page) {
  const url = `${BASE}/testimonials_front/testimonials/index/?page=${page}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'mm-gallery-convert/1.0' },
  });
  const text = await res.text();
  if (!res.ok || text.trimStart().startsWith('<!')) {
    throw new Error(`Blocked or non-JSON response for page ${page}`);
  }
  return JSON.parse(text);
}

async function downloadImage(relativeUrl, destFile) {
  const url = relativeUrl.startsWith('http') ? relativeUrl : `${BASE}${relativeUrl}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image fetch failed: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(destFile), { recursive: true });
  await fs.writeFile(destFile, buf);
  return buf;
}

function rowsFromChunk(chunk) {
  if (Array.isArray(chunk)) return chunk;
  return chunk.items || chunk.data || [];
}

const LEGACY_JSON_DIRS = [
  path.join(ROOT, 'scripts/fixtures/legacy'),
  DATA_RAW,
];

async function listLegacyPageFiles(dir) {
  try {
    return (await fs.readdir(dir))
      .filter((f) => /^page-\d+\.json$/i.test(f))
      .sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0));
  } catch {
    return [];
  }
}

async function loadLocalPages() {
  const seenFiles = new Set();
  const allRows = [];

  for (const dir of LEGACY_JSON_DIRS) {
    const files = await listLegacyPageFiles(dir);
    for (const file of files) {
      if (seenFiles.has(file)) continue;
      seenFiles.add(file);
      const raw = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'));
      const list = rowsFromChunk(raw);
      console.log(`Loaded ${list.length} rows from ${path.relative(ROOT, path.join(dir, file))}`);
      allRows.push(...list);
    }
  }
  return allRows;
}

async function fetchAllPages() {
  const allRows = [];
  for (let page = 1; page <= 50; page += 1) {
    let chunk;
    try {
      chunk = await fetchJson(page);
    } catch (err) {
      if (page === 1) throw err;
      break;
    }
    const list = rowsFromChunk(chunk);
    if (!list.length) break;
    allRows.push(...list);
    const lastPage = chunk.lastPage;
    if (lastPage && page >= lastPage) break;
  }
  return allRows;
}

function publicCompany(company) {
  const c = String(company || '').trim();
  if (!c) return null;
  if (/find email|chk name/i.test(c)) return null;
  return c;
}

function buildCaption(row) {
  const parts = [];
  if (row.name) parts.push(String(row.name).trim());
  const company = publicCompany(row.company);
  if (company) parts.push(company);
  else if (row.install) parts.push(String(row.install).trim());
  return parts.filter(Boolean).join(', ') || 'Customer photo';
}

function groupKey(row) {
  const m = String(row.filename || '').match(/\/(\d+)-\d+/);
  if (m) return `order-${m[1]}`;
  return `row-${row.name}-${row.install}-${row.headline}`;
}

function groupRows(allRows) {
  const map = new Map();
  for (const row of allRows) {
    const key = groupKey(row);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  for (const rows of map.values()) {
    rows.sort((a, b) => String(a.filename).localeCompare(String(b.filename)));
  }
  return [...map.values()];
}

async function convertRows(allRows) {
  const taxonomy = JSON.parse(
    await fs.readFile(path.join(PUBLIC, 'data/taxonomy.json'), 'utf8'),
  );

  const groups = groupRows(allRows);
  const privateMap = {};
  const items = [];
  let n = 1;

  for (const group of groups) {
    const row = group[0];
    const id = `G-${String(n).padStart(4, '0')}`;
    const images = [];
    const legacyFiles = [];

    for (let i = 0; i < group.length; i += 1) {
      const r = group[i];
      const mediaPath = mediaPathFromRow(r);
      if (!mediaPath) continue;

      const rawDest = path.join(
        DATA_RAW,
        'images',
        path.basename(String(r.filename || `${id}-${i}.jpg`)),
      );
      let imgBuf;
      try {
        imgBuf = await downloadImage(mediaPath, rawDest);
      } catch (err) {
        console.warn(`Skip image ${mediaPath}: ${err.message}`);
        continue;
      }

      const imgIndex = images.length + 1;
      const imgBase = path.join(PUBLIC, 'img', `${id}-${imgIndex}`);
      const relSrc = `img/${id}-${imgIndex}`;
      const dims = await writeResponsiveWebp(imgBuf, imgBase);

      const { segment, rooms, sectors } = parseLegacyType(r.type || row.type);
      const muralName = r.mural || row.mural || row.headline || 'Custom mural';
      const alt = imageAltText(
        muralName,
        rooms,
        taxonomy.rooms,
        segment,
        taxonomy.sectors,
        sectors,
      );

      images.push({ src: relSrc, w: dims.w, h: dims.h, alt });
      if (r.filename) legacyFiles.push(r.filename);
    }

    if (!images.length) continue;

    const { segment, rooms, sectors } = parseLegacyType(row.type);
    const muralName = row.mural || row.headline || 'Custom mural';
    const muralUrl =
      row.url && String(row.url).startsWith('/') && !row.url.includes('custom-wall-murals')
        ? row.url
        : row.url && String(row.url).startsWith('/')
          ? row.url
          : null;

    items.push({
      id,
      images,
      caption: buildCaption(row),
      headline: (row.headline || muralName).trim(),
      text: stripHtml(row.description),
      mural: muralName ? { name: muralName.replace(/^\*/, ''), url: muralUrl } : null,
      segment,
      rooms,
      sectors,
      material: null,
      featured: false,
      score: 0,
      added: new Date().toISOString().slice(0, 10),
    });

    privateMap[id] = {
      filenames: legacyFiles,
      legacyName: row.name || null,
    };
    n += 1;
  }

  const gallery = {
    version: 1,
    generated: new Date().toISOString(),
    items,
  };

  await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });
  await fs.writeFile(
    path.join(PUBLIC, 'data/gallery.json'),
    JSON.stringify(gallery, null, 2) + '\n',
  );
  await fs.writeFile(
    path.join(ROOT, 'data/private-map.json'),
    JSON.stringify(privateMap, null, 2) + '\n',
  );

  console.log(`Converted ${items.length} gallery entries (${allRows.length} legacy rows).`);
}

async function main() {
  const localFirst = process.argv.includes('--local') || process.argv.includes('--from-local');
  let allRows = [];

  if (localFirst || (await loadLocalPages()).length) {
    allRows = await loadLocalPages();
  }

  if (!allRows.length) {
    try {
      allRows = await fetchAllPages();
    } catch (err) {
      console.warn('Legacy fetch failed:', err.message);
    }
  }

  if (allRows.length) {
    await convertRows(allRows);
    return;
  }

  console.warn('No legacy data; using sample placeholders.');
  await generateSampleGallery();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
