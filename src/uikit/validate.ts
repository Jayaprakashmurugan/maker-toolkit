// Build-time checks for every UI Kit snippet: the YAML must round-trip, follow the canvas YAML schema's shape,
// use only properties that control version accepts, and follow our naming conventions.

import { parse } from 'yaml';
import { ALLOWED_PROPS, LAYOUT_CHILD_PROPS } from './allowed';
import { flatten, toYaml, type YamlControl } from './yaml';

/** Naming conventions: each control type's prefix, followed by a capital letter or digit. */
export const PREFIXES: { control: string; variant?: string; direction?: 'Vertical' | 'Horizontal'; prefix: string; what: string }[] = [
  { control: 'GroupContainer@1.5.0', variant: 'AutoLayout', direction: 'Vertical', prefix: 'vCon', what: 'Vertical container' },
  { control: 'GroupContainer@1.5.0', variant: 'AutoLayout', direction: 'Horizontal', prefix: 'hCon', what: 'Horizontal container' },
  { control: 'GroupContainer@1.5.0', variant: 'ManualLayout', prefix: 'nCon', what: 'Normal (manual) container' },
  { control: 'Label@2.5.1', prefix: 'lbl', what: 'Label' },
  { control: 'Classic/Button@2.2.0', prefix: 'btn', what: 'Button' },
  { control: 'Rectangle@2.3.0', prefix: 'shp', what: 'Rectangle' },
  { control: 'Circle@2.3.0', prefix: 'shp', what: 'Circle' },
  { control: 'Classic/Icon@2.5.0', prefix: 'ico', what: 'Icon' },
  { control: 'Image@2.2.3', prefix: 'img', what: 'Image' },
  { control: 'Classic/TextInput@2.3.2', prefix: 'txt', what: 'Text input' },
  { control: 'Gallery@2.15.0', prefix: 'gal', what: 'Gallery' },
];

const KNOWN_KEYS = new Set(['Control', 'Variant', 'Properties', 'Children']);

function expectedPrefix(c: YamlControl) {
  const dir = c.props.LayoutDirection?.endsWith('Horizontal') ? 'Horizontal' : 'Vertical';
  return PREFIXES.find((p) => p.control === c.control && (!p.variant || p.variant === c.variant) && (!p.direction || p.direction === dir));
}

export function checkSnippet(slug: string, root: YamlControl): string[] {
  const errors: string[] = [];
  const names = new Set<string>();
  for (const { c } of flatten(root)) {
    const where = `${slug} › ${c.name}`;
    const rule = expectedPrefix(c);
    if (!rule) errors.push(`${where}: no naming rule for ${c.control}${c.variant ? ` (${c.variant})` : ''}`);
    else if (!new RegExp(`^${rule.prefix}[A-Z0-9]`).test(c.name)) errors.push(`${where}: a ${rule.what.toLowerCase()} must be named ${rule.prefix}…`);
    if (names.has(c.name)) errors.push(`${where}: name used twice`);
    names.add(c.name);
    const allowed = ALLOWED_PROPS[c.control];
    if (!allowed) {
      errors.push(`${where}: unknown control ${c.control}`);
      continue;
    }
    for (const [k, v] of Object.entries(c.props)) {
      if (!allowed.includes(k) && !LAYOUT_CHILD_PROPS.includes(k)) errors.push(`${where}: ${c.control} has no property ${k}`);
      if (typeof v !== 'string' || v.trim() === '') errors.push(`${where}: ${k} is empty`);
    }
  }

  // The text must parse back into the same shape the canvas YAML schema describes.
  const text = toYaml([root]);
  let doc: unknown;
  try {
    doc = parse(text);
  } catch (e) {
    errors.push(`${slug}: YAML doesn't parse: ${(e as Error).message}`);
    return errors;
  }
  const walk = (seq: unknown, path: string) => {
    if (!Array.isArray(seq)) return errors.push(`${path}: expected a list of controls`);
    for (const item of seq) {
      const keys = item && typeof item === 'object' ? Object.keys(item) : [];
      if (keys.length !== 1) {
        errors.push(`${path}: each list item must hold exactly one control`);
        continue;
      }
      const ctl = (item as Record<string, Record<string, unknown>>)[keys[0]];
      for (const k of Object.keys(ctl)) if (!KNOWN_KEYS.has(k)) errors.push(`${path} › ${keys[0]}: unexpected key ${k}`);
      if (typeof ctl.Control !== 'string' || !/^([A-Z][a-zA-Z0-9]*\/)?[A-Z][a-zA-Z0-9]*(@\d+\.\d+\.\d+)?$/.test(ctl.Control))
        errors.push(`${path} › ${keys[0]}: bad Control id`);
      for (const [k, v] of Object.entries((ctl.Properties as Record<string, unknown>) ?? {}))
        if (typeof v !== 'string' || !v.startsWith('=')) errors.push(`${path} › ${keys[0]}: ${k} must be a formula starting with =`);
      if (ctl.Children !== undefined) walk(ctl.Children, `${path} › ${keys[0]}`);
    }
  };
  walk(doc, slug);
  return errors;
}
