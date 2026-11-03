import { normalizePhotoId } from './photo-id.js';

function editDistance(a, b) {
  if (a.length > b.length) [a, b] = [b, a];
  if (!a.length) return b.length;
  let prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    const row = new Array(b.length + 1);
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = row;
  }
  return prev[b.length];
}

/** Higher = better match. */
export function scoreText(query, text) {
  const q = String(query || '').trim().toLowerCase();
  const t = String(text || '').trim().toLowerCase();
  if (!q || !t) return 0;
  if (t === q) return 1000;
  if (t.startsWith(q)) return 800 - q.length;
  const idx = t.indexOf(q);
  if (idx >= 0) return 600 - idx - q.length;
  const maxLen = Math.max(q.length, t.length);
  if (maxLen <= 24) {
    const d = editDistance(q, t.slice(0, Math.min(t.length, q.length + 4)));
    if (d <= 2) return 400 - d * 50;
  }
  const tokens = t.split(/\s+/);
  for (const tok of tokens) {
    if (tok.startsWith(q)) return 350;
    if (q.length <= 12 && editDistance(q, tok) <= 1) return 300;
  }
  return 0;
}

export function rankIdQuery(query, id) {
  const norm = normalizePhotoId(query);
  if (!norm) return 0;
  if (norm === id) return 2000;
  if (id.includes(norm.replace('G-', ''))) return 1500;
  return 0;
}

export function rankItemForQuery(item, query) {
  const q = String(query || '').trim();
  if (!q) return 0;
  let best = rankIdQuery(q, item.id);
  best = Math.max(best, scoreText(q, item.mural?.name));
  best = Math.max(best, scoreText(q, item.caption));
  best = Math.max(best, scoreText(q, item.headline));
  best = Math.max(best, scoreText(q, item.text));
  return best;
}
