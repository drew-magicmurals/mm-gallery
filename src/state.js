import { isIdOnlySearch } from './photo-id.js';
import { itemHasColorBucket } from './color-buckets.js';
import { normalizeMuralName } from './mural.js';

export function createState() {
  return {
    items: [],
    taxonomy: null,
    sort: 'best',
    segment: 'all',
    category: '',
    search: '',
    color: '',
    muralFilter: '',
    shortlistView: null,
    shortlistIds: [],
    visibleCount: 24,
    lightbox: null,
    lastFocus: null,
    pendingOpenId: null,
    embedMural: '',
  };
}

export function defaultSort(a, b) {
  const fa = a.featured ? 1 : 0;
  const fb = b.featured ? 1 : 0;
  if (fb !== fa) return fb - fa;
  const sa = a.score ?? 0;
  const sb = b.score ?? 0;
  if (sb !== sa) return sb - sa;
  return (b.added || '').localeCompare(a.added || '');
}

export function sortItems(items, mode) {
  const list = [...items];
  if (mode === 'newest') {
    list.sort((a, b) => (b.added || '').localeCompare(a.added || ''));
  } else if (mode === 'mural') {
    list.sort((a, b) => {
      const na = (a.mural?.name || a.headline || '').toLowerCase();
      const nb = (b.mural?.name || b.headline || '').toLowerCase();
      return na.localeCompare(nb);
    });
  } else {
    list.sort(defaultSort);
  }
  return list;
}

export function itemSearchText(item) {
  return [
    item.headline,
    item.caption,
    item.text,
    item.mural?.name,
    item.id,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function hasUserFilters(state) {
  return Boolean(
    state.search.trim() ||
      state.category ||
      state.segment !== 'all' ||
      state.color ||
      state.muralFilter ||
      state.shortlistView?.length ||
      state.embedMural,
  );
}

export function filterItems(state) {
  let list = state.items;

  if (state.shortlistView?.length) {
    const allow = new Set(state.shortlistView);
    list = list.filter((i) => allow.has(i.id));
  }

  if (state.embedMural) {
    const key = normalizeMuralName(state.embedMural);
    list = list.filter((i) => normalizeMuralName(i.mural?.name || i.headline) === key);
  }

  if (state.muralFilter) {
    const key = normalizeMuralName(state.muralFilter);
    list = list.filter((i) => normalizeMuralName(i.mural?.name || i.headline) === key);
  }

  if (state.segment === 'residential') {
    list = list.filter((i) => i.segment === 'residential');
  } else if (state.segment === 'business') {
    list = list.filter((i) => i.segment === 'business');
  }

  if (state.category) {
    list = list.filter((i) => {
      if (i.segment === 'business') {
        return (i.sectors || []).includes(state.category);
      }
      return (i.rooms || []).includes(state.category);
    });
  }

  if (state.color) {
    list = list.filter((i) => itemHasColorBucket(i, state.color));
  }

  const idQuery = isIdOnlySearch(state.search);
  if (idQuery) {
    list = list.filter((i) => i.id === idQuery);
  } else {
    const tokens = state.searchTokens || [];
    if (tokens.length) {
      list = list.filter((item) => {
        const hay = itemSearchText(item);
        return tokens.every((t) => hay.includes(t));
      });
    }
  }

  return sortItems(list, state.sort);
}

export function applyHashToState(state, hash) {
  const seg = hash.params.get('seg');
  if (seg === 'residential' || seg === 'business') state.segment = seg;
  else if (hash.params.has('seg')) state.segment = 'all';

  const room = hash.params.get('room');
  const sector = hash.params.get('sector');
  state.category = room || sector || '';

  const sort = hash.params.get('sort');
  if (sort === 'newest' || sort === 'mural' || sort === 'best') state.sort = sort;

  const q = hash.params.get('q');
  if (q != null) state.search = q;

  state.color = hash.params.get('color') || '';
  const mural = hash.params.get('mural');
  state.muralFilter = mural ? decodeURIComponent(mural) : '';
  state.shortlistView = hash.params.get('list')
    ? hash.params.get('list').split(',').map((s) => s.trim().toUpperCase())
    : null;
}

export function stateToHashParams(state) {
  const p = new URLSearchParams();
  if (state.segment !== 'all') p.set('seg', state.segment);
  if (state.category) {
    if (state.segment === 'business') p.set('sector', state.category);
    else if (state.segment === 'residential') p.set('room', state.category);
    else if (state.taxonomy?.sectors?.[state.category]) p.set('sector', state.category);
    else p.set('room', state.category);
  }
  if (state.sort !== 'best') p.set('sort', state.sort);
  if (state.search.trim()) p.set('q', state.search.trim());
  if (state.color) p.set('color', state.color);
  if (state.muralFilter) p.set('mural', state.muralFilter);
  if (state.shortlistView?.length) p.set('list', state.shortlistView.join(','));
  return p;
}
