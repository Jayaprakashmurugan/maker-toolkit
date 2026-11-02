// Turns a node tree into canvas app YAML in the format Power Apps Studio generates for "Copy code":
// a list of controls, each with Control (type@version), Variant, Properties (formulas starting with =) and Children.
// Control versions are the ones used in our own apps.

import { isFx, str, type ContainerNode, type Dim, type GalleryNode, type Node, type Row } from './model';
import { colorFx, padSides, radiusFx, sizeFx, spaceFx, thicknessFx } from './resolve';

export interface YamlControl {
  name: string;
  control: string;
  variant?: string;
  props: Record<string, string>;
  children?: YamlControl[];
}

/** Where a control sits, which decides how its size and position are written. */
type Place = { kind: 'auto'; dir: 'Vertical' | 'Horizontal'; parent: ContainerNode } | { kind: 'manual' } | { kind: 'template' } | { kind: 'root' };

const CONTROL_ID: Record<Node['kind'], string> = {
  vCon: 'GroupContainer@1.5.0',
  hCon: 'GroupContainer@1.5.0',
  nCon: 'GroupContainer@1.5.0',
  label: 'Label@2.5.1',
  button: 'Classic/Button@2.2.0',
  rect: 'Rectangle@2.3.0',
  circle: 'Circle@2.3.0',
  icon: 'Classic/Icon@2.5.0',
  image: 'Image@2.2.3',
  input: 'Classic/TextInput@2.3.2',
  gallery: 'Gallery@2.15.0',
};

const text = (t: string | { fx: string }) => (typeof t === 'string' ? str(t) : t.fx);
const num = (n: number | { fx: string }) => (typeof n === 'number' ? String(n) : n.fx);

function dimFx(d: Dim, axis: 'Width' | 'Height', place: Place): string {
  if (isFx(d)) return d.fx;
  if (d !== 'fill') return String(d);
  return place.kind === 'template' ? `Parent.Template${axis}` : `Parent.${axis}`;
}

/** Size and position, which depend on the parent. */
function layoutProps(n: Node, place: Place, p: Record<string, string>) {
  if (place.kind === 'auto') {
    const main = place.dir === 'Vertical' ? 'h' : 'w';
    const cross = main === 'h' ? 'w' : 'h';
    const mainAxis = main === 'h' ? 'Height' : 'Width';
    const crossAxis = main === 'h' ? 'Width' : 'Height';
    const mainDim = n[main];
    if (mainDim === 'fill') {
      p.FillPortions = '1';
      p[`LayoutMin${mainAxis}`] = String(main === 'h' ? (n.minH ?? 0) : (n.minW ?? 0));
    } else {
      p.FillPortions = '0';
      if (mainDim !== undefined) p[mainAxis] = dimFx(mainDim, mainAxis, place);
    }
    const crossDim = n[cross];
    if (crossDim === 'fill') {
      p.AlignInContainer = 'AlignInContainer.Stretch';
      p[`LayoutMin${crossAxis}`] = String(cross === 'h' ? (n.minH ?? 0) : (n.minW ?? 0));
    } else {
      if (crossDim !== undefined) p[crossAxis] = dimFx(crossDim, crossAxis, place);
      const parentAlign = place.parent.alignItems;
      const align = n.align ?? (parentAlign && parentAlign !== 'Stretch' ? 'SetByContainer' : 'Start');
      p.AlignInContainer = `AlignInContainer.${align}`;
    }
    return;
  }
  if (n.w !== undefined) p.Width = dimFx(n.w, 'Width', place);
  if (n.h !== undefined) p.Height = dimFx(n.h, 'Height', place);
  p.X = n.x === undefined ? '0' : num(n.x);
  p.Y = n.y === undefined ? '0' : num(n.y);
}

function radiusProps(r: NonNullable<Node['radius']>, p: Record<string, string>) {
  p.RadiusTopLeft = radiusFx(r);
  p.RadiusTopRight = 'Self.RadiusTopLeft';
  p.RadiusBottomLeft = 'Self.RadiusTopLeft';
  p.RadiusBottomRight = 'Self.RadiusTopLeft';
}

function paddingProps(pad: Parameters<typeof padSides>[0], p: Record<string, string>) {
  const s = padSides(pad);
  p.PaddingTop = spaceFx(s.t);
  p.PaddingRight = spaceFx(s.r);
  p.PaddingBottom = spaceFx(s.b);
  p.PaddingLeft = spaceFx(s.l);
}

function sampleRow(g: GalleryNode): Row {
  const sample = g.sample[0] ?? {};
  return {
    f: (field) => ({ fx: `ThisItem.${field}`, v: sample[field] as string }),
    selected: { fx: 'ThisItem.IsSelected', v: g.selectedIndex === 0 },
    index: 0,
    sample,
  };
}

export function toControl(n: Node, place: Place = { kind: 'root' }): YamlControl {
  const p: Record<string, string> = {};
  layoutProps(n, place, p);
  if (n.fill !== undefined) p.Fill = colorFx(n.fill);
  if (n.border) {
    p.BorderColor = colorFx(n.border.color);
    p.BorderThickness = thicknessFx(n.border.thickness ?? 'Thin');
  }
  // Labels, shapes, classic icons and galleries have no corner radius in canvas apps.
  if (n.radius !== undefined && !['label', 'rect', 'circle', 'icon', 'gallery'].includes(n.kind)) radiusProps(n.radius, p);
  if (n.visible) p.Visible = n.visible.fx;
  if (n.onSelect) p.OnSelect = n.onSelect;
  if (n.tooltip !== undefined) p.Tooltip = text(n.tooltip);

  const ctl: YamlControl = { name: n.name, control: CONTROL_ID[n.kind], props: p };

  switch (n.kind) {
    case 'vCon':
    case 'hCon': {
      const dir = n.kind === 'vCon' ? 'Vertical' : 'Horizontal';
      ctl.variant = 'AutoLayout';
      p.LayoutDirection = `LayoutDirection.${dir}`;
      p.LayoutGap = n.gap === undefined ? '0' : spaceFx(n.gap);
      p.LayoutAlignItems = `LayoutAlignItems.${n.alignItems ?? 'Start'}`;
      p.LayoutJustifyContent = `LayoutJustifyContent.${n.justify ?? 'Start'}`;
      if (n.wrap) p.LayoutWrap = 'true';
      if (n.scrollY) p.LayoutOverflowY = 'LayoutOverflow.Scroll';
      p.DropShadow = `DropShadow.${n.shadow ?? 'None'}`;
      if (n.pad !== undefined) paddingProps(n.pad, p);
      ctl.children = n.children.map((c) => toControl(c, { kind: 'auto', dir, parent: n }));
      break;
    }
    case 'nCon':
      ctl.variant = 'ManualLayout';
      p.DropShadow = `DropShadow.${n.shadow ?? 'None'}`;
      ctl.children = n.children.map((c) => toControl(c, { kind: 'manual' }));
      break;
    case 'label':
      p.Text = text(n.text);
      p.Font = 'fxTextConfigs.Font';
      p.Size = sizeFx(n.size ?? 'Regular');
      p.Color = colorFx(n.color ?? 'TextColor');
      p.FontWeight = `FontWeight.${n.weight ?? 'Normal'}`;
      if (n.textAlign) p.Align = `Align.${n.textAlign}`;
      p.VerticalAlign = `VerticalAlign.${n.vAlign ?? 'Middle'}`;
      if (n.pad !== undefined) paddingProps(n.pad, p);
      if (n.wrap !== undefined) p.Wrap = String(n.wrap);
      if (n.autoHeight) p.AutoHeight = 'true';
      break;
    case 'button': {
      p.Text = text(n.text);
      p.Font = 'fxTextConfigs.Font';
      p.Size = sizeFx(n.size ?? 'Regular');
      p.Color = colorFx(n.color ?? 'SelectedColor');
      p.FontWeight = `FontWeight.${n.weight ?? 'Semibold'}`;
      if (n.textAlign) p.Align = `Align.${n.textAlign}`;
      if (!n.border) {
        p.BorderThickness = '0';
        p.BorderColor = 'Self.Fill';
      }
      p.HoverFill = n.hoverFill ? colorFx(n.hoverFill) : 'ColorFade(Self.Fill, -10%)';
      p.HoverColor = n.hoverColor ? colorFx(n.hoverColor) : 'Self.Color';
      p.HoverBorderColor = 'Self.BorderColor';
      p.PressedFill = n.pressedFill ? colorFx(n.pressedFill) : 'ColorFade(Self.Fill, -20%)';
      p.PressedColor = 'Self.Color';
      p.PressedBorderColor = 'Self.BorderColor';
      p.DisabledFill = 'fxColorConfigs.DisabledFill';
      p.DisabledColor = 'fxColorConfigs.DisabledColor';
      p.DisabledBorderColor = 'fxColorConfigs.DisabledFill';
      p.FocusedBorderColor = 'fxColorConfigs.Secondary1';
      p.FocusedBorderThickness = 'fxTextConfigs.BorderThickness.Regular';
      if (n.disabled) p.DisplayMode = `If(${n.disabled.fx}, DisplayMode.Disabled, DisplayMode.Edit)`;
      if (n.pad !== undefined) paddingProps(n.pad, p);
      break;
    }
    case 'rect':
    case 'circle':
      if (!n.border) p.BorderThickness = '0';
      break;
    case 'icon':
      p.Icon = `Icon.${n.icon}`;
      p.Color = colorFx(n.color ?? 'Primary3');
      if (n.pad !== undefined) paddingProps(n.pad, p);
      if (n.label) p.AccessibleLabel = str(n.label);
      break;
    case 'image': {
      const svg = n.svg((key) => `" & fxColorConfigs.HexColors.${key} & "`, 'yaml');
      p.Image = `"data:image/svg+xml;utf8," & EncodeUrl("${svg}")`.replace(/ & ""/g, '').replace(/"" & /g, '');
      if (n.pad !== undefined) paddingProps(n.pad, p);
      if (n.label) p.AccessibleLabel = str(n.label);
      break;
    }
    case 'input':
      p.Default = n.value === undefined ? '""' : text(n.value);
      if (n.hint !== undefined) p.HintText = text(n.hint);
      p.Mode = `TextMode.${n.mode ?? 'SingleLine'}`;
      p.Font = 'fxTextConfigs.Font';
      p.Size = sizeFx(n.size ?? 'Regular');
      p.Color = colorFx(n.color ?? 'TextColor');
      p.HoverBorderColor = 'fxColorConfigs.HoverBorderColor';
      p.FocusedBorderColor = 'fxColorConfigs.Primary1';
      p.FocusedBorderThickness = 'fxTextConfigs.BorderThickness.Regular';
      if (n.pad !== undefined) paddingProps(n.pad, p);
      if (n.onChange) p.OnChange = n.onChange;
      break;
    case 'gallery':
      ctl.variant = n.dir;
      p.Items = n.items;
      p.TemplateSize = String(n.templateSize);
      p.TemplatePadding = String(n.templatePad ?? 0);
      p.ShowScrollbar = String(n.scrollbar ?? false);
      if (!n.border) p.BorderThickness = '0';
      p.LoadingSpinner = 'LoadingSpinner.Data';
      if (n.wrapCount) p.WrapCount = String(n.wrapCount);
      ctl.children = n.template(sampleRow(n)).map((c) => toControl(c, { kind: 'template' }));
      break;
  }
  if (n.extra) Object.assign(p, n.extra);
  return ctl;
}

// ── Text ─────────────────────────────────────────────────

const needsBlock = (v: string) => /\n|: | #|:$|^\s|\s$|\t/.test(v);

function writeValue(key: string, formula: string, indent: string): string[] {
  const v = `=${formula}`;
  if (!needsBlock(v)) return [`${indent}${key}: ${v}`];
  return [`${indent}${key}: |-`, ...v.split('\n').map((line) => (line ? `${indent}  ${line}` : ''))];
}

function writeControl(c: YamlControl, indent: string): string[] {
  const inner = indent + '    ';
  const out = [`${indent}- ${c.name}:`, `${inner}Control: ${c.control}`];
  if (c.variant) out.push(`${inner}Variant: ${c.variant}`);
  const keys = Object.keys(c.props).sort((a, b) => a.localeCompare(b));
  if (keys.length) {
    out.push(`${inner}Properties:`);
    for (const k of keys) out.push(...writeValue(k, c.props[k], inner + '  '));
  }
  if (c.children?.length) {
    out.push(`${inner}Children:`);
    for (const child of c.children) out.push(...writeControl(child, inner + '  '));
  }
  return out;
}

/** The YAML for one or more top-level controls, ready for Paste code. */
export const toYaml = (controls: YamlControl[]) => controls.flatMap((c) => writeControl(c, '')).join('\n') + '\n';

/** Every control in a tree, flattened, for checks and the tree view. */
export function flatten(c: YamlControl, depth = 0, out: { c: YamlControl; depth: number }[] = []) {
  out.push({ c, depth });
  c.children?.forEach((ch) => flatten(ch, depth + 1, out));
  return out;
}
