// Build-time checks for every UI Kit snippet: the YAML must round-trip, follow the canvas YAML schema's shape,
// use only properties that control version accepts, and follow our naming conventions.

import { parse } from 'yaml';
import { ALLOWED_PROPS, LAYOUT_CHILD_PROPS } from './allowed';
import { DATA_TYPES, componentGaps, type KitComponent } from './component';
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
  { control: 'Attachments@2.3.0', prefix: 'att', what: 'Attachments' },
  // Add picture shows as a button, so it's named like one (btnAddPhoto).
  { control: 'AddMedia@2.2.1', prefix: 'btn', what: 'Add picture' },
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

// ── Components ───────────────────────────────────────────

const PROPERTY_KEYS: Record<string, string[]> = {
  Input: ['PropertyKind', 'DisplayName', 'Description', 'DataType', 'Default', 'RaiseOnReset'],
  Output: ['PropertyKind', 'DisplayName', 'Description', 'DataType'],
  Event: ['PropertyKind', 'DisplayName', 'Description', 'ReturnType', 'Default', 'Parameters'],
};
const DEFINITION_KEYS = ['DefinitionType', 'Description', 'AllowCustomization', 'AccessAppScope', 'CustomProperties', 'Properties', 'Children'];
/** The component's own properties besides its outputs (X, Y and Visible belong to the instance). */
const COMPONENT_PROPS = ['ContentLanguage', 'ChildTabPriority', 'EnableChildFocus', 'Fill', 'Height', 'OnReset', 'Width'];
const INSTANCE_PROPS = ['X', 'Y', 'Width', 'Height', 'Visible', 'DisplayMode', 'AlignInContainer', 'FillPortions', 'LayoutMinWidth', 'LayoutMinHeight'];
const formula = (v: unknown) => typeof v === 'string' && v.startsWith('=');

/**
 * A component must parse into the shape of the canvas YAML schema's ComponentDefinition (pa.schema.yaml v3.0),
 * its controls must pass the same checks as a snippet, and it mustn't read anything only the screen has.
 */
export function checkComponent(slug: string, comp: KitComponent): string[] {
  const where = `${slug} › ${comp.name}`;
  const errors = [...comp.problems, ...componentGaps(comp).map((e) => `${where}: ${e}`), ...checkSnippet(`${slug} (component)`, comp.children)];

  let doc: unknown;
  try {
    doc = parse(comp.definition);
  } catch (e) {
    return [...errors, `${where}: YAML doesn't parse: ${(e as Error).message}`];
  }
  const defs = (doc as Record<string, unknown>)?.ComponentDefinitions as Record<string, Record<string, unknown>> | undefined;
  const def = defs?.[comp.name];
  if (!defs || Object.keys(defs).length !== 1 || !def) return [...errors, `${where}: expected ComponentDefinitions with exactly ${comp.name}`];
  for (const k of Object.keys(def)) if (!DEFINITION_KEYS.includes(k)) errors.push(`${where}: unexpected key ${k}`);
  if (def.DefinitionType !== 'CanvasComponent') errors.push(`${where}: DefinitionType must be CanvasComponent`);

  const custom = (def.CustomProperties ?? {}) as Record<string, Record<string, unknown>>;
  const outputs = new Set<string>();
  const settable = new Set<string>();
  for (const [name, p] of Object.entries(custom)) {
    const at = `${where} › ${name}`;
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) errors.push(`${at}: not a valid property name`);
    const kind = String(p.PropertyKind);
    const keys = PROPERTY_KEYS[kind];
    if (!keys) {
      errors.push(`${at}: PropertyKind ${kind} isn't Input, Output or Event`);
      continue;
    }
    for (const k of Object.keys(p)) if (!keys.includes(k)) errors.push(`${at}: ${kind} has no ${k}`);
    if (kind === 'Event') {
      if (p.ReturnType !== 'None' && !DATA_TYPES.includes(String(p.ReturnType))) errors.push(`${at}: bad ReturnType`);
      if (p.Default !== undefined && !formula(p.Default)) errors.push(`${at}: Default must start with =`);
      settable.add(name);
    } else {
      if (!DATA_TYPES.includes(String(p.DataType))) errors.push(`${at}: bad DataType ${String(p.DataType)}`);
      if (kind === 'Input') {
        if (!formula(p.Default) || String(p.Default).trim() === '=') errors.push(`${at}: an input needs a Default formula`);
        settable.add(name);
      } else outputs.add(name);
    }
  }

  const props = (def.Properties ?? {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(props)) {
    if (!COMPONENT_PROPS.includes(k) && !outputs.has(k)) errors.push(`${where}: Properties has ${k}, which is neither a component property nor an output`);
    if (!formula(v)) errors.push(`${where}: ${k} must be a formula starting with =`);
  }
  for (const o of outputs) if (!(o in props)) errors.push(`${where}: output ${o} has no formula in Properties`);
  const children = def.Children as unknown[];
  if (!Array.isArray(children) || children.length !== 1) errors.push(`${where}: Children must hold the one outer control`);

  // The instance for a screen: a CanvasComponent control that sets only inputs, events and placement.
  let inst: unknown;
  try {
    inst = parse(comp.instance);
  } catch (e) {
    return [...errors, `${where}: instance YAML doesn't parse: ${(e as Error).message}`];
  }
  const item = Array.isArray(inst) && inst.length === 1 ? (inst[0] as Record<string, Record<string, unknown>>)[comp.instanceName] : undefined;
  if (!item) return [...errors, `${where}: the instance must be one control named ${comp.instanceName}`];
  if (item.Control !== 'CanvasComponent' || item.ComponentName !== comp.name)
    errors.push(`${where}: the instance must be Control: CanvasComponent, ComponentName: ${comp.name}`);
  for (const [k, v] of Object.entries((item.Properties ?? {}) as Record<string, unknown>)) {
    if (!settable.has(k) && !INSTANCE_PROPS.includes(k)) errors.push(`${where}: the instance sets ${k}, which it can't`);
    if (!formula(v)) errors.push(`${where}: instance ${k} must be a formula starting with =`);
  }
  return errors;
}
