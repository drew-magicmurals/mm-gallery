import { PAGE_SIZE } from './config.js';
import { imageSrc, imageSrcSet } from './images.js';
import {
  filterItems,
  stateToHashParams,
  showFeaturedStrip,
  syncLegacyFilterFields,
} from './state.js';
import { displayAlt } from './alt-text.js';
import { attachSmartBar } from './smart-bar.js';
import { isIdOnlySearch, displayPhotoId } from './photo-id.js';
import { rankItemForQuery } from './search-rank.js';

export function renderGalleryUI(root, state, { onOpenLightbox, onStateChange, shortlistApi }) {
  root.classList.add('mmg-root');
  root.innerHTML = `
    <noscript><p class="mmg-noscript">Enable JavaScript to browse the customer photo gallery, filter by room, and view full-size photos.</p></noscript>
    <div class="mmg-app" hidden>
      <div class="mmg-featured" hidden aria-label="Featured customer stories"></div>
      <div class="mmg-smartbar-wrap"></div>
      <div class="mmg-grid" role="list"></div>
      <div class="mmg-empty" hidden>
        <p class="mmg-empty__msg">No photos match your search.</p>
        <ul class="mmg-empty__suggest" hidden></ul>
        <button type="button" class="mmg-btn mmg-clear">Clear all</button>
      </div>
      <button type="button" class="mmg-btn mmg-load-more" hidden>Load more</button>
    </div>
  `;

  const app = root.querySelector('.mmg-app');
  const featuredEl = root.querySelector('.mmg-featured');
  const smartbarWrap = root.querySelector('.mmg-smartbar-wrap');
  const grid = root.querySelector('.mmg-grid');
  const emptyEl = root.querySelector('.mmg-empty');
  const emptySuggest = root.querySelector('.mmg-empty__suggest');
  const loadMoreBtn = root.querySelector('.mmg-load-more');

  const smartBar = attachSmartBar(smartbarWrap, state, { onStateChange });

  function renderFeatured(allItems) {
    if (!showFeaturedStrip(state)) {
      featuredEl.hidden = true;
      return;
    }
    const featured = allItems.filter((i) => i.featured).slice(0, 3);
    if (!featured.length) {
      featuredEl.hidden = true;
      return;
    }
    featuredEl.hidden = false;
    featuredEl.textContent = '';
    const title = document.createElement('h2');
    title.className = 'mmg-featured__title';
    title.textContent = 'Featured';
    featuredEl.appendChild(title);
    const track = document.createElement('div');
    track.className = 'mmg-featured__track';
    featured.forEach((item) => {
      const img = item.images?.[0];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'mmg-featured__card';
      card.setAttribute('aria-label', `Featured photo ${item.id}`);
      card.innerHTML = `
        <span class="mmg-featured__img-wrap">
          <span class="mmg-featured__badge">Featured</span>
        </span>
      `;
      if (img) {
        const im = document.createElement('img');
        im.src = imageSrc(img.src, 450);
        im.alt = '';
        im.loading = 'lazy';
        card.querySelector('.mmg-featured__img-wrap').appendChild(im);
      }
      card.addEventListener('click', () => onOpenLightbox(item, filterItems(state)));
      track.appendChild(card);
    });
    featuredEl.appendChild(track);
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

      const muralName = item.mural?.name || item.headline || 'Custom mural';
      const location = item.caption || '';
      const dominant = img?.dominant || '';
      const mediaClass = dominant ? `mmg-card__media mmg-dominant-${dominant}` : 'mmg-card__media';

      card.innerHTML = `
        <div class="${mediaClass}">
          <img class="mmg-card__img" alt="" loading="lazy" decoding="async" />
          <button type="button" class="mmg-card__heart" aria-label="Save to shortlist" aria-pressed="false"><span aria-hidden="true">♥</span></button>
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
      card.querySelector('.mmg-card__id').textContent = displayPhotoId(item.id);

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

    if (filtered.length === 0) {
      emptySuggest.textContent = '';
      const suggestions = smartBar.getCloseSuggestions();
      if (suggestions.length) {
        emptySuggest.hidden = false;
        for (const s of suggestions) {
          const li = document.createElement('li');
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'mmg-empty__suggest-btn';
          btn.textContent = s.label;
          btn.addEventListener('click', () => {
            if (s.kind === 'color' || s.kind === 'category' || s.kind === 'place') {
              const colors = state.filterColors || [];
              const cats = state.filterCategories || [];
              const places = state.filterPlaces || [];
              if (s.kind === 'color' && !colors.includes(s.value)) {
                state.filterColors = [...colors, s.value];
              }
              if (s.kind === 'category' && !cats.includes(s.value)) {
                state.filterCategories = [...cats, s.value];
              }
              if (s.kind === 'place') state.filterPlaces = [...places, s.value];
              onStateChange();
            } else if (s.kind === 'id') {
              state.search = s.value;
              onStateChange();
            } else {
              state.search = s.label;
              onStateChange();
            }
          });
          li.appendChild(btn);
          emptySuggest.appendChild(li);
        }
      } else if (state.search.trim()) {
        const ranked = [...state.items]
          .map((item) => ({ item, score: rankItemForQuery(item, state.search) }))
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
        if (ranked.length) {
          emptySuggest.hidden = false;
          for (const { item } of ranked) {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'mmg-empty__suggest-btn';
            btn.textContent = item.mural?.name || item.headline || item.id;
            btn.addEventListener('click', () => onOpenLightbox(item, state.items));
            li.appendChild(btn);
            emptySuggest.appendChild(li);
          }
        } else {
          emptySuggest.hidden = true;
        }
      } else {
        emptySuggest.hidden = true;
      }
    } else {
      emptySuggest.hidden = true;
    }
  }

  function refresh() {
    state.searchTokens = state.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    syncLegacyFilterFields(state);
    renderFeatured(state.items);
    const filtered = filterItems(state);
    smartBar.sync(filtered.length);
    renderCards(filtered);

    const idJump = isIdOnlySearch(state.search);
    if (idJump && filtered.length === 1) {
      state.pendingOpenId = idJump;
    }

    return filtered;
  }

  loadMoreBtn.addEventListener('click', () => {
    state.visibleCount += PAGE_SIZE;
    refresh();
  });

  root.querySelector('.mmg-clear').addEventListener('click', () => {
    smartBar.clearAll();
  });

  app.hidden = false;

  return {
    refresh,
    updateHash: () => stateToHashParams(state),
  };
}
