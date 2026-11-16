import { describe, expect, it } from 'vitest';
import { references } from './references';
import { slugify } from './types';

describe.each(references.map((r) => [r.title, r] as const))('%s', (_title, ref) => {
  it('gives every item a unique URL', () => {
    const slugs = ref.items.map((i) => slugify(i.name));
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    expect(dupes).toEqual([]);
  });

  it('puts every item in a category that exists', () => {
    const names = new Set(ref.categories.map((c) => c.name));
    expect(ref.items.filter((i) => !names.has(i.category)).map((i) => `${i.name} → ${i.category}`)).toEqual([]);
  });

  it('gives every item a summary, syntax and at least one example', () => {
    const incomplete = ref.items.filter(
      (i) => !i.summary.trim() || !i.syntax.trim() || !i.examples.length || i.examples.some((e) => !e.code.trim()),
    );
    expect(incomplete.map((i) => i.name)).toEqual([]);
  });

  it('keeps items sorted by name', () => {
    const names = ref.items.map((i) => i.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
