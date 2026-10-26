// Site-wide search: Ctrl K (or ⌘K, or /) opens a dialog that searches every tool, formula and expression.
// The index (/search-index.json) is fetched the first time it's needed, then kept in memory.

interface Entry {
  t: string;
  u: string;
  k: string;
  g: string;
  d: string;
  s: string;
  c: string;
  tl: string;
  words: string[];
}

const dialog = document.getElementById('site-search') as HTMLDialogElement | null;
const input = document.getElementById('search-q') as HTMLInputElement | null;
const list = document.getElementById('search-results') as HTMLUListElement | null;
const count = document.querySelector<HTMLElement>('.sitesearch__count');

let index: Entry[] | null = null;
let loading: Promise<void> | null = null;
let shown: Entry[] = [];
let active = 0;

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
document.querySelectorAll<HTMLElement>('[data-search-kbd]').forEach((k) => (k.textContent = isMac ? '⌘K' : 'Ctrl K'));

function load(): Promise<void> {
  loading ??= fetch('/search-index.json')
    .then((r) => r.json())
    .then((raw: Omit<Entry, 'tl' | 'words'>[]) => {
      index = raw.map((e) => {
        const tl = e.t.toLowerCase();
        // "IfError" → "if error" so a search for "error" finds it too.
        const split = e.t.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
        return { ...e, s: `${e.d.toLowerCase()} ${e.s}`, tl, words: [...new Set([...tl.split(/[^a-z0-9]+/), ...split.split(/[^a-z0-9]+/)])].filter(Boolean) };
      });
    })
    .catch(() => {
      loading = null;
    });
  return loading;
}

function rank(q: string): Entry[] {
  if (!index) return [];
  const query = q.trim().toLowerCase();
  const tokens = query.split(/\s+/).filter(Boolean);
  if (!tokens.length) return index.filter((e) => e.k === 'Tool' || e.k === 'Reference');
  const scored: [number, Entry][] = [];
  for (const e of index) {
    let score = e.tl === query ? 1000 : e.tl.startsWith(query) ? 400 : e.tl.includes(query) ? 150 : 0;
    let ok = true;
    for (const tok of tokens) {
      if (e.words.some((w) => w.startsWith(tok))) score += 60;
      else if (e.tl.includes(tok)) score += 30;
      else if (e.s.includes(tok)) score += 12;
      else {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    if (e.k === 'Tool' || e.k === 'Reference') score += 20;
    scored.push([score, e]);
  }
  return scored
    .sort((a, b) => b[0] - a[0] || a[1].t.length - b[1].t.length)
    .slice(0, 60)
    .map(([, e]) => e);
}

/** The title with each query word marked. Built from text nodes, never HTML. */
function marked(title: string, q: string): Node[] {
  const lower = title.toLowerCase();
  const ranges: [number, number][] = [];
  for (const tok of q.toLowerCase().split(/\s+/).filter(Boolean)) {
    const at = lower.indexOf(tok);
    if (at >= 0) ranges.push([at, at + tok.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const out: Node[] = [];
  let pos = 0;
  for (const [a, b] of ranges) {
    if (a < pos) continue;
    out.push(document.createTextNode(title.slice(pos, a)));
    const m = document.createElement('mark');
    m.textContent = title.slice(a, b);
    out.push(m);
    pos = b;
  }
  out.push(document.createTextNode(title.slice(pos)));
  return out;
}

function setActive(i: number, scroll = true) {
  if (!list || !input) return;
  active = Math.max(0, Math.min(shown.length - 1, i));
  list.querySelectorAll('[role="option"]').forEach((li, k) => li.setAttribute('aria-selected', String(k === active)));
  const el = document.getElementById(`sr-${active}`);
  if (el) {
    input.setAttribute('aria-activedescendant', el.id);
    if (scroll) el.scrollIntoView({ block: 'nearest' });
  } else input.removeAttribute('aria-activedescendant');
}

function render() {
  if (!list || !input || !count) return;
  const q = input.value;
  if (!index) {
    list.replaceChildren();
    count.textContent = loading ? 'Loading…' : 'Search isn’t available offline.';
    return;
  }
  shown = rank(q);
  list.replaceChildren(
    ...shown.map((e, i) => {
      const li = document.createElement('li');
      li.id = `sr-${i}`;
      li.setAttribute('role', 'option');
      li.style.setProperty('--cat', e.c);
      const a = document.createElement('a');
      a.href = e.u;
      a.tabIndex = -1;
      const kind = document.createElement('span');
      kind.className = 'sitesearch__kind';
      kind.textContent = e.k;
      const title = document.createElement('span');
      title.className = 'sitesearch__title';
      title.append(...marked(e.t, q));
      const desc = document.createElement('span');
      desc.className = 'sitesearch__desc';
      desc.textContent = e.k === 'Tool' || e.k === 'Reference' || e.k === 'Page' || e.k === 'Blog' ? e.d : `${e.g} · ${e.d}`;
      a.append(kind, title, desc);
      li.append(a);
      li.addEventListener('mousemove', () => active !== i && setActive(i, false));
      return li;
    }),
  );
  count.textContent = q.trim()
    ? shown.length
      ? `${shown.length === 60 ? '60+' : shown.length} results`
      : 'No matches. Try a task, such as “split text”.'
    : 'All tools. Start typing to search formulas and expressions too.';
  setActive(0);
}

function open(q = '') {
  if (!dialog || !input) return;
  if (!dialog.open) {
    dialog.showModal();
    document.documentElement.classList.add('search-open');
  }
  input.value = q;
  input.focus();
  render();
  load().then(render);
}

if (dialog && input && list) {
  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(active + (e.key === 'ArrowDown' ? 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = shown[active];
      if (hit) location.href = hit.u;
    }
  });
  dialog.addEventListener('close', () => document.documentElement.classList.remove('search-open'));
  // A click on the backdrop (the dialog itself, outside its content) closes it.
  dialog.addEventListener('click', (e) => e.target === dialog && dialog.close());
  list.addEventListener('click', (e) => (e.target as Element).closest('a') && dialog.close());
  dialog.querySelector('[data-search-close]')?.addEventListener('click', () => dialog.close());

  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    const typing = t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      dialog.open ? dialog.close() : open();
    } else if (e.key === '/' && !typing && !dialog.open) {
      e.preventDefault();
      open();
    }
  });

  document.querySelectorAll<HTMLElement>('[data-search-open]').forEach((b) => {
    b.addEventListener('click', () => open());
    b.addEventListener('pointerenter', load, { once: true });
  });
  document.querySelectorAll<HTMLElement>('[data-search-query]').forEach((b) => b.addEventListener('click', () => open(b.dataset.searchQuery)));

  // The homepage search box: typing in it continues in the dialog.
  const hero = document.querySelector<HTMLInputElement>('[data-search-input]');
  if (hero) {
    hero.addEventListener('focus', load, { once: true });
    hero.addEventListener('input', () => {
      const q = hero.value;
      hero.value = '';
      open(q);
    });
    hero.closest('form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      open(hero.value);
    });
  }
}

export {};
