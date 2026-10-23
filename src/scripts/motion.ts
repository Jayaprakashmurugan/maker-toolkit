// Small, purposeful motion: decode titles, type formulas, count numbers, reveal on scroll.
// Everything is skipped when the visitor prefers reduced motion.

declare global {
  interface Window {
    __motionReady?: boolean;
  }
}
window.__motionReady = true;

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const GLYPHS = '()[]{}<>=+-*/&|!?;:@#$%01';

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

/** Copies the first n characters of highlighted code (flat spans + text) into target. */
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Types each formula in the homepage ticker, then shows what it does. */
function ticker(root: HTMLElement) {
  const lines = [...root.querySelectorAll<HTMLElement>('.ticker__line')];
  if (!lines.length) return;
  const sources = lines.map((l) => [...l.querySelector('code')!.childNodes].map((n) => n.cloneNode(true)));
  const lengths = sources.map((s) => s.reduce((n, node) => n + (node.textContent ?? '').length, 0));
  root.classList.add('is-typing');

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(root);
  const waitUntilShown = async () => {
    while (!visible || document.hidden) await sleep(400);
  };

  (async () => {
    for (let i = 0; ; i = (i + 1) % lines.length) {
      await waitUntilShown();
      const line = lines[i];
      const code = line.querySelector('code')!;
      lines.forEach((l) => l.classList.toggle('is-active', l === line));
      line.classList.remove('is-done');
      for (let n = 0; n <= lengths[i]; n++) {
        typeInto(code, sources[i], n);
        await sleep(22 + Math.random() * 34);
      }
      await sleep(250);
      line.classList.add('is-done');
      await sleep(2600);
    }
  })();
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

function init() {
  // Stagger children of reveal groups.
  document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
    [...group.children].forEach((child, i) => {
      (child as HTMLElement).dataset.reveal = '';
      (child as HTMLElement).style.setProperty('--d', String(Math.min(i, 10)));
    });
  });

  if (reduce) return;

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
  document.querySelectorAll<HTMLElement>('.ticker').forEach(ticker);
}

init();

export {};
