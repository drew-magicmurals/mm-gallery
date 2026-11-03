/** Override in production embed if assets are not co-located with mmg.js */
export let ASSET_BASE = './';
export const UPLOAD_ENDPOINT = '/api/upload';
export const PAGE_SIZE = 24;
export const SEARCH_DEBOUNCE_MS = 250;

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
