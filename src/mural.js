export function normalizeMuralName(name) {
  return String(name || '')
    .replace(/^\*/, '')
    .trim()
    .toLowerCase();
}

export function itemsWithSameMural(items, item) {
  const key = normalizeMuralName(item.mural?.name || item.headline);
  if (!key) return [];
  return items.filter(
    (i) => i.id !== item.id && normalizeMuralName(i.mural?.name || i.headline) === key,
  );
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
