// Builds 1200×630 share images (Open Graph) at build time: an SVG card in the site's
// style, rendered to PNG with resvg. Fonts come from the @fontsource packages.
import { Resvg } from '@resvg/resvg-js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { markPaths, slashGradient } from './logo';

export interface OgCard {
  kicker: string;
  title: string;
  /** "mono" for function names, "display" for page titles. */
  titleFont: 'mono' | 'display';
  summary?: string;
  /** Optional syntax line shown in a dark code strip. */
  code?: string;
  /** Color of the top edge stripe. */
  accent?: string;
  /** Show the author's photo and name in the footer (blog posts). */
  byline?: { name: string; photo?: string };
}

const FONT_SOURCES = [
  'node_modules/@fontsource/unbounded/files/unbounded-latin-700-normal.woff',
  'node_modules/@fontsource/instrument-sans/files/instrument-sans-latin-500-normal.woff',
  'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff',
  'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-800-normal.woff',
];

// resvg reads TrueType/OpenType, so unpack WOFF 1.0 (zlib-compressed tables) to a plain font file.
function woffToSfnt(woff: Buffer): Buffer {
  const numTables = woff.readUInt16BE(12);
  const tables = Array.from({ length: numTables }, (_, i) => {
    const o = 44 + i * 20;
    const offset = woff.readUInt32BE(o + 4);
    const compLength = woff.readUInt32BE(o + 8);
    const origLength = woff.readUInt32BE(o + 12);
    const raw = woff.subarray(offset, offset + compLength);
    return {
      tag: woff.readUInt32BE(o),
      checksum: woff.readUInt32BE(o + 16),
      data: compLength < origLength ? inflateSync(raw) : raw,
    };
  });
  let searchRange = 1;
  let entrySelector = 0;
  while (searchRange * 2 <= numTables) {
    searchRange *= 2;
    entrySelector++;
  }
  searchRange *= 16;
  let size = 12 + 16 * numTables;
  const offsets = tables.map((t) => {
    const at = size;
    size += (t.data.length + 3) & ~3;
    return at;
  });
  const out = Buffer.alloc(size);
  out.writeUInt32BE(woff.readUInt32BE(4), 0);
  out.writeUInt16BE(numTables, 4);
  out.writeUInt16BE(searchRange, 6);
  out.writeUInt16BE(entrySelector, 8);
  out.writeUInt16BE(numTables * 16 - searchRange, 10);
  tables.forEach((t, i) => {
    const o = 12 + i * 16;
    out.writeUInt32BE(t.tag, o);
    out.writeUInt32BE(t.checksum, o + 4);
    out.writeUInt32BE(offsets[i], o + 8);
    out.writeUInt32BE(t.data.length, o + 12);
    t.data.copy(out, offsets[i]);
  });
  return out;
}

let fontFiles: string[] | null = null;
function fonts(): string[] {
  if (fontFiles) return fontFiles;
  const dir = join(tmpdir(), 'maker-toolkit-og-fonts');
  mkdirSync(dir, { recursive: true });
  fontFiles = FONT_SOURCES.map((src) => {
    const out = join(dir, basename(src).replace(/\.woff$/, '.ttf'));
    if (!existsSync(out)) writeFileSync(out, woffToSfnt(readFileSync(join(process.cwd(), src))));
    return out;
  });
  return fontFiles;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) line = next;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[\s,.;:]*$/, '').slice(0, maxChars - 1)}…`;
    return kept;
  }
  return lines;
}

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

const C = {
  paper: '#07090d',
  card: '#0e121a',
  ink: '#eef1f6',
  ink2: '#a6afbd',
  ink3: '#6c7686',
  rule: '#1d2330',
  apps: '#d16be0',
  accent: '#4c8dff',
  data: '#1fb5a6',
  bi: '#f2c811',
  accentInk: '#8fb7ff',
  code: '#0d1118',
  codeInk: '#e2e8f0',
  fn: '#f2c811',
};
// Family names as stored in the @fontsource files (one family per weight).
const MONO = 'JetBrains Mono ExtraBold';
const MONO_MED = 'JetBrains Mono Medium';
const DISPLAY = 'Unbounded';
const BODY = 'Instrument Sans Medium';

/** A file under public/ as a data URI, for embedding in the SVG. */
function dataUri(publicPath: string): string | null {
  const file = join(process.cwd(), 'public', publicPath);
  if (!existsSync(file)) return null;
  const type = /\.png$/i.test(file) ? 'image/png' : 'image/jpeg';
  return `data:${type};base64,${readFileSync(file).toString('base64')}`;
}

/** Renders an SVG string to PNG at the given width, with the site fonts available. */
export function svgToPng(svg: string, width: number): Buffer {
  return new Resvg(svg, {
    font: { fontFiles: fonts(), loadSystemFonts: false, defaultFontFamily: MONO },
    fitTo: { mode: 'width', value: width },
  })
    .render()
    .asPng();
}

export function renderOg(card: OgCard & { host: string }): Buffer {
  const X = 80;
  const CW = 1040;
  const parts: string[] = [];

  if (card.titleFont === 'mono') {
    const size = Math.max(60, Math.min(120, Math.floor(CW / (card.title.length * 0.6))));
    parts.push(
      `<text x="${X}" y="${250 + size * 0.78}" font-family="${MONO}" font-size="${size}" letter-spacing="-2" fill="${C.ink}">${esc(truncate(card.title, Math.floor(CW / (60 * 0.6))))}</text>`,
    );
    if (card.summary) {
      wrap(card.summary, 58, 2).forEach((l, i) =>
        parts.push(
          `<text x="${X}" y="${Math.round(310 + size * 0.78 + i * 42)}" font-family="${BODY}" font-size="32" fill="${C.ink2}">${esc(l)}</text>`,
        ),
      );
    }
    if (card.code) {
      const code = truncate(card.code, 62);
      const at = code.indexOf('(');
      const name = at > 0 ? code.slice(0, at) : '';
      const rest = at > 0 ? code.slice(at) : code;
      parts.push(
        `<rect x="${X}" y="470" width="${CW}" height="60" rx="12" fill="${C.code}"/>`,
        `<text x="${X + 24}" y="509" font-family="${MONO_MED}" font-size="26" fill="${C.codeInk}"><tspan fill="${C.fn}">${esc(name)}</tspan>${esc(rest)}</text>`,
      );
    }
  } else {
    // Unbounded is wide, so long titles get a smaller size.
    const size = card.title.length > 34 ? 52 : card.title.length > 22 ? 62 : 74;
    const titleLines = wrap(card.title, Math.floor(CW / (size * 0.74)), size < 60 ? 3 : 2);
    titleLines.forEach((l, i) =>
      parts.push(
        `<text x="${X}" y="${300 + i * size * 1.12}" font-family="${DISPLAY}" font-weight="700" font-size="${size}" letter-spacing="-2.5" fill="${C.ink}">${esc(l)}</text>`,
      ),
    );
    if (card.summary) {
      const top = 300 + (titleLines.length - 1) * size * 1.12 + 62;
      wrap(card.summary, 60, titleLines.length > 2 ? 1 : titleLines.length > 1 ? 2 : 3).forEach((l, i) =>
        parts.push(`<text x="${X}" y="${top + i * 44}" font-family="${BODY}" font-size="32" fill="${C.ink2}">${esc(l)}</text>`),
      );
    }
  }

  const photo = card.byline?.photo ? dataUri(card.byline.photo) : null;
  const foot = card.byline
    ? `${photo ? `<rect x="${X - 2}" y="562" width="56" height="56" rx="14" fill="url(#g)"/><clipPath id="face"><rect x="${X}" y="564" width="52" height="52" rx="12"/></clipPath><image href="${photo}" x="${X}" y="564" width="52" height="52" clip-path="url(#face)" preserveAspectRatio="xMidYMid slice"/>` : ''}
  <text x="${X + (photo ? 68 : 0)}" y="598" font-family="${DISPLAY}" font-weight="700" font-size="21" fill="${C.ink}">${esc(card.byline.name)}</text>`
    : `<text x="${X}" y="598" font-family="${BODY}" font-size="23" fill="${C.ink2}">${esc(card.host)}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${C.apps}"/>
      <stop offset="0.42" stop-color="${C.accent}"/>
      <stop offset="0.78" stop-color="${C.data}"/>
      <stop offset="1" stop-color="${C.bi}"/>
    </linearGradient>
    ${slashGradient('slash')}
    <radialGradient id="glow1" cx="0.92" cy="0.05" r="0.6">
      <stop offset="0" stop-color="${C.apps}" stop-opacity="0.2"/>
      <stop offset="1" stop-color="${C.apps}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.7" cy="1" r="0.6">
      <stop offset="0" stop-color="${C.accent}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="${C.accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#ffffff" stroke-opacity="0.045" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="${C.paper}"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow1)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>
  <rect width="1200" height="6" fill="${card.accent ?? 'url(#g)'}"/>

  <g transform="translate(${X} 62)">
    <g transform="scale(0.875)">
      <rect width="64" height="64" rx="15" fill="${C.card}" stroke="#2a3242" stroke-width="2"/>
      ${markPaths(C.ink, 'url(#slash)')}
    </g>
  </g>
  <text x="${X + 72}" y="99" font-family="${DISPLAY}" font-weight="700" font-size="26" fill="${C.ink}">Maker<tspan fill="${C.accent}">/</tspan>Toolkit</text>

  <text x="${X}" y="200" font-family="${MONO_MED}" font-size="22" fill="${C.accentInk}">// ${esc(card.kicker.toLowerCase())}</text>
  ${parts.join('\n  ')}

  <rect x="${X}" y="548" width="${CW}" height="1.5" fill="${C.rule}"/>
  ${foot}
  <text x="${X + CW}" y="598" text-anchor="end" font-family="${MONO_MED}" font-size="19" fill="${C.ink3}">free · no sign-up · no cookies</text>
</svg>`;

  return svgToPng(svg, 1200);
}

/** Logo + wordmark on a light or dark background, for profiles and documents. */
export function renderLockup(theme: 'light' | 'dark'): Buffer {
  const bg = theme === 'light' ? '#f2f3ee' : C.paper;
  const text = theme === 'light' ? '#0b0d12' : C.ink;
  const slash = theme === 'light' ? '#2f6fe4' : C.accent;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="320" viewBox="0 0 1200 320">
  <defs>${slashGradient('slash')}</defs>
  <rect width="1200" height="320" fill="${bg}"/>
  <g transform="translate(70 60)">
    <g transform="scale(3.125)">
      <rect width="64" height="64" rx="14" fill="${C.card}"/>
      ${markPaths(C.ink, 'url(#slash)')}
    </g>
  </g>
  <text x="320" y="196" font-family="${DISPLAY}" font-weight="700" font-size="92" letter-spacing="-4" fill="${text}">Maker<tspan fill="${slash}">/</tspan>Toolkit</text>
</svg>`;
  return svgToPng(svg, 1200);
}
