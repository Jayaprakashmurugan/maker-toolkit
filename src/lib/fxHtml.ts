// A tiny build-time highlighter for one-line formulas in static pages (the homepage console).
// Emits the same tk-* classes as src/lib/highlight.tsx, as an HTML string.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const TOKEN = /("(?:[^"]|"")*"|'(?:[^'])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w.]*)(?=\s*\()|(\b(?:true|false|ThisItem|Self|Parent)\b)|(<>|>=|<=|&&|\|\||[=<>&!@?+\-*/])|([()[\]{},;:])/g;

export function fxHtml(code: string): string {
  let out = '';
  let at = 0;
  for (const m of code.matchAll(TOKEN)) {
    out += esc(code.slice(at, m.index));
    const [text, str, num, fn, kw, op] = m;
    const cls = str ? 'str' : num ? 'num' : fn ? 'fn' : kw ? 'kw' : op ? 'op' : 'punc';
    out += `<span class="tk-${cls}">${esc(text)}</span>`;
    at = m.index! + text.length;
  }
  return out + esc(code.slice(at));
}
