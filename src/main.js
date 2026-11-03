import './styles.css';
import {
  resolveAssetBase,
  setAssetBase,
  assetUrl,
} from './config.js';
import { createState, applyHashToState } from './state.js';
import { parseHash, writeFilterHash, debounce } from './util.js';
import { renderGalleryUI } from './gallery.js';
import { createLightbox } from './lightbox.js';
import { createShareWidget } from './share.js';
import { injectJsonLd } from './jsonld.js';
import { filterItems } from './state.js';

function injectStylesheet(base) {
  if (document.querySelector('link[data-mmg-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = assetUrl('mmg.css');
  link.setAttribute('data-mmg-css', '');
  document.head.appendChild(link);
}

async function loadJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}

async function init() {
  const mount = document.getElementById('mmg-gallery');
  if (!mount) return;

  const scriptEl = document.currentScript || document.querySelector('script[src*="mmg"], script[src*="main.js"]');
  const base = resolveAssetBase(scriptEl);
  setAssetBase(base);

  if (!import.meta.env?.DEV) {
    injectStylesheet(base);
  }

  const state = createState();
  const [gallery, taxonomy] = await Promise.all([
    loadJson(assetUrl('data/gallery.json')),
    loadJson(assetUrl('data/taxonomy.json')),
  ]);
  state.items = gallery.items || [];
  state.taxonomy = taxonomy;

  injectJsonLd(state.items);

  let lightboxApi;
  let ui;

  const pushHash = debounce(() => {
    const hash = parseHash();
    if (hash.id) return;
    writeFilterHash(ui.updateHash());
  }, 100);

  const onStateChange = () => {
    const filtered = ui.refresh();
    pushHash();
    if (state.pendingOpenId) {
      const item = filtered.find((i) => i.id === state.pendingOpenId);
      if (item) {
        lightboxApi.open(item, filtered);
        state.pendingOpenId = null;
      }
    }
  };

  ui = renderGalleryUI(mount, state, {
    onOpenLightbox: (item, list) => {
      writeFilterHash(new URLSearchParams(), item.id);
      lightboxApi.open(item, list);
    },
    onStateChange,
  });

  lightboxApi = createLightbox(mount, state, () => {
    pushHash();
  }, (id) => {
    writeFilterHash(new URLSearchParams(), id);
  });

  createShareWidget(mount);

  const initialHash = parseHash();
  applyHashToState(state, initialHash);
  if (initialHash.id) state.pendingOpenId = initialHash.id.toUpperCase();

  ui.refresh();
  if (state.pendingOpenId) {
    const filtered = filterItems(state);
    const item = filtered.find((i) => i.id === state.pendingOpenId) || state.items.find((i) => i.id === state.pendingOpenId);
    if (item) {
      lightboxApi.open(item, filtered.length ? filtered : state.items);
      state.pendingOpenId = null;
    }
  }

  window.addEventListener('hashchange', () => {
    const hash = parseHash();
    if (hash.id) {
      const filtered = filterItems(state);
      const item = state.items.find((i) => i.id === hash.id);
      if (item) lightboxApi.open(item, filtered.length ? filtered : state.items);
      return;
    }
    applyHashToState(state, hash);
    state.visibleCount = 24;
    ui.refresh();
    lightboxApi.close();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
