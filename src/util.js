export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function tokenizeQuery(q) {
  return String(q || '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function parseHash() {
  const raw = location.hash.replace(/^#/, '').trim();
  if (!raw) return { id: null, params: new URLSearchParams() };
  if (/^G-\d{4}$/i.test(raw)) {
    return { id: raw.toUpperCase(), params: new URLSearchParams() };
  }
  const params = new URLSearchParams(raw);
  if (params.has('list') || params.has('color') || params.has('mural') || params.has('room')) {
    return { id: null, params };
  }
  return { id: null, params };
}

export function writeFilterHash(params, itemId) {
  if (itemId) {
    location.hash = itemId;
    return;
  }
  const s = params.toString();
  location.hash = s ? s : '';
}

export function getFocusable(container) {
  return [...container.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((el) => el.offsetParent !== null || el === document.activeElement);
}

export function trapFocus(container, onEscape) {
  const handler = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onEscape();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = getFocusable(container);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
