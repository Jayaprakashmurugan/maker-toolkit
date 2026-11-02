// Building bigger snippets (layouts, screens) out of smaller ones.

import type { Node, Snippet } from './model';
import type { KitItem, KitValues } from './types';
import { defaults } from './types';

/** All control names in a tree (gallery rows included, built from their first sample). */
function names(n: Node, out: string[] = []): string[] {
  out.push(n.name);
  if ('children' in n) n.children.forEach((c) => names(c, out));
  if (n.kind === 'gallery') {
    const row = { f: (field: string) => ({ fx: `ThisItem.${field}` }), selected: { fx: 'ThisItem.IsSelected' }, index: 0, sample: n.sample[0] ?? {} };
    n.template(row).forEach((c) => names(c, out));
  }
  return out;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Deep copy with every string run through `fix`; gallery rows are fixed as they're built. */
function mapStrings<T>(value: T, fix: (s: string) => string): T {
  if (typeof value === 'string') return fix(value) as T;
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fix)) as T;
  if (typeof value === 'function') {
    const fn = value as unknown as (...a: unknown[]) => unknown;
    return ((...a: unknown[]) => mapStrings(fn(...a), fix)) as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = mapStrings(v, fix);
    return out as T;
  }
  return value;
}

/**
 * The same tree with a suffix on every control name, and on every reference to those names in its formulas,
 * so a component can be used more than once in one snippet (lblKpiValue → lblKpiValue2).
 */
export function suffixed<T extends Node>(node: T, suffix: string): T {
  const list = [...new Set(names(node))].sort((a, b) => b.length - a.length);
  if (!list.length) return node;
  const re = new RegExp(`\\b(${list.map(escape).join('|')})\\b`, 'g');
  return mapStrings(node, (s) => s.replace(re, (m) => m + suffix));
}

/** Build an item with its defaults plus some changes. */
export const part = (item: KitItem, changes: KitValues = {}): Snippet => item.build({ ...defaults(item), ...changes });

/** Combine the extras of several snippets: formulas, OnVisible lines, names used and notes. */
export function merge(root: Node, parts: Snippet[], notes: string[] = []): Snippet {
  const uniq = <T>(xs: T[], key: (x: T) => string) => [...new Map(xs.map((x) => [key(x), x])).values()];
  const formulas = uniq(parts.map((p) => p.formulas).filter(Boolean) as string[], (x) => x);
  const onVisible = uniq(parts.map((p) => p.onVisible).filter(Boolean) as string[], (x) => x);
  return {
    root,
    formulas: formulas.length ? formulas.join('\n\n') : undefined,
    onVisible: onVisible.length ? onVisible.join(';\n') : undefined,
    uses: uniq(parts.flatMap((p) => p.uses ?? []), (u) => u.name),
    notes,
  };
}

/** The same tree with one named control changed (inside gallery rows too). */
export function tweak<T extends Node>(node: T, name: string, patch: Record<string, unknown>): T {
  const walk = (n: Node): Node => {
    let out: Node = n.name === name ? ({ ...n, ...patch } as Node) : n;
    if ('children' in out) out = { ...out, children: out.children.map(walk) } as Node;
    if (out.kind === 'gallery') {
      const template = out.template;
      out = { ...out, template: (row) => template(row).map(walk) };
    }
    return out;
  };
  return walk(node) as T;
}
