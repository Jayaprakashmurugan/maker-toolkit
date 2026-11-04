// A UI Kit item as a canvas component: the ComponentDefinitions YAML that Power Apps keeps in
// Src/Components/<name>.pa.yaml, plus the instance to put on a screen. It's built from the options picked on the page.
// The design system comes in through a ConfigProperties input (ConfigProperties: =fxConfig), the way our own
// components take it. Text options become text inputs, named formulas become table inputs, UpdateContext becomes
// Set (components have no context variables), the screen's OnVisible becomes OnReset, and the item's actions
// become event properties whose formulas move to the screen.

import type { GalleryNode, Node, Snippet } from './model';
import { str } from './model';
import { pascal } from './items/shared';
import { COMPONENT_SPECS } from './componentSpecs';
import { defaultTheme, fxConfigFormula, type KitTheme } from './theme';
import type { KitItem, KitValues } from './types';
import { flatten, toControl, writeControl, writeValue, type YamlControl } from './yaml';

export type DataType = 'Text' | 'Number' | 'Boolean' | 'DateAndTime' | 'Record' | 'Table' | 'Color' | 'Image';

export interface CustomProp {
  name: string;
  kind: 'Input' | 'Output' | 'Event';
  /** Inputs and outputs. */
  type?: DataType;
  /** Inputs: the formula used when the screen doesn't set one (no leading =). */
  default?: string;
  description: string;
}

/**
 * What can't be worked out automatically. In every formula here, CMP stands for the component inside the
 * definition and for the instance (cmpX_1) on the screen.
 */
export interface ComponentSpec {
  /**
   * Extra inputs. `option`: a formula option (Items, Value…) whose formula moves to the screen.
   * `from`: a name in the formulas (a screen variable) that the input replaces.
   * The default is a formula, the rows of a gallery's sample (`sample`) or a named formula's value (`defaultFrom`).
   */
  inputs?: {
    name: string;
    type: DataType;
    description: string;
    option?: string;
    from?: string;
    default?: string;
    sample?: string;
    defaultFrom?: string;
    /** What the screen passes in. Defaults to the option's formula, the replaced name, or the default. */
    host?: string;
  }[];
  outputs?: { name: string; type: DataType; value: string; description: string }[];
  /**
   * Events. Each listed control property calls CMP.<name>() and the screen gets the formula it had.
   * `keep` keeps the control's own formula first (internal state), and `host` gives the screen's formula instead.
   */
  events?: { name: string; description: string; on: [control: string, prop?: string][]; keep?: boolean; host?: string }[];
  /** Named formulas worked out inside the component (internal outputs, like the user's _Theme) instead of inputs. */
  internal?: string[];
  /** Option ids that stay fixed in the component instead of becoming inputs. */
  fixed?: string[];
  /** Better names (and descriptions) for text inputs, by option id. */
  names?: Record<string, string | [name: string, description: string]>;
  /** Property changes inside the component, after conversion. null removes the property. */
  set?: [control: string, prop: string, formula: string | null][];
  /** Text replacements in every formula inside the component, after conversion. */
  replace?: [from: string, to: string][];
  /** The component's OnReset, instead of the one made from the item's OnVisible. null for none. */
  onReset?: string | null;
  /** Keep the item's OnVisible on the screen (it sets the screen's own variables) instead of moving it to OnReset. */
  screen?: boolean;
  /** Extra properties on the instance. */
  instance?: Record<string, string>;
  /** The component's name, when the slug doesn't make a good one. */
  name?: string;
  notes?: string[];
}

export interface KitComponent {
  name: string;
  instanceName: string;
  definition: string;
  instance: string;
  props: CustomProp[];
  /** The component's own properties: Width, Height, OnReset and the outputs' formulas. */
  properties: Record<string, string>;
  children: YamlControl;
  /** What goes in the screen's OnVisible: what the item kept there, and the Reset that starts the component. */
  screen?: string;
  notes: string[];
  /** Anything the conversion couldn't do, for the build-time checks. */
  problems: string[];
}

export const hasComponent = (item: KitItem) => item.slug in COMPONENT_SPECS;

function specFor(item: KitItem, values: KitValues): ComponentSpec | null {
  const spec = COMPONENT_SPECS[item.slug];
  if (!spec) return null;
  return typeof spec === 'function' ? spec(values) : spec;
}

// ── Formula text ─────────────────────────────────────────

/** Index of the quote that closes the string literal opening at `i`. */
function skipString(f: string, i: number): number {
  for (i++; i < f.length; i++) {
    if (f[i] !== '"') continue;
    if (f[i + 1] === '"') i++;
    else return i;
  }
  return f.length;
}

/** Index just past the bracket that closes the one at `open`. */
function closing(f: string, open: number): number {
  let depth = 0;
  for (let i = open; i < f.length; i++) {
    const ch = f[i];
    if (ch === '"') i = skipString(f, i);
    else if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch) && --depth === 0) return i + 1;
  }
  return -1;
}

/** Splits at commas that aren't inside brackets or strings. */
function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') i = skipString(s, i);
    else if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    else if (ch === ',' && depth === 0) {
      out.push(s.slice(start, i));
      start = i + 1;
    }
  }
  out.push(s.slice(start));
  return out;
}

/** A formula cut into code and string literals (contents without the quotes, "" escapes kept). */
function pieces(f: string): { lit: boolean; s: string }[] {
  const out: { lit: boolean; s: string }[] = [];
  let code = '';
  for (let i = 0; i < f.length; i++) {
    if (f[i] === '"') {
      if (code) out.push({ lit: false, s: code });
      code = '';
      const end = skipString(f, i);
      out.push({ lit: true, s: f.slice(i + 1, end) });
      i = end;
    } else if (f.startsWith('//', i)) {
      const end = f.indexOf('\n', i);
      const stop = end < 0 ? f.length : end;
      code += f.slice(i, stop);
      i = stop - 1;
    } else code += f[i];
  }
  if (code) out.push({ lit: false, s: code });
  return out;
}

const join = (parts: { lit: boolean; s: string }[]) => parts.map((p) => (p.lit ? `"${p.s}"` : p.s)).join('');

/** Runs `fn` over the code of a formula, leaving string literals alone. */
const mapCode = (f: string, fn: (code: string) => string) => join(pieces(f).map((p) => (p.lit ? p : { lit: false, s: fn(p.s) })));

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const replaceName = (f: string, name: string, to: string) => mapCode(f, (c) => c.replace(new RegExp(`\\b${escapeRe(name)}\\b`, 'g'), to));

/** The formula's code with comments and string contents taken out, for checking which names it uses. */
const codeOnly = (f: string) =>
  pieces(f)
    .map((p) => (p.lit ? '""' : p.s.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')))
    .join('');

/** UpdateContext({ a: x, b: y }) → Set(a, x); Set(b, y). Components have Set but no context variables. */
export function toSet(f: string): string {
  const re = /\bUpdateContext\s*\(/g;
  let out = '';
  let from = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(f))) {
    const open = m.index + m[0].length - 1;
    const end = closing(f, open);
    if (end < 0) break;
    const arg = f.slice(open + 1, end - 1).trim();
    if (!arg.startsWith('{') || !arg.endsWith('}')) continue;
    const sets = splitTop(arg.slice(1, -1))
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const c = p.indexOf(':');
        return `Set(${p.slice(0, c).trim()}, ${p.slice(c + 1).trim()})`;
      });
    out += f.slice(from, m.index) + sets.join('; ');
    from = end;
    re.lastIndex = end;
  }
  return out + f.slice(from);
}

/** The named formulas in an App.Formulas block, with the comment above each. */
function namedFormulas(text = '') {
  const out: { name: string; body: string; note: string }[] = [];
  let note: string[] = [];
  let p = 0;
  while (p < text.length) {
    const rest = text.slice(p);
    const ws = /^\s+/.exec(rest);
    if (ws) {
      p += ws[0].length;
      continue;
    }
    if (rest.startsWith('//')) {
      const line = rest.split('\n')[0];
      note.push(line.replace(/^\/\/\s*/, ''));
      p += line.length;
      continue;
    }
    const m = /^(fx[A-Za-z0-9_]+)\s*=/.exec(rest);
    if (!m) break;
    let i = p + m[0].length;
    let depth = 0;
    for (; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') i = skipString(text, i);
      else if (ch === '/' && text[i + 1] === '/') i = text.indexOf('\n', i) < 0 ? text.length : text.indexOf('\n', i);
      else if ('([{'.includes(ch)) depth++;
      else if (')]}'.includes(ch)) depth--;
      else if (ch === ';' && depth === 0) break;
    }
    out.push({ name: m[1], body: text.slice(p + m[0].length, i).trim(), note: note.join(' ') });
    note = [];
    p = i + 1;
  }
  return out;
}

/** [ … ] → Table( … ), the way table inputs are usually written. */
function asTable(body: string): string {
  if (body.startsWith('[') && closing(body, 0) === body.length) return `Table(${body.slice(1, -1)})`;
  return body;
}

/** A Power Fx literal for a sample value. */
function literal(v: unknown, indent = ''): string {
  if (v === null || v === undefined) return 'Blank()';
  if (typeof v === 'string') return str(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Date) return `Date(${v.getFullYear()}, ${v.getMonth() + 1}, ${v.getDate()})`;
  if (Array.isArray(v)) return rowsLiteral(v as Record<string, unknown>[], indent);
  const fields = Object.entries(v as Record<string, unknown>)
    .filter(([, x]) => typeof x !== 'function')
    .map(([k, x]) => `${/^[A-Za-z_]\w*$/.test(k) ? k : `'${k}'`}: ${literal(x, indent)}`);
  return `{ ${fields.join(', ')} }`;
}

/** Gallery sample rows as a Table( … ) literal. */
export function rowsLiteral(rows: Record<string, unknown>[], indent = ''): string {
  if (!rows.length) return 'Table()';
  return `Table(\n${rows.map((r) => `${indent}    ${literal(r, indent + '    ')}`).join(',\n')}\n${indent})`;
}

function findGallery(n: Node, name: string): GalleryNode | undefined {
  if (n.kind === 'gallery') {
    if (n.name === name) return n;
    const row = { f: (field: string) => ({ fx: `ThisItem.${field}` }), selected: { fx: 'ThisItem.IsSelected' }, index: 0, sample: n.sample[0] ?? {} };
    for (const c of n.template(row)) {
      const g = findGallery(c, name);
      if (g) return g;
    }
  }
  if ('children' in n)
    for (const c of n.children) {
      const g = findGallery(c, name);
      if (g) return g;
    }
  return undefined;
}

// ── Option values that become inputs ─────────────────────

// Private-use characters stand in for option values while the item is built a second time.
const SENTINEL = /([\uE000-\uE0FF])\1*/g;
const hasSentinel = (s: string) => /[\uE000-\uE0FF]/.test(s);

interface Candidate {
  id: string;
  name: string;
  kind: 'text' | 'formula';
  char: string;
  len: number;
}

const TEXT_NAMES: Record<string, string> = {
  confirm: 'ConfirmText',
  action: 'ActionText',
  hint: 'HintText',
  error: 'ErrorText',
  delta: 'DeltaText',
  apply: 'ApplyText',
  tip: 'TooltipText',
  brand: 'AppName',
  app: 'AppName',
};

/**
 * Puts the input references in where the sentinels landed: inside a string literal a text input is joined in
 * with &, in code a formula input stands on its own. null when a sentinel was cut or used where it can't go.
 */
function placeInputs(f: string, byChar: Map<string, Candidate>, used: Set<string>): string | null {
  let ok = true;
  const out = pieces(f).map((p) => {
    if (!hasSentinel(p.s)) return p.lit ? `"${p.s}"` : p.s;
    if (!p.lit)
      return p.s.replace(SENTINEL, (run, ch: string) => {
        const c = byChar.get(ch);
        if (!c || c.kind !== 'formula' || run.length !== c.len) ok = false;
        else used.add(c.id);
        return `CMP.${c?.name}`;
      });
    const parts: string[] = [];
    let last = 0;
    p.s.replace(SENTINEL, (run, ch: string, at: number) => {
      const c = byChar.get(ch);
      if (!c || c.kind !== 'text' || run.length !== c.len) ok = false;
      else used.add(c.id);
      if (at > last) parts.push(`"${p.s.slice(last, at)}"`);
      parts.push(`CMP.${c?.name}`);
      last = at + run.length;
      return run;
    });
    if (last < p.s.length) parts.push(`"${p.s.slice(last)}"`);
    return parts.length === 1 ? parts[0] : `(${parts.join(' & ')})`;
  });
  return ok ? out.join('') : null;
}

const shape = (c: YamlControl) =>
  flatten(c)
    .map(({ c }) => `${c.name}:${Object.keys(c.props).sort().join(',')}`)
    .join('|');

/** Walks two trees of the same shape together. */
function pairUp(a: YamlControl, b: YamlControl, fn: (a: YamlControl, b: YamlControl) => void) {
  fn(a, b);
  a.children?.forEach((c, i) => pairUp(c, b.children![i], fn));
}

function eachControl(c: YamlControl, fn: (c: YamlControl) => void) {
  fn(c);
  c.children?.forEach((ch) => eachControl(ch, fn));
}

function findControl(root: YamlControl, name: string) {
  let hit: YamlControl | undefined;
  eachControl(root, (c) => {
    if (c.name === name) hit = c;
  });
  return hit;
}

const clone = (c: YamlControl): YamlControl => ({ ...c, props: { ...c.props }, children: c.children?.map(clone) });

/** fxConfig's record, as the ConfigProperties default. */
function configRecord(t: KitTheme): string {
  const f = fxConfigFormula(t);
  const start = f.indexOf('fxConfig =');
  return f.slice(f.indexOf('{', start), f.indexOf('\n};', start) + 2);
}

const isNumber = (s: string | undefined) => s !== undefined && /^\d+(\.\d+)?$/.test(s);

// ── The conversion ───────────────────────────────────────

export function componentize(item: KitItem, values: KitValues, theme: KitTheme = defaultTheme): KitComponent | null {
  const spec = specFor(item, values);
  if (!spec) return null;
  const name = spec.name ?? `cmp${pascal(item.slug.replace(/-/g, ' '))}`;
  const instanceName = `${name}_1`;
  const problems: string[] = [];
  const notes = [...(spec.notes ?? [])];

  const base: Snippet = item.build(values);
  const baseRoot = toControl(base.root);

  // 1. Text and formula options: build again with a sentinel in each, and see where they land.
  const formulaInputs = (spec.inputs ?? []).filter((i) => i.option);
  const all: Candidate[] = [
    ...item.options
      .filter((o) => o.type === 'text' && !/preview/i.test(o.label) && !spec.fixed?.includes(o.id) && !formulaInputs.some((i) => i.option === o.id))
      .map((o) => {
        const given = spec.names?.[o.id];
        return { id: o.id, name: (Array.isArray(given) ? given[0] : given) ?? TEXT_NAMES[o.id] ?? pascal(o.id), kind: 'text' as const };
      }),
    ...formulaInputs.map((i) => ({ id: i.option!, name: i.name, kind: 'formula' as const })),
  ].map((c, k) => ({ ...c, char: String.fromCharCode(0xe000 + k), len: Math.max(1, String(values[c.id] ?? '').length) }));

  const tryBuild = (cands: Candidate[]) => {
    const v = { ...values };
    for (const c of cands) v[c.id] = c.char.repeat(c.len);
    const s = item.build(v);
    const root = toControl(s.root);
    return shape(root) === shape(baseRoot) ? { s, root } : null;
  };
  let cands = all;
  let marked = tryBuild(cands);
  if (!marked) {
    cands = all.filter((c) => tryBuild([c]));
    marked = tryBuild(cands);
    if (!marked) {
      cands = [];
      marked = { s: base, root: baseRoot };
    }
  }
  for (const c of formulaInputs)
    if (!cands.some((k) => k.id === c.option)) problems.push(`${item.slug}: option ${c.option} changes the controls, so it can't be an input`);

  const byChar = new Map(cands.map((c) => [c.char, c]));
  const used = new Set<string>();
  const tree = clone(baseRoot);
  const treeByName = new Map(flatten(tree).map(({ c }) => [c.name, c]));
  pairUp(baseRoot, marked.root, (b, m) => {
    const t = treeByName.get(b.name)!;
    for (const [k, v] of Object.entries(m.props)) {
      if (!hasSentinel(v)) continue;
      t.props[k] = placeInputs(v, byChar, used) ?? b.props[k];
    }
  });
  let onReset = spec.screen ? '' : (base.onVisible ?? '');
  if (!spec.screen && marked.s.onVisible && hasSentinel(marked.s.onVisible)) onReset = placeInputs(marked.s.onVisible, byChar, used) ?? onReset;

  // Every formula inside the component, so each step below can run over all of them.
  const outputs = (spec.outputs ?? []).map((o) => ({ ...o }));
  const each = (fn: (f: string) => string) => {
    eachControl(tree, (c) => {
      for (const k of Object.keys(c.props)) c.props[k] = fn(c.props[k]);
    });
    onReset = fn(onReset);
    for (const o of outputs) o.value = fn(o.value);
  };
  const allCode = () => {
    const out: string[] = [onReset, ...outputs.map((o) => o.value)];
    eachControl(tree, (c) => out.push(...Object.values(c.props)));
    return out.map(codeOnly).join('\n');
  };

  // 2. Collections that only copy a named formula (ClearCollect(colTrend, fxTrend) in OnVisible) read it directly.
  const defs = namedFormulas(base.formulas);
  for (const m of [...onReset.matchAll(/ClearCollect\(\s*(col\w+)\s*,\s*(fx\w+)\s*\)\s*;?[ \t]*\n?/g)]) {
    const [stmt, col, fxName] = m;
    const rest = allCode().replace(codeOnly(stmt), '');
    if (new RegExp(`\\b(Collect|ClearCollect|Clear|Remove|RemoveIf|Patch|UpdateIf|Update)\\(\\s*${col}\\b`).test(rest)) continue;
    onReset = onReset.replace(stmt, '');
    each((f) => replaceName(f, col, fxName));
  }
  onReset = onReset.trim();

  // 3. Named formulas the component still reads become table (or record) inputs.
  const props: CustomProp[] = [
    { name: 'ConfigProperties', kind: 'Input', type: 'Record', default: configRecord(theme), description: 'The design system. Pass fxConfig from App.Formulas.' },
  ];
  const host: Record<string, string> = { ConfigProperties: 'fxConfig' };
  for (const d of defs) {
    if (!new RegExp(`\\b${d.name}\\b`).test(allCode())) continue;
    // Worked out inside: an output named with _, like the internal outputs in our own components.
    const internal = spec.internal?.includes(d.name);
    const input = (internal ? '_' : '') + d.name.replace(/^fx/, '');
    const body = asTable(d.body);
    each((f) => replaceName(f, d.name, `CMP.${input}`));
    if (internal) {
      outputs.push({ name: input, type: 'Table', value: body, description: `Internal: ${d.note || `what ${d.name} is in the Controls version`}` });
      continue;
    }
    props.push({
      name: input,
      kind: 'Input',
      type: body.startsWith('{') ? 'Record' : 'Table',
      default: body,
      description: d.note || `The rows, the same as ${d.name} in the Controls version.`,
    });
    host[input] = body;
  }

  // 4. The design system, read from ConfigProperties.
  each((f) =>
    mapCode(f, (c) =>
      c
        .replace(/\bfxColorConfigs\./g, 'CMP.ConfigProperties.ColorConfigs.')
        .replace(/\bfxTextConfigs\./g, 'CMP.ConfigProperties.TextConfigs.')
        .replace(/\bfxConfig\b/g, 'CMP.ConfigProperties'),
    ),
  );

  // 5. Context variables become component variables.
  each(toSet);

  // 6. Text and formula inputs that landed somewhere.
  for (const c of cands) {
    if (!used.has(c.id)) continue;
    const opt = item.options.find((o) => o.id === c.id)!;
    if (c.kind === 'text') {
      const given = spec.names?.[c.id];
      const label = opt.label.toLowerCase();
      const description = Array.isArray(given) ? given[1] : /text$/.test(label) ? `The ${label}.` : `Text for the ${label}.`;
      props.push({ name: c.name, kind: 'Input', type: 'Text', default: str(String(values[c.id] ?? '')), description });
      host[c.name] = str(String(values[c.id] ?? ''));
    }
  }
  for (const i of spec.inputs ?? []) {
    if (i.option && !used.has(i.option)) {
      if (cands.some((c) => c.id === i.option)) problems.push(`${item.slug}: option ${i.option} isn't used in any formula`);
      continue;
    }
    if (i.from) each((f) => replaceName(f, i.from!, `CMP.${i.name}`));
    const fromDef = i.defaultFrom ? defs.find((d) => d.name === i.defaultFrom) : undefined;
    if (i.defaultFrom && !fromDef) problems.push(`${item.slug}: no named formula ${i.defaultFrom}`);
    let dflt = i.default;
    if (fromDef) dflt = asTable(fromDef.body);
    if (i.sample) {
      const g = findGallery(base.root, i.sample);
      if (!g) problems.push(`${item.slug}: no gallery ${i.sample}`);
      else dflt = rowsLiteral(g.sample);
    }
    if (dflt === undefined) {
      problems.push(`${item.slug}: input ${i.name} has no default`);
      dflt = 'Blank()';
    }
    props.push({ name: i.name, kind: 'Input', type: i.type, default: dflt, description: i.description });
    const opt = i.option ? item.options.find((o) => o.id === i.option) : undefined;
    const value = i.option ? String(values[i.option] ?? '') : undefined;
    host[i.name] = i.host ?? (opt && fromDef && value === opt.default ? dflt : (value ?? i.from ?? dflt));
  }

  // 7. Events: the control calls the event, and the screen gets what the control did.
  for (const e of spec.events ?? []) {
    props.push({ name: e.name, kind: 'Event', description: e.description });
    let first: string | undefined;
    for (const [ctl, prop = 'OnSelect'] of e.on) {
      const c = findControl(tree, ctl);
      const orig = findControl(baseRoot, ctl)?.props[prop];
      if (!c) {
        problems.push(`${item.slug}: event ${e.name}: no control ${ctl}`);
        continue;
      }
      first ??= orig;
      c.props[prop] = e.keep && c.props[prop] ? `${c.props[prop]};\nCMP.${e.name}()` : `CMP.${e.name}()`;
    }
    host[e.name] = e.host ?? (e.keep ? '' : (first ?? ''));
  }

  // 8. Hand-made changes.
  for (const [ctl, prop, f] of spec.set ?? []) {
    const c = findControl(tree, ctl);
    if (!c) problems.push(`${item.slug}: set: no control ${ctl}`);
    else if (f === null) delete c.props[prop];
    else c.props[prop] = f;
  }
  for (const [from, to] of spec.replace ?? []) each((f) => f.split(from).join(to));
  if (spec.onReset !== undefined) onReset = spec.onReset ?? '';

  // 9. The outermost control fills the component; its size becomes the component's size.
  const size = (axis: 'Width' | 'Height', fallback: number) => {
    const v = baseRoot.props[axis];
    if (isNumber(v)) return { def: v, host: v };
    if (!v || /^(Parent|App)\.(Width|Height)$/.test(v)) return { def: String(fallback), host: v ?? String(fallback) };
    // A size that changes (a date picker opening): an output the screen reads back.
    const out = `cmp${axis}`;
    outputs.push({
      name: out,
      type: 'Number',
      value: tree.props[axis],
      description: `The ${axis.toLowerCase()} it needs right now. The instance's ${axis} reads it: Self.${out}.`,
    });
    return { def: String(fallback), host: `Self.${out}` };
  };
  const w = size('Width', item.canvas.w);
  const h = size('Height', item.canvas.h);
  tree.props.Width = 'Parent.Width';
  tree.props.Height = 'Parent.Height';
  tree.props.X = '0';
  tree.props.Y = '0';
  const visible = baseRoot.props.Visible;
  delete tree.props.Visible;

  for (const o of outputs) props.push({ name: o.name, kind: 'Output', type: o.type, description: o.description });

  const properties: Record<string, string> = { Width: w.def, Height: h.def };
  if (onReset) properties.OnReset = onReset;
  for (const o of outputs) properties[o.name] = o.value;

  // CMP → the component's name inside, the instance's name on the screen.
  const inside = (f: string) => f.replace(/\bCMP\b/g, name);
  eachControl(tree, (c) => {
    for (const k of Object.keys(c.props)) c.props[k] = inside(c.props[k]);
  });
  for (const k of Object.keys(properties)) properties[k] = inside(properties[k]);
  for (const p of props) if (p.default !== undefined) p.default = inside(p.default);

  const instanceProps: Record<string, string> = { ...host, Width: w.host, Height: h.host, X: baseRoot.props.X ?? '0', Y: baseRoot.props.Y ?? '0' };
  if (visible) instanceProps.Visible = visible;
  Object.assign(instanceProps, spec.instance);
  for (const k of Object.keys(instanceProps)) {
    if (instanceProps[k].trim() === '') delete instanceProps[k];
    else instanceProps[k] = instanceProps[k].replace(/\bCMP\b/g, instanceName);
  }

  props.sort((a, b) => a.name.localeCompare(b.name));
  const screen = [spec.screen ? base.onVisible : '', onReset ? `// Starts the component (runs its OnReset)\nReset(${instanceName})` : ''].filter(Boolean).join(';\n');
  const outside = (f: string) => f.replace(/\bCMP\b/g, instanceName);

  return {
    name,
    instanceName,
    definition: writeDefinition(name, item.summary, props, properties, tree),
    instance: writeControl({ name: instanceName, control: 'CanvasComponent', component: name, props: instanceProps }, '').join('\n') + '\n',
    props,
    properties,
    children: tree,
    screen: screen || undefined,
    notes: notes.map(outside),
    problems,
  };
}

// ── Text ─────────────────────────────────────────────────

/** A plain YAML scalar when it's safe, single-quoted when not. */
const scalar = (s: string) => (/^[A-Za-z0-9(][^:#'"\n]*$/.test(s) && !/\s$/.test(s) ? s : `'${s.replace(/'/g, "''")}'`);

function writeDefinition(name: string, summary: string, props: CustomProp[], properties: Record<string, string>, root: YamlControl): string {
  const out = ['ComponentDefinitions:', `  ${name}:`, '    DefinitionType: CanvasComponent', `    Description: ${scalar(summary)}`, '    CustomProperties:'];
  for (const p of props) {
    out.push(`      ${p.name}:`, `        PropertyKind: ${p.kind}`, `        Description: ${scalar(p.description)}`);
    if (p.kind === 'Event') out.push('        ReturnType: None', '        Default: =');
    else out.push(`        DataType: ${p.type}`);
    if (p.kind === 'Input') out.push(...writeValue('Default', p.default ?? '', '        '));
  }
  out.push('    Properties:');
  for (const k of Object.keys(properties).sort((a, b) => a.localeCompare(b))) out.push(...writeValue(k, properties[k], '      '));
  out.push('    Children:', ...writeControl(root, '      '));
  return out.join('\n') + '\n';
}

// ── Checks ───────────────────────────────────────────────

export const DATA_TYPES = ['Text', 'Number', 'Boolean', 'DateAndTime', 'Screen', 'Record', 'Table', 'Image', 'VideoOrAudio', 'Color', 'Currency'];

/** What the component reads that nothing inside it provides: the things that would break once it's pasted. */
export function componentGaps(comp: KitComponent): string[] {
  const errors: string[] = [];
  const formulas: string[] = [...Object.values(comp.properties)];
  eachControl(comp.children, (c) => formulas.push(...Object.values(c.props)));
  const code = formulas.map(codeOnly).join('\n');
  const names = (re: RegExp) => new Set([...code.matchAll(re)].map((m) => m[1]));

  // Set makes a component variable; With and record fields name values too.
  const setVars = new Set([...names(/\bSet\(\s*((?:lcl|gbl)\w+)/g), ...names(/\b((?:lcl|gbl)\w+)\s*:/g)]);
  for (const v of names(/\b((?:lcl|gbl)[A-Z]\w*)/g)) if (!setVars.has(v)) errors.push(`reads ${v}, which nothing inside the component sets`);
  const made = names(/\b(?:Collect|ClearCollect)\(\s*(col\w+)/g);
  for (const v of names(/\b(col[A-Z]\w*)/g)) if (!made.has(v)) errors.push(`reads ${v}, which only the screen has`);
  for (const v of names(/\b(fx[A-Z]\w*)/g)) errors.push(`reads ${v} from App.Formulas`);
  for (const v of names(/\b(scr[A-Z]\w*)/g)) errors.push(`refers to the screen ${v}`);
  if (/\bUpdateContext\(/.test(code)) errors.push('still uses UpdateContext');
  if (/\bNavigate\(/.test(code)) errors.push('navigates, which a component can’t do without app scope');
  if (/\bCMP\b/.test(code)) errors.push('has an unreplaced CMP');
  const declared = new Set(comp.props.map((p) => p.name));
  for (const v of names(new RegExp(`\\b${comp.name}\\.(\\w+)`, 'g'))) if (!declared.has(v)) errors.push(`reads ${comp.name}.${v}, which isn't a custom property`);
  for (const p of comp.props) if (p.kind !== 'Output' && !new RegExp(`\\b${comp.name}\\.${p.name}\\b`).test(code)) errors.push(`never uses its ${p.name} property`);
  return errors;
}
