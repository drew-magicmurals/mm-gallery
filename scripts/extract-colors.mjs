import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { rgbToBucket } from './lib/color-buckets.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const galleryPath = path.join(PUBLIC, 'data/gallery.json');

function isBackgroundPixel(r, g, b) {
  if (r > 245 && g > 245 && b > 245) return true;
  const d = Math.max(r, g, b) - Math.min(r, g, b);
  if (d < 12 && (r + g + b) / 3 > 200) return true;
  return false;
}

function hex(r, g, b) {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

async function analyzeImage(relSrc) {
  const file = path.join(PUBLIC, `${relSrc}-450.webp`);
  const { data, info } = await sharp(file)
    .resize(48, 48, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bucketCounts = new Map();
  const hexCounts = new Map();
  let total = 0;

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isBackgroundPixel(r, g, b)) continue;
    total += 1;
    const bucket = rgbToBucket(r, g, b);
    bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + 1);
    const h = hex(r, g, b);
    hexCounts.set(h, (hexCounts.get(h) || 0) + 1);
  }

  if (!total) {
    return { colors: ['#9e9e9e'], dominant: 'neutral' };
  }

  const sortedBuckets = [...bucketCounts.entries()].sort((a, b) => b[1] - a[1]);
  const dominant = sortedBuckets[0]?.[0] || 'neutral';
  const sortedHex = [...hexCounts.entries()].sort((a, b) => b[1] - a[1]);
  const colors = sortedHex.slice(0, 3).map(([h]) => h);

  return { colors, dominant };
}

const gallery = JSON.parse(await fs.readFile(galleryPath, 'utf8'));
let n = 0;

for (const item of gallery.items || []) {
  for (const img of item.images || []) {
    try {
      const result = await analyzeImage(img.src);
      img.colors = result.colors;
      img.dominant = result.dominant;
      n += 1;
    } catch (err) {
      console.warn(`Skip colors for ${img.src}:`, err.message);
    }
  }
}

gallery.generated = new Date().toISOString();
await fs.writeFile(galleryPath, JSON.stringify(gallery, null, 2) + '\n');
console.log(`Extracted colors for ${n} images.`);
