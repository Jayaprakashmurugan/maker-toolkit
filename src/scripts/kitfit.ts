// Scales each catalog preview down to fit its card.
function fit() {
  document.querySelectorAll<HTMLElement>('[data-kfit]').forEach((el) => {
    const stage = el.parentElement!;
    const s = Math.min(1, (stage.clientWidth - 24) / el.offsetWidth, (stage.clientHeight - 24) / el.offsetHeight);
    el.style.transform = `translate(-50%, -50%) scale(${s})`;
  });
}
fit();
new ResizeObserver(fit).observe(document.body);

export {};
