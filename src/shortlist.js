import { CONTACT_EMAIL } from './config.js';

const STORAGE_KEY = 'mmg-shortlist';

export function loadShortlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((id) => /^G-\d{4}$/.test(id)) : [];
  } catch {
    return [];
  }
}

export function saveShortlist(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* session-only fallback handled by caller */
  }
}

export function toggleShortlistId(ids, id) {
  const set = new Set(ids);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return [...set];
}

export function parseListHash(param) {
  if (!param) return [];
  return param
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((id) => /^G-\d{4}$/.test(id));
}

export function shortlistMailto(ids, items, origin) {
  const lines = ids.map((id) => {
    const item = items.find((i) => i.id === id);
    const label = item?.headline || item?.mural?.name || id;
    return `${id} — ${label}\n${origin}#${id}`;
  });
  const subject = encodeURIComponent(`My Magic Murals photo shortlist (${ids.length})`);
  const body = encodeURIComponent(
    `Hi Magic Murals,\n\nI'm interested in murals like these customer photos:\n\n${lines.join('\n\n')}\n\n`,
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export function shortlistShareHash(ids) {
  return `list=${ids.join(',')}`;
}
