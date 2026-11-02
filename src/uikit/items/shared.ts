// Pieces several UI Kit items share.

import { iconSvg, type IconName } from '../icons';
import { img, type ImageNode } from '../model';

/** An icon as an Image control with an SVG, colored from HexColors (our apps' icon pattern). */
export const icon = (name: string, shape: IconName, colorKey: string, o: Omit<ImageNode, 'kind' | 'name' | 'svg'> = {}) =>
  img(name, { w: 20, h: 20, label: '', ...o, svg: (hex) => iconSvg(shape, hex(colorKey)) });

/** Status names mapped to the design system's status slots. */
export const STATUSES: [string, 1 | 2 | 3 | 4 | 5 | 6 | 7][] = [
  ['Draft', 4],
  ['Submitted', 1],
  ['In review', 6],
  ['Waiting', 3],
  ['Approved', 5],
  ['Rejected', 2],
  ['Cancelled', 7],
];

/** "Fill=Status" style lines (e.g. "Approved=5") into pairs. */
export function statusPairs(lines: string[]): [string, 1 | 2 | 3 | 4 | 5 | 6 | 7][] {
  return lines
    .map((l) => l.split('='))
    .filter((p) => p[0]?.trim())
    .map(([name, slot]) => [name.trim(), Math.min(7, Math.max(1, Number(slot) || 1)) as 1 | 2 | 3 | 4 | 5 | 6 | 7]);
}

/** A rough text width in pixels for fixed-width labels (Segoe UI; canvas font sizes are in points). */
export const textWidth = (text: string, pt = 12) => Math.ceil(text.length * pt * 0.76 + 8);

/** Turns any label into a safe PascalCase control-name part. */
export const pascal = (s: string, fallback = 'Item') => {
  const out = s
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');
  return /^[A-Za-z]/.test(out) ? out.slice(0, 24) : fallback;
};
