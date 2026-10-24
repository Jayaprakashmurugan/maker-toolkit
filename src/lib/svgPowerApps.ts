// Turns an SVG into a formula for a Power Apps Image control: cleaned, minified, single-quoted
// so it fits in a Power Fx string, and optionally with colors driven by Power Fx.
// Uses the browser's DOMParser, so call it only on the client.

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';
const XMLNS_NS = 'http://www.w3.org/2000/xmlns/';

const COLOR_PROPS = ['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color', 'color'];
const NOT_COLORS = new Set(['', 'none', 'inherit', 'transparent', 'initial', 'unset', 'context-fill', 'context-stroke']);
const DROP_TAGS = new Set(['script', 'foreignObject', 'metadata', 'title', 'desc']);
const TEXT_TAGS = new Set(['text', 'tspan', 'textPath']);
const SHAPES = 'path, rect, circle, ellipse, polygon, polyline, text';
const NUMERIC_ATTRS = new Set([
  'd', 'points', 'transform', 'gradientTransform', 'patternTransform', 'viewBox',
  'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'fx', 'fy', 'dx', 'dy',
  'width', 'height', 'stroke-width', 'font-size',
]);

/** Key used when the SVG sets no fill at all, so shapes draw in the default black. */
export const DEFAULT_FILL = 'default-fill';

export interface ColorUse {
  key: string;
  /** The color as written in the SVG. */
  value: string;
  count: number;
}

export type Replacement = { kind: 'keep' } | { kind: 'color'; value: string } | { kind: 'fx'; expr: string };

export interface Analysis {
  ok: true;
  root: Element;
  colors: ColorUse[];
  /** What the clean-up removed or fixed, in plain words. */
  report: string[];
  inputBytes: number;
}

export interface AnalysisError {
  ok: false;
  error: string;
}

const isColor = (v: string) => {
  const s = v.trim().toLowerCase();
  return !NOT_COLORS.has(s) && !s.startsWith('url(') && !s.startsWith('var(');
};
const colorKey = (v: string) => v.trim().toLowerCase().replace(/\s+/g, '');
export const byteLength = (s: string) => new TextEncoder().encode(s).length;

/** Calls fn for every color-bearing declaration in a style attribute or <style> block. */
function eachStyleColor(css: string, fn: (value: string) => string): string {
  return css.replace(/(^|[;{\s])(fill|stroke|stop-color|flood-color|lighting-color|color)(\s*:\s*)([^;}!]+)/gi, (m, pre, prop, sep, value) => {
    const v = value.trim();
    if (!isColor(v)) return m;
    const next = fn(v);
    return `${pre}${prop}${sep}${next}${value.slice(value.trimEnd().length)}`;
  });
}

function prepare(src: string): string {
  let s = src.replace(/^\uFEFF/, '').trim();
  // Copied from HTML, an <svg> often lacks the namespace that XML parsing needs.
  if (!/<svg\b[^>]*\sxmlns\s*=/.test(s)) s = s.replace(/<svg\b/, `<svg xmlns="${SVG_NS}"`);
  if (/\sxlink:/.test(s) && !/xmlns:xlink\s*=/.test(s)) s = s.replace(/<svg\b/, `<svg xmlns:xlink="${XLINK_NS}"`);
  return s.replace(/&nbsp;/g, '&#160;');
}

export function analyzeSvg(src: string): Analysis | AnalysisError {
  if (!src.trim()) return { ok: false, error: 'Paste an SVG to start.' };
  if (!/<svg\b/i.test(src)) return { ok: false, error: 'This doesn’t look like an SVG. It should contain an <svg> tag.' };
  const doc = new DOMParser().parseFromString(prepare(src), 'image/svg+xml');
  const err = doc.querySelector('parsererror');
  if (err) {
    // Chrome: "error on line 3 at column 9: <reason>". Firefox: "XML Parsing Error: <reason> ... Line Number 3".
    const text = err.textContent || '';
    const lead = (src.match(/^[\s\uFEFF]*/)?.[0].match(/\n/g) || []).length;
    const c = text.match(/line (\d+) at column \d+:\s*([^\n]+?)\s*(?:Below is|$)/im);
    const f = text.match(/XML Parsing Error:\s*([^\n]+)[\s\S]*?Line Number (\d+)/i);
    const [reason, line] = c ? [c[2], c[1]] : f ? [f[1], f[2]] : ['', ''];
    const where = line ? ` on line ${Number(line) + lead}` : '';
    return { ok: false, error: `The SVG couldn’t be read${reason ? ` (${reason.trim()}${where})` : where}. Check that every tag is closed and every attribute is quoted.` };
  }
  const root = doc.documentElement;
  if (root.localName !== 'svg') return { ok: false, error: 'The outermost tag must be <svg>.' };

  const counts = { script: 0, events: 0, editor: 0, external: 0, title: 0, desc: 0 };
  const comments = (src.match(/<!--/g) || []).length;

  for (const el of Array.from(root.querySelectorAll('*'))) {
    if (!el.isConnected) continue;
    if (el.namespaceURI !== SVG_NS) {
      counts.editor++;
      el.remove();
    } else if (DROP_TAGS.has(el.localName)) {
      if (el.localName === 'script') counts.script++;
      else if (el.localName === 'foreignObject') counts.external++;
      else if (el.localName === 'title') counts.title++;
      else if (el.localName === 'desc') counts.desc++;
      el.remove();
    }
  }
  for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
    for (const a of Array.from(el.attributes)) {
      const ns = a.namespaceURI;
      if (/^on/i.test(a.localName) && !ns) {
        counts.events++;
        el.removeAttributeNode(a);
      } else if (ns === XMLNS_NS) {
        if (a.name !== 'xmlns' && a.name !== 'xmlns:xlink') el.removeAttributeNode(a);
      } else if ((ns && ns !== XLINK_NS && ns !== XML_NS) || a.name.startsWith('data-')) {
        counts.editor++;
        el.removeAttributeNode(a);
      } else if (a.localName === 'href') {
        const v = a.value.trim();
        if (!v.startsWith('#') && !/^data:image\//i.test(v)) {
          counts.external++;
          if (el.localName === 'image') el.remove();
          else el.removeAttributeNode(a);
          break;
        }
      }
    }
  }
  for (const name of ['version', 'enable-background', 'xml:space']) {
    if (root.hasAttribute(name)) {
      root.removeAttribute(name);
      counts.editor++;
    }
  }
  for (const name of ['x', 'y']) if (/^0(px)?$/.test(root.getAttribute(name) || '')) root.removeAttribute(name);
  if (!root.querySelector('[*|href]') && root.hasAttribute('xmlns:xlink')) root.removeAttribute('xmlns:xlink');

  const report: string[] = [];
  if (!root.hasAttribute('viewBox')) {
    const w = parseFloat(root.getAttribute('width') || '');
    const h = parseFloat(root.getAttribute('height') || '');
    if (w > 0 && h > 0 && !/%/.test(root.getAttribute('width')! + root.getAttribute('height'))) {
      root.setAttribute('viewBox', `0 0 ${w} ${h}`);
      report.push('Added a viewBox so the image scales with the Image control.');
    } else {
      report.push('There’s no viewBox, so the image may not scale. Add one, such as viewBox="0 0 24 24".');
    }
  }
  if (counts.script) report.push(`Removed ${counts.script} script${counts.script > 1 ? 's' : ''}. Scripts never run in an Image control.`);
  if (counts.events) report.push(`Removed ${counts.events} event handler${counts.events > 1 ? 's' : ''} (onclick and similar).`);
  if (counts.external) report.push(`Removed ${counts.external} link${counts.external > 1 ? 's' : ''} to outside files or HTML, which an Image control can’t load.`);
  if (counts.editor) report.push(`Removed ${counts.editor} leftover${counts.editor > 1 ? 's' : ''} from the design tool.`);
  const unseen = [comments && `${comments} comment${comments > 1 ? 's' : ''}`, counts.title && 'the title', counts.desc && 'the description'].filter(Boolean);
  if (unseen.length) report.push(`Removed ${unseen.join(', ').replace(/, ([^,]*)$/, ' and $1')}, which don’t show in an image.`);
  if (root.querySelector('text')) report.push('This SVG has text. It draws in a font from the user’s device, so it can look different there; convert text to outlines in your design tool if that matters.');

  return { ok: true, root, colors: findColors(root), report, inputBytes: byteLength(src) };
}

function findColors(root: Element): ColorUse[] {
  const found = new Map<string, ColorUse>();
  const add = (v: string) => {
    const key = colorKey(v);
    const hit = found.get(key);
    if (hit) hit.count++;
    else found.set(key, { key, value: v.trim(), count: 1 });
  };
  let anyFill = false;
  for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
    for (const p of COLOR_PROPS) {
      const v = el.getAttribute(p);
      if (v == null) continue;
      if (p === 'fill') anyFill = true;
      if (isColor(v)) add(v);
    }
    const style = el.getAttribute('style');
    if (style) {
      if (/(^|[;\s])fill\s*:/i.test(style)) anyFill = true;
      eachStyleColor(style, (v) => (add(v), v));
    }
    if (el.localName === 'style') {
      if (/[{;\s]fill\s*:/i.test(el.textContent || '')) anyFill = true;
      eachStyleColor(el.textContent || '', (v) => (add(v), v));
    }
  }
  const list = [...found.values()];
  if (!anyFill && root.querySelector(SHAPES)) list.unshift({ key: DEFAULT_FILL, value: '#000000', count: 1 });
  return list;
}

const escText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const escAttr = (s: string) => escText(s).replace(/'/g, '&apos;');

function roundNumbers(v: string, digits: number): string {
  return v.replace(/\d*\.\d+(e[-+]?\d+)?/gi, (m, exp, offset: number, all: string) => {
    if (exp) return m;
    let out = Number(m).toFixed(digits).replace(/\.?0+$/, '');
    if (out === '' || out === '-0') out = '0';
    // ".5" written right after another number is a separate number; keep the two apart.
    if (m.startsWith('.') && /[\d.]/.test(all[offset - 1] || '') && !out.includes('.')) out = ` ${out}`;
    return out;
  });
}

const tightPath = (d: string) =>
  d
    .replace(/\s*([MmLlHhVvCcSsQqTtAaZz])\s*/g, '$1')
    .replace(/\s*,\s*/g, ',')
    .replace(/\s+-/g, '-')
    .trim();

const tightCss = (css: string) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};:,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();

function serialize(node: Node, digits: number | null, out: string[]) {
  if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
    const parent = (node.parentNode as Element | null)?.localName || '';
    const t = node.nodeValue || '';
    if (parent === 'style') out.push(escText(tightCss(t)));
    else if (TEXT_TAGS.has(parent)) out.push(escText(t.replace(/\s+/g, ' ')));
    else if (t.trim()) out.push(escText(t.replace(/\s+/g, ' ').trim()));
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as Element;
  out.push(`<${el.tagName}`);
  for (const a of Array.from(el.attributes)) {
    let v = a.value.replace(/\s+/g, ' ').trim();
    if (a.name === 'style') v = tightCss(v);
    if (digits != null && NUMERIC_ATTRS.has(a.name)) v = roundNumbers(v, digits);
    if (a.name === 'd') v = tightPath(v);
    out.push(` ${a.name}='${escAttr(v)}'`);
  }
  if (!el.childNodes.length) {
    out.push('/>');
    return;
  }
  out.push('>');
  el.childNodes.forEach((c) => serialize(c, digits, out));
  out.push(`</${el.tagName}>`);
}

export interface Rendered {
  /** The SVG as it will look, with every Power Fx color shown in its original color. */
  previewSvg: string;
  /** The Image property formula. */
  formula: string;
  /** A static base64 data URI, or null when some colors come from Power Fx. */
  base64: string | null;
  svgBytes: number;
}

const mark = (i: number) => `\u0001${i}\u0001`;

export function renderSvg(a: Analysis, replacements: Record<string, Replacement>, digits: number | null): Rendered {
  const exprs: string[] = [];
  const build = (forPreview: boolean) => {
    const root = a.root.cloneNode(true) as Element;
    const swap = (v: string) => {
      const r = replacements[colorKey(v)];
      if (!r || r.kind === 'keep') return v;
      if (r.kind === 'color') return r.value;
      if (forPreview || !r.expr.trim()) return v;
      exprs.push(r.expr.trim());
      return mark(exprs.length - 1);
    };
    for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
      for (const p of COLOR_PROPS) {
        const v = el.getAttribute(p);
        if (v != null && isColor(v)) el.setAttribute(p, swap(v));
      }
      const style = el.getAttribute('style');
      if (style) el.setAttribute('style', eachStyleColor(style, swap));
      if (el.localName === 'style' && el.textContent) el.textContent = eachStyleColor(el.textContent, swap);
    }
    // No fill anywhere: shapes draw black, so a new color goes on the <svg> itself.
    const def = replacements[DEFAULT_FILL];
    if (def && def.kind !== 'keep' && a.colors.some((c) => c.key === DEFAULT_FILL)) {
      if (def.kind === 'color') root.setAttribute('fill', def.value);
      else if (!forPreview && def.expr.trim()) {
        exprs.push(def.expr.trim());
        root.setAttribute('fill', mark(exprs.length - 1));
      }
    }
    const out: string[] = [];
    serialize(root, digits, out);
    return out.join('');
  };

  const previewSvg = build(true);
  exprs.length = 0;
  const svg = build(false);
  const body = svg.replace(/"/g, '""').replace(/\u0001(\d+)\u0001/g, (_, i) => `" & ${exprs[Number(i)]} & "`);
  return {
    previewSvg,
    formula: `"data:image/svg+xml;utf8, " & EncodeUrl("${body}")`,
    base64: exprs.length ? null : `"data:image/svg+xml;base64,${toBase64(previewSvg)}"`,
    svgBytes: byteLength(previewSvg),
  };
}

function toBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export const previewUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** A color the <input type="color"> picker accepts, from whatever the SVG wrote. */
export function pickerValue(v: string): string {
  const s = v.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(s)) return s;
  if (/^#[0-9a-f]{3}$/.test(s)) return `#${[...s.slice(1)].map((c) => c + c).join('')}`;
  if (/^#[0-9a-f]{8}$/.test(s)) return s.slice(0, 7);
  if (s === 'white') return '#ffffff';
  return '#000000';
}

export const SAMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Exported from a design tool -->
<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg" version="1.1">
  <title>Approved badge</title>
  <circle data-name="badge" cx="24" cy="24" r="22.0625" fill="#0F6CBD"/>
  <path d="M 14.5 24.5 L 21.25 31.125 L 34 17.5" fill="none" stroke="#FFFFFF"
        stroke-width="4.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
