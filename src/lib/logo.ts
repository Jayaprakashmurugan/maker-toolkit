// The Maker Toolkit mark: formula brackets cut by the lime slash from "Maker/Toolkit".
// Single source for the header logo, favicons, app icons, share images and brand kit.

export const COLORS = { ink: '#0e121a', paper: '#eef1f6', accent: '#c8f560' };

// Paths in a 64×64 box.
export const LEFT = 'M23.5 14.5c-6.6 4.6-9.8 10.6-9.8 17.5s3.2 12.9 9.8 17.5';
export const RIGHT = 'M40.5 14.5c6.6 4.6 9.8 10.6 9.8 17.5s-3.2 12.9-9.8 17.5';
export const SLASH = 'M37.6 16.5 26.4 47.5';
export const BRACKET_WIDTH = 5.6;
export const SLASH_WIDTH = 6.4;

/** The mark's strokes, for embedding inside a 64×64 coordinate space. */
export function markPaths(stroke = COLORS.paper, accent = COLORS.accent): string {
  return (
    `<path d="${LEFT} ${RIGHT}" fill="none" stroke="${stroke}" stroke-width="${BRACKET_WIDTH}" stroke-linecap="round"/>` +
    `<path d="${SLASH}" stroke="${accent}" stroke-width="${SLASH_WIDTH}" stroke-linecap="round"/>`
  );
}

/**
 * A standalone SVG of the mark.
 * - rounded: rounded tile (false = full-bleed square, for iOS and maskable icons)
 * - scale: size of the mark inside the tile (1 = as designed)
 * - themed: swap tile and stroke colors in dark mode (for the favicon)
 */
export function markSvg({ rounded = true, scale = 1, themed = false } = {}): string {
  const offset = (64 - 64 * scale) / 2;
  const style = themed
    ? `<style>.t{fill:${COLORS.ink}}.b{stroke:${COLORS.paper}}@media (prefers-color-scheme:dark){.t{fill:#1a2130}}</style>`
    : '';
  const paths = themed
    ? `<path class="b" d="${LEFT} ${RIGHT}" fill="none" stroke-width="${BRACKET_WIDTH}" stroke-linecap="round"/>` +
      `<path d="${SLASH}" stroke="${COLORS.accent}" stroke-width="${SLASH_WIDTH}" stroke-linecap="round"/>`
    : markPaths();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">${style}<rect${themed ? ' class="t"' : ''} width="64" height="64"${rounded ? ' rx="14"' : ''} fill="${COLORS.ink}"/><g transform="translate(${offset} ${offset}) scale(${scale})">${paths}</g></svg>`;
}

/** Wraps PNG data in a .ico container (modern ICO files can hold PNG images). */
export function pngToIco(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  header.writeUInt8(size >= 256 ? 0 : size, 6);
  header.writeUInt8(size >= 256 ? 0 : size, 7);
  header.writeUInt8(0, 8); // no palette
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10); // color planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18); // image data offset
  return Buffer.concat([header, png]);
}
