/** Parse G-0412, CG-0412, g0412, 412 from search input (canonical id: G-####). */
export function normalizePhotoId(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  const upper = raw.toUpperCase().replace(/\s/g, '');
  let m = upper.match(/^C?G-?0*(\d{1,4})$/);
  if (m) return `G-${m[1].padStart(4, '0')}`;
  if (/^0*\d{1,4}$/.test(upper)) return `G-${parseInt(upper, 10).toString().padStart(4, '0')}`;
  return null;
}

/** Public label in UI (Customer Gallery). Hash/data stay G-####. */
export function displayPhotoId(id) {
  const norm = normalizePhotoId(id);
  if (norm) return `CG-${norm.slice(2)}`;
  return String(id || '').trim();
}

export function isIdOnlySearch(query) {
  const t = String(query || '').trim();
  if (!t || t.includes(' ')) return null;
  return normalizePhotoId(t);
}
