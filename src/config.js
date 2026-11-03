/** Override in production embed if assets are not co-located with mmg.js */
export let ASSET_BASE = './';
export const UPLOAD_ENDPOINT = '/api/upload';
export const CONTACT_EMAIL = 'testimonials@magicmurals.com';
/** If set (e.g. /custom-wall-murals.html), "I want this look" uses ?ref=ID instead of mailto */
export const WANT_THIS_URL = '';
/** Room tile row (Phase 1B §7) — off until layout is decided */
export const ENABLE_BROWSE_BY_ROOM = false;

export const PAGE_SIZE = 24;
export const SEARCH_DEBOUNCE_MS = 250;

export const COLOR_SWATCH_KEYS = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'pink',
  'neutral',
  'blackwhite',
  'brown',
];

export function resolveAssetBase(scriptEl) {
  if (typeof globalThis !== 'undefined' && globalThis.MMG_ASSET_BASE) {
    return String(globalThis.MMG_ASSET_BASE).replace(/\/$/, '') || '.';
  }
  if (scriptEl?.src?.includes('/src/main')) return '/';
  try {
    const url = new URL(scriptEl.src, location.href);
    const p = url.pathname.replace(/\/mmg\.js$/, '');
    return p || '.';
  } catch {
    return '/';
  }
}

export function setAssetBase(base) {
  ASSET_BASE = base.endsWith('/') ? base.slice(0, -1) : base;
}

export function assetUrl(relative) {
  const rel = relative.startsWith('/') ? relative.slice(1) : relative;
  const base = ASSET_BASE === '.' ? '' : ASSET_BASE;
  return `${base}/${rel}`.replace(/\/+/g, '/');
}
