import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { imageAltText } from './lib/alt-text.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const galleryPath = path.join(ROOT, 'public/data/gallery.json');
const taxPath = path.join(ROOT, 'public/data/taxonomy.json');

const gallery = JSON.parse(await fs.readFile(galleryPath, 'utf8'));
const taxonomy = JSON.parse(await fs.readFile(taxPath, 'utf8'));

for (const item of gallery.items || []) {
  const muralName = item.mural?.name || item.headline || 'Custom mural';
  for (const img of item.images || []) {
    img.alt = imageAltText(
      muralName,
      item.rooms,
      taxonomy.rooms,
      item.segment,
      taxonomy.sectors,
      item.sectors,
    );
  }
}

gallery.generated = new Date().toISOString();
await fs.writeFile(galleryPath, JSON.stringify(gallery, null, 2) + '\n');
console.log(`Updated alt text on ${gallery.items.length} items.`);
