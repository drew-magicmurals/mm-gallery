import { PAGE_SIZE, SEARCH_DEBOUNCE_MS, COLOR_SWATCH_KEYS } from './config.js';
import { debounce } from './util.js';
import { imageSrc, imageSrcSet } from './images.js';
import { filterItems, stateToHashParams, hasUserFilters } from './state.js';
import { displayAlt } from './alt-text.js';
import { hasColorData, SWATCH_HEX, SWATCH_LABELS } from './color-buckets.js';
import { roomCounts } from './mural.js';
import { isIdOnlySearch } from './photo-id.js';

export function renderGalleryUI(root, state, { onOpenLightbox, onStateChange, shortlistApi }) {
  root.classList.add('mmg-root');
  root.innerHTML = `
    <noscript><p class="mmg-noscript">Enable JavaScript to browse the customer photo gallery, filter by room, and view full-size photos.</p></noscript>
    <div class="mmg-app" hidden>
      <div class="mmg-featured" hidden aria-label="Featured customer stories"></div>
      <div class="mmg-browse" hidden>
        <button type="button" class="mmg-browse-toggle" aria-expanded="false">Browse by room</button>
        <div class="mmg-browse-tiles" hidden></div>
      </div>
      <div class="mmg-toolbar">
        <div class="mmg-color-filters" hidden role="group" aria-label="Filter by color"></div>
        <div class="mmg-toolbar__row">
          <div class="mmg-segments" role="group" aria-label="Gallery segment">
            <button type="button" class="mmg-seg" data-seg="all">All</button>
            <button type="button" class="mmg-seg" data-seg="residential">Residential</button>
            <button type="button" class="mmg-seg" data-seg="business">Business</button>
          </div>
          <label class="mmg-select-wrap">
            <span class="mmg-visually-hidden">Room or sector</span>
            <select class="mmg-category" aria-label="Filter by room or sector"></select>
          </label>
        </div>
        <div class="mmg-toolbar__row">
          <label class="mmg-search-wrap">
            <span class="mmg-visually-hidden">Search gallery</span>
            <input type="search" class="mmg-search" placeholder="Search murals, places, or a photo number" autocomplete="off" />
          </label>
          <label class="mmg-select-wrap mmg-select-wrap--sort">
            <span class="mmg-visually-hidden">Sort</span>
            <select class="mmg-sort" aria-label="Sort gallery">
              <option value="best">Best</option>
              <option value="newest">Newest</option>
              <option value="mural">Mural name</option>
            </select>
          </label>
        </div>
      </div>
      <p class="mmg-count" aria-live="polite"></p>
      <div class="mmg-grid" role="list"></div>
      <div class="mmg-empty" hidden>
        <p>No photos match your filters.</p>
        <button type="button" class="mmg-btn mmg-clear">Clear filters</button>
      </div>
      <button type="button" class="mmg-btn mmg-load-more" hidden>Load more</button>
    </div>
  `;

  const app = root.querySelector('.mmg-app');
  const featuredEl = root.querySelector('.mmg-featured');
  const browseWrap = root.querySelector('.mmg-browse');
  const browseToggle = root.querySelector('.mmg-browse-toggle');
  const browseTiles = root.querySelector('.mmg-browse-tiles');
  const colorFilters = root.querySelector('.mmg-color-filters');
  const grid = root.querySelector('.mmg-grid');
  const countEl = root.querySelector('.mmg-count');
  const emptyEl = root.querySelector('.mmg-empty');
  const loadMoreBtn = root.querySelector('.mmg-load-more');
  const categorySelect = root.querySelector('.mmg-category');
  const searchInput = root.querySelector('.mmg-search');
  const sortSelect = root.querySelector('.mmg-sort');

  function categoryOptions() {
    const tax = state.taxonomy;
    const opts = [{ value: '', label: state.segment === 'business' ? 'All sectors' : 'All rooms' }];
    if (!tax) return opts;
    const map = state.segment === 'business' ? tax.sectors : tax.rooms;
    if (state.segment === 'all') {
      opts.push({ value: '', label: 'Select segment first', disabled: true });
      return opts;
    }
    for (const [key, label] of Object.entries(map)) {
      opts.push({ value: key, label });
    }
    return opts;
  }

  function syncControls() {
    root.querySelectorAll('.mmg-seg').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.seg === state.segment);
      btn.setAttribute('aria-pressed', btn.dataset.seg === state.segment ? 'true' : 'false');
    });
    sortSelect.value = state.sort;
    searchInput.value = state.search;

    const prev = state.category;
    categorySelect.textContent = '';
    for (const opt of categoryOptions()) {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      if (opt.disabled) o.disabled = true;
      categorySelect.appendChild(o);
    }
    if ([...categorySelect.options].some((o) => o.value === prev)) {
      categorySelect.value = prev;
    } else {
      categorySelect.value = '';
      state.category = '';
    }

    categorySelect.disabled = state.segment === 'all';

    colorFilters.querySelectorAll('.mmg-color-swatch').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.color === state.color);
      btn.setAttribute('aria-pressed', btn.dataset.color === state.color ? 'true' : 'false');
    });
  }

  function renderColorFilters() {
    colorFilters.textContent = '';
    if (!hasColorData(state.items)) {
      colorFilters.hidden = true;
      return;
    }
    colorFilters.hidden = false;
    for (const key of COLOR_SWATCH_KEYS) {
      if (!state.items.some((i) => i.images?.some((im) => im.dominant === key))) continue;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `mmg-color-swatch mmg-dominant-${key}`;
      btn.dataset.color = key;
      btn.setAttribute('aria-label', SWATCH_LABELS[key] || key);
      btn.title = SWATCH_LABELS[key] || key;
      btn.addEventListener('click', () => {
        state.color = state.color === key ? '' : key;
        state.visibleCount = PAGE_SIZE;
        onStateChange();
      });
      colorFilters.appendChild(btn);
    }
  }

  function truncateQuote(text, max = 140) {
    const t = String(text || '').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max).trim()}…`;
  }

  function renderFeatured(allItems) {
    if (hasUserFilters(state)) {
      featuredEl.hidden = true;
      return;
    }
    const featured = allItems.filter((i) => i.featured).slice(0, 5);
    if (!featured.length) {
      featuredEl.hidden = true;
      return;
    }
    featuredEl.hidden = false;
    featuredEl.textContent = '';
    const title = document.createElement('h2');
    title.className = 'mmg-featured__title';
    title.textContent = 'Featured stories';
    featuredEl.appendChild(title);
    const track = document.createElement('div');
    track.className = 'mmg-featured__track';
    featured.forEach((item, idx) => {
      const img = item.images?.[0];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'mmg-featured__card' + (idx === 0 ? ' mmg-featured__card--lead' : '');
      const quote = truncateQuote(item.text);
      card.innerHTML = `
        <span class="mmg-featured__img-wrap"></span>
        <span class="mmg-featured__meta">
          <span class="mmg-featured__mural"></span>
          <span class="mmg-featured__caption"></span>
          ${quote ? `<span class="mmg-featured__quote"></span>` : ''}
        </span>
      `;
      if (img) {
        const im = document.createElement('img');
        im.src = imageSrc(img.src, 450);
        im.alt = '';
        im.loading = 'lazy';
        if (img.w && img.h) {
          im.width = img.w;
          im.height = img.h;
        }
        card.querySelector('.mmg-featured__img-wrap').appendChild(im);
      }
      card.querySelector('.mmg-featured__mural').textContent = item.mural?.name || item.headline;
      card.querySelector('.mmg-featured__caption').textContent = item.caption || '';
      const qEl = card.querySelector('.mmg-featured__quote');
      if (qEl) qEl.textContent = `"${quote}"`;
      card.addEventListener('click', () => onOpenLightbox(item, filterItems(state)));
      track.appendChild(card);
    });
    featuredEl.appendChild(track);
  }

  function renderBrowse() {
    const rooms = roomCounts(state.items, state.taxonomy).slice(0, 6);
    if (!rooms.length || state.segment === 'business') {
      browseWrap.hidden = true;
      return;
    }
    browseWrap.hidden = false;
    browseTiles.textContent = '';
    for (const room of rooms) {
      const sample = room.sample?.images?.[0];
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'mmg-browse-tile';
      tile.innerHTML = `<span class="mmg-browse-tile__img"></span><span class="mmg-browse-tile__label"></span><span class="mmg-browse-tile__count"></span>`;
      if (sample) {
        const im = document.createElement('img');
        im.src = imageSrc(sample.src, 450);
        im.alt = '';
        im.loading = 'lazy';
        tile.querySelector('.mmg-browse-tile__img').appendChild(im);
      }
      tile.querySelector('.mmg-browse-tile__label').textContent = room.label;
      tile.querySelector('.mmg-browse-tile__count').textContent = `${room.count} photos`;
      tile.addEventListener('click', () => {
        state.segment = 'residential';
        state.category = room.key;
        state.visibleCount = PAGE_SIZE;
        onStateChange();
      });
      browseTiles.appendChild(tile);
    }
  }

  browseToggle.addEventListener('click', () => {
    const open = browseTiles.hidden;
    browseTiles.hidden = !open;
    browseToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  function renderCards(filtered) {
    grid.textContent = '';
    const slice = filtered.slice(0, state.visibleCount);
    for (const item of slice) {
      const img = item.images?.[0];
      const card = document.createElement('article');
      card.className = 'mmg-card';
      card.setAttribute('role', 'listitem');
      card.tabIndex = 0;
      card.dataset.id = item.id;

      const muralName = item.mural?.name || item.headline || 'Custom mural';
      const location = item.caption || '';
      const dominant = img?.dominant || '';
      const mediaClass = dominant ? `mmg-card__media mmg-dominant-${dominant}` : 'mmg-card__media';

      card.innerHTML = `
        <div class="${mediaClass}">
          <img class="mmg-card__img" alt="" loading="lazy" decoding="async" />
          <button type="button" class="mmg-card__heart" aria-label="Save to shortlist" aria-pressed="false">♥</button>
          <div class="mmg-card__overlay">
            <span class="mmg-card__mural"></span>
            <span class="mmg-card__loc"></span>
            <span class="mmg-card__id"></span>
          </div>
        </div>
      `;

      const imgEl = card.querySelector('.mmg-card__img');
      if (img) {
        imgEl.src = imageSrc(img.src, 450);
        imgEl.srcset = imageSrcSet(img.src);
        imgEl.sizes = '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw';
        imgEl.alt = displayAlt(item, img, state.taxonomy);
        if (img.w && img.h) {
          imgEl.width = img.w;
          imgEl.height = img.h;
        }
      }

      const heart = card.querySelector('.mmg-card__heart');
      if (shortlistApi) {
        const saved = shortlistApi.isSaved(item.id);
        heart.setAttribute('aria-pressed', saved ? 'true' : 'false');
        heart.classList.toggle('is-active', saved);
        heart.addEventListener('click', (e) => {
          e.stopPropagation();
          shortlistApi.toggle(item.id);
          heart.setAttribute('aria-pressed', shortlistApi.isSaved(item.id) ? 'true' : 'false');
          heart.classList.toggle('is-active', shortlistApi.isSaved(item.id));
        });
      }

      card.querySelector('.mmg-card__mural').textContent = muralName;
      card.querySelector('.mmg-card__loc').textContent = location;
      card.querySelector('.mmg-card__id').textContent = item.id;

      const open = () => onOpenLightbox(item, filtered);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });

      grid.appendChild(card);
    }

    const hasMore = filtered.length > state.visibleCount;
    loadMoreBtn.hidden = !hasMore;
    emptyEl.hidden = filtered.length > 0;
    grid.hidden = filtered.length === 0;
    countEl.textContent =
      filtered.length === state.items.length
        ? `${filtered.length} photos`
        : `${filtered.length} of ${state.items.length} photos`;
  }

  function refresh() {
    state.searchTokens = state.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    renderColorFilters();
    syncControls();
    renderFeatured(state.items);
    renderBrowse();
    const filtered = filterItems(state);
    renderCards(filtered);

    const idJump = isIdOnlySearch(state.search);
    if (idJump && filtered.length === 1) {
      state.pendingOpenId = idJump;
    }

    return filtered;
  }

  root.querySelectorAll('.mmg-seg').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.segment = btn.dataset.seg;
      state.category = '';
      state.visibleCount = PAGE_SIZE;
      onStateChange();
    });
  });

  categorySelect.addEventListener('change', () => {
    state.category = categorySelect.value;
    state.visibleCount = PAGE_SIZE;
    onStateChange();
  });

  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    onStateChange();
  });

  const debouncedSearch = debounce(() => onStateChange(), SEARCH_DEBOUNCE_MS);
  searchInput.addEventListener('input', () => {
    state.search = searchInput.value;
    state.visibleCount = PAGE_SIZE;
    debouncedSearch();
  });

  loadMoreBtn.addEventListener('click', () => {
    state.visibleCount += PAGE_SIZE;
    refresh();
  });

  root.querySelector('.mmg-clear').addEventListener('click', () => {
    state.segment = 'all';
    state.category = '';
    state.search = '';
    state.sort = 'best';
    state.color = '';
    state.muralFilter = '';
    state.shortlistView = null;
    state.visibleCount = PAGE_SIZE;
    onStateChange();
  });

  app.hidden = false;

  return {
    refresh,
    updateHash: () => stateToHashParams(state),
  };
}
