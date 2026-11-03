import { assetUrl } from './config.js';
import { imageSrc, imageSrcSet, pinterestUrl } from './images.js';
import { trapFocus, prefersReducedMotion } from './util.js';

export function createLightbox(root, state, onClose, onNavigate) {
  let releaseTrap = null;
  let touchStartX = 0;

  const overlay = document.createElement('div');
  overlay.className = 'mmg-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Photo details');
  overlay.hidden = true;

  overlay.innerHTML = `
    <div class="mmg-lightbox__backdrop" data-mmg-action="close"></div>
    <div class="mmg-lightbox__panel">
      <button type="button" class="mmg-lightbox__close" data-mmg-action="close" aria-label="Close">&times;</button>
      <button type="button" class="mmg-lightbox__nav mmg-lightbox__nav--prev" data-mmg-action="prev" aria-label="Previous photo">&lsaquo;</button>
      <button type="button" class="mmg-lightbox__nav mmg-lightbox__nav--next" data-mmg-action="next" aria-label="Next photo">&rsaquo;</button>
      <figure class="mmg-lightbox__figure">
        <img class="mmg-lightbox__img" alt="" decoding="async" />
        <figcaption class="mmg-lightbox__caption"></figcaption>
      </figure>
      <div class="mmg-lightbox__thumbs" hidden></div>
      <div class="mmg-lightbox__body">
        <p class="mmg-lightbox__headline"></p>
        <p class="mmg-lightbox__text"></p>
        <p class="mmg-lightbox__id"></p>
        <div class="mmg-lightbox__actions">
          <a class="mmg-btn mmg-btn--primary mmg-lightbox__mural" href="#"></a>
          <button type="button" class="mmg-btn mmg-lightbox__copy">Copy link</button>
          <a class="mmg-btn mmg-lightbox__pin" href="#" target="_blank" rel="noopener noreferrer">Save to Pinterest</a>
        </div>
      </div>
    </div>
  `;

  root.appendChild(overlay);

  const els = {
    img: overlay.querySelector('.mmg-lightbox__img'),
    caption: overlay.querySelector('.mmg-lightbox__caption'),
    headline: overlay.querySelector('.mmg-lightbox__headline'),
    text: overlay.querySelector('.mmg-lightbox__text'),
    id: overlay.querySelector('.mmg-lightbox__id'),
    mural: overlay.querySelector('.mmg-lightbox__mural'),
    copy: overlay.querySelector('.mmg-lightbox__copy'),
    pin: overlay.querySelector('.mmg-lightbox__pin'),
    thumbs: overlay.querySelector('.mmg-lightbox__thumbs'),
  };

  function permalink(itemId) {
    const base = `${location.origin}${location.pathname}`;
    return `${base}#${itemId}`;
  }

  function renderImageIndex(item, imageIndex) {
    const images = item.images || [];
    const img = images[imageIndex] || images[0];
    if (!img) return;

    els.img.src = imageSrc(img.src, 1600);
    els.img.srcset = imageSrcSet(img.src);
    els.img.sizes = '(min-width: 900px) 900px, 100vw';
    els.img.alt = img.alt || '';
    els.img.style.aspectRatio = `${img.w} / ${img.h}`;

    const pageUrl = permalink(item.id);
    const fullImg = assetUrl(`${img.src}-1600.webp`);
    els.pin.href = pinterestUrl(pageUrl, fullImg, item.headline || item.caption);

    if (images.length > 1) {
      els.thumbs.hidden = false;
      els.thumbs.textContent = '';
      images.forEach((im, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mmg-lightbox__thumb' + (idx === imageIndex ? ' is-active' : '');
        btn.setAttribute('aria-label', `Image ${idx + 1} of ${images.length}`);
        const thumb = document.createElement('img');
        thumb.src = imageSrc(im.src, 450);
        thumb.alt = '';
        thumb.loading = 'lazy';
        btn.appendChild(thumb);
        btn.addEventListener('click', () => {
          state.lightbox.imageIndex = idx;
          renderImageIndex(item, idx);
        });
        els.thumbs.appendChild(btn);
      });
    } else {
      els.thumbs.hidden = true;
    }
  }

  function fillContent(item, imageIndex = 0) {
    els.caption.textContent = item.caption || '';
    els.headline.textContent = item.headline || '';
    els.text.textContent = item.text || '';
    els.id.textContent = `Photo ${item.id}`;

    if (item.mural?.url) {
      els.mural.textContent = 'See this mural';
      els.mural.href = item.mural.url;
    } else {
      els.mural.textContent = 'Start a custom mural like this';
      els.mural.href = '/custom-wall-murals.html';
    }
    els.mural.hidden = false;

    renderImageIndex(item, imageIndex);
  }

  function open(item, list, imageIndex = 0) {
    const opening = overlay.hidden;
    if (opening) {
      state.lastFocus = document.activeElement;
      releaseTrap = trapFocus(overlay, close);
    }
    state.lightbox = { item, list, imageIndex };
    overlay.hidden = false;
    document.body.classList.add('mmg-lightbox-open');
    fillContent(item, imageIndex);
    if (opening) overlay.querySelector('.mmg-lightbox__close').focus();
  }

  function close() {
    overlay.hidden = true;
    document.body.classList.remove('mmg-lightbox-open');
    state.lightbox = null;
    if (releaseTrap) releaseTrap();
    releaseTrap = null;
    if (state.lastFocus?.focus) state.lastFocus.focus();
    onClose?.();
  }

  function step(delta) {
    if (!state.lightbox) return;
    const { list, item } = state.lightbox;
    const idx = list.findIndex((i) => i.id === item.id);
    if (idx < 0) return;
    const next = list[(idx + delta + list.length) % list.length];
    state.lightbox.item = next;
    state.lightbox.imageIndex = 0;
    fillContent(next, 0);
    onNavigate?.(next.id);
  }

  overlay.addEventListener('click', (e) => {
    const action = e.target.closest('[data-mmg-action]')?.getAttribute('data-mmg-action');
    if (action === 'close') close();
    if (action === 'prev') step(-1);
    if (action === 'next') step(1);
  });

  els.copy.addEventListener('click', async () => {
    if (!state.lightbox) return;
    const url = permalink(state.lightbox.item.id);
    try {
      await navigator.clipboard.writeText(url);
      els.copy.textContent = 'Copied!';
      setTimeout(() => {
        els.copy.textContent = 'Copy link';
      }, 2000);
    } catch {
      els.copy.textContent = 'Copy failed';
    }
  });

  overlay.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0]?.clientX ?? 0;
    },
    { passive: true },
  );

  overlay.addEventListener(
    'touchend',
    (e) => {
      if (prefersReducedMotion()) return;
      const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX;
      if (Math.abs(dx) < 50) return;
      step(dx > 0 ? -1 : 1);
    },
    { passive: true },
  );

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    }
  });

  return { open, close, el: overlay };
}
