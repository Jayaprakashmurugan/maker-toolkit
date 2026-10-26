// Purposeful motion: decode titles, type formulas, count numbers, reveal on scroll, and pointer effects
// (spotlight cards, magnetic buttons, hero glow, post previews). Anything that moves on its own is skipped
// when the visitor prefers reduced motion; pointer effects only run with a mouse or trackpad.

declare global {
  interface Window {
    __motionReady?: boolean;
  }
}
window.__motionReady = true;

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const GLYPHS = '()[]{}<>=+-*/&|!?;:@#$%01';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** "Decodes" text: random code symbols resolve left to right into the real text. */
function scramble(el: HTMLElement) {
  const final = el.textContent ?? '';
  const length = final.length;
  const duration = Math.min(800, 300 + length * 32);
  const start = performance.now();
  el.setAttribute('aria-label', final);
  const frame = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const revealed = Math.floor(p ** 1.3 * length);
    let out = '';
    for (let i = 0; i < length; i++) {
      out += i < revealed || /\s/.test(final[i]) ? final[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(frame);
    else {
      el.textContent = final;
      el.removeAttribute('aria-label');
      el.classList.add('is-decoded');
    }
  };
  requestAnimationFrame(frame);
}

/** Counts a number up from zero when it scrolls into view. */
function countUp(el: HTMLElement) {
  const target = Number(el.textContent);
  if (!Number.isFinite(target) || target <= 0) return;
  const start = performance.now();
  const frame = (now: number) => {
    const p = Math.min(1, (now - start) / 900);
    el.textContent = String(Math.round(target * (1 - (1 - p) ** 3)));
    if (p < 1) requestAnimationFrame(frame);
  };
  el.textContent = '0';
  requestAnimationFrame(frame);
}

/** Copies the first n characters of highlighted code (flat spans and text) into target. */
function typeInto(target: HTMLElement, source: Node[], n: number) {
  target.textContent = '';
  let left = n;
  for (const node of source) {
    if (left <= 0) break;
    const part = (node.textContent ?? '').slice(0, left);
    left -= part.length;
    if (node.nodeType === Node.TEXT_NODE) target.append(part);
    else {
      const span = node.cloneNode(false) as HTMLElement;
      span.textContent = part;
      target.append(span);
    }
  }
}

/** The homepage formula bar: types each formula, holds it, deletes it, moves on. */
function typer(root: HTMLElement) {
  const lines = [...root.querySelectorAll<HTMLElement>('[data-typer-line]')];
  const out = root.querySelector<HTMLElement>('[data-typer-out]');
  const note = root.querySelector<HTMLElement>('[data-typer-note]');
  if (!lines.length || !out) return;
  const sources = lines.map((l) => [...l.childNodes].map((n) => n.cloneNode(true)));
  const lengths = sources.map((s) => s.reduce((n, node) => n + (node.textContent ?? '').length, 0));
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(root);
  root.classList.add('is-typing');
  (async () => {
    for (let i = 0; ; i = (i + 1) % lines.length) {
      while (!visible || document.hidden) await sleep(400);
      if (note) note.textContent = lines[i].dataset.note ?? '';
      for (let n = 0; n <= lengths[i]; n++) {
        typeInto(out, sources[i], n);
        await sleep(26 + Math.random() * 38);
      }
      await sleep(2600);
      for (let n = lengths[i]; n >= 0; n -= 3) {
        typeInto(out, sources[i], n);
        await sleep(14);
      }
      await sleep(250);
    }
  })();
}

/** Throttles a handler to one call per animation frame. */
function perFrame<E>(fn: (e: E) => void) {
  let queued: E | null = null;
  return (e: E) => {
    if (queued === null) requestAnimationFrame(() => (fn(queued!), (queued = null)));
    queued = e;
  };
}

function pointerEffects() {
  // Cards and tiles light up where the pointer is.
  document.addEventListener(
    'pointermove',
    perFrame((e: PointerEvent) => {
      const el = (e.target as Element).closest<HTMLElement>('.tcard > a, .tile, .ways a, .catcards a, .band');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    }),
    { passive: true },
  );

  // Post previews follow the pointer over the list.
  document.querySelectorAll<HTMLElement>('[data-preview-list]').forEach((list) =>
    list.addEventListener(
      'pointermove',
      perFrame((e: PointerEvent) => {
        const r = list.getBoundingClientRect();
        // Keep the preview inside the list: near the right edge it shows to the left of the pointer.
        const thumb = list.querySelector<HTMLElement>('.plist__thumb')?.offsetWidth ?? 320;
        const x = e.clientX - r.left;
        list.style.setProperty('--px', `${x + thumb + 48 > r.width ? x - thumb - 48 : x}px`);
        list.style.setProperty('--py', `${e.clientY - r.top}px`);
      }),
      { passive: true },
    ),
  );

  if (reduce) return;

  // A soft glow follows the pointer across the hero.
  document.querySelectorAll<HTMLElement>('[data-glow]').forEach((el) =>
    el.addEventListener(
      'pointermove',
      perFrame((e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--gx', `${e.clientX - r.left}px`);
        el.style.setProperty('--gy', `${e.clientY - r.top}px`);
      }),
      { passive: true },
    ),
  );

  // The Maker ID badge tilts toward the pointer, and its sheen follows.
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    el.addEventListener(
      'pointermove',
      perFrame((e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.classList.add('is-tilting');
        el.style.setProperty('--rx', `${((0.5 - py) * 14).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${((px - 0.5) * 16).toFixed(2)}deg`);
        el.style.setProperty('--sx', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--sy', `${(py * 100).toFixed(1)}%`);
      }),
    );
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-tilting');
      el.style.removeProperty('--rx');
      el.style.removeProperty('--ry');
    });
  });

  // Buttons lean toward the pointer.
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.translate = `${x * 0.18}px ${y * 0.3}px`;
    });
    el.addEventListener('pointerleave', () => (el.style.translate = ''));
  });
}

function scrollEffects() {
  const header = document.querySelector('.site-header');
  const root = document.documentElement;
  const update = () => {
    const max = root.scrollHeight - innerHeight;
    root.style.setProperty('--progress', String(max > 0 ? Math.min(1, scrollY / max) : 0));
    header?.classList.toggle('is-scrolled', scrollY > 8);
  };
  addEventListener('scroll', perFrame(update), { passive: true });
  update();
}

function init() {
  // Stagger children of reveal groups.
  document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
    [...group.children].forEach((child, i) => {
      (child as HTMLElement).dataset.reveal = '';
      (child as HTMLElement).style.setProperty('--d', String(Math.min(i, 10)));
    });
  });

  scrollEffects();
  if (finePointer) pointerEffects();
  if (reduce) return;

  document.querySelectorAll<HTMLElement>('[data-typer]').forEach(typer);

  const once = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        once.unobserve(el);
        el.classList.add('is-visible');
        if (el.dataset.count !== undefined) countUp(el);
        if (el.dataset.scramble !== undefined) scramble(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );

  document.querySelectorAll<HTMLElement>('[data-reveal], [data-count], [data-scramble]').forEach((el) => once.observe(el));
}

init();

export {};
