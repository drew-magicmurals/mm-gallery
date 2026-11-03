import { CONTACT_EMAIL } from './config.js';
import {
  loadShortlist,
  saveShortlist,
  toggleShortlistId,
  shortlistMailto,
  shortlistShareHash,
} from './shortlist.js';

export function attachShortlistUI(root, state, getItems, { onViewChange, onOpenItem }) {
  let sessionIds = loadShortlist();

  function ids() {
    const stored = loadShortlist();
    return stored.length ? stored : sessionIds;
  }

  function setIds(next) {
    sessionIds = next;
    saveShortlist(next);
    state.shortlistIds = next;
    updateTray();
  }

  const tray = document.createElement('button');
  tray.type = 'button';
  tray.className = 'mmg-shortlist-tray';
  tray.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'mmg-shortlist-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Your shortlist');

  panel.innerHTML = `
    <div class="mmg-shortlist-panel__backdrop" data-sl="close"></div>
    <div class="mmg-shortlist-panel__sheet">
      <button type="button" class="mmg-shortlist-panel__close" data-sl="close" aria-label="Close">&times;</button>
      <h2 class="mmg-shortlist-panel__title">Your shortlist</h2>
      <ul class="mmg-shortlist-panel__list"></ul>
      <div class="mmg-shortlist-panel__actions">
        <a class="mmg-btn mmg-btn--primary mmg-shortlist-email" href="#">Email my shortlist</a>
        <button type="button" class="mmg-btn mmg-shortlist-copy">Copy shareable link</button>
      </div>
      <p class="mmg-shortlist-panel__status" role="status"></p>
    </div>
  `;

  root.appendChild(tray);
  root.appendChild(panel);

  const listEl = panel.querySelector('.mmg-shortlist-panel__list');
  const statusEl = panel.querySelector('.mmg-shortlist-panel__status');
  const emailLink = panel.querySelector('.mmg-shortlist-email');
  const copyBtn = panel.querySelector('.mmg-shortlist-copy');

  function updateTray() {
    const n = ids().length;
    tray.hidden = n === 0;
    tray.textContent = `Your shortlist (${n})`;
  }

  function renderPanelList() {
    listEl.textContent = '';
    const items = getItems();
    for (const id of ids()) {
      const item = items.find((i) => i.id === id);
      const li = document.createElement('li');
      li.className = 'mmg-shortlist-panel__item';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mmg-shortlist-panel__open';
      btn.textContent = item?.headline || item?.mural?.name || id;
      btn.addEventListener('click', () => {
        if (item) onOpenItem(item);
        panel.hidden = true;
      });
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'mmg-shortlist-panel__remove';
      rm.setAttribute('aria-label', `Remove ${id} from shortlist`);
      rm.textContent = 'Remove';
      rm.addEventListener('click', () => {
        setIds(ids().filter((x) => x !== id));
        renderPanelList();
        onViewChange();
      });
      li.appendChild(btn);
      li.appendChild(rm);
      listEl.appendChild(li);
    }
    const origin = `${location.origin}${location.pathname}`;
    emailLink.href = shortlistMailto(ids(), items, origin);
    emailLink.textContent = `Email my shortlist to ${CONTACT_EMAIL.split('@')[0]}…`;
  }

  tray.addEventListener('click', () => {
    renderPanelList();
    panel.hidden = false;
    panel.querySelector('.mmg-shortlist-panel__close').focus();
  });

  panel.addEventListener('click', (e) => {
    if (e.target.closest('[data-sl="close"]')) panel.hidden = true;
  });

  copyBtn.addEventListener('click', async () => {
    const link = `${location.origin}${location.pathname}#${shortlistShareHash(ids())}`;
    try {
      await navigator.clipboard.writeText(link);
      statusEl.textContent = 'Link copied.';
    } catch {
      statusEl.textContent = 'Could not copy link.';
    }
  });

  updateTray();
  state.shortlistIds = ids();

  return {
    isSaved(id) {
      return ids().includes(id);
    },
    toggle(id) {
      setIds(toggleShortlistId(ids(), id));
      updateTray();
    },
    refreshTray: updateTray,
  };
}
