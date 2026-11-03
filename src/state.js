import { isIdOnlySearch } from './photo-id.js';
import { itemHasAnyColorBucket } from './color-buckets.js';
import { normalizeMuralName } from './mural.js';
import { itemMatchesPlaces } from './places.js';

export function createState() {
  return {
    items: [],
    taxonomy: null,
    sort: 'best',
    segment: 'all',
    /** @deprecated use filterCategories */
    category: '',
    search: '',
    /** @deprecated use filterColors */
    color: '',
    filterColors: [],
    filterCategories: [],
    filterPlaces: [],
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

export function hasActiveChips(state) {
  return Boolean(
    state.filterColors?.length ||
      state.filterCategories?.length ||
      state.filterPlaces?.length,
  );
}

export function showFeaturedStrip(state) {
  return (
    state.segment === 'all' &&
    !state.search.trim() &&
    !hasActiveChips(state) &&
    !state.muralFilter &&
    !state.shortlistView?.length &&
    !state.embedMural
  );
}

export function hasUserFilters(state) {
  return Boolean(
    state.search.trim() ||
      hasActiveChips(state) ||
      state.segment !== 'all' ||
      state.muralFilter ||
      state.shortlistView?.length ||
      state.embedMural,
  );
}

export function syncLegacyFilterFields(state) {
  state.color = state.filterColors?.[0] || '';
  state.category = state.filterCategories?.[0] || '';
}

function cloneFilterState(state, overrides = {}) {
  return {
    ...state,
    filterColors: overrides.filterColors ?? [...(state.filterColors || [])],
    filterCategories: overrides.filterCategories ?? [...(state.filterCategories || [])],
    filterPlaces: overrides.filterPlaces ?? [...(state.filterPlaces || [])],
    search: overrides.search ?? state.search,
    segment: overrides.segment ?? state.segment,
    searchTokens:
      overrides.searchTokens ??
      (overrides.search ?? state.search).trim().toLowerCase().split(/\s+/).filter(Boolean),
  };
}

/** Count / suggest without mutating live state. */
export function filterItemsPreview(state, overrides = {}, options = {}) {
  return filterItems(cloneFilterState(state, overrides), options);
}

export function filterItems(state, options = {}) {
  const ignoreCategories = options.ignoreCategories;
  const ignoreColors = options.ignoreColors;
  const ignorePlaces = options.ignorePlaces;

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

  const categories = ignoreCategories ? [] : state.filterCategories || [];
  if (categories.length) {
    list = list.filter((i) => {
      if (i.segment === 'business') {
        return (i.sectors || []).some((s) => categories.includes(s));
      }
      return (i.rooms || []).some((r) => categories.includes(r));
    });
  }

  const colors = ignoreColors ? [] : state.filterColors || [];
  if (colors.length) {
    list = list.filter((i) => itemHasAnyColorBucket(i, colors));
  }

  const places = ignorePlaces ? [] : state.filterPlaces || [];
  if (places.length) {
    list = list.filter((i) => itemMatchesPlaces(i, places));
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

function splitHashList(val) {
  if (!val) return [];
  return val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function applyHashToState(state, hash) {
  const seg = hash.params.get('seg');
  if (seg === 'residential' || seg === 'business') state.segment = seg;
  else if (hash.params.has('seg')) state.segment = 'all';

  const room = hash.params.get('room');
  const sector = hash.params.get('sector');
  const catParts = splitHashList(room || sector || '');
  state.filterCategories = catParts;
  state.category = catParts[0] || '';

  const sort = hash.params.get('sort');
  if (sort === 'newest' || sort === 'mural' || sort === 'best') state.sort = sort;

  const q = hash.params.get('q');
  if (q != null) state.search = q;

  const colorParam = hash.params.get('color') || '';
  state.filterColors = splitHashList(colorParam);
  state.color = state.filterColors[0] || '';

  const placeParam = hash.params.get('place') || '';
  state.filterPlaces = splitHashList(placeParam);

  const mural = hash.params.get('mural');
  state.muralFilter = mural ? decodeURIComponent(mural) : '';
  state.shortlistView = hash.params.get('list')
    ? hash.params.get('list').split(',').map((s) => s.trim().toUpperCase())
    : null;
}

export function stateToHashParams(state) {
  const p = new URLSearchParams();
  if (state.segment !== 'all') p.set('seg', state.segment);
  if (state.filterCategories?.length) {
    if (state.segment === 'business') p.set('sector', state.filterCategories.join(','));
    else if (state.segment === 'residential') p.set('room', state.filterCategories.join(','));
    else {
      const first = state.filterCategories[0];
      if (state.taxonomy?.sectors?.[first]) p.set('sector', state.filterCategories.join(','));
      else p.set('room', state.filterCategories.join(','));
    }
  }
  if (state.sort !== 'best') p.set('sort', state.sort);
  if (state.search.trim()) p.set('q', state.search.trim());
  if (state.filterColors?.length) p.set('color', state.filterColors.join(','));
  if (state.filterPlaces?.length) p.set('place', state.filterPlaces.join(','));
  if (state.muralFilter) p.set('mural', state.muralFilter);
  if (state.shortlistView?.length) p.set('list', state.shortlistView.join(','));
  return p;
}

export function clearAllFilters(state) {
  state.segment = 'all';
  state.filterCategories = [];
  state.category = '';
  state.search = '';
  state.sort = 'best';
  state.filterColors = [];
  state.color = '';
  state.filterPlaces = [];
  state.muralFilter = '';
  state.shortlistView = null;
  state.visibleCount = 24;
}
