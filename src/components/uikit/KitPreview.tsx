// Draws a UI Kit node tree as HTML, in a theme, so the preview matches the YAML it comes from.
// Sizes follow canvas apps: control sizes in pixels, font sizes in points.

import type { CSSProperties, ReactNode } from 'react';
import { isFx, type ContainerNode, type Dim, type GalleryNode, type Node, type Row, type Text } from '../../uikit/model';
import { colorCss, padCss, radiusPx, sizePx, spacePx, thicknessPx } from '../../uikit/resolve';
import type { KitTheme } from '../../uikit/theme';

type Place = { kind: 'auto'; dir: 'Vertical' | 'Horizontal'; parent: ContainerNode } | { kind: 'manual' } | { kind: 'template' } | { kind: 'root' };

const FLEX: Record<string, string> = { Start: 'flex-start', Center: 'center', End: 'flex-end', Stretch: 'stretch', SpaceBetween: 'space-between' };
const WEIGHT = { Normal: 400, Semibold: 600, Bold: 700, Lighter: 300 } as const;

const textOf = (t: Text | undefined) => (t === undefined ? '' : typeof t === 'string' ? t : t.v === undefined ? '' : String(t.v));

function dimPx(d: Dim | undefined): number | string | undefined {
  if (d === undefined) return undefined;
  if (d === 'fill') return '100%';
  if (isFx(d)) return typeof d.v === 'number' ? d.v : undefined;
  return d;
}

function boxStyle(n: Node, place: Place, t: KitTheme): CSSProperties {
  const s: CSSProperties = { boxSizing: 'border-box', position: 'relative', flexShrink: 0 };
  if (place.kind === 'auto') {
    const vertical = place.dir === 'Vertical';
    const main = vertical ? n.h : n.w;
    const cross = vertical ? n.w : n.h;
    if (main === 'fill') {
      s.flex = '1 1 0';
      if (vertical) s.minHeight = n.minH ?? 0;
      else s.minWidth = n.minW ?? 0;
    } else {
      s.flex = '0 0 auto';
      const v = dimPx(main);
      if (v !== undefined) s[vertical ? 'height' : 'width'] = v;
    }
    if (cross === 'fill') s.alignSelf = 'stretch';
    else {
      const v = dimPx(cross);
      if (v !== undefined) s[vertical ? 'width' : 'height'] = v;
      if (n.align) s.alignSelf = FLEX[n.align];
      else if (place.parent.alignItems === 'Stretch' || !place.parent.alignItems) s.alignSelf = 'flex-start';
    }
  } else if (place.kind === 'root') {
    s.width = dimPx(n.w);
    s.height = dimPx(n.h);
  } else {
    s.position = 'absolute';
    s.left = n.x === undefined ? 0 : isFx(n.x) ? (typeof n.x.v === 'number' ? n.x.v : 0) : n.x;
    s.top = n.y === undefined ? 0 : isFx(n.y) ? (typeof n.y.v === 'number' ? n.y.v : 0) : n.y;
    s.width = dimPx(n.w);
    s.height = dimPx(n.h);
  }
  const fill = colorCss(n.fill);
  if (fill) s.background = fill;
  if (n.border) {
    const w = thicknessPx(n.border.thickness ?? 'Thin', t);
    if (w > 0) s.border = `${w}px solid ${colorCss(n.border.color)}`;
  }
  if (n.radius !== undefined && !['label', 'rect', 'icon', 'gallery'].includes(n.kind)) s.borderRadius = radiusPx(n.radius, t);
  return s;
}

function rowFor(g: GalleryNode, i: number): Row {
  const sample = g.sample[i] ?? {};
  return {
    f: (field) => ({ fx: `ThisItem.${field}`, v: sample[field] as string }),
    selected: { fx: 'ThisItem.IsSelected', v: g.selectedIndex === i },
    index: i,
    sample,
  };
}

function render(n: Node, place: Place, t: KitTheme, key?: number): ReactNode {
  if (n.visible && n.visible.v === false) return null;
  const s = boxStyle(n, place, t);
  const title = n.tooltip === undefined ? undefined : textOf(n.tooltip);
  const font = 'var(--k-font)';

  switch (n.kind) {
    case 'vCon':
    case 'hCon': {
      const dir = n.kind === 'vCon' ? 'Vertical' : 'Horizontal';
      Object.assign(s, {
        display: 'flex',
        flexDirection: dir === 'Vertical' ? 'column' : 'row',
        gap: spacePx(n.gap, t),
        alignItems: FLEX[n.alignItems ?? 'Start'],
        justifyContent: FLEX[n.justify ?? 'Start'],
        flexWrap: n.wrap ? 'wrap' : 'nowrap',
        padding: padCss(n.pad, t),
        overflow: n.scrollY ? 'auto' : 'hidden',
      } satisfies CSSProperties);
      if (n.shadow && n.shadow !== 'None') s.boxShadow = '0 4px 14px rgba(20, 30, 45, 0.14)';
      return (
        <div key={key} style={s} data-k={n.name} title={title}>
          {n.children.map((c, i) => render(c, { kind: 'auto', dir, parent: n }, t, i))}
        </div>
      );
    }
    case 'nCon':
      if (n.shadow && n.shadow !== 'None') s.boxShadow = '0 4px 14px rgba(20, 30, 45, 0.14)';
      s.overflow = 'hidden';
      return (
        <div key={key} style={s} data-k={n.name}>
          {n.children.map((c, i) => render(c, { kind: 'manual' }, t, i))}
        </div>
      );
    case 'label':
      Object.assign(s, {
        display: 'flex',
        alignItems: { Top: 'flex-start', Middle: 'center', Bottom: 'flex-end' }[n.vAlign ?? 'Middle'],
        justifyContent: { Left: 'flex-start', Center: 'center', Right: 'flex-end' }[n.textAlign ?? 'Left'],
        textAlign: (n.textAlign ?? 'Left').toLowerCase() as CSSProperties['textAlign'],
        fontFamily: font,
        fontSize: `${sizePx(n.size, t)}pt`,
        fontWeight: WEIGHT[n.weight ?? 'Normal'],
        color: colorCss(n.color ?? 'TextColor'),
        padding: padCss(n.pad ?? 5, t),
        lineHeight: 1.2,
        overflow: 'hidden',
        whiteSpace: n.wrap === false ? 'nowrap' : 'normal',
      } satisfies CSSProperties);
      if (n.autoHeight) s.height = 'auto';
      return (
        <div key={key} style={s} data-k={n.name} title={title}>
          <span style={n.wrap === false ? { overflow: 'hidden', textOverflow: 'ellipsis' } : undefined}>{textOf(n.text)}</span>
        </div>
      );
    case 'button': {
      const disabled = n.disabled?.v === true;
      Object.assign(s, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: { Left: 'flex-start', Center: 'center', Right: 'flex-end' }[n.textAlign ?? 'Center'],
        fontFamily: font,
        fontSize: `${sizePx(n.size, t)}pt`,
        fontWeight: WEIGHT[n.weight ?? 'Semibold'],
        color: disabled ? 'var(--k-DisabledColor)' : colorCss(n.color ?? 'SelectedColor'),
        padding: padCss(n.pad ?? 5, t),
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        cursor: 'pointer',
      } satisfies CSSProperties);
      if (disabled) s.background = 'var(--k-DisabledFill)';
      return (
        <div key={key} style={s} data-k={n.name} title={title}>
          {textOf(n.text)}
        </div>
      );
    }
    case 'rect':
      return <div key={key} style={s} data-k={n.name} />;
    case 'circle':
      return <div key={key} style={{ ...s, borderRadius: '50%' }} data-k={n.name} />;
    case 'icon':
      return (
        <div key={key} style={{ ...s, padding: padCss(n.pad, t), color: colorCss(n.color ?? 'Primary3') }} data-k={n.name}>
          <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d={n.icon === 'Add' ? 'M12 5v14M5 12h14' : n.icon === 'Cancel' ? 'M6.5 6.5l11 11M17.5 6.5l-11 11' : 'M9.5 5.5L16 12l-6.5 6.5'} />
          </svg>
        </div>
      );
    case 'image': {
      // Inline SVG, with theme colors as CSS variables (style, since var() isn't reliable in SVG attributes).
      const svg = n
        .svg((k) => `__HEX_${k}__`, 'preview')
        .replace(/(stroke|fill)='__HEX_(\w+)__'/g, "style='$1:var(--k-hex-$2)'")
        .replace('<svg ', "<svg width='100%' height='100%' ");
      return <div key={key} style={{ ...s, padding: padCss(n.pad, t), display: 'flex' }} data-k={n.name} dangerouslySetInnerHTML={{ __html: svg }} />;
    }
    case 'input': {
      const value = textOf(n.value);
      Object.assign(s, {
        display: 'flex',
        alignItems: n.mode === 'MultiLine' ? 'flex-start' : 'center',
        fontFamily: font,
        fontSize: `${sizePx(n.size, t)}pt`,
        color: value ? colorCss(n.color ?? 'TextColor') : 'var(--k-DisabledColor)',
        padding: padCss(n.pad ?? { x: 12, y: 5 }, t),
        background: colorCss(n.fill ?? 'Fill'),
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      } satisfies CSSProperties);
      if (!n.border) s.border = '2px solid var(--k-BorderColor)';
      return (
        <div key={key} style={s} data-k={n.name}>
          {value || textOf(n.hint)}
        </div>
      );
    }
    case 'gallery': {
      const pad = n.templatePad ?? 0;
      const vertical = n.dir === 'Vertical';
      Object.assign(s, {
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        gap: pad,
        padding: pad,
        overflow: 'hidden',
      } satisfies CSSProperties);
      return (
        <div key={key} style={s} data-k={n.name}>
          {n.sample.map((_, i) => (
            <div
              key={i}
              style={{ position: 'relative', flex: '0 0 auto', [vertical ? 'height' : 'width']: n.templateSize, [vertical ? 'width' : 'height']: '100%' }}
            >
              {n.template(rowFor(n, i)).map((c, j) => render(c, { kind: 'template' }, t, j))}
            </div>
          ))}
        </div>
      );
    }
  }
}

export default function KitPreview({ root, theme }: { root: Node; theme: KitTheme }) {
  return <>{render(root, { kind: 'root' }, theme)}</>;
}
