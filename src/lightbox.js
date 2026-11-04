import { assetUrl, CONTACT_EMAIL, WANT_THIS_URL } from './config.js';
import { imageSrc, imageSrcSet, pinterestUrl } from './images.js';
import { trapFocus, prefersReducedMotion } from './util.js';
import { displayAlt } from './alt-text.js';
import { itemsWithSameMural, muralDisplayName } from './mural.js';

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
      <button type="button" class="mmg-lightbox__nav mmg-lightbox__nav--prev" data-mmg-action="prev" aria-label="Previous photo">&lsaquo;</button>
      <button type="button" class="mmg-lightbox__nav mmg-lightbox__nav--next" data-mmg-action="next" aria-label="Next photo">&rsaquo;</button>
      <div class="mmg-lightbox__media">
        <figure class="mmg-lightbox__figure">
          <img class="mmg-lightbox__img" alt="" decoding="async" />
          <p class="mmg-lightbox__image-count" hidden></p>
        </figure>
        <div class="mmg-lightbox__thumbs" hidden></div>
      </div>
      <div class="mmg-lightbox__footer">
        <p class="mmg-lightbox__caption"></p>
        <p class="mmg-lightbox__headline"></p>
        <p class="mmg-lightbox__text"></p>
        <p class="mmg-lightbox__id"></p>
        <div class="mmg-lightbox__mural-more" hidden></div>
        <div class="mmg-lightbox__actions">
          <a class="mmg-btn mmg-lightbox__mural" href="#" hidden></a>
          <a class="mmg-btn mmg-btn--primary mmg-lightbox__want" href="#"></a>
          <button type="button" class="mmg-btn mmg-lightbox__heart" aria-pressed="false">Save to shortlist</button>
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
    imageCount: overlay.querySelector('.mmg-lightbox__image-count'),
    prevBtn: overlay.querySelector('.mmg-lightbox__nav--prev'),
    nextBtn: overlay.querySelector('.mmg-lightbox__nav--next'),
    want: overlay.querySelector('.mmg-lightbox__want'),
    heart: overlay.querySelector('.mmg-lightbox__heart'),
    muralMore: overlay.querySelector('.mmg-lightbox__mural-more'),
  };

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
    els.caption.textContent = cap;
    els.caption.hidden = !cap;
    els.headline.textContent = head;
    els.headline.hidden = !head;
    els.text.textContent = body;
    els.text.hidden = !body;
    if (body) els.text.title = body;
    els.id.textContent = `Photo ${item.id}`;

    if (item.mural?.url) {
      els.mural.textContent = 'See this mural';
      els.mural.href = item.mural.url;
      els.mural.hidden = false;
    } else {
      els.mural.hidden = true;
    }

    els.want.textContent = 'I want this look';
    els.want.href = wantThisHref(item);

    if (shortlistApi) {
      const saved = shortlistApi.isSaved(item.id);
      els.heart.setAttribute('aria-pressed', saved ? 'true' : 'false');
      els.heart.classList.toggle('is-active', saved);
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
      const styles = getComputedStyle(panel);
      const padT = parseFloat(styles.paddingTop) || 0;
      const padB = parseFloat(styles.paddingBottom) || 0;
      const reservedTop = padT + 40;
      const footerH = footer.offsetHeight;
      const maxMedia = panel.clientHeight - padB - reservedTop - footerH - 4;
      media.style.maxHeight = `${Math.max(96, maxMedia)}px`;
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
    const saved = shortlistApi.isSaved(state.lightbox.item.id);
    els.heart.setAttribute('aria-pressed', saved ? 'true' : 'false');
    els.heart.classList.toggle('is-active', saved);
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
