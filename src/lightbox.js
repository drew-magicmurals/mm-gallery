import { assetUrl, CONTACT_EMAIL, WANT_THIS_URL } from './config.js';
import { imageSrc, imageSrcSet, pinterestUrl } from './images.js';
import { trapFocus, prefersReducedMotion } from './util.js';
import { displayAlt } from './alt-text.js';
import { itemsWithSameMural, muralDisplayName } from './mural.js';
import { ICON_SHARE, ICON_PINTEREST } from './lightbox-icons.js';

export function createLightbox(root, state, { onClose, onNavigate, shortlistApi, onMuralFilter }) {
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
      <button type="button" class="mmg-lightbox__nav mmg-lightbox__nav--prev" data-mmg-action="prev" aria-label="Previous photo">
        <svg class="mmg-lightbox__nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6L8 12l6 6" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button type="button" class="mmg-lightbox__nav mmg-lightbox__nav--next" data-mmg-action="next" aria-label="Next photo">
        <svg class="mmg-lightbox__nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="mmg-lightbox__media">
        <figure class="mmg-lightbox__figure">
          <img class="mmg-lightbox__img" alt="" decoding="async" />
          <p class="mmg-lightbox__image-count" hidden></p>
        </figure>
        <div class="mmg-lightbox__thumbs" hidden></div>
      </div>
      <div class="mmg-lightbox__footer">
        <div class="mmg-lightbox__meta">
          <div class="mmg-lightbox__byline">
            <p class="mmg-lightbox__caption"></p>
            <p class="mmg-lightbox__id"></p>
          </div>
          <p class="mmg-lightbox__headline"></p>
          <p class="mmg-lightbox__text"></p>
          <div class="mmg-lightbox__id-slot" aria-hidden="true"></div>
        </div>
        <div class="mmg-lightbox__mural-more" hidden></div>
        <div class="mmg-lightbox__actions">
          <div class="mmg-lightbox__actions-left" role="group" aria-label="Mural options">
            <a class="mmg-lightbox__action mmg-lightbox__action--lead mmg-lightbox__want" href="#" title="Ask Magic Murals about a custom mural inspired by this photo"></a>
            <a class="mmg-lightbox__action mmg-lightbox__action--mural mmg-lightbox__mural" href="#" hidden title="Open this mural on magicmurals.com"></a>
            <button type="button" class="mmg-lightbox__action mmg-lightbox__action--heart mmg-lightbox__heart" aria-pressed="false" title="Save to your favorites on this device">
              <span class="mmg-lightbox__heart-glyph" aria-hidden="true">♥</span>
              <span class="mmg-lightbox__action-label">Favorite</span>
            </button>
          </div>
          <div class="mmg-lightbox__actions-right" role="group" aria-label="Share">
            <button type="button" class="mmg-lightbox__action mmg-lightbox__action--share mmg-lightbox__copy" title="Copy a link to share this photo">
              ${ICON_SHARE}
              <span class="mmg-lightbox__action-label">Share</span>
            </button>
            <a class="mmg-lightbox__action mmg-lightbox__action--pinterest mmg-lightbox__pin" href="#" target="_blank" rel="noopener noreferrer" title="Save to Pinterest" aria-label="Save to Pinterest">
              ${ICON_PINTEREST}
            </a>
          </div>
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
    imageCount: overlay.querySelector('.mmg-lightbox__image-count'),
    prevBtn: overlay.querySelector('.mmg-lightbox__nav--prev'),
    nextBtn: overlay.querySelector('.mmg-lightbox__nav--next'),
    want: overlay.querySelector('.mmg-lightbox__want'),
    heart: overlay.querySelector('.mmg-lightbox__heart'),
    heartLabel: overlay.querySelector('.mmg-lightbox__heart .mmg-lightbox__action-label'),
    copyLabel: overlay.querySelector('.mmg-lightbox__copy .mmg-lightbox__action-label'),
    muralMore: overlay.querySelector('.mmg-lightbox__mural-more'),
  };

  function syncFavoriteButton(saved) {
    els.heart.setAttribute('aria-pressed', saved ? 'true' : 'false');
    els.heart.classList.toggle('is-active', saved);
    if (els.heartLabel) els.heartLabel.textContent = saved ? 'Saved' : 'Favorite';
    els.heart.title = saved
      ? 'Remove from your favorites on this device'
      : 'Save to your favorites on this device';
  }

  function permalink(itemId) {
    const base = `${location.origin}${location.pathname}`;
    return `${base}#${itemId}`;
  }

  function updateNavLabels(item, imageIndex) {
    const images = item.images || [];
    const multi = images.length > 1;
    const atStart = imageIndex <= 0;
    const atEnd = imageIndex >= images.length - 1;

    els.prevBtn.setAttribute(
      'aria-label',
      multi && !atStart ? 'Previous image in this set' : 'Previous testimonial',
    );
    els.nextBtn.setAttribute(
      'aria-label',
      multi && !atEnd ? 'Next image in this set' : 'Next testimonial',
    );
  }

  function renderImageIndex(item, imageIndex, options = {}) {
    const { rebuildThumbs = true } = options;
    const images = item.images || [];
    const img = images[imageIndex] || images[0];
    if (!img) return;

    els.img.src = imageSrc(img.src, 1600);
    els.img.srcset = imageSrcSet(img.src);
    els.img.sizes = '(min-width: 900px) 900px, 100vw';
    els.img.alt = displayAlt(item, img, state.taxonomy);
    if (img.w && img.h) {
      els.img.width = img.w;
      els.img.height = img.h;
    } else {
      els.img.removeAttribute('width');
      els.img.removeAttribute('height');
    }
    els.img.onload = () => scheduleLightboxLayout();

    const pageUrl = permalink(item.id);
    const fullImg = assetUrl(`${img.src}-1600.webp`);
    els.pin.href = pinterestUrl(pageUrl, fullImg, item.headline || item.caption);

    if (images.length > 1) {
      els.imageCount.hidden = false;
      els.imageCount.textContent = `Image ${imageIndex + 1} of ${images.length}`;
    } else {
      els.imageCount.hidden = true;
      els.imageCount.textContent = '';
    }

    updateNavLabels(item, imageIndex);

    if (images.length > 1) {
      els.thumbs.hidden = false;
      const thumbButtons = els.thumbs.querySelectorAll('.mmg-lightbox__thumb');
      if (rebuildThumbs || thumbButtons.length !== images.length) {
        els.thumbs.textContent = '';
        images.forEach((im, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'mmg-lightbox__thumb' + (idx === imageIndex ? ' is-active' : '');
          btn.setAttribute('aria-label', `Show image ${idx + 1} of ${images.length}`);
          btn.setAttribute('aria-current', idx === imageIndex ? 'true' : 'false');
          const thumb = document.createElement('img');
          thumb.src = imageSrc(im.src, 450);
          thumb.alt = '';
          thumb.loading = 'lazy';
          btn.appendChild(thumb);
          btn.addEventListener('click', () => {
            if (!state.lightbox) return;
            state.lightbox.imageIndex = idx;
            renderImageIndex(state.lightbox.item, idx, { rebuildThumbs: false });
          });
          els.thumbs.appendChild(btn);
        });
      } else {
        thumbButtons.forEach((btn, idx) => {
          btn.classList.toggle('is-active', idx === imageIndex);
          btn.setAttribute('aria-current', idx === imageIndex ? 'true' : 'false');
        });
      }
    } else {
      els.thumbs.hidden = true;
      els.thumbs.textContent = '';
    }
  }

  function wantThisHref(item) {
    if (WANT_THIS_URL) {
      try {
        const u = new URL(WANT_THIS_URL, location.href);
        u.searchParams.set('ref', item.id);
        return u.pathname + u.search + u.hash;
      } catch {
        return `${WANT_THIS_URL}?ref=${encodeURIComponent(item.id)}`;
      }
    }
    const subject = encodeURIComponent(`Custom mural like photo ${item.id}`);
    const body = encodeURIComponent(
      `I'm interested in a custom mural like photo ${item.id}:\n${permalink(item.id)}\n\nMy wall size / notes:\n\n`,
    );
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  function renderMuralRelated(item) {
    const related = itemsWithSameMural(state.items, item);
    const productName = muralDisplayName(item);
    els.muralMore.textContent = '';
    if (!related.length || !productName) {
      els.muralMore.hidden = true;
      return;
    }
    els.muralMore.hidden = false;
    const title = document.createElement('p');
    title.className = 'mmg-lightbox__mural-more-title';
    const n = related.length;
    title.textContent =
      n === 1
        ? `1 more customer photo of ${productName}`
        : `${n} more customer photos of ${productName}`;
    els.muralMore.appendChild(title);
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'mmg-link-btn';
    link.textContent = `See all photos of ${productName}`;
    link.addEventListener('click', () => {
      close();
      onMuralFilter?.(productName);
    });
    els.muralMore.appendChild(link);
  }

  function fillContent(item, imageIndex = 0) {
    const cap = item.caption || '';
    const head = item.headline || '';
    const body = item.text || '';
    els.caption.textContent = cap || '\u00a0';
    els.caption.classList.toggle('is-empty', !cap);
    els.headline.textContent = head || '\u00a0';
    els.headline.classList.toggle('is-empty', !head);
    els.text.textContent = body || '\u00a0';
    els.text.classList.toggle('is-empty', !body);
    els.text.title = body || '';
    els.id.textContent = `Photo ${item.id}`;

    if (item.mural?.url) {
      const rawName = item.mural.name?.replace(/^\*/, '').trim() || '';
      els.mural.textContent = 'Shop this mural';
      els.mural.href = item.mural.url;
      els.mural.title = rawName
        ? `View ${rawName} on magicmurals.com`
        : 'View this mural product page on magicmurals.com';
      els.mural.hidden = false;
    } else {
      els.mural.hidden = true;
    }

    els.want.textContent = 'Get a mural like this';
    els.want.href = wantThisHref(item);

    if (shortlistApi) {
      syncFavoriteButton(shortlistApi.isSaved(item.id));
    }

    renderImageIndex(item, imageIndex);
    renderMuralRelated(item);
    scheduleLightboxLayout();
  }

  let layoutFrame = 0;
  function scheduleLightboxLayout() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(() => {
      if (overlay.hidden) return;
      const panel = overlay.querySelector('.mmg-lightbox__panel');
      const media = overlay.querySelector('.mmg-lightbox__media');
      const footer = overlay.querySelector('.mmg-lightbox__footer');
      if (!panel || !media || !footer) return;
      const footerTop = footer.getBoundingClientRect().top;
      const mediaTop = media.getBoundingClientRect().top;
      const maxMedia = Math.max(120, Math.floor(footerTop - mediaTop - 4));
      media.style.maxHeight = `${maxMedia}px`;
      media.style.flex = '0 1 auto';
    });
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
    if (opening) {
      overlay.querySelector('.mmg-lightbox__close').focus();
      window.addEventListener('resize', scheduleLightboxLayout);
    }
  }

  function close() {
    overlay.hidden = true;
    document.body.classList.remove('mmg-lightbox-open');
    window.removeEventListener('resize', scheduleLightboxLayout);
    state.lightbox = null;
    if (releaseTrap) releaseTrap();
    releaseTrap = null;
    if (state.lastFocus?.focus) state.lastFocus.focus();
    onClose?.();
  }

  function step(delta) {
    if (!state.lightbox) return;
    const { list, item, imageIndex } = state.lightbox;
    const images = item.images || [];
    const nextImageIndex = imageIndex + delta;

    if (images.length > 1 && nextImageIndex >= 0 && nextImageIndex < images.length) {
      state.lightbox.imageIndex = nextImageIndex;
      renderImageIndex(item, nextImageIndex, { rebuildThumbs: false });
      return;
    }

    const idx = list.findIndex((i) => i.id === item.id);
    if (idx < 0) return;
    const nextItem = list[(idx + delta + list.length) % list.length];
    const nextImages = nextItem.images || [];
    const landOn =
      delta > 0 ? 0 : Math.max(0, nextImages.length - 1);

    state.lightbox.item = nextItem;
    state.lightbox.imageIndex = landOn;
    fillContent(nextItem, landOn);
    onNavigate?.(nextItem.id);
  }

  overlay.addEventListener('click', (e) => {
    const action = e.target.closest('[data-mmg-action]')?.getAttribute('data-mmg-action');
    if (action === 'close') close();
    if (action === 'prev') step(-1);
    if (action === 'next') step(1);
  });

  els.heart.addEventListener('click', () => {
    if (!state.lightbox || !shortlistApi) return;
    shortlistApi.toggle(state.lightbox.item.id);
    syncFavoriteButton(shortlistApi.isSaved(state.lightbox.item.id));
  });

  els.copy.addEventListener('click', async () => {
    if (!state.lightbox || !els.copyLabel) return;
    const url = permalink(state.lightbox.item.id);
    const defaultLabel = 'Share';
    try {
      await navigator.clipboard.writeText(url);
      els.copyLabel.textContent = 'Copied!';
      els.copy.title = 'Link copied to clipboard';
      setTimeout(() => {
        els.copyLabel.textContent = defaultLabel;
        els.copy.title = 'Copy a link to share this photo';
      }, 2000);
    } catch {
      els.copyLabel.textContent = 'Copy failed';
      setTimeout(() => {
        els.copyLabel.textContent = defaultLabel;
      }, 2000);
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
