#!/usr/bin/env node
/**
 * One-off: read legacy page JSON from stdin (full {"data":[...]} body).
 * Usage: node scripts/save-pasted-pages.mjs 2 < page-2.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pageNum = process.argv[2];
if (!pageNum || !/^\d+$/.test(pageNum)) {
  console.error('Usage: node scripts/save-pasted-pages.mjs <pageNumber> < page-N.json');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const chunks = [];
for await (const c of process.stdin) chunks.push(c);
const text = Buffer.concat(chunks).toString('utf8').trim();
JSON.parse(text);

const dirs = [
  path.join(ROOT, 'scripts/fixtures/legacy'),
  path.join(ROOT, 'data/raw'),
];
for (const dir of dirs) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `page-${pageNum}.json`), text + '\n');
}
console.log(`Saved page-${pageNum}.json to fixtures and data/raw`);
