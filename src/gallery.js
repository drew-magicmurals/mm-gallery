import { PAGE_SIZE, SEARCH_DEBOUNCE_MS } from './config.js';
import { debounce } from './util.js';
import { imageSrc, imageSrcSet } from './images.js';
import {
  filterItems,
  stateToHashParams,
} from './state.js';

export function renderGalleryUI(root, state, { onOpenLightbox, onStateChange }) {
  root.classList.add('mmg-root');
  root.innerHTML = `
    <noscript><p class="mmg-noscript">Enable JavaScript to browse the customer photo gallery, filter by room, and view full-size photos.</p></noscript>
    <div class="mmg-app" hidden>
      <div class="mmg-toolbar">
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
            <input type="search" class="mmg-search" placeholder="Search photos" autocomplete="off" />
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
  }

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

      const ratio = img ? `${img.w} / ${img.h}` : '4 / 3';
      const muralName = item.mural?.name || item.headline || 'Custom mural';
      const location = item.caption || '';

      card.innerHTML = `
        <div class="mmg-card__media" style="aspect-ratio: ${ratio}">
          <img class="mmg-card__img" alt="" loading="lazy" decoding="async" />
          <div class="mmg-card__overlay">
            <span class="mmg-card__mural"></span>
            <span class="mmg-card__loc"></span>
          </div>
        </div>
      `;

      const imgEl = card.querySelector('.mmg-card__img');
      if (img) {
        imgEl.src = imageSrc(img.src, 450);
        imgEl.srcset = imageSrcSet(img.src);
        imgEl.sizes = '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw';
        imgEl.alt = img.alt || muralName;
      }

      card.querySelector('.mmg-card__mural').textContent = muralName;
      card.querySelector('.mmg-card__loc').textContent = location;

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
    syncControls();
    const filtered = filterItems(state);
    renderCards(filtered);
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
    state.visibleCount = PAGE_SIZE;
    onStateChange();
  });

  app.hidden = false;

  return {
    refresh,
    updateHash: () => stateToHashParams(state),
  };
}
