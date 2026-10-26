// Small, purposeful motion: decode titles, count numbers, reveal on scroll.
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
}

init();

export {};
