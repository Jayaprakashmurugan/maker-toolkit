// Builds 1200×630 share images (Open Graph) at build time: an SVG card in the site's
// style, rendered to PNG with resvg. Fonts come from the @fontsource packages.
import { Resvg } from '@resvg/resvg-js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { inflateSync } from 'node:zlib';

export interface OgCard {
  kicker: string;
  title: string;
  /** "mono" for function names, "display" for page titles. */
  titleFont: 'mono' | 'display';
  summary?: string;
  /** Optional syntax line shown in a dark code strip. */
  code?: string;
  /** Color of the left edge stripe. */
  accent?: string;
}

const FONT_SOURCES = [
  'node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff',
  'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff',
  'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-800-normal.woff',
  'node_modules/@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-400-normal.woff',
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
  paper: '#f3efe6',
  ink: '#1b1a17',
  ink2: '#4f4b43',
  ink3: '#857f73',
  accent: '#e8461a',
  accentInk: '#b5340e',
  code: '#1d1c19',
  codeInk: '#ece7dc',
  fn: '#ffbd6e',
};
// Family names as stored in the @fontsource files (one family per weight).
const MONO = 'JetBrains Mono ExtraBold';
const MONO_MED = 'JetBrains Mono Medium';
const DISPLAY = 'Bricolage Grotesque ExtraBold';
const BODY = 'Atkinson Hyperlegible Next';

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
        `<rect x="${X}" y="470" width="${CW}" height="60" rx="8" fill="${C.code}"/>`,
        `<text x="${X + 24}" y="509" font-family="${MONO_MED}" font-size="26" fill="${C.codeInk}"><tspan fill="${C.fn}">${esc(name)}</tspan>${esc(rest)}</text>`,
      );
    }
  } else {
    const size = 86;
    const titleLines = wrap(card.title, Math.floor(CW / (size * 0.56)), 2);
    titleLines.forEach((l, i) =>
      parts.push(
        `<text x="${X}" y="${312 + i * size * 0.98}" font-family="${DISPLAY}" font-size="${size}" letter-spacing="-2" fill="${C.ink}">${esc(l)}</text>`,
      ),
    );
    if (card.summary) {
      const top = 312 + (titleLines.length - 1) * size * 0.98 + 66;
      wrap(card.summary, 56, titleLines.length > 1 ? 2 : 3).forEach((l, i) =>
        parts.push(`<text x="${X}" y="${top + i * 44}" font-family="${BODY}" font-size="33" fill="${C.ink2}">${esc(l)}</text>`),
      );
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0V24" fill="none" stroke="${C.ink}" stroke-opacity="0.06" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="${C.paper}"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="14" height="630" fill="${card.accent ?? C.accent}"/>

  <g transform="translate(${X} 64)">
    <rect x="3" y="3" width="52" height="52" rx="9" fill="${C.accent}"/>
    <rect width="52" height="52" rx="9" fill="${C.ink}"/>
    <g transform="scale(0.8125)">
      <path d="M22 16c-6 4-9 10-9 16s3 12 9 16M42 16c6 4 9 10 9 16s-3 12-9 16" fill="none" stroke="${C.paper}" stroke-width="5" stroke-linecap="round"/>
      <path d="M37 18 27 46" stroke="${C.accent}" stroke-width="6" stroke-linecap="round"/>
    </g>
  </g>
  <text x="${X + 74}" y="101" font-family="${MONO}" font-size="30" fill="${C.ink}">Maker<tspan fill="${C.accent}">/</tspan>Toolkit</text>

  <text x="${X}" y="212" font-family="${MONO}" font-size="22" letter-spacing="3" fill="${C.accentInk}">${esc(card.kicker.toUpperCase())}</text>
  ${parts.join('\n  ')}

  <rect x="${X}" y="556" width="${CW}" height="2" fill="${C.ink}"/>
  <text x="${X}" y="598" font-family="${MONO_MED}" font-size="23" fill="${C.ink2}">${esc(card.host)}</text>
  <text x="${X + CW}" y="598" text-anchor="end" font-family="${MONO_MED}" font-size="21" fill="${C.ink3}">Free · No sign-up · No cookies</text>
</svg>`;

  return new Resvg(svg, {
    font: { fontFiles: fonts(), loadSystemFonts: false, defaultFontFamily: MONO },
    fitTo: { mode: 'width', value: 1200 },
  })
    .render()
    .asPng();
}
