/** Extract searchable place strings from a caption like "Name, City, ST". */
export function placesFromCaption(caption) {
  if (!caption) return [];
  const parts = String(caption)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 2) return [];
  const locParts = parts.slice(1);
  const full = locParts.join(', ');
  const out = new Set([full]);
  if (locParts.length >= 2) {
    out.add(locParts[locParts.length - 1]);
    out.add(locParts[locParts.length - 2]);
  } else {
    out.add(locParts[0]);
  }
  return [...out].filter(Boolean);
}

export function buildPlaceIndex(items) {
  const map = new Map();
  for (const item of items) {
    for (const p of placesFromCaption(item.caption)) {
      const key = p.toLowerCase();
      const prev = map.get(key);
      if (prev) prev.count += 1;
      else map.set(key, { key, label: p, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function itemMatchesPlaces(item, placeKeys) {
  if (!placeKeys?.length) return true;
  const cap = (item.caption || '').toLowerCase();
  return placeKeys.some((k) => cap.includes(String(k).toLowerCase()));
}
