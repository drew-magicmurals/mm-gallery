const GENERIC_MURAL_NAMES = new Set([
  '',
  'custom mural',
  'custom wall mural',
  'custom murals',
  'custom',
]);

/** Catch-all product pages — not a specific mural SKU. */
const GENERIC_MURAL_URLS = new Set([
  '/custom-wall-murals.html',
  '/custom-murals.html',
]);

export function normalizeMuralName(name) {
  return String(name || '')
    .replace(/^\*/, '')
    .trim()
    .toLowerCase();
}

function normalizeMuralUrl(url) {
  if (!url) return '';
  try {
    const path = url.startsWith('http') ? new URL(url).pathname : url;
    return path.trim().toLowerCase().replace(/\/$/, '') || '';
  } catch {
    return String(url).trim().toLowerCase().replace(/\/$/, '');
  }
}

/** Stable key for “same mural product” grouping; null when not groupable. */
export function muralGroupKey(item) {
  const url = normalizeMuralUrl(item.mural?.url);
  if (url && !GENERIC_MURAL_URLS.has(url)) return `url:${url}`;

  const name = normalizeMuralName(item.mural?.name);
  if (name && !GENERIC_MURAL_NAMES.has(name)) return `name:${name}`;

  return null;
}

export function muralDisplayName(item) {
  const rawName = item.mural?.name?.replace(/^\*/, '').trim();
  const nameKey = normalizeMuralName(rawName);
  if (rawName && nameKey && !GENERIC_MURAL_NAMES.has(nameKey)) return rawName;

  const url = normalizeMuralUrl(item.mural?.url);
  if (url && !GENERIC_MURAL_URLS.has(url)) {
    const slug = url.split('/').filter(Boolean).pop()?.replace(/\.html$/i, '') || '';
    if (slug) {
      return slug
        .split('-')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }
  return '';
}

export function itemsWithSameMural(items, item) {
  const key = muralGroupKey(item);
  if (!key) return [];
  return items.filter((i) => i.id !== item.id && muralGroupKey(i) === key);
}

export function bestItemForRoom(items, roomKey) {
  const matches = items.filter((i) => i.segment === 'residential' && (i.rooms || []).includes(roomKey));
  matches.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return matches[0] || null;
}

export function roomCounts(items, taxonomy) {
  const counts = new Map();
  for (const item of items) {
    if (item.segment !== 'residential') continue;
    for (const r of item.rooms || []) {
      counts.set(r, (counts.get(r) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: taxonomy?.rooms?.[key] || key,
      count,
      sample: bestItemForRoom(items, key),
    }))
    .sort((a, b) => b.count - a.count);
}

export function sectorCounts(items, taxonomy) {
  const counts = new Map();
  for (const item of items) {
    if (item.segment !== 'business') continue;
    for (const s of item.sectors || []) {
      counts.set(s, (counts.get(s) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: taxonomy?.sectors?.[key] || key,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}
