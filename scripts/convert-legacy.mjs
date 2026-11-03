import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLegacyType, stripHtml } from './lib/taxonomy-map.mjs';
import { writeResponsiveWebp } from './lib/images.mjs';
import { generateSampleGallery } from './generate-sample-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_RAW = path.join(ROOT, 'data/raw');
const PUBLIC = path.join(ROOT, 'public');
const BASE = 'https://www.magicmurals.com';

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

function anonymizeCaption(name, company, install) {
  const parts = [];
  if (name) {
    const tokens = String(name).trim().split(/\s+/);
    if (tokens.length >= 2) {
      parts.push(`${tokens[0]} ${tokens[tokens.length - 1].charAt(0)}.`);
    } else if (tokens[0]) {
      parts.push(`${tokens[0].charAt(0)}.`);
    }
  }
  if (company) parts.push(String(company).trim());
  else if (install) parts.push(String(install).trim());
  return parts.filter(Boolean).join(', ') || 'Customer photo';
}

function roomLabel(rooms, taxonomyRooms) {
  if (!rooms?.length) return 'room';
  return taxonomyRooms[rooms[0]]?.toLowerCase() || 'room';
}

async function convertLegacy() {
  const taxonomy = JSON.parse(
    await fs.readFile(path.join(PUBLIC, 'data/taxonomy.json'), 'utf8'),
  );

  const allRows = [];
  for (let page = 1; page <= 50; page += 1) {
    let chunk;
    try {
      chunk = await fetchJson(page);
    } catch (err) {
      if (page === 1) throw err;
      break;
    }
    const list = Array.isArray(chunk) ? chunk : chunk.items || chunk.data || [];
    if (!list.length) break;
    allRows.push(...list);
  }

  if (!allRows.length) throw new Error('No legacy rows downloaded');

  const privateMap = {};
  const items = [];
  let n = 1;

  for (const row of allRows) {
    const id = `G-${String(n).padStart(4, '0')}`;
    const imagePath = row.fullImage || row.imageUrl || row.url;
    if (!imagePath) continue;

    const rawDest = path.join(DATA_RAW, `${id}${path.extname(imagePath) || '.jpg'}`);
    let imgBuf;
    try {
      imgBuf = await downloadImage(imagePath, rawDest);
    } catch {
      continue;
    }

    const imgBase = path.join(PUBLIC, 'img', `${id}-1`);
    const relSrc = `img/${id}-1`;
    const dims = await writeResponsiveWebp(imgBuf, imgBase);

    const { segment, rooms, sectors } = parseLegacyType(row.type);
    const muralName = row.mural || row.headline || 'Custom mural';
    const alt = `${muralName} installed in a ${roomLabel(rooms, taxonomy.rooms)}`;

    const muralUrl = row.url && String(row.url).startsWith('/') ? row.url : null;

    items.push({
      id,
      images: [{ src: relSrc, w: dims.w, h: dims.h, alt }],
      caption: anonymizeCaption(row.name, row.company, row.install),
      headline: row.headline || muralName,
      text: stripHtml(row.description),
      mural: muralName ? { name: muralName, url: muralUrl } : null,
      segment,
      rooms,
      sectors,
      material: null,
      featured: false,
      score: 0,
      added: new Date().toISOString().slice(0, 10),
    });

    privateMap[id] = {
      filename: row.filename || null,
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

  console.log(`Converted ${items.length} legacy items.`);
}

async function main() {
  try {
    await convertLegacy();
  } catch (err) {
    console.warn('Legacy convert failed, using sample data:', err.message);
    await generateSampleGallery();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
