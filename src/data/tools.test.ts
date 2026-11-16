import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { categories, tools } from './tools';

describe('tool registry', () => {
  const ids = new Set(categories.map((c) => c.id));

  it('has unique titles and URLs', () => {
    expect(new Set(tools.map((t) => t.title)).size).toBe(tools.length);
    expect(new Set(tools.map((t) => t.href)).size).toBe(tools.length);
  });

  it('uses only known categories, and never lists a tool as "also" in its own category', () => {
    for (const t of tools) {
      expect(ids.has(t.category), `${t.title}: ${t.category}`).toBe(true);
      for (const a of t.also ?? []) {
        expect(ids.has(a), `${t.title}: also ${a}`).toBe(true);
        expect(a, `${t.title} lists its own category in "also"`).not.toBe(t.category);
      }
    }
  });

  it('points every tool at a page that exists', () => {
    const missing = tools.filter((t) => !existsSync(`src/pages${t.href}index.astro`)).map((t) => t.href);
    expect(missing).toEqual([]);
  });

  it('says which product every tool works with', () => {
    expect(tools.filter((t) => t.works.length === 0).map((t) => t.title)).toEqual([]);
  });
});
