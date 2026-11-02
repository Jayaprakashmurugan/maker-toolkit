// Turns design-system tokens into Power Fx formulas (for YAML) and into real values (for the preview).

import { isFx, type Color, type Pad, type Radius, type Size, type Space, type Thickness } from './model';
import type { KitTheme } from './theme';

// ── Power Fx ─────────────────────────────────────────────

export function colorFx(c: Color): string {
  if (isFx(c)) return c.fx;
  if (c === 'Transparent') return 'Color.Transparent';
  if (c === 'White') return 'Color.White';
  if (typeof c === 'string') return `fxColorConfigs.${c}`;
  if ('status' in c) return `fxColorConfigs.StatusColors.StatusColor${c.status}`;
  if ('statusFont' in c) return `fxColorConfigs.StatusFontColors.StatusFontColor${c.statusFont}`;
  if ('fade' in c) return `ColorFade(fxColorConfigs.${c.fade}, ${c.by}%)`;
  if ('if' in c) return `If(${c.if.fx}, ${colorFx(c.then)}, ${colorFx(c.else)})`;
  if ('switch' in c)
    return ['Switch(', `    ${c.switch},`, ...c.cases.map(([v, col]) => `    "${v}", ${colorFx(col)},`), `    ${colorFx(c.else)}`, ')'].join('\n');
  const [r, g, b, a] = c.rgba;
  return `RGBA(${r}, ${g}, ${b}, ${a})`;
}

export const sizeFx = (s: Size) => (isFx(s) ? s.fx : typeof s === 'number' ? String(s) : `fxTextConfigs.Size.${s}`);
export const radiusFx = (r: Radius) => (typeof r === 'number' ? String(r) : `fxTextConfigs.BorderRadius.${r}`);
export const thicknessFx = (t: Thickness) => (typeof t === 'number' ? String(t) : `fxTextConfigs.BorderThickness.${t}`);
export const spaceFx = (s: Space) => (typeof s === 'number' ? String(s) : `fxTextConfigs.Padding.${s}`);

export function padSides(p: Pad): { t: Space; r: Space; b: Space; l: Space } {
  if (typeof p !== 'object') return { t: p, r: p, b: p, l: p };
  return {
    t: p.t ?? p.y ?? 0,
    r: p.r ?? p.x ?? 0,
    b: p.b ?? p.y ?? 0,
    l: p.l ?? p.x ?? 0,
  };
}

// ── Preview ──────────────────────────────────────────────

/** A color as CSS. Theme colors are CSS variables (see themeVars), so a page can switch themes without re-rendering. */
export function colorCss(c: Color | undefined): string | undefined {
  if (c === undefined) return undefined;
  if (isFx(c)) return typeof c.v === 'string' ? c.v : undefined;
  if (c === 'Transparent') return 'transparent';
  if (c === 'White') return '#FFFFFF';
  if (typeof c === 'string') return `var(--k-${c})`;
  if ('status' in c) return `var(--k-s${c.status})`;
  if ('statusFont' in c) return `var(--k-sf${c.statusFont})`;
  if ('fade' in c) return `color-mix(in srgb, var(--k-${c.fade}), ${c.by < 0 ? '#000' : '#fff'} ${Math.abs(c.by)}%)`;
  if ('if' in c) return colorCss(c.if.v ? c.then : c.else);
  if ('switch' in c) return colorCss(c.cases.find(([v]) => v === c.pick)?.[1] ?? c.else);
  const [r, g, b, a] = c.rgba;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export const sizePx = (s: Size | undefined, t: KitTheme) =>
  s === undefined ? t.size.Regular : isFx(s) ? (typeof s.v === 'number' ? s.v : t.size.Regular) : typeof s === 'number' ? s : t.size[s];
export const radiusPx = (r: Radius | undefined, t: KitTheme) => (r === undefined ? 0 : typeof r === 'number' ? r : t.radius[r]);
export const thicknessPx = (x: Thickness | undefined, t: KitTheme) => (x === undefined ? 1 : typeof x === 'number' ? x : t.thickness[x]);
export const spacePx = (s: Space | undefined, t: KitTheme) => (s === undefined ? 0 : typeof s === 'number' ? s : t.padding[s]);

export function padCss(p: Pad | undefined, t: KitTheme): string | undefined {
  if (p === undefined) return undefined;
  const s = padSides(p);
  return [s.t, s.r, s.b, s.l].map((v) => `${spacePx(v, t)}px`).join(' ');
}
