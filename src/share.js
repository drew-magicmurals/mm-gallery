import { UPLOAD_ENDPOINT } from './config.js';
import { trapFocus } from './util.js';

const MAX_FILES = 10;
const MAX_BYTES = 15 * 1024 * 1024;

export function createShareWidget(root) {
  const tab = document.createElement('button');
  tab.type = 'button';
  tab.className = 'mmg-share-tab';
  tab.textContent = 'Share your wall';

  const modal = document.createElement('div');
  modal.className = 'mmg-share-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Share your photo');
  modal.hidden = true;

  modal.innerHTML = `
    <div class="mmg-share-modal__backdrop" data-mmg-share="close"></div>
    <div class="mmg-share-modal__panel">
      <button type="button" class="mmg-share-modal__close" data-mmg-share="close" aria-label="Close">&times;</button>
      <h2 class="mmg-share-modal__title">Share your wall</h2>
      <p class="mmg-share-modal__intro">Upload a photo of your Magic Mural installation. Submissions are reviewed before appearing in the gallery.</p>
      <form class="mmg-share-form" novalidate>
        <div class="mmg-field mmg-field--hp" aria-hidden="true">
          <label for="mmg-hp">Leave blank</label>
          <input id="mmg-hp" name="website" type="text" tabindex="-1" autocomplete="off" />
        </div>
        <div class="mmg-field">
          <label for="mmg-photos">Photos <span class="mmg-req">*</span></label>
          <input id="mmg-photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple required />
          <p class="mmg-hint">Up to ${MAX_FILES} images, ${MAX_BYTES / (1024 * 1024)} MB each.</p>
          <ul class="mmg-share-previews" aria-live="polite"></ul>
        </div>
        <div class="mmg-field">
          <label for="mmg-email">Email <span class="mmg-req">*</span></label>
          <input id="mmg-email" name="email" type="email" required autocomplete="email" />
        </div>
        <div class="mmg-field">
          <label for="mmg-first">First name</label>
          <input id="mmg-first" name="firstName" type="text" autocomplete="given-name" />
        </div>
        <div class="mmg-field">
          <label for="mmg-location">City / state</label>
          <input id="mmg-location" name="location" type="text" autocomplete="address-level2" />
        </div>
        <div class="mmg-field">
          <label for="mmg-comment">Comment</label>
          <input id="mmg-comment" name="comment" type="text" maxlength="200" />
        </div>
        <div class="mmg-field mmg-field--check">
          <input id="mmg-permission" name="permission" type="checkbox" required />
          <label for="mmg-permission">OK to display my photo on magicmurals.com <span class="mmg-req">*</span></label>
        </div>
        <div id="mmg-turnstile" class="mmg-turnstile" aria-hidden="true"></div>
        <p class="mmg-share-status" role="status"></p>
        <button type="submit" class="mmg-btn mmg-btn--primary">Submit</button>
        <p class="mmg-share-alt">Prefer email? <a href="mailto:testimonials@magicmurals.com">Send photos to testimonials@magicmurals.com</a></p>
      </form>
    </div>
  `;

  root.appendChild(tab);
  root.appendChild(modal);

  const form = modal.querySelector('.mmg-share-form');
  const previews = modal.querySelector('.mmg-share-previews');
  const statusEl = modal.querySelector('.mmg-share-status');
  let releaseTrap = null;
  let lastFocus = null;
  let previewUrls = [];

  function clearPreviews() {
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    previewUrls = [];
    previews.textContent = '';
  }

  function open() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    releaseTrap = trapFocus(modal, close);
    modal.querySelector('.mmg-share-modal__close').focus();
  }

  function close() {
    modal.hidden = true;
    if (releaseTrap) releaseTrap();
    releaseTrap = null;
    statusEl.textContent = '';
    if (lastFocus?.focus) lastFocus.focus();
  }

  tab.addEventListener('click', open);

  modal.addEventListener('click', (e) => {
    const action = e.target.closest('[data-mmg-share]')?.getAttribute('data-mmg-share');
    if (action === 'close') close();
  });

  form.photos.addEventListener('change', () => {
    clearPreviews();
    const files = [...form.photos.files].slice(0, MAX_FILES);
    for (const file of files) {
      const url = URL.createObjectURL(file);
      previewUrls.push(url);
      const li = document.createElement('li');
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      li.appendChild(img);
      previews.appendChild(li);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = '';

    if (form.website.value) {
      statusEl.textContent = 'Thanks!';
      form.reset();
      clearPreviews();
      return;
    }

    const files = [...form.photos.files];
    if (!files.length) {
      statusEl.textContent = 'Please add at least one photo.';
      return;
    }
    if (files.length > MAX_FILES) {
      statusEl.textContent = `Please select at most ${MAX_FILES} photos.`;
      return;
    }
    for (const f of files) {
      if (f.size > MAX_BYTES) {
        statusEl.textContent = 'Each photo must be 15 MB or smaller.';
        return;
      }
    }

    const fd = new FormData();
    files.forEach((f, i) => fd.append(`photo${i}`, f));
    fd.append('email', form.email.value);
    fd.append('firstName', form.firstName.value);
    fd.append('location', form.location.value);
    fd.append('comment', form.comment.value);
    fd.append('permission', form.permission.checked ? 'yes' : 'no');

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    statusEl.textContent = 'Uploading…';

    try {
      const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error('upload_failed');
      statusEl.textContent = 'Thank you! Your photo was received and will be reviewed.';
      form.reset();
      clearPreviews();
    } catch {
      statusEl.textContent = 'Something went wrong. Please try again or email us.';
    } finally {
      submitBtn.disabled = false;
    }
  });

  if (new URLSearchParams(location.search).get('share') === '1') {
    queueMicrotask(open);
  }

  return { open, close };
}
