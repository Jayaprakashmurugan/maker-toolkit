// The UI Kit's control model. A snippet is described once as a tree of nodes; the same tree becomes the
// Power Apps YAML (yaml.ts) and the HTML preview (KitPreview.tsx), so the two can't drift apart.
// Colors and sizes are design-system tokens that turn into fxColorConfigs / fxTextConfigs formulas.

import type { ColorKey, PaddingKey, RadiusKey, SizeKey, StatusIndex, ThicknessKey } from './theme';

/** A Power Fx formula, plus the value the preview should show for it. */
export interface Fx {
  fx: string;
  v?: string | number | boolean;
}
export const fx = (formula: string, v?: Fx['v']): Fx => ({ fx: formula, v });
export const isFx = (x: unknown): x is Fx => typeof x === 'object' && x !== null && 'fx' in x;

export type Text = string | Fx;
export type Num = number | Fx;

export type Color =
  | ColorKey
  | 'Transparent'
  | 'White'
  | { status: StatusIndex }
  | { statusFont: StatusIndex }
  | { fade: ColorKey; by: number }
  | { rgba: [number, number, number, number] }
  /** If(condition, then, else). The preview uses the condition's value. */
  | { if: Fx; then: Color; else: Color }
  /** Switch(on, "value", color, ..., fallback). The preview uses the case named in `pick`. */
  | { switch: string; cases: [string, Color][]; else: Color; pick?: string }
  | Fx;

export type Size = SizeKey | number | Fx;
export type Radius = RadiusKey | number;
export type Thickness = ThicknessKey | number;
export type Space = PaddingKey | number;
export type Pad = Space | { t?: Space; r?: Space; b?: Space; l?: Space; x?: Space; y?: Space };

/** A width or height: a number, 'fill' (take the space the parent gives), or a formula. */
export type Dim = number | 'fill' | Fx;

export type Align = 'Start' | 'Center' | 'End' | 'Stretch';
export type Justify = 'Start' | 'Center' | 'End' | 'SpaceBetween';
export type Weight = 'Normal' | 'Semibold' | 'Bold' | 'Lighter';

interface BaseNode {
  name: string;
  w?: Dim;
  h?: Dim;
  /** Position, only inside manual containers (nCon), gallery rows and at the top level. */
  x?: Num;
  y?: Num;
  /** How this control sits across its auto-layout parent (AlignInContainer). */
  align?: Align;
  minW?: number;
  minH?: number;
  fill?: Color;
  border?: { color: Color; thickness?: Thickness };
  radius?: Radius;
  /** Shown when true. The preview uses the formula's value. */
  visible?: Fx;
  onSelect?: string;
  tooltip?: Text;
  /** Extra properties written as-is (formula text without the leading =). YAML only. */
  extra?: Record<string, string>;
}

export interface ContainerNode extends BaseNode {
  kind: 'vCon' | 'hCon' | 'nCon';
  gap?: Space;
  pad?: Pad;
  alignItems?: Align;
  justify?: Justify;
  wrap?: boolean;
  scrollY?: boolean;
  shadow?: 'None' | 'Semilight' | 'Light' | 'Regular';
  children: Node[];
}

export interface LabelNode extends BaseNode {
  kind: 'label';
  text: Text;
  size?: Size;
  color?: Color;
  weight?: Weight;
  textAlign?: 'Left' | 'Center' | 'Right';
  vAlign?: 'Top' | 'Middle' | 'Bottom';
  pad?: Pad;
  wrap?: boolean;
  autoHeight?: boolean;
}

export interface ButtonNode extends BaseNode {
  kind: 'button';
  text: Text;
  size?: Size;
  color?: Color;
  weight?: Weight;
  hoverFill?: Color;
  hoverColor?: Color;
  pressedFill?: Color;
  pad?: Pad;
  textAlign?: 'Left' | 'Center' | 'Right';
  disabled?: Fx;
}

export interface ShapeNode extends BaseNode {
  kind: 'rect' | 'circle';
}

export interface IconNode extends BaseNode {
  kind: 'icon';
  /** A classic Power Apps icon, as in Icon.<name>. */
  icon: string;
  color?: Color;
  pad?: Pad;
  label?: string;
}

export interface ImageNode extends BaseNode {
  kind: 'image';
  /** SVG markup. `hex` gives a color as text: a formula piece in YAML, a real color in the preview. */
  svg: (hex: (key: string) => string, mode: 'yaml' | 'preview') => string;
  pad?: Pad;
  label?: string;
}

export interface InputNode extends BaseNode {
  kind: 'input';
  hint?: Text;
  value?: Text;
  mode?: 'SingleLine' | 'MultiLine' | 'Password';
  size?: Size;
  color?: Color;
  pad?: Pad;
  onChange?: string;
}

/** One gallery row's fields: formulas over ThisItem, with the sample value for the preview. */
export interface Row {
  f: (field: string) => Fx;
  selected: Fx;
  index: number;
  sample: Record<string, unknown>;
}

export interface GalleryNode extends BaseNode {
  kind: 'gallery';
  dir: 'Vertical' | 'Horizontal';
  items: string;
  sample: Record<string, unknown>[];
  templateSize: number;
  templatePad?: number;
  scrollbar?: boolean;
  /** Which sample row the preview shows as selected. */
  selectedIndex?: number;
  template: (row: Row) => Node[];
}

export type Node =
  | ContainerNode
  | LabelNode
  | ButtonNode
  | ShapeNode
  | IconNode
  | ImageNode
  | InputNode
  | GalleryNode;

type Opt<T extends Node> = Omit<T, 'kind' | 'name' | 'children'>;

export const vCon = (name: string, o: Opt<ContainerNode>, children: Node[]): ContainerNode => ({ kind: 'vCon', name, ...o, children });
export const hCon = (name: string, o: Opt<ContainerNode>, children: Node[]): ContainerNode => ({ kind: 'hCon', name, ...o, children });
export const nCon = (name: string, o: Opt<ContainerNode>, children: Node[]): ContainerNode => ({ kind: 'nCon', name, ...o, children });
export const lbl = (name: string, o: Opt<LabelNode>): LabelNode => ({ kind: 'label', name, ...o });
export const btn = (name: string, o: Opt<ButtonNode>): ButtonNode => ({ kind: 'button', name, ...o });
export const rect = (name: string, o: Opt<ShapeNode>): ShapeNode => ({ kind: 'rect', name, ...o });
export const circle = (name: string, o: Opt<ShapeNode>): ShapeNode => ({ kind: 'circle', name, ...o });
export const ico = (name: string, o: Opt<IconNode>): IconNode => ({ kind: 'icon', name, ...o });
export const img = (name: string, o: Opt<ImageNode>): ImageNode => ({ kind: 'image', name, ...o });
export const txt = (name: string, o: Opt<InputNode>): InputNode => ({ kind: 'input', name, ...o });
export const gal = (name: string, o: Opt<GalleryNode>): GalleryNode => ({ kind: 'gallery', name, ...o });

/** A Power Fx text literal. */
export const str = (s: string) => `"${s.replace(/"/g, '""')}"`;

/** Everything a snippet needs besides its controls. */
export interface Snippet {
  root: Node;
  /** Named formulas to add to App.Formulas (besides fxConfig). */
  formulas?: string;
  /** What to add to the screen's OnVisible, if anything. */
  onVisible?: string;
  /** Short notes shown under the code. */
  notes?: string[];
  /** Variables and collections the snippet uses, for the naming table. */
  uses?: { name: string; what: string }[];
}
