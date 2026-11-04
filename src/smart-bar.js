import {
  PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  COLOR_SWATCH_KEYS,
} from './config.js';
import { debounce } from './util.js';
import { filterItemsPreview, clearAllFilters } from './state.js';
import { hasColorData, SWATCH_LABELS } from './color-buckets.js';
import { roomCounts, sectorCounts } from './mural.js';
import { buildPlaceIndex } from './places.js';
import { normalizePhotoId, displayPhotoId } from './photo-id.js';
import { scoreText, rankIdQuery } from './search-rank.js';

const SEG_SYNONYMS = {
  home: 'residential',
  residential: 'residential',
  business: 'business',
  commercial: 'business',
};

function parseSegmentWords(text) {
  const tokens = String(text || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  let segment = null;
  const kept = [];
  for (const t of tokens) {
    const seg = SEG_SYNONYMS[t.replace(/[^a-z]/g, '')];
    if (seg && !segment) segment = seg;
    else kept.push(t);
  }
  return { segment, query: kept.join(' ') };
}

export function attachSmartBar(wrap, state, { onStateChange }) {
  wrap.innerHTML = `
    <div class="mmg-smartbar">
      <div class="mmg-smartbar__pill-row">
        <div class="mmg-smartbar__pill">
          <span class="mmg-smartbar__search-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" stroke-width="2"/><path d="M16 16l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </span>
          <div class="mmg-smartbar__chips" aria-live="polite"></div>
          <input type="search" class="mmg-smartbar__input" autocomplete="off" spellcheck="false"
            role="combobox" aria-expanded="false" aria-controls="mmg-smartbar-listbox"
            aria-autocomplete="list" placeholder="Search murals, places, colors, rooms…" />
          <div class="mmg-smartbar__seg mmg-smartbar__seg--in-pill" role="radiogroup" aria-label="Gallery type">
            <button type="button" class="mmg-smartbar__seg-btn" data-seg="all" role="radio" aria-checked="true">All</button>
            <button type="button" class="mmg-smartbar__seg-btn" data-seg="residential" role="radio" aria-checked="false">Home</button>
            <button type="button" class="mmg-smartbar__seg-btn" data-seg="business" role="radio" aria-checked="false">Business</button>
          </div>
        </div>
        <div class="mmg-smartbar__seg mmg-smartbar__seg--below" role="radiogroup" aria-label="Gallery type">
          <button type="button" class="mmg-smartbar__seg-btn" data-seg="all" role="radio" aria-checked="true">All</button>
          <button type="button" class="mmg-smartbar__seg-btn" data-seg="residential" role="radio" aria-checked="false">Home</button>
          <button type="button" class="mmg-smartbar__seg-btn" data-seg="business" role="radio" aria-checked="false">Business</button>
        </div>
      </div>
      <p class="mmg-smartbar__summary">
        <span class="mmg-smartbar__count" aria-live="polite"></span>
      </p>
      <div class="mmg-smartbar__panel" id="mmg-smartbar-listbox" role="listbox" hidden></div>
    </div>
  `;

  const pill = wrap.querySelector('.mmg-smartbar__pill');
  const chipsEl = wrap.querySelector('.mmg-smartbar__chips');
  const input = wrap.querySelector('.mmg-smartbar__input');
  const panel = wrap.querySelector('.mmg-smartbar__panel');
  const countEl = wrap.querySelector('.mmg-smartbar__count');
  const segGroups = wrap.querySelectorAll('.mmg-smartbar__seg');

  let panelOpen = false;
  let activeOption = -1;
  let placeIndex = [];
  let launcherExpanded = false;

  function bump() {
    state.visibleCount = PAGE_SIZE;
    onStateChange();
  }

  function setPanelOpen(open) {
    panelOpen = open;
    panel.hidden = !open;
    input.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) renderPanel();
    else activeOption = -1;
  }

  function syncSegmentUi() {
    const mobile = window.matchMedia('(max-width: 639px)').matches;
    wrap.querySelector('.mmg-smartbar__seg--in-pill')?.setAttribute('aria-hidden', mobile ? 'true' : 'false');
    wrap.querySelector('.mmg-smartbar__seg--below')?.setAttribute('aria-hidden', mobile ? 'false' : 'true');
    segGroups.forEach((group) => {
      group.querySelectorAll('.mmg-smartbar__seg-btn').forEach((btn) => {
        const on = btn.dataset.seg === state.segment;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    });
  }

  function chipLabel(type, value) {
    if (type === 'color') return SWATCH_LABELS[value] || value;
    if (type === 'place') {
      const hit = placeIndex.find((p) => p.key === value.toLowerCase());
      return hit?.label || value;
    }
    if (type === 'category') {
      const tax = state.taxonomy;
      return tax?.rooms?.[value] || tax?.sectors?.[value] || value;
    }
    return value;
  }

  function renderChips() {
    chipsEl.textContent = '';
    const chips = [];
    for (const c of state.filterColors || []) chips.push({ type: 'color', value: c });
    for (const c of state.filterCategories || []) chips.push({ type: 'category', value: c });
    for (const p of state.filterPlaces || []) chips.push({ type: 'place', value: p });

    chips.forEach((chip) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mmg-smartbar__chip';
      if (chip.type === 'color') btn.classList.add(`mmg-dominant-${chip.value}`);
      const label = chipLabel(chip.type, chip.value);
      btn.setAttribute('aria-label', `Remove ${label}`);
      btn.innerHTML = `<span class="mmg-smartbar__chip-label"></span><span class="mmg-smartbar__chip-x" aria-hidden="true">×</span>`;
      btn.querySelector('.mmg-smartbar__chip-label').textContent = label;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeChip(chip.type, chip.value);
      });
      chipsEl.appendChild(btn);
    });
  }

  function removeChip(type, value) {
    if (type === 'color') {
      state.filterColors = (state.filterColors || []).filter((c) => c !== value);
    } else if (type === 'category') {
      state.filterCategories = (state.filterCategories || []).filter((c) => c !== value);
    } else if (type === 'place') {
      state.filterPlaces = (state.filterPlaces || []).filter((p) => p !== value);
    }
    renderChips();
    bump();
  }

  function addChip(type, value) {
    if (type === 'color') {
      if (!(state.filterColors || []).includes(value)) {
        state.filterColors = [...(state.filterColors || []), value];
      }
    } else if (type === 'category') {
      if (!(state.filterCategories || []).includes(value)) {
        state.filterCategories = [...(state.filterCategories || []), value];
        if (state.segment === 'all') {
          const isSector = Boolean(state.taxonomy?.sectors?.[value]);
          state.segment = isSector ? 'business' : 'residential';
        }
      }
    } else if (type === 'place') {
      const key = value.toLowerCase();
      if (!(state.filterPlaces || []).some((p) => p.toLowerCase() === key)) {
        state.filterPlaces = [...(state.filterPlaces || []), value];
      }
    }
    input.value = '';
    state.search = '';
    renderChips();
    syncSegmentUi();
    bump();
    setPanelOpen(false);
  }

  function categoryOptionsForLauncher() {
    if (state.segment === 'business') {
      return sectorCounts(state.items, state.taxonomy);
    }
    if (state.segment === 'residential') {
      return roomCounts(state.items, state.taxonomy);
    }
    return roomCounts(state.items, state.taxonomy).slice(0, 8);
  }

  function countWithCategory(key) {
    return filterItemsPreview(state, { filterCategories: [key] }).length;
  }

  function countWithColor(key) {
    return filterItemsPreview(state, { filterColors: [key] }).length;
  }

  function buildSuggestions(query) {
    const q = query.trim();
    if (!q) return [];
    const groups = [];
    const normId = normalizePhotoId(q);
    if (normId) {
      const item = state.items.find((i) => i.id === normId);
      if (item) {
        groups.push({
          title: 'Photo number',
          options: [{ kind: 'id', value: item.id, label: displayPhotoId(item.id), score: 2000 }],
        });
      }
    }

    const colorOpts = [];
    for (const key of COLOR_SWATCH_KEYS) {
      if (!state.items.some((i) => i.images?.some((im) => im.dominant === key))) continue;
      const label = SWATCH_LABELS[key] || key;
      const score = scoreText(q, label) + scoreText(q, key);
      if (score > 0) {
        colorOpts.push({ kind: 'color', value: key, label, score, count: countWithColor(key) });
      }
    }
    colorOpts.sort((a, b) => b.score - a.score);
    if (colorOpts.length) groups.push({ title: 'Colors', options: colorOpts.slice(0, 6) });

    const catOpts = [];
    const cats =
      state.segment === 'business'
        ? sectorCounts(state.items, state.taxonomy)
        : roomCounts(state.items, state.taxonomy);
    for (const c of cats) {
      const score = scoreText(q, c.label);
      if (score > 0) catOpts.push({ kind: 'category', value: c.key, label: c.label, score, count: countWithCategory(c.key) });
    }
    catOpts.sort((a, b) => b.score - a.score);
    if (catOpts.length) {
      groups.push({
        title: state.segment === 'business' ? 'Sectors' : 'Rooms',
        options: catOpts.slice(0, 8),
      });
    }

    const placeOpts = [];
    for (const p of placeIndex) {
      const score = scoreText(q, p.label);
      if (score > 0) placeOpts.push({ kind: 'place', value: p.label, label: p.label, score, count: p.count });
    }
    placeOpts.sort((a, b) => b.score - a.score);
    if (placeOpts.length) groups.push({ title: 'Places', options: placeOpts.slice(0, 8) });

    const muralMap = new Map();
    for (const item of state.items) {
      const name = item.mural?.name || item.headline;
      if (!name) continue;
      const score = Math.max(scoreText(q, name), rankIdQuery(q, item.id) ? 0 : 0);
      const prev = muralMap.get(name) || { kind: 'mural', value: name, label: name, score: 0, count: 0 };
      prev.score = Math.max(prev.score, score);
      prev.count += 1;
      muralMap.set(name, prev);
    }
    const muralOpts = [...muralMap.values()].filter((m) => m.score > 0).sort((a, b) => b.score - a.score);
    if (muralOpts.length) groups.push({ title: 'Murals', options: muralOpts.slice(0, 8) });

    return groups;
  }

  function flatOptions(groups) {
    const flat = [];
    for (const g of groups) {
      for (const o of g.options) flat.push({ ...o, group: g.title });
    }
    return flat;
  }

  function renderPanel() {
    panel.textContent = '';
    const q = input.value.trim();
    const groups = q ? buildSuggestions(q) : null;

    if (groups && groups.length) {
      panel.setAttribute('role', 'listbox');
      panel.removeAttribute('aria-label');
      let idx = 0;
      for (const g of groups) {
        const heading = document.createElement('div');
        heading.className = 'mmg-smartbar__panel-heading';
        heading.textContent = g.title;
        panel.appendChild(heading);
        for (const opt of g.options) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'mmg-smartbar__option';
          btn.role = 'option';
          btn.id = `mmg-sb-opt-${idx}`;
          btn.dataset.index = String(idx);
          if (opt.kind === 'color') {
            btn.innerHTML = `<span class="mmg-smartbar__option-swatch mmg-dominant-${opt.value}"></span><span class="mmg-smartbar__option-label"></span><span class="mmg-smartbar__option-count"></span>`;
          } else {
            btn.innerHTML = `<span class="mmg-smartbar__option-label"></span><span class="mmg-smartbar__option-count"></span>`;
          }
          btn.querySelector('.mmg-smartbar__option-label').textContent = opt.label;
          const countElOpt = btn.querySelector('.mmg-smartbar__option-count');
          if (countElOpt && opt.count != null) countElOpt.textContent = String(opt.count);
          btn.addEventListener('click', () => applyOption(opt));
          panel.appendChild(btn);
          idx += 1;
        }
      }
      activeOption = flatOptions(groups).length ? 0 : -1;
      highlightOption();
      return;
    }

    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', 'Filter and sort');

    if (q) {
      const empty = document.createElement('p');
      empty.className = 'mmg-smartbar__panel-empty';
      empty.textContent = 'No matches — press Enter to search the gallery.';
      panel.appendChild(empty);
      return;
    }

    renderLauncher();
  }

  function renderLauncher() {
    panel.textContent = '';

    if (hasColorData(state.items)) {
      const colorsHead = document.createElement('div');
      colorsHead.className = 'mmg-smartbar__panel-heading';
      colorsHead.textContent = 'Colors';
      panel.appendChild(colorsHead);
      const row = document.createElement('div');
      row.className = 'mmg-smartbar__color-row';
      for (const key of COLOR_SWATCH_KEYS) {
        if (!state.items.some((i) => i.images?.some((im) => im.dominant === key))) continue;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `mmg-smartbar__color-dot mmg-dominant-${key}`;
        btn.setAttribute('aria-label', SWATCH_LABELS[key] || key);
        btn.title = SWATCH_LABELS[key] || key;
        btn.addEventListener('click', () => addChip('color', key));
        row.appendChild(btn);
      }
      panel.appendChild(row);
    }

    const cats = categoryOptionsForLauncher();
    const showCats = launcherExpanded ? cats : cats.slice(0, 8);
    if (showCats.length && state.segment !== 'all') {
      const head = document.createElement('div');
      head.className = 'mmg-smartbar__panel-heading';
      head.textContent = state.segment === 'business' ? 'Business sectors' : 'Rooms';
      panel.appendChild(head);
      const chipRow = document.createElement('div');
      chipRow.className = 'mmg-smartbar__launcher-chips';
      for (const c of showCats) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mmg-smartbar__launcher-chip';
        btn.textContent = `${c.label} (${countWithCategory(c.key)})`;
        btn.addEventListener('click', () => addChip('category', c.key));
        chipRow.appendChild(btn);
      }
      panel.appendChild(chipRow);
      if (!launcherExpanded && cats.length > 8) {
        const more = document.createElement('button');
        more.type = 'button';
        more.className = 'mmg-smartbar__more';
        more.textContent = 'More';
        more.addEventListener('click', () => {
          launcherExpanded = true;
          renderPanel();
        });
        panel.appendChild(more);
      }
    } else if (showCats.length && state.segment === 'all') {
      const head = document.createElement('div');
      head.className = 'mmg-smartbar__panel-heading';
      head.textContent = 'Rooms (Home)';
      panel.appendChild(head);
      const chipRow = document.createElement('div');
      chipRow.className = 'mmg-smartbar__launcher-chips';
      for (const c of showCats) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mmg-smartbar__launcher-chip';
        btn.textContent = `${c.label} (${countWithCategory(c.key)})`;
        btn.addEventListener('click', () => addChip('category', c.key));
        chipRow.appendChild(btn);
      }
      panel.appendChild(chipRow);
    }

    const sortHead = document.createElement('div');
    sortHead.className = 'mmg-smartbar__panel-heading';
    sortHead.textContent = 'Sort';
    panel.appendChild(sortHead);
    const sortRow = document.createElement('div');
    sortRow.className = 'mmg-smartbar__sort';
    sortRow.setAttribute('role', 'radiogroup');
    sortRow.setAttribute('aria-label', 'Sort order');
    for (const [val, lab] of [
      ['best', 'Best'],
      ['newest', 'Newest'],
      ['mural', 'A–Z'],
    ]) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mmg-smartbar__sort-btn';
      btn.dataset.sort = val;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', state.sort === val ? 'true' : 'false');
      btn.classList.toggle('is-active', state.sort === val);
      btn.textContent = lab;
      btn.addEventListener('click', () => {
        state.sort = val;
        bump();
        renderPanel();
      });
      sortRow.appendChild(btn);
    }
    panel.appendChild(sortRow);

    const actions = document.createElement('div');
    actions.className = 'mmg-smartbar__panel-actions';
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'mmg-btn mmg-smartbar__clear';
    clearBtn.textContent = 'Clear all';
    clearBtn.addEventListener('click', () => {
      clearAllFilters(state);
      input.value = '';
      launcherExpanded = false;
      renderChips();
      syncSegmentUi();
      bump();
      setPanelOpen(false);
    });
    const doneBtn = document.createElement('button');
    doneBtn.type = 'button';
    doneBtn.className = 'mmg-btn mmg-btn--primary mmg-smartbar__done';
    doneBtn.textContent = 'Done';
    doneBtn.addEventListener('click', () => setPanelOpen(false));
    actions.appendChild(clearBtn);
    actions.appendChild(doneBtn);
    panel.appendChild(actions);
  }

  function applyOption(opt) {
    if (opt.kind === 'id') {
      state.search = opt.value;
      input.value = opt.value;
      bump();
      setPanelOpen(false);
      return;
    }
    if (opt.kind === 'mural') {
      state.search = opt.label;
      input.value = opt.label;
      bump();
      setPanelOpen(false);
      return;
    }
    addChip(opt.kind, opt.value);
  }

  function highlightOption() {
    panel.querySelectorAll('.mmg-smartbar__option').forEach((el, i) => {
      el.classList.toggle('is-active', i === activeOption);
      if (i === activeOption) el.setAttribute('aria-selected', 'true');
      else el.removeAttribute('aria-selected');
    });
  }

  function syncFromInput() {
    const raw = input.value;
    const { segment, query } = parseSegmentWords(raw);
    if (segment && segment !== state.segment) {
      state.segment = segment;
      syncSegmentUi();
    }
    state.search = query || raw;
    state.searchTokens = state.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (segment && query !== raw.trim()) {
      input.value = query;
    }
  }

  const debouncedChange = debounce(() => {
    syncFromInput();
    bump();
  }, SEARCH_DEBOUNCE_MS);

  input.addEventListener('focus', () => setPanelOpen(true));
  input.addEventListener('click', () => setPanelOpen(true));
  input.addEventListener('input', () => {
    syncFromInput();
    if (panelOpen) renderPanel();
    debouncedChange();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !input.value && (state.filterColors?.length || state.filterCategories?.length || state.filterPlaces?.length)) {
      const last =
        state.filterPlaces?.length
          ? { type: 'place', value: state.filterPlaces[state.filterPlaces.length - 1] }
          : state.filterCategories?.length
            ? { type: 'category', value: state.filterCategories[state.filterCategories.length - 1] }
            : state.filterColors?.length
              ? { type: 'color', value: state.filterColors[state.filterColors.length - 1] }
              : null;
      if (last) {
        e.preventDefault();
        removeChip(last.type, last.value);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setPanelOpen(false);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const groups = buildSuggestions(input.value.trim());
      const flat = flatOptions(groups);
      if (activeOption >= 0 && flat[activeOption]) {
        applyOption(flat[activeOption]);
      } else {
        syncFromInput();
        bump();
        setPanelOpen(false);
      }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const flat = flatOptions(buildSuggestions(input.value.trim()));
      if (!flat.length) return;
      e.preventDefault();
      if (e.key === 'ArrowDown') activeOption = activeOption < flat.length - 1 ? activeOption + 1 : 0;
      else activeOption = activeOption > 0 ? activeOption - 1 : flat.length - 1;
      highlightOption();
    }
  });

  segGroups.forEach((group) => {
    group.querySelectorAll('.mmg-smartbar__seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.segment = btn.dataset.seg;
        if (state.segment === 'all') {
          /* keep category chips — may span segments rarely */
        }
        syncSegmentUi();
        if (panelOpen) renderPanel();
        bump();
      });
    });
  });

  document.addEventListener('mousedown', (e) => {
    if (!panelOpen) return;
    if (wrap.contains(e.target)) return;
    setPanelOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      e.preventDefault();
      input.focus();
      setPanelOpen(true);
    }
  });

  function sync(filteredLength) {
    placeIndex = buildPlaceIndex(state.items);
    input.value = state.search;
    renderChips();
    syncSegmentUi();
    const total = state.items.length;
    countEl.textContent =
      filteredLength === total
        ? `Showing ${filteredLength} photos`
        : `Showing ${filteredLength} of ${total} photos`;
    if (panelOpen) renderPanel();
  }

  function getCloseSuggestions() {
    const q = state.search.trim();
    if (!q) return [];
    const groups = buildSuggestions(q);
    return flatOptions(groups).slice(0, 3);
  }

  function clearAndNotify() {
    clearAllFilters(state);
    input.value = '';
    launcherExpanded = false;
    renderChips();
    syncSegmentUi();
    bump();
  }

  return {
    sync,
    focusSearch: () => {
      input.focus();
      setPanelOpen(true);
    },
    getCloseSuggestions,
    clearAll: clearAndNotify,
  };
}
